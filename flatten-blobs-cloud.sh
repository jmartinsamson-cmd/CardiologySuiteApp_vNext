#!/bin/bash

# Azure Cloud Shell - Flatten Blob Storage Structure
# Bash script to reorganize edu-content blob container

STORAGE_ACCOUNT="cardiologysuitepub"
CONTAINER="edu-content"
BASE_FOLDER="education"

echo "🗂️  Flattening Azure Blob Storage Structure"
echo "Storage Account: $STORAGE_ACCOUNT"
echo "Container: $CONTAINER"
echo "Base Folder: $BASE_FOLDER"
echo ""

# Get storage account key
ACCOUNT_KEY=$(az storage account keys list --account-name $STORAGE_ACCOUNT --resource-group cardiologysuite --query "[0].value" -o tsv)

# Get all blobs in the base folder
echo "🔍 Discovering blob structure..."
BLOBS=$(az storage blob list --account-name $STORAGE_ACCOUNT --account-key "$ACCOUNT_KEY" --container-name $CONTAINER --prefix "$BASE_FOLDER/" --query "[].name" -o tsv)

# Count total files and subfolders
TOTAL_FILES=0
declare -A SUBFOLDER_COUNTS

while IFS= read -r blob; do
    if [[ $blob =~ ^$BASE_FOLDER/([^/]+)/(.+)$ ]]; then
        subfolder="${BASH_REMATCH[1]}"
        filename="${BASH_REMATCH[2]}"
        ((SUBFOLDER_COUNTS[$subfolder]++))
        ((TOTAL_FILES++))
    fi
done <<< "$BLOBS"

echo "📊 Found $TOTAL_FILES files across ${#SUBFOLDER_COUNTS[@]} subfolders:"
for subfolder in "${!SUBFOLDER_COUNTS[@]}"; do
    count=${SUBFOLDER_COUNTS[$subfolder]}
    echo "  • $subfolder ($count files)"
done | sort -k3 -nr
echo ""

# Process each subfolder
MOVED_FILES=0
CONFLICTS_RESOLVED=0

for subfolder in "${!SUBFOLDER_COUNTS[@]}"; do
    echo "📁 Processing subfolder: $subfolder"

    # Get files in this subfolder
    SUBFOLDER_BLOBS=$(az storage blob list --account-name $STORAGE_ACCOUNT --account-key "$ACCOUNT_KEY" --container-name $CONTAINER --prefix "$BASE_FOLDER/$subfolder/" --query "[].name" -o tsv)

    SUBFOLDER_MOVED=0
    SUBFOLDER_CONFLICTS=0

    while IFS= read -r source_blob; do
        if [[ -z "$source_blob" ]]; then continue; fi

        # Extract filename from path
        filename=$(basename "$source_blob")

        # Target blob path (flattened)
        target_blob="$BASE_FOLDER/$filename"

        # Check if target already exists
        EXISTS=$(az storage blob exists --account-name $STORAGE_ACCOUNT --account-key "$ACCOUNT_KEY" --container-name $CONTAINER --name "$target_blob" --query "exists" -o tsv)

        if [[ "$EXISTS" == "true" ]]; then
            # Resolve conflict by prefixing with subfolder name
            target_blob="$BASE_FOLDER/${subfolder}_${filename}"
            ((SUBFOLDER_CONFLICTS++))
            ((CONFLICTS_RESOLVED++))
            echo "  ⚠️  Conflict: $filename → ${subfolder}_${filename}"
        fi

        # Copy blob
        az storage blob copy start --account-name $STORAGE_ACCOUNT --account-key "$ACCOUNT_KEY" --source-container $CONTAINER --source-blob "$source_blob" --destination-container $CONTAINER --destination-blob "$target_blob" --output none

        # Wait for copy to complete
        while true; do
            sleep 1
            STATUS=$(az storage blob show --account-name $STORAGE_ACCOUNT --account-key "$ACCOUNT_KEY" --container-name $CONTAINER --name "$target_blob" --query "properties.copy.status" -o tsv 2>/dev/null)
            if [[ "$STATUS" != "pending" ]]; then
                break
            fi
        done

        if [[ "$STATUS" == "success" ]]; then
            ((SUBFOLDER_MOVED++))
            ((MOVED_FILES++))
        else
            echo "  ❌ Failed to copy: $filename"
        fi

        # Progress indicator
        if (( SUBFOLDER_MOVED % 10 == 0 && SUBFOLDER_MOVED > 0 )); then
            echo "  📊 Progress: $SUBFOLDER_MOVED files processed in $subfolder..."
        fi

    done <<< "$SUBFOLDER_BLOBS"

    echo "  ✅ $subfolder complete: $SUBFOLDER_MOVED moved, $SUBFOLDER_CONFLICTS conflicts resolved"
    echo ""

done

echo "🎉 Blob flattening complete!"
echo "📊 Summary:"
echo "  • Total files processed: $TOTAL_FILES"
echo "  • Files moved: $MOVED_FILES"
echo "  • Conflicts resolved: $CONFLICTS_RESOLVED"
echo ""
echo "🧹 Next steps:"
echo "1. Verify files were moved correctly"
echo "2. Remove old subfolders (optional - run cleanup script)"
echo "3. Update any applications referencing old paths"