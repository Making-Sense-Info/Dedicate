# Local Dedicator API on http://127.0.0.1:8080 (Windows).
# Uses invoke.ps1 → Java Saxon / Sparna.
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Api = Join-Path $Root "dedicator\api"
$Venv = Join-Path $Root "dedicator\.venv"

$DefaultShaclJar = Join-Path $Root "dedicator\jars\shacl-play-app-0.12.5-onejar.jar"
if (-not $env:SHACL_JAR -and (Test-Path -LiteralPath $DefaultShaclJar)) {
    $env:SHACL_JAR = $DefaultShaclJar
    Write-Host "Using default SHACL_JAR=$env:SHACL_JAR"
} elseif (-not $env:SHACL_JAR) {
    Write-Warning "SHACL_JAR is unset — transform works, Sparna validation is skipped."
    Write-Host '  Put Sparna onejar in dedicator\jars\ or set:'
    Write-Host '  $env:SHACL_JAR = "C:\path\shacl-play-app-0.12.5-onejar.jar"'
} elseif (-not (Test-Path -LiteralPath $env:SHACL_JAR)) {
    Write-Warning "SHACL_JAR is set but file missing: $env:SHACL_JAR"
}

if (-not (Test-Path -LiteralPath $Venv)) {
    python -m venv $Venv
    & (Join-Path $Venv "Scripts\pip.exe") install -r (Join-Path $Api "requirements.txt")
}

if (-not $env:DEDICATOR_CORS) { $env:DEDICATOR_CORS = "*" }

Set-Location $Api
& (Join-Path $Venv "Scripts\uvicorn.exe") main:app --reload --host 127.0.0.1 --port 8080
