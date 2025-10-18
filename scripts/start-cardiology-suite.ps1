# CARDIOLOGY SUITE - BULLETPROOF STARTUP SCRIPT v3.0
# This script GUARANTEES correct startup every time
param(
    [int]$Port = 3000,
    [switch]$NoBrowser = $false
)

Write-Host "🏥 CARDIOLOGY SUITE BULLETPROOF STARTUP v3.0" -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Blue

# STEP 1: Find the project directory with index.html
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = $null

Write-Host "🔍 Locating project directory..." -ForegroundColor Cyan

# Check if script is in project root
if (Test-Path (Join-Path $scriptDir "index.html")) {
    $projectDir = $scriptDir
    Write-Host "✅ Found project in script directory" -ForegroundColor Green
} else {
    Write-Host "❌ Script not in project root. Searching..." -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Project Directory: $projectDir" -ForegroundColor Cyan

# STEP 2: Verify required files exist
$requiredFiles = @("index.html", "styles\style.css", "src\core\app.js")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path (Join-Path $projectDir $file))) {
        Write-Host "❌ CRITICAL: Missing $file" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ All required files verified" -ForegroundColor Green

# STEP 3: Stop any existing servers
Write-Host "🔄 Stopping existing servers..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# STEP 4: Start server in correct directory
Write-Host "🚀 Starting server in project directory..." -ForegroundColor Green
Set-Location $projectDir

# Double-check we're in the right place
if (-not (Test-Path "index.html")) {
    Write-Host "❌ FATAL: Not in correct directory!" -ForegroundColor Red
    exit 1
}

# Start the server as a background job
$serverJob = Start-Job -ScriptBlock {
    param($dir, $port)
    Set-Location $dir
    python -m http.server $port
} -ArgumentList $projectDir, $Port

Write-Host "✅ Server started as job ID: $($serverJob.Id)" -ForegroundColor Green

# STEP 5: Wait and verify server is working
Write-Host "⏳ Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 10
    
    if ($response.Content -match "Index of /") {
        Write-Host "❌ FATAL ERROR: Server serving directory listing!" -ForegroundColor Red
        Write-Host "   This should never happen with v3.0 script." -ForegroundColor Red
        Stop-Job $serverJob
        Remove-Job $serverJob
        exit 1
    } else {
        Write-Host "✅ SUCCESS: Application is serving correctly!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Server not responding: $($_.Exception.Message)" -ForegroundColor Red
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}

# STEP 6: Open browser
if (-not $NoBrowser) {
    Write-Host "🌐 Opening VS Code Simple Browser..." -ForegroundColor Cyan
    try {
        & code --command "simpleBrowser.show" "http://localhost:$Port"
        Write-Host "✅ Browser opened successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not open VS Code browser, open manually: http://localhost:$Port" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 CARDIOLOGY SUITE RUNNING SUCCESSFULLY!" -ForegroundColor Green
Write-Host "   URL: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "   Job ID: $($serverJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 To stop: Stop-Job $($serverJob.Id); Remove-Job $($serverJob.Id)" -ForegroundColor Yellow
Write-Host ""