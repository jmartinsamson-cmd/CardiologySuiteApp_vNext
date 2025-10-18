# Cardiology Suite Server Launcher
# Ensures index.html is always served as the default page

Set-Location $PSScriptRoot
Write-Host "🏥 Starting Cardiology Suite Server..." -ForegroundColor Green

if (-not (Test-Path "index.html")) {
    Write-Host "❌ ERROR: index.html not found in current directory!" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Serving from: $(Get-Location)" -ForegroundColor Cyan
Write-Host "🌐 Opening browser at http://localhost:8080" -ForegroundColor Cyan

# Start server in background
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PSScriptRoot
    python server.py
}

# Wait a moment for server to start
Start-Sleep -Seconds 2

# Open browser
Start-Process "http://localhost:8080"

Write-Host "🔄 Server running (Job ID: $($serverJob.Id))" -ForegroundColor Green
Write-Host "🛑 Press Ctrl+C to stop or run: Stop-Job $($serverJob.Id)" -ForegroundColor Yellow

try {
    # Keep script running and show server output
    do {
        Receive-Job $serverJob
        Start-Sleep -Seconds 1
    } while ($serverJob.State -eq "Running")
} finally {
    # Clean up
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job $serverJob -ErrorAction SilentlyContinue
    Write-Host "🛑 Server stopped" -ForegroundColor Red
}