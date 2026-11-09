# Run DDI Lifecycle → HealthDCAT-AP Turtle (XSLT 3.0 via Saxon-HE).
# Optionally validate the Turtle with Sparna shacl-play when -ShaclJar is set.
#
# Usage:
#   .\run.ps1 -InputPath "in\file.xml" [-OutputPath "out\result.ttl"] `
#             [-ShaclJar "C:\path\shacl-play-app-0.12.5-onejar.jar"] `
#             [-Shapes "C:\path\shapes.ttl" | "https://…"] [-Report "out\report.html"]
#
# Env (optional defaults): SHACL_JAR, SHACL_SHAPES, SHACL_REPORT, SAXON_URL, SAXON_CP
# Sparna only accepts local --shapes paths; https:// URLs are downloaded to lib\shacl-cache\
param(
    [Parameter(Mandatory = $true)]
    [Alias("Input")]
    [string] $InputPath,

    [Alias("Output")]
    [string] $OutputPath = "",

    [string] $ShaclJar = "",

    [string] $Shapes = "",

    [string] $Report = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Xsl = Join-Path $ScriptDir "xsl\ddi-lifecycle-to-dcat-ap.xsl"
$LibDir = Join-Path $ScriptDir "lib"
$ShaclCacheDir = Join-Path $LibDir "shacl-cache"
$SaxonVersion = "12.5"
$SaxonJar = Join-Path $LibDir "saxon-he-$SaxonVersion.jar"
$ResolverJar = Join-Path $LibDir "xmlresolver-5.2.2.jar"
$ResolverDataJar = Join-Path $LibDir "xmlresolver-5.2.2-data.jar"
# Default: R8 non-public. Full catalogue: https://data.health.europa.eu/healthdcat-ap/releases/release-8/#validation-of-healthdcat-ap
$DefaultShapesUrl = "https://data.health.europa.eu/healthdcat-ap/releases/release-8/html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes/non-public-shapes.ttl"
$SaxonUrl = if ($env:SAXON_URL) {
    $env:SAXON_URL
} else {
    "https://github.com/Saxonica/Saxon-HE/releases/download/SaxonHE12-5/SaxonHE12-5J.zip"
}

function Resolve-ShapesPath {
    param([string] $Source)
    if ($Source -match '^https?://') {
        if (-not (Test-Path -LiteralPath $ShaclCacheDir)) {
            New-Item -ItemType Directory -Force -Path $ShaclCacheDir | Out-Null
        }
        $name = [System.IO.Path]::GetFileName(($Source -split '\?')[0])
        if ([string]::IsNullOrWhiteSpace($name)) {
            $name = "shapes.ttl"
        }
        $dest = Join-Path $ShaclCacheDir $name
        Write-Host "Downloading SHACL shapes → $dest"
        Invoke-WebRequest -Uri $Source -OutFile $dest
        return $dest
    }
    return $Source
}

if ([string]::IsNullOrWhiteSpace($ShaclJar) -and $env:SHACL_JAR) {
    $ShaclJar = $env:SHACL_JAR
}
if ([string]::IsNullOrWhiteSpace($Shapes) -and $env:SHACL_SHAPES) {
    $Shapes = $env:SHACL_SHAPES
}
if ([string]::IsNullOrWhiteSpace($Report) -and $env:SHACL_REPORT) {
    $Report = $env:SHACL_REPORT
}

if (-not (Test-Path -LiteralPath $InputPath)) {
    throw "Input not found: $InputPath"
}

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    throw "Java not found. Install a JRE 11+ to run Saxon-HE."
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path $ScriptDir "out\dcat-ap.ttl"
}

$outDir = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

if (-not ((Test-Path $SaxonJar) -and (Test-Path $ResolverJar) -and (Test-Path $ResolverDataJar))) {
    Write-Host "Downloading Saxon HE $SaxonVersion (+ xmlresolver)…"
    New-Item -ItemType Directory -Force -Path $LibDir | Out-Null
    $tmp = Join-Path $env:TEMP ("saxon-he-" + [guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    $zip = Join-Path $tmp "saxon.zip"
    Invoke-WebRequest -Uri $SaxonUrl -OutFile $zip
    Expand-Archive -Path $zip -DestinationPath $tmp -Force
    Copy-Item (Join-Path $tmp "saxon-he-$SaxonVersion.jar") $SaxonJar -Force
    Copy-Item (Join-Path $tmp "lib\xmlresolver-5.2.2.jar") $ResolverJar -Force
    Copy-Item (Join-Path $tmp "lib\xmlresolver-5.2.2-data.jar") $ResolverDataJar -Force
}

$cp = if ($env:SAXON_CP) {
    $env:SAXON_CP
} else {
    "$SaxonJar;$ResolverJar;$ResolverDataJar"
}

& java -cp $cp net.sf.saxon.Transform "-s:$InputPath" "-xsl:$Xsl" "-o:$OutputPath"
Write-Host "Wrote $OutputPath"

if (-not [string]::IsNullOrWhiteSpace($ShaclJar)) {
    if (-not (Test-Path -LiteralPath $ShaclJar)) {
        throw "SHACL jar not found: $ShaclJar"
    }
    if ([string]::IsNullOrWhiteSpace($Shapes)) {
        throw "Validation requested but -Shapes / SHACL_SHAPES is missing. Tip: -Shapes `"$DefaultShapesUrl`""
    }
    $ShapesLocal = Resolve-ShapesPath -Source $Shapes
    if (-not (Test-Path -LiteralPath $ShapesLocal)) {
        throw "SHACL shapes not found: $ShapesLocal"
    }

    if ([string]::IsNullOrWhiteSpace($Report)) {
        $stem = [System.IO.Path]::ChangeExtension($OutputPath, $null).TrimEnd('.')
        $Report = "$stem-shacl-report.html"
    }
    $reportTtl = [System.IO.Path]::ChangeExtension($Report, ".ttl")
    $reportDir = Split-Path -Parent $Report
    if ($reportDir -and -not (Test-Path -LiteralPath $reportDir)) {
        New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
    }

    Write-Host ("Validating with {0}…" -f (Split-Path -Leaf $ShaclJar))
    & java -jar $ShaclJar validate `
        --input $OutputPath `
        --shapes $ShapesLocal `
        --output $Report `
        --output $reportTtl
    Write-Host "Wrote $Report"
    Write-Host "Wrote $reportTtl"
}
