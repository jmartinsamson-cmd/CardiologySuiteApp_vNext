# CSS Change Detection & Validation Script
# Compares current CSS against locked baseline

param(
    [switch]$Fix,
    [switch]$Force
)

$cssFile = "styles/style.css"
$integrityFile = "styles/css-integrity.json"
$lockConfig = "styles/.stylelintrc.lock.json"

Write-Host "🔒 CSS Integrity Check" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

# Load baseline integrity data
if (-not (Test-Path $integrityFile)) {
    Write-Host "❌ No baseline integrity file found!" -ForegroundColor Red
    Write-Host "Run generate-css-hash.ps1 first to create baseline" -ForegroundColor Yellow
    exit 1
}

$baseline = Get-Content $integrityFile | ConvertFrom-Json

# Check current file hash
if (Test-Path $cssFile) {
    $currentHash = (Get-FileHash -Path $cssFile -Algorithm SHA256).Hash
    
    if ($currentHash -eq $baseline.Hash) {
        Write-Host "✅ CSS file integrity VERIFIED" -ForegroundColor Green
        Write-Host "🔒 File unchanged since: $($baseline.Timestamp)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  CSS file has CHANGED!" -ForegroundColor Yellow
        Write-Host "📊 Expected Hash: $($baseline.Hash)" -ForegroundColor Cyan
        Write-Host "📊 Current Hash:  $currentHash" -ForegroundColor Red
        
        # Run linting check
        Write-Host "`n🔍 Running lint validation..." -ForegroundColor Yellow
        $lintResult = npx stylelint $cssFile --config $lockConfig --formatter compact
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Linting passed - changes are compliant" -ForegroundColor Green
            if ($Fix) {
                # Update baseline with new clean hash
                $baseline.Hash = $currentHash
                $baseline.Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                $baseline | ConvertTo-Json | Out-File -FilePath $integrityFile -Encoding UTF8
                Write-Host "🔄 Baseline updated with new clean state" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ LINTING FAILED - Changes violate CSS standards!" -ForegroundColor Red
            Write-Host $lintResult -ForegroundColor White
            
            if (-not $Force) {
                Write-Host "`n🚫 CSS changes REJECTED - File does not meet locked standards" -ForegroundColor Red
                Write-Host "Use -Fix flag to update baseline (only if linting passes)" -ForegroundColor Yellow
                Write-Host "Use -Force flag to bypass this check (NOT RECOMMENDED)" -ForegroundColor Red
                exit 1
            } else {
                Write-Host "⚠️  FORCE flag used - bypassing validation" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "❌ CSS file not found: $cssFile" -ForegroundColor Red
    exit 1
}