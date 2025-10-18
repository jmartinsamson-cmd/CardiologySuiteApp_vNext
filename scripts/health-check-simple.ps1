# CARDIOLOGY SUITE HEALTH CHECK v2.0
Write-Host "Health Check: Cardiology Suite" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Blue

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 5
    
    if ($response.StatusCode -eq 200) {
        Write-Host "Server Status: OK ($($response.StatusCode))" -ForegroundColor Green
        
        # Check for Cardiology application content
        if ($response.Content -match "Cardiology Suite" -and $response.Content -match "<!DOCTYPE html>") {
            Write-Host "Application Status: HEALTHY" -ForegroundColor Green
            
            # Check key components
            if ($response.Content -match "Enhanced Cardiology Application") {
                Write-Host "Enhanced Styling: OK" -ForegroundColor Green
            }
            if ($response.Content -match "dx-item") {
                Write-Host "Diagnosis List: OK" -ForegroundColor Green
            }
        } 
        elseif ($response.Content -match "Index of /" -or $response.Content -match "Directory listing") {
            Write-Host "Application Status: FAILED - Directory listing detected" -ForegroundColor Red
            Write-Host "Solution: Run startup script to fix directory issue" -ForegroundColor Yellow
        }
        else {
            Write-Host "Application Status: UNKNOWN - Unexpected content" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Server Status: WARNING - Status $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Server Status: OFFLINE" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "Solution: Run start-cardiology-suite.ps1" -ForegroundColor Yellow
}

Write-Host ""