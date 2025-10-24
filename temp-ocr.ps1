$ErrorActionPreference = "Stop"

function Get-NowPlusHoursUtc([int]$h) {
  return (Get-Date).ToUniversalTime().AddHours($h).ToString("yyyy-MM-ddTHH:mm:ssZ")
}

# Inputs from env vars
$StorageAccount = $env:STORAGE_ACCOUNT
$Container = $env:STORAGE_CONTAINER
$BlobName = $env:BLOB_NAME
$ResourceGroup = $env:RESOURCE_GROUP
$VisionEndpoint = $env:AZURE_VISION_ENDPOINT
$VisionKey = $env:AZURE_VISION_KEY

if (-not $StorageAccount -or -not $Container -or -not $BlobName -or -not $ResourceGroup -or -not $VisionEndpoint -or -not $VisionKey) {
  Write-Host "Missing required environment variables." -ForegroundColor Red
  exit 1
}

# SAS
$acctKey = az storage account keys list -g $ResourceGroup -n $StorageAccount --query [0].value -o tsv
$expiry = Get-NowPlusHoursUtc 1
$blobSas = az storage blob generate-sas --account-name $StorageAccount --account-key $acctKey --container-name $Container --name $BlobName --permissions r --https-only --expiry $expiry -o tsv
$BlobSasUrl = "https://$StorageAccount.blob.core.windows.net/$Container/$BlobName`?$blobSas"
Write-Host "SAS URL generated (1h)"

# OCR start
$startUri = "$VisionEndpoint/vision/v3.2/read/analyze"
$headers = @{ "Ocp-Apim-Subscription-Key" = $VisionKey; "Content-Type" = "application/json" }
$body = @{ url = $BlobSasUrl } | ConvertTo-Json -Depth 3
$resp = Invoke-WebRequest -Method Post -Uri $startUri -Headers $headers -Body $body
$opLoc = $resp.Headers["Operation-Location"]
if (-not $opLoc) { Write-Host "No Operation-Location header." -ForegroundColor Red; exit 1 }

# Poll
$deadline = (Get-Date).AddSeconds(60)
$status = "notStarted"
$result = $null
do {
  Start-Sleep -Seconds 2
  $result = Invoke-RestMethod -Method Get -Uri $opLoc -Headers $headers
  $status = $result.status
  Write-Host "Status: $status"
} while ($status -ne "succeeded" -and (Get-Date) -lt $deadline)

if ($status -ne "succeeded") { Write-Host "Timed out." -ForegroundColor Red; exit 1 }

# Summarize
$lines = @()
foreach ($read in $result.analyzeResult.readResults) {
  foreach ($l in $read.lines) { if ($l.text) { $lines += $l.text } }
}
$totalChars = ($lines | ForEach-Object { $_.Length } | Measure-Object -Sum).Sum
$preview = ($lines | Where-Object { $_ -and $_.Trim().Length -gt 0 })[0..4]

Write-Host "Preview:"
$preview | ForEach-Object { Write-Host "  · $_" }

if ($totalChars -lt 50) { Write-Host "FAIL (very little text found)" -ForegroundColor Red; exit 1 }
else { Write-Host "PASS" -ForegroundColor Green }
