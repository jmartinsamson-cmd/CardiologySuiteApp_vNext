# CARDIOLOGY SUITE HEALTH CHECK v2.0
Write-Host "🔍 CARDIOLOGY SUITE HEALTH CHECK" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Blue

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 5
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Server responding (Status: $($response.StatusCode))" -ForegroundColor Green
        
        # Check for Cardiology application content
        if ($response.Content -match "Cardiology Suite" -and $response.Content -match "<!DOCTYPE html>") {
            Write-Host "✅ Cardiology application loaded correctly!" -ForegroundColor Green
            
            # Check key components
            if ($response.Content -match "Enhanced Cardiology Application") {
                Write-Host "✅ Enhanced styling detected" -ForegroundColor Green
            }
            if ($response.Content -match "dx-item") {
                Write-Host "✅ Diagnosis list structure detected" -ForegroundColor Green
            }
        } 
        elseif ($response.Content -match "Index of /" -or $response.Content -match "Directory listing") {
            Write-Host "❌ PROBLEM: Server is serving directory listing!" -ForegroundColor Red
            Write-Host "Solution: Run the startup script to fix directory issue" -ForegroundColor Yellow
        }
        else {
            Write-Host "⚠️  Server responding but unexpected content" -ForegroundColor Yellow
            Write-Host "First 200 chars: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  Server responding with status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Server not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Try running: .\start-cardiology-suite.ps1" -ForegroundColor Yellow
}

Write-Host ""