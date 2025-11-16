# SwitchBot Power Control App Startup Script
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SwitchBot Power Control App Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host ""
}

if (-not (Test-Path ".env")) {
    Write-Host "[Warning] .env file not found." -ForegroundColor Red
    Write-Host "Please set up authentication information. See SETUP.md" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Checking for existing server processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

try {
    $portProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($portProcess) {
        Write-Host "Stopping process using port 3000 (PID: $portProcess)..." -ForegroundColor Yellow
        Stop-Process -Id $portProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
} catch {
    # Ignore if Get-NetTCPConnection is not available
}

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Green
Write-Host "Access http://localhost:3000 in your browser." -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host ""

node server.js

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "An error occurred." -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
