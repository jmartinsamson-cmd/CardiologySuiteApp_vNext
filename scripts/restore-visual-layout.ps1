# CARDIOLOGY SUITE - VISUAL RESTORATION SCRIPT
# Use this PowerShell script to restore the stable visual layout

param([switch]$Force = $false)

Write-Host "🔄 CARDIOLOGY SUITE VISUAL RESTORATION" -ForegroundColor Red
Write-Host "======================================" -ForegroundColor Blue

$backupPath = "backups\visual-stable-2025-10-02"

# Verify backup exists
if (-not (Test-Path $backupPath)) {
    Write-Host "❌ Backup not found: $backupPath" -ForegroundColor Red
    exit 1
}

if (-not $Force) {
    $confirmed = Read-Host "This will restore the stable visual layout. Continue? (y/N)"
    if ($confirmed -ne "y" -and $confirmed -ne "Y") {
        Write-Host "Restoration cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "📁 Restoring from backup..." -ForegroundColor Yellow

try {
    # Restore main files with error checking
    Copy-Item "$backupPath\index.html" -Destination "." -Force
    Copy-Item "$backupPath\src\core\app.js" -Destination "src\core\" -Force
    Copy-Item "$backupPath\styles\*.css" -Destination "styles\" -Force
    
    Write-Host "✅ Visual layout restored successfully!" -ForegroundColor Green
    Write-Host "🔄 Use '🏥 Start Cardiology Suite' task to restart server" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Restoration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📖 See VISUAL_PRESERVATION_GUIDE.md for details" -ForegroundColor Magenta