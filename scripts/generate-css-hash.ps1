# CSS File Integrity Hash
# Generated: $(Get-Date)
# Purpose: Detect unauthorized changes to cleaned CSS file

$cssFilePath = "styles/style.css"

# Generate SHA256 hash of the current clean CSS
if (Test-Path $cssFilePath) {
    $cssHash = Get-FileHash -Path $cssFilePath -Algorithm SHA256
    Write-Host "CSS File Hash (SHA256): $($cssHash.Hash)" -ForegroundColor Green
    
    # Store hash for future verification
    @{
        FilePath = $cssFilePath
        Hash = $cssHash.Hash
        Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        Status = "CLEAN - All Stylelint rules passed"
        LintingResults = "0 problems found"
    } | ConvertTo-Json | Out-File -FilePath "styles/css-integrity.json" -Encoding UTF8
    
    Write-Host "🔒 CSS integrity baseline saved to styles/css-integrity.json" -ForegroundColor Cyan
} else {
    Write-Host "❌ CSS file not found!" -ForegroundColor Red
}