[CmdletBinding()]
param(
    [switch]$Force,
    [ValidateRange(1024, 65535)]
    [int]$BackendPort = 8000,
    [ValidateRange(1024, 65535)]
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryDirectory = [System.IO.Path]::GetFullPath((Join-Path $scriptDirectory "..\.."))
$demoDirectory = [System.IO.Path]::GetFullPath((Join-Path $repositoryDirectory ".demo"))
$statePath = Join-Path $demoDirectory "processes.json"
$stopScript = Join-Path $scriptDirectory "stop-demo.ps1"

function Assert-InDemoDirectory([string]$Path) {
    $resolved = [System.IO.Path]::GetFullPath($Path)
    $prefix = $demoDirectory.TrimEnd('\') + '\'
    if (-not $resolved.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Safety check refused a target outside .demo: $resolved"
    }
    return $resolved
}

if (-not $Force) {
    Write-Host "This resets only local demo-generated data in:" -ForegroundColor Yellow
    Write-Host "  $demoDirectory"
    Write-Host "Source files, logs, and visual QA screenshots are kept. Saved items, PLANs, posts, uploads, and analytics cannot be recovered." -ForegroundColor Yellow
    $confirmation = Read-Host "Type RESET to continue"
    if ($confirmation -cne "RESET") {
        Write-Host "Reset cancelled."
        exit 0
    }
}

if (Test-Path -LiteralPath $statePath) {
    & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $stopScript
    if ($LASTEXITCODE -ne 0) {
        Write-Host "The demo could not be stopped safely. No data was removed." -ForegroundColor Red
        exit 1
    }
}

$listeners = @(@($BackendPort, $FrontendPort) | ForEach-Object {
    Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue
})
if ($listeners.Count -gt 0) {
    $details = $listeners | ForEach-Object { "port $($_.LocalPort) (PID $($_.OwningProcess))" }
    Write-Host "Reset refused because a listener remains: $($details -join ', '). Stop it first." -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Force -Path $demoDirectory | Out-Null
$fileTargets = @(
    "room-harmony-community.db",
    "room-harmony-community.db-wal",
    "room-harmony-community.db-shm",
    "e2e.db",
    "e2e.db-wal",
    "e2e.db-shm",
    "visual-qa.db",
    "visual-qa.db-wal",
    "visual-qa.db-shm"
)
$directoryTargets = @("uploads", "e2e-uploads", "visual-qa-uploads")

foreach ($name in $fileTargets) {
    $target = Assert-InDemoDirectory (Join-Path $demoDirectory $name)
    if (Test-Path -LiteralPath $target -PathType Leaf) {
        Remove-Item -LiteralPath $target -Force
        Write-Host "Removed $target" -ForegroundColor DarkGray
    }
}
foreach ($name in $directoryTargets) {
    $target = Assert-InDemoDirectory (Join-Path $demoDirectory $name)
    if (Test-Path -LiteralPath $target -PathType Container) {
        Remove-Item -LiteralPath $target -Recurse -Force
        Write-Host "Removed $target" -ForegroundColor DarkGray
    }
}

# Remove only process-scoped QA residues that match our own exact filename contracts.
# These files normally self-clean; this handles an interrupted E2E or visual-QA run.
$scopedFiles = @(Get-ChildItem -LiteralPath $demoDirectory -File -Force | Where-Object {
    $_.Name -match '^(e2e|visual-qa)-\d+\.db(?:-wal|-shm)?$'
})
foreach ($entry in $scopedFiles) {
    $target = Assert-InDemoDirectory $entry.FullName
    Remove-Item -LiteralPath $target -Force
    Write-Host "Removed $target" -ForegroundColor DarkGray
}
$scopedDirectories = @(Get-ChildItem -LiteralPath $demoDirectory -Directory -Force | Where-Object {
    $_.Name -match '^(e2e|visual-qa)-uploads-\d+$'
})
foreach ($entry in $scopedDirectories) {
    $target = Assert-InDemoDirectory $entry.FullName
    Remove-Item -LiteralPath $target -Recurse -Force
    Write-Host "Removed $target" -ForegroundColor DarkGray
}

$validator = Join-Path $repositoryDirectory "scripts\validate_data\validate_seed.py"
$venvPython = Join-Path $repositoryDirectory "backend\.venv\Scripts\python.exe"
if (Test-Path -LiteralPath $venvPython) {
    & $venvPython $validator
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Demo data was cleared, but bundled seed validation failed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Bundled seed validation will run during the next start because backend\.venv is not installed yet." -ForegroundColor Yellow
}

Write-Host "Demo data reset completed. Run start-demo.cmd to recreate the clean bundled seed." -ForegroundColor Green
exit 0
