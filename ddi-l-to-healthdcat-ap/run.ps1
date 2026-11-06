# Run DDI Lifecycle → DCAT-AP Turtle transform (XSLT 3.0 via Saxon-HE).
# Usage:
#   .\run.ps1 -InputPath "C:\path\to\file.xml" [-OutputPath "out\result.ttl"]
param(
    [Parameter(Mandatory = $true)]
    [string] $InputPath,

    [string] $OutputPath = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Xsl = Join-Path $ScriptDir "xsl\ddi-lifecycle-to-dcat-ap.xsl"
$LibDir = Join-Path $ScriptDir "lib"
$SaxonVersion = "12.5"
$SaxonJar = Join-Path $LibDir "saxon-he-$SaxonVersion.jar"
$ResolverJar = Join-Path $LibDir "xmlresolver-5.2.2.jar"
$ResolverDataJar = Join-Path $LibDir "xmlresolver-5.2.2-data.jar"
$SaxonUrl = if ($env:SAXON_URL) {
    $env:SAXON_URL
} else {
    "https://github.com/Saxonica/Saxon-HE/releases/download/SaxonHE12-5/SaxonHE12-5J.zip"
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
