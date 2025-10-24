# Azure Cloud Shell - Flatten Blob Storage Structure
# PowerShell script to reorganize edu-content blob container

param(
    [string]$StorageAccountName = "cardiologysuitepub",
    [string]$ContainerName = "edu-content",
    [string]$BaseFolder = "education"
)

Write-Host "🗂️  Flattening Azure Blob Storage Structure" -ForegroundColor Cyan
Write-Host "Storage Account: $StorageAccountName" -ForegroundColor Yellow
Write-Host "Container: $ContainerName" -ForegroundColor Yellow
Write-Host "Base Folder: $BaseFolder" -ForegroundColor Yellow
Write-Host ""

# Get storage account key
$accountKey = az storage account keys list --account-name $StorageAccountName --resource-group cardiologysuite --query "[0].value" -o tsv

# Get all blobs in the base folder
Write-Host "🔍 Discovering blob structure..." -ForegroundColor Green
$blobs = az storage blob list --account-name $StorageAccountName --account-key $accountKey --container-name $ContainerName --prefix "$BaseFolder/" --query "[].name" -o tsv

# Group blobs by subfolder
$subfolderGroups = @{}
$totalFiles = 0

foreach ($blob in $blobs) {
    if ($blob -match "^$BaseFolder/([^/]+)/(.+)$") {
        $subfolder = $matches[1]
        $filename = $matches[2]

        if (-not $subfolderGroups.ContainsKey($subfolder)) {
            $subfolderGroups[$subfolder] = @()
        }
        $subfolderGroups[$subfolder] += $filename
        $totalFiles++
    }
}

Write-Host "📊 Found $totalFiles files across $($subfolderGroups.Count) subfolders:" -ForegroundColor Green
foreach ($subfolder in $subfolderGroups.Keys | Sort-Object) {
    $count = $subfolderGroups[$subfolder].Count
    Write-Host "  • $subfolder ($count files)" -ForegroundColor Gray
}
Write-Host ""

# Process each subfolder
$movedFiles = 0
$conflictsResolved = 0

foreach ($subfolder in $subfolderGroups.Keys | Sort-Object) {
    Write-Host "📁 Processing subfolder: $subfolder" -ForegroundColor Blue

    $files = $subfolderGroups[$subfolder]
    $subfolderMoved = 0
    $subfolderConflicts = 0

    foreach ($filename in $files) {
        $sourceBlob = "$BaseFolder/$subfolder/$filename"
        $targetBlob = "$BaseFolder/$filename"

        # Check if target already exists
        $exists = az storage blob exists --account-name $StorageAccountName --account-key $accountKey --container-name $ContainerName --name $targetBlob --query "exists" -o tsv

        if ($exists -eq "true") {
            # Resolve conflict by prefixing with subfolder name
            $targetBlob = "$BaseFolder/${subfolder}_${filename}"
            $subfolderConflicts++
            Write-Host "  ⚠️  Conflict: $filename → ${subfolder}_${filename}" -ForegroundColor Yellow
        }

        # Copy blob
        az storage blob copy start --account-name $StorageAccountName --account-key $accountKey --source-container $ContainerName --source-blob $sourceBlob --destination-container $ContainerName --destination-blob $targetBlob --output none

        # Wait for copy to complete
        do {
            Start-Sleep -Seconds 1
            $status = az storage blob show --account-name $StorageAccountName --account-key $accountKey --container-name $ContainerName --name $targetBlob --query "properties.copy.status" -o tsv 2>$null
        } while ($status -eq "pending")

        if ($status -eq "success") {
            $subfolderMoved++
            $movedFiles++
        } else {
            Write-Host "  ❌ Failed to copy: $filename" -ForegroundColor Red
        }

        # Progress indicator
        if ($subfolderMoved % 10 -eq 0 -and $subfolderMoved -gt 0) {
            Write-Host "  📊 Progress: $subfolderMoved files processed in $subfolder..." -ForegroundColor Gray
        }
    }

    Write-Host "  ✅ $subfolder complete: $subfolderMoved moved, $subfolderConflicts conflicts resolved" -ForegroundColor Green
    Write-Host ""
}

Write-Host "🎉 Blob flattening complete!" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "  • Total files processed: $totalFiles" -ForegroundColor White
Write-Host "  • Files moved: $movedFiles" -ForegroundColor White
Write-Host "  • Conflicts resolved: $conflictsResolved" -ForegroundColor White
Write-Host ""
Write-Host "🧹 Next steps:" -ForegroundColor Green
Write-Host "1. Verify files were moved correctly" -ForegroundColor White
Write-Host "2. Remove old subfolders (optional - run cleanup script)" -ForegroundColor White
Write-Host "3. Update any applications referencing old paths" -ForegroundColor White