$ErrorActionPreference = "Stop"

function Get-NowPlusHoursUtc([int]$h) {
  # Why: CLI expects ISO8601 UTC for expiry.
  return (Get-Date).ToUniversalTime().AddHours($h).ToString("yyyy-MM-ddTHH:mm:ssZ")
}

function Invoke-WithRetry {
  param (
    [scriptblock]$ScriptBlock,
    [int]$MaxRetries = 3,
    [int]$DelaySeconds = 2
  )
  $attempt = 0
  while ($attempt -lt $MaxRetries) {
    try {
      & $ScriptBlock
      return
    } catch {
      $attempt++
      if ($attempt -eq $MaxRetries) {
        throw
      }
      Write-Host "Attempt $attempt failed: $($_.Exception.Message). Retrying in $DelaySeconds seconds..." -ForegroundColor Yellow
      Start-Sleep -Seconds $DelaySeconds
      $DelaySeconds *= 2  # Exponential backoff
    }
  }
}

# 1) Inputs from environment variables
$StorageAccount = $env:AZURE_STORAGE_ACCOUNT
$Container = $env:AZURE_STORAGE_CONTAINER
$BlobName = $env:AZURE_BLOB_NAME
$ResourceGroup = $env:AZURE_RESOURCE_GROUP
$VisionEndpoint = $env:AZURE_VISION_ENDPOINT
$VisionKey = $env:AZURE_VISION_KEY

if (-not $StorageAccount -or -not $Container -or -not $BlobName -or -not $ResourceGroup -or -not $VisionEndpoint -or -not $VisionKey) {
  Write-Host "Missing required environment variables. Set AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_CONTAINER, AZURE_BLOB_NAME, AZURE_RESOURCE_GROUP, AZURE_VISION_ENDPOINT, AZURE_VISION_KEY." -ForegroundColor Red
  exit 1
}

# 2) SAS for blob
try {
  $acctKey = Invoke-WithRetry { az storage account keys list -g $ResourceGroup -n $StorageAccount --query [0].value -o tsv }
  $expiry  = Get-NowPlusHoursUtc 1
  $blobSas = Invoke-WithRetry { az storage blob generate-sas `
    --account-name $StorageAccount `
    --account-key  $acctKey `
    --container-name $Container `
    --name $BlobName `
    --permissions r `
    --https-only `
    --expiry $expiry -o tsv }
} catch {
  Write-Host "Failed to generate SAS URL: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

$global:BlobSasUrl = "https://$StorageAccount.blob.core.windows.net/$Container/$BlobName`?$blobSas"
Write-Host "SAS URL generated (1h): $BlobSasUrl" -ForegroundColor Cyan

# 3) Start OCR
$startUri = "$VisionEndpoint/vision/v3.2/read/analyze"
$headers  = @{ "Ocp-Apim-Subscription-Key" = $VisionKey; "Content-Type" = "application/json" }
$body     = @{ url = $BlobSasUrl } | ConvertTo-Json -Depth 3

try {
  $resp = Invoke-WithRetry { Invoke-WebRequest -Method Post -Uri $startUri -Headers $headers -Body $body }
  $opLoc = $resp.Headers["Operation-Location"]
  if (-not $opLoc) { throw "No Operation-Location header returned." }
} catch {
  Write-Host "Failed to start OCR: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# Poll with retry
$deadline = (Get-Date).AddSeconds(60)
$status = "notStarted"
$result = $null
$polls = 0
do {
  try {
    $result = Invoke-WithRetry { Invoke-RestMethod -Method Get -Uri $opLoc -Headers $headers }
    $status = $result.status
    Write-Host "Status: $status ..."
    if ($status -eq "failed") { throw "OCR operation failed." }
  } catch {
    Write-Host "Polling failed: $($_.Exception.Message)" -ForegroundColor Yellow
    if ($polls -ge 5) { throw }  # Max polls
  }
  $polls++
  Start-Sleep -Seconds 2
} while ($status -ne "succeeded" -and (Get-Date) -lt $deadline)

if ($status -ne "succeeded") { 
  Write-Host "Timed out waiting for OCR result." -ForegroundColor Red
  exit 1
}

# 4) Summarize
$lines = @()
foreach ($read in $result.analyzeResult.readResults) {
  foreach ($l in $read.lines) { if ($l.text) { $lines += $l.text } }
}

$totalChars = ($lines | ForEach-Object { $_.Length } | Measure-Object -Sum).Sum
$preview = ($lines | Where-Object { $_ -and $_.Trim().Length -gt 0 })[0..([Math]::Min(4, $lines.Count-1))]

Write-Host "----- OCR SUMMARY -----" -ForegroundColor Green
Write-Host ("Lines:    {0}" -f $lines.Count)
Write-Host ("Chars:    {0}" -f $totalChars)
Write-Host "Preview:"
$preview | ForEach-Object { Write-Host ("  · " + $_) }

if ($totalChars -lt 50) { 
  Write-Host "OCR CHECK: FAIL (very little text found)" -ForegroundColor Red
  exit 1
} else { 
  Write-Host "OCR CHECK: PASS" -ForegroundColor Green
}