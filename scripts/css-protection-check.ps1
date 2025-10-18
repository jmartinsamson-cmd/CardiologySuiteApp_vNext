#!/usr/bin/env pwsh
# CSS Protection Script - Validates CSS against locked standards
# Run this before any CSS changes to ensure compliance

Write-Host "🔒 CSS Protection Check" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$cssFile = "styles/style.css"
$lockConfig = "styles/.stylelintrc.lock.json"

# Check if CSS file exists
if (-not (Test-Path $cssFile)) {
    Write-Host "❌ CSS file not found: $cssFile" -ForegroundColor Red
    exit 1
}

# Run stylelint with locked config
Write-Host "🔍 Running CSS validation..." -ForegroundColor Yellow
$result = npx stylelint $cssFile --config $lockConfig --formatter compact

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ CSS validation PASSED - File is clean!" -ForegroundColor Green
    Write-Host "🔒 CSS standards maintained successfully" -ForegroundColor Green
} else {
    Write-Host "❌ CSS validation FAILED - Changes detected!" -ForegroundColor Red
    Write-Host "🚫 CSS file has been modified and no longer meets locked standards" -ForegroundColor Red
    Write-Host "📋 Errors found:" -ForegroundColor Yellow
    Write-Host $result -ForegroundColor White
    exit 1
}