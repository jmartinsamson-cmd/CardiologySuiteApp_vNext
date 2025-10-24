#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy OCR FastAPI app to Azure Container Apps
.DESCRIPTION
    Builds container image, pushes to ACR, and deploys to Azure Container Apps with Form Recognizer secrets.
#>

param(
    [string]$ResourceGroup = "cardiologysuite",
    [string]$ContainerRegistry = "cardiologysuiteacr",
    [string]$ContainerAppEnv = "cardiologysuite",
    [string]$AppName = "cardiology-ocr-app",
    [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   OCR Container App Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI not found. Install from: https://aka.ms/azure-cli"
    exit 1
}

# Check if logged in
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "❌ Not logged into Azure. Running 'az login'..." -ForegroundColor Red
    az login
    if ($LASTEXITCODE -ne 0) { exit 1 }
}

Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host "✅ Subscription: $($account.name)`n" -ForegroundColor Green

# Step 1: Build and push container image to ACR
Write-Host "🔨 Step 1: Building container image..." -ForegroundColor Yellow
$imageName = "$ContainerRegistry.azurecr.io/ocr-app:$ImageTag"

az acr build `
    --registry $ContainerRegistry `
    --image "ocr-app:$ImageTag" `
    --file Dockerfile.ocr `
    .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build and push container image"
    exit 1
}

Write-Host "✅ Image built and pushed: $imageName`n" -ForegroundColor Green

# Step 2: Get Form Recognizer credentials from environment or prompt
Write-Host "🔑 Step 2: Configuring Form Recognizer secrets..." -ForegroundColor Yellow

$formRecognizerEndpoint = $env:FORM_RECOGNIZER_ENDPOINT
$formRecognizerKey = $env:FORM_RECOGNIZER_KEY

if (-not $formRecognizerEndpoint) {
    $formRecognizerEndpoint = Read-Host "Enter Form Recognizer Endpoint (e.g., https://cardiologysuite-ocr.cognitiveservices.azure.com/)"
}

if (-not $formRecognizerKey) {
    $formRecognizerKey = Read-Host "Enter Form Recognizer API Key" -AsSecureString
    $formRecognizerKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($formRecognizerKey)
    )
}

Write-Host "✅ Form Recognizer configured`n" -ForegroundColor Green

# Step 3: Deploy or update container app
Write-Host "🚀 Step 3: Deploying to Azure Container Apps..." -ForegroundColor Yellow

# Check if app exists
$appExists = az containerapp show `
    --name $AppName `
    --resource-group $ResourceGroup `
    2>$null

if ($appExists) {
    Write-Host "📦 Updating existing container app: $AppName" -ForegroundColor Cyan
    
    az containerapp update `
        --name $AppName `
        --resource-group $ResourceGroup `
        --image $imageName `
        --set-env-vars `
            "FORM_RECOGNIZER_ENDPOINT=$formRecognizerEndpoint" `
        --secrets `
            "form-recognizer-key=$formRecognizerKey" `
        --replace-env-vars `
            "FORM_RECOGNIZER_KEY=secretref:form-recognizer-key"
} else {
    Write-Host "📦 Creating new container app: $AppName" -ForegroundColor Cyan
    
    az containerapp create `
        --name $AppName `
        --resource-group $ResourceGroup `
        --environment $ContainerAppEnv `
        --image $imageName `
        --target-port 8000 `
        --ingress external `
        --min-replicas 1 `
        --max-replicas 3 `
        --cpu 0.5 `
        --memory 1.0Gi `
        --env-vars `
            "FORM_RECOGNIZER_ENDPOINT=$formRecognizerEndpoint" `
        --secrets `
            "form-recognizer-key=$formRecognizerKey" `
        --secret-env-vars `
            "FORM_RECOGNIZER_KEY=form-recognizer-key"
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to deploy container app"
    exit 1
}

Write-Host "✅ Container app deployed successfully`n" -ForegroundColor Green

# Step 4: Get the app URL
Write-Host "🌐 Step 4: Getting app URL..." -ForegroundColor Yellow
$appUrl = az containerapp show `
    --name $AppName `
    --resource-group $ResourceGroup `
    --query "properties.configuration.ingress.fqdn" `
    -o tsv

if ($appUrl) {
    Write-Host "✅ App URL: https://$appUrl`n" -ForegroundColor Green
    
    # Test health endpoint
    Write-Host "🏥 Testing health endpoint..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5  # Wait for app to start
    
    try {
        $healthResponse = Invoke-WebRequest -Uri "https://$appUrl/health" -TimeoutSec 10
        if ($healthResponse.StatusCode -eq 200) {
            Write-Host "✅ Health check passed!" -ForegroundColor Green
            Write-Host $healthResponse.Content
        }
    } catch {
        Write-Host "⚠️  Health check failed (app may still be starting): $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test endpoints: node test-ocr-health.js" -ForegroundColor White
Write-Host "  2. View logs: az containerapp logs show --name $AppName --resource-group $ResourceGroup --follow" -ForegroundColor White
Write-Host "  3. Update .env with OCR_SERVICE_URL=https://$appUrl`n" -ForegroundColor White
