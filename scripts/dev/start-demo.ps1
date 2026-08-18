[CmdletBinding()]
param(
    [switch]$NoBrowser,
    [ValidateRange(20, 300)]
    [int]$TimeoutSeconds = 120
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryDirectory = [System.IO.Path]::GetFullPath((Join-Path $scriptDirectory "..\.."))
$backendDirectory = Join-Path $repositoryDirectory "backend"
$frontendDirectory = Join-Path $repositoryDirectory "frontend"
$demoDirectory = Join-Path $repositoryDirectory ".demo"
$logDirectory = Join-Path $demoDirectory "logs"
$statePath = Join-Path $demoDirectory "processes.json"
$backendRequirements = Join-Path $backendDirectory "requirements.txt"
$frontendLock = Join-Path $frontendDirectory "package-lock.json"
$backendHashPath = Join-Path $demoDirectory "backend-requirements.sha256"
$frontendHashPath = Join-Path $demoDirectory "frontend-lock.sha256"
$pythonVenv = Join-Path $backendDirectory ".venv\Scripts\python.exe"
$viteEntry = Join-Path $frontendDirectory "node_modules\vite\bin\vite.js"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backendOut = Join-Path $logDirectory "backend-$timestamp.out.log"
$backendErr = Join-Path $logDirectory "backend-$timestamp.err.log"
$frontendOut = Join-Path $logDirectory "frontend-$timestamp.out.log"
$frontendErr = Join-Path $logDirectory "frontend-$timestamp.err.log"

function Write-Step([string]$Message) {
    Write-Host ">> $Message" -ForegroundColor Cyan
}

function Get-Sha256([string]$Path) {
    $stream = [System.IO.File]::OpenRead($Path)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        return ([System.BitConverter]::ToString($sha256.ComputeHash($stream))).Replace("-", "")
    } finally {
        $sha256.Dispose()
        $stream.Dispose()
    }
}

function Stop-OwnedProcess([int]$ProcessId) {
    if ($ProcessId -le 0) { return }
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
    if (-not $processInfo) { return }
    $commandLine = [string]$processInfo.CommandLine
    if ($commandLine -notlike "*$repositoryDirectory*") {
        Write-Warning "PID $ProcessId does not belong to this repository; it was not stopped."
        return
    }
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

function Test-OwnedProcess([int]$ProcessId) {
    if ($ProcessId -le 0) { return $false }
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
    return [bool]($processInfo -and [string]$processInfo.CommandLine -like "*$repositoryDirectory*")
}

function Show-LogTail([string]$Label, [string]$Path) {
    if (Test-Path -LiteralPath $Path) {
        Write-Host "--- $Label ($Path) ---" -ForegroundColor DarkYellow
        Get-Content -LiteralPath $Path -Tail 25 -ErrorAction SilentlyContinue
    }
}

function Fail([string]$Message, [object[]]$StartedProcesses = @()) {
    foreach ($startedProcess in $StartedProcesses) {
        if ($startedProcess) { Stop-OwnedProcess -ProcessId $startedProcess.Id }
    }
    if (Test-Path -LiteralPath $statePath) { Remove-Item -LiteralPath $statePath -Force }
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    Show-LogTail -Label "Backend error" -Path $backendErr
    Show-LogTail -Label "Frontend error" -Path $frontendErr
    Write-Host "Logs: $logDirectory" -ForegroundColor Yellow
    exit 1
}

function Get-RequiredCommand([string]$Name, [string]$InstallHint) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) {
        Fail "$Name was not found. $InstallHint Then close and reopen this window."
    }
    return $command.Source
}

function Test-PortAvailable([int]$Port) {
    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $listener) { return $true }
    $owner = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
    $ownerText = if ($owner) { "$($owner.ProcessName) (PID $($owner.Id))" } else { "PID $($listener.OwningProcess)" }
    Fail "Port $Port is already in use by $ownerText. Close that process or run stop-demo.cmd, then retry."
    return $false
}

function Wait-ForUrl([string]$Url, [int]$Seconds, [object[]]$Processes) {
    $deadline = (Get-Date).AddSeconds($Seconds)
    do {
        foreach ($process in $Processes) {
            if ($process.HasExited) { return $false }
        }
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { return $true }
        } catch {
            Start-Sleep -Milliseconds 500
        }
    } while ((Get-Date) -lt $deadline)
    return $false
}

Set-Location -LiteralPath $repositoryDirectory
New-Item -ItemType Directory -Force -Path $demoDirectory, $logDirectory | Out-Null

Write-Host "===============================================" -ForegroundColor DarkGray
Write-Host " Room Harmony Community - one-click demo" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor DarkGray

if (Test-Path -LiteralPath $statePath) {
    try {
        $state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
        $backendOwned = Test-OwnedProcess -ProcessId ([int]$state.backendPid)
        $frontendOwned = Test-OwnedProcess -ProcessId ([int]$state.frontendPid)
        $backendHealthy = $false
        $frontendHealthy = $false
        if ($backendOwned -and $frontendOwned) {
            try { $backendHealthy = (Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8000/health" -TimeoutSec 2).StatusCode -eq 200 } catch {}
            try { $frontendHealthy = (Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:5173" -TimeoutSec 2).StatusCode -eq 200 } catch {}
        }
        if ($backendHealthy -and $frontendHealthy) {
            Write-Host "The demo is already running." -ForegroundColor Green
            Write-Host "App: http://127.0.0.1:5173"
            Write-Host "API: http://127.0.0.1:8000/docs"
            if (-not $NoBrowser) { Start-Process "http://127.0.0.1:5173" }
            exit 0
        }
        if ($backendOwned) { Stop-OwnedProcess -ProcessId ([int]$state.backendPid) }
        if ($frontendOwned) { Stop-OwnedProcess -ProcessId ([int]$state.frontendPid) }
    } catch {
        Write-Warning "Ignoring a stale process record."
    }
    Remove-Item -LiteralPath $statePath -Force
}

Write-Step "Checking Python and Node.js"
$systemPython = Get-RequiredCommand -Name "python.exe" -InstallHint "Install Python 3.11 or newer from https://www.python.org/downloads/windows/."
$node = Get-RequiredCommand -Name "node.exe" -InstallHint "Install Node.js 20 LTS or newer from https://nodejs.org/."
$npm = Get-RequiredCommand -Name "npm.cmd" -InstallHint "Reinstall Node.js with npm enabled."

$pythonVersionText = & $systemPython -c "import sys; print('.'.join(map(str, sys.version_info[:3])))" 2>$null
if ($LASTEXITCODE -ne 0 -or -not $pythonVersionText) {
    Fail "python.exe was found but could not run. Disable a Microsoft Store alias or reinstall Python 3.11+."
}
$pythonVersion = [version]$pythonVersionText.Trim()
if ($pythonVersion -lt [version]"3.11.0") {
    Fail "Python $pythonVersion is too old. Python 3.11 or newer is required."
}
$nodeVersionText = (& $node --version 2>$null).TrimStart("v").Trim()
if ($LASTEXITCODE -ne 0 -or -not $nodeVersionText) {
    Fail "node.exe was found but could not run. Reinstall Node.js with npm enabled."
}
$nodeVersion = [version]$nodeVersionText
if ($nodeVersion -lt [version]"20.19.0" -or $nodeVersion -ge [version]"25.0.0") {
    Fail "Node.js $nodeVersion is unsupported. Install Node.js 20.19 through 24.x."
}
Write-Host "Python $pythonVersion / Node.js ${nodeVersion}: OK" -ForegroundColor Green

Test-PortAvailable -Port 8000 | Out-Null
Test-PortAvailable -Port 5173 | Out-Null

Write-Step "Preparing backend dependencies"
if (-not (Test-Path -LiteralPath $pythonVenv)) {
    & $systemPython -m venv (Join-Path $backendDirectory ".venv")
    if ($LASTEXITCODE -ne 0) { Fail "Python virtual environment creation failed." }
}
$backendHash = Get-Sha256 -Path $backendRequirements
$installedBackendHash = if (Test-Path -LiteralPath $backendHashPath) { (Get-Content -Raw -LiteralPath $backendHashPath).Trim() } else { "" }
$backendImportsOk = $false
& $pythonVenv -c "import fastapi, sqlalchemy, uvicorn" 2>$null
if ($LASTEXITCODE -eq 0) { $backendImportsOk = $true }
if (-not $backendImportsOk -or $backendHash -ne $installedBackendHash) {
    Write-Host "Installing Python packages (first run may take a few minutes)..."
    & $pythonVenv -m pip install --disable-pip-version-check -r $backendRequirements
    if ($LASTEXITCODE -ne 0) { Fail "Python package installation failed. Check the network connection and retry." }
    Set-Content -LiteralPath $backendHashPath -Value $backendHash -NoNewline
} else {
    Write-Host "Backend dependencies: ready" -ForegroundColor Green
}

Write-Step "Preparing frontend dependencies"
$frontendHash = Get-Sha256 -Path $frontendLock
$installedFrontendHash = if (Test-Path -LiteralPath $frontendHashPath) { (Get-Content -Raw -LiteralPath $frontendHashPath).Trim() } else { "" }
if (-not (Test-Path -LiteralPath $viteEntry) -or $frontendHash -ne $installedFrontendHash) {
    Write-Host "Installing Node packages (first run may take a few minutes)..."
    Push-Location -LiteralPath $frontendDirectory
    try {
        & $npm ci --include=dev --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { Fail "Node package installation failed. Check the network connection and retry." }
    } finally {
        Pop-Location
    }
    Set-Content -LiteralPath $frontendHashPath -Value $frontendHash -NoNewline
} else {
    Write-Host "Frontend dependencies: ready" -ForegroundColor Green
}

Write-Step "Starting API and web app"
$databasePath = (Join-Path $demoDirectory "room-harmony-community.db").Replace("\", "/")
$env:RHC_DATABASE_URL = "sqlite:///$databasePath"
$env:RHC_SEED_PATH = (Join-Path $repositoryDirectory "data\seed\demo_seed.json")
$env:RHC_CORS_ORIGINS = '["http://127.0.0.1:5173","http://localhost:5173"]'
$env:VITE_API_BASE_URL = "http://127.0.0.1:8000"
$backendProcess = Start-Process -FilePath $pythonVenv `
    -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") `
    -WorkingDirectory $backendDirectory -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput $backendOut -RedirectStandardError $backendErr
$frontendProcess = Start-Process -FilePath $node `
    -ArgumentList @($viteEntry, "--host", "127.0.0.1", "--port", "5173", "--strictPort") `
    -WorkingDirectory $frontendDirectory -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput $frontendOut -RedirectStandardError $frontendErr

$state = [ordered]@{
    repository = $repositoryDirectory
    startedAt = (Get-Date).ToString("o")
    backendPid = $backendProcess.Id
    frontendPid = $frontendProcess.Id
    backendLog = $backendOut
    frontendLog = $frontendOut
}
$state | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8

if (-not (Wait-ForUrl -Url "http://127.0.0.1:8000/health" -Seconds $TimeoutSeconds -Processes @($backendProcess, $frontendProcess))) {
    Fail "The backend did not become healthy within $TimeoutSeconds seconds." @($backendProcess, $frontendProcess)
}
if (-not (Wait-ForUrl -Url "http://127.0.0.1:5173" -Seconds $TimeoutSeconds -Processes @($backendProcess, $frontendProcess))) {
    Fail "The frontend did not become ready within $TimeoutSeconds seconds." @($backendProcess, $frontendProcess)
}

Write-Host ""
Write-Host "Room Harmony Community is ready." -ForegroundColor Green
Write-Host "App:      http://127.0.0.1:5173"
Write-Host "API docs: http://127.0.0.1:8000/docs"
Write-Host "Logs:     $logDirectory"
Write-Host "Stop:     double-click stop-demo.cmd"
if (-not $NoBrowser) { Start-Process "http://127.0.0.1:5173" }
exit 0
