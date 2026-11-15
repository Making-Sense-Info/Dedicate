# One-shot local stack: API (:8080) then UI (:5173) once /api/health is OK.
$ErrorActionPreference = "Stop"
$ApiScript = Join-Path $PSScriptRoot "dev-api.ps1"
$WebScript = Join-Path $PSScriptRoot "dev-web.ps1"
$HealthUrl = "http://127.0.0.1:8080/api/health"

Write-Host "Starting API…"
$api = Start-Process -FilePath "powershell.exe" `
    -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $ApiScript
    ) `
    -PassThru `
    -NoNewWindow

function Stop-ApiTree {
    if ($null -eq $api) { return }
    if (-not $api.HasExited) {
        & taskkill.exe /PID $api.Id /T /F 2>$null | Out-Null
    }
}

try {
    $ready = $false
    for ($i = 0; $i -lt 90; $i++) {
        if ($api.HasExited) {
            throw "API exited before becoming ready (exit $($api.ExitCode))."
        }
        try {
            $r = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 2
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) {
                $ready = $true
                break
            }
        } catch {
            # still booting
        }
        Start-Sleep -Milliseconds 400
    }

    if (-not $ready) {
        throw "API did not become ready at $HealthUrl"
    }

    Write-Host "API ready — starting UI (Ctrl+C stops both)…"
    & $WebScript
}
finally {
    Stop-ApiTree
}
