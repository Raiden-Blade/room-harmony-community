[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryDirectory = [System.IO.Path]::GetFullPath((Join-Path $scriptDirectory "..\.."))
$statePath = Join-Path $repositoryDirectory ".demo\processes.json"

if (-not (Test-Path -LiteralPath $statePath)) {
    Write-Host "No Room Harmony Community process record was found. Nothing to stop." -ForegroundColor Yellow
    exit 0
}

try {
    $state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
} catch {
    Write-Host "The process record is unreadable: $statePath" -ForegroundColor Red
    exit 1
}

$refused = @()
foreach ($processId in @([int]$state.backendPid, [int]$state.frontendPid)) {
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
    if (-not $processInfo) { continue }
    if ([string]$processInfo.CommandLine -notlike "*$repositoryDirectory*") {
        $refused += $processId
        continue
    }
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped PID $processId" -ForegroundColor Green
}

if ($refused.Count -gt 0) {
    Write-Host "Safety check refused to stop unrelated PID(s): $($refused -join ', ')." -ForegroundColor Red
    exit 1
}

Remove-Item -LiteralPath $statePath -Force
Write-Host "Room Harmony Community stopped." -ForegroundColor Green
exit 0
