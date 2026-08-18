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
$stopped = @()
foreach ($processId in @([int]$state.backendPid, [int]$state.frontendPid)) {
    if ($processId -le 0) { continue }
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
    if (-not $processInfo) { continue }
    if (([string]$processInfo.CommandLine).IndexOf(
        $repositoryDirectory,
        [System.StringComparison]::OrdinalIgnoreCase
    ) -lt 0) {
        $refused += $processId
        continue
    }
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    $stopped += $processId
    Write-Host "Stopped PID $processId" -ForegroundColor Green
}

if ($refused.Count -gt 0) {
    Write-Host "Safety check refused to stop unrelated PID(s): $($refused -join ', ')." -ForegroundColor Red
    exit 1
}

Remove-Item -LiteralPath $statePath -Force
$deadline = (Get-Date).AddSeconds(10)
do {
    $remaining = @($stopped | Where-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue })
    if ($remaining.Count -eq 0) { break }
    Start-Sleep -Milliseconds 200
} while ((Get-Date) -lt $deadline)

$listeners = @(@(8000, 5173) | ForEach-Object {
    Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue
})
if ($listeners.Count -gt 0) {
    $details = $listeners | ForEach-Object { "port $($_.LocalPort) (PID $($_.OwningProcess))" }
    Write-Host "Process stop completed, but a listener remains: $($details -join ', '). No unrelated process was terminated." -ForegroundColor Red
    exit 1
}
Write-Host "Room Harmony Community stopped." -ForegroundColor Green
exit 0
