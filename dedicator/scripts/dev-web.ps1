# Local Dedicator Vite UI on http://127.0.0.1:5173 (Windows).
# Proxies /api → http://127.0.0.1:8080
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Web = Join-Path $Root "dedicator\web"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "node not found. Install Node 22+ and ensure it is on PATH."
}
if (-not (Get-Command yarn -ErrorAction SilentlyContinue)) {
    throw "yarn not found. Install Yarn classic (npm i -g yarn) or enable corepack."
}

Set-Location $Web
if (-not (Test-Path -LiteralPath (Join-Path $Web "node_modules"))) {
    yarn install
}
yarn dev
