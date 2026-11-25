# Thin job runner for Dedicator API (Windows): Saxon transform + optional Sparna validate.
# Usage:
#   .\invoke.ps1 -InputPath <ddi.xml> -OutputPath <out.ttl> [-Xsl <file>] `
#                [-ShaclJar <jar>] [-Shapes <file|url>] [-Report <report.html>]
param(
    [Parameter(Mandatory = $true)]
    [string] $InputPath,

    [Parameter(Mandatory = $true)]
    [string] $OutputPath,

    [string] $Xsl = "",

    [string] $ShaclJar = "",

    [string] $Shapes = "",

    [string] $Report = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir "..\..")
$Pipeline = Join-Path $Root "ddi-l-to-healthdcat-ap"
$LibDir = Join-Path $Pipeline "lib"
$ShaclCacheDir = Join-Path $LibDir "shacl-cache"
$SaxonVersion = "12.5"
$SaxonJar = Join-Path $LibDir "saxon-he-$SaxonVersion.jar"
$ResolverJar = Join-Path $LibDir "xmlresolver-5.2.2.jar"
$ResolverDataJar = Join-Path $LibDir "xmlresolver-5.2.2-data.jar"
$DefaultXsl = Join-Path $Pipeline "xsl\ddi-lifecycle-to-dcat-ap.xsl"
$DefaultShapesUrl = "https://data.health.europa.eu/healthdcat-ap/releases/release-8/html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes/non-public-shapes.ttl"
$SaxonUrl = if ($env:SAXON_URL) {
    $env:SAXON_URL
} else {
    "https://github.com/Saxonica/Saxon-HE/releases/download/SaxonHE12-5/SaxonHE12-5J.zip"
}

if ([string]::IsNullOrWhiteSpace($Xsl)) { $Xsl = $DefaultXsl }
if ([string]::IsNullOrWhiteSpace($ShaclJar) -and $env:SHACL_JAR) { $ShaclJar = $env:SHACL_JAR }
if ([string]::IsNullOrWhiteSpace($Shapes)) {
    $Shapes = if ($env:SHACL_SHAPES) { $env:SHACL_SHAPES } else { $DefaultShapesUrl }
}

if (-not (Test-Path -LiteralPath $InputPath)) { throw "Input not found: $InputPath" }
if (-not (Test-Path -LiteralPath $Xsl)) { throw "XSL not found: $Xsl" }
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    throw "Java not found. Install a JRE 11+."
}

function Resolve-ShapesPath {
    param([string] $Source)
    if ($Source -match '^https?://') {
        if (-not (Test-Path -LiteralPath $ShaclCacheDir)) {
            New-Item -ItemType Directory -Force -Path $ShaclCacheDir | Out-Null
        }
        $name = [System.IO.Path]::GetFileName(($Source -split '\?')[0])
        if ([string]::IsNullOrWhiteSpace($name)) { $name = "shapes.ttl" }
        $dest = Join-Path $ShaclCacheDir $name
        Write-Host "Downloading SHACL shapes → $dest"
        Invoke-WebRequest -Uri $Source -OutFile $dest
        return $dest
    }
    return $Source
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

$outDir = Split-Path -Parent $OutputPath
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$cp = if ($env:SAXON_CP) { $env:SAXON_CP } else { "$SaxonJar;$ResolverJar;$ResolverDataJar" }
& java -cp $cp net.sf.saxon.Transform "-s:$InputPath" "-xsl:$Xsl" "-o:$OutputPath"
Write-Host "Wrote $OutputPath"

if (-not [string]::IsNullOrWhiteSpace($ShaclJar)) {
    if (-not (Test-Path -LiteralPath $ShaclJar)) { throw "SHACL jar not found: $ShaclJar" }
    if ([string]::IsNullOrWhiteSpace($Shapes)) { throw "Missing -Shapes" }
    $ShapesLocal = Resolve-ShapesPath -Source $Shapes
    if (-not (Test-Path -LiteralPath $ShapesLocal)) { throw "Shapes not found: $ShapesLocal" }

    if ([string]::IsNullOrWhiteSpace($Report)) {
        $stem = [System.IO.Path]::ChangeExtension($OutputPath, $null).TrimEnd('.')
        $Report = "$stem-shacl-report.html"
    }
    $reportTtl = [System.IO.Path]::ChangeExtension($Report, ".ttl")
    $reportDir = Split-Path -Parent $Report
    if ($reportDir -and -not (Test-Path -LiteralPath $reportDir)) {
        New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
    }

    & java -jar $ShaclJar validate `
        --input $OutputPath `
        --shapes $ShapesLocal `
        --avoidResolvingTargets `
        --output $Report `
        --output $reportTtl
    Write-Host "Wrote $Report"
    Write-Host "Wrote $reportTtl"
}
