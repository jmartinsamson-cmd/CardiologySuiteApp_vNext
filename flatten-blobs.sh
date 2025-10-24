#!/bin/bash
# Flatten Azure Blob Storage structure
# Moves all files from subfolders to root level with conflict resolution

set -e

STORAGE_ACCOUNT="cardiologysuitepub"
CONTAINER="edu-content"
BASE_FOLDER="education"

echo "🗂️  Flattening blob storage structure..."
echo "Storage Account: $STORAGE_ACCOUNT"
echo "Container: $CONTAINER"
echo "Base Folder: $BASE_FOLDER"
echo

# Get storage account key
ACCOUNT_KEY=$(az storage account keys list --account-name $STORAGE_ACCOUNT --resource-group cardiologysuite --query "[0].value" -o tsv)

# Function to flatten a subfolder
flatten_subfolder() {
    local subfolder="$1"
    echo "📁 Processing subfolder: $subfolder"

    # Get all blobs in this subfolder
    blobs=$(az storage blob list \
        --account-name $STORAGE_ACCOUNT \
        --account-key $ACCOUNT_KEY \
        --container-name $CONTAINER \
        --prefix "$BASE_FOLDER/$subfolder/" \
        --query "[].name" \
        --output tsv)

    local count=0
    local moved=0
    local skipped=0

    while IFS= read -r blob_name; do
        if [ -z "$blob_name" ]; then continue; fi

        ((count++))

        # Extract filename from path
        filename=$(basename "$blob_name")

        # Create new name in root folder
        new_name="$BASE_FOLDER/$filename"

        # Check if file already exists in root
        exists=$(az storage blob exists \
            --account-name $STORAGE_ACCOUNT \
            --account-key $ACCOUNT_KEY \
            --container-name $CONTAINER \
            --name "$new_name" \
            --query "exists" \
            --output tsv 2>/dev/null || echo "false")

        if [ "$exists" = "true" ]; then
            # File exists, add subfolder prefix to avoid conflict
            new_name="$BASE_FOLDER/${subfolder}_${filename}"
            echo "  ⚠️  Conflict resolved: $filename → ${subfolder}_${filename}"
        fi

        # Copy blob to new location
        az storage blob copy start \
            --account-name $STORAGE_ACCOUNT \
            --account-key $ACCOUNT_KEY \
            --source-container $CONTAINER \
            --source-blob "$blob_name" \
            --destination-container $CONTAINER \
            --destination-blob "$new_name" \
            --output none

        # Wait for copy to complete
        while true; do
            status=$(az storage blob show \
                --account-name $STORAGE_ACCOUNT \
                --account-key $ACCOUNT_KEY \
                --container-name $CONTAINER \
                --name "$new_name" \
                --query "properties.copy.status" \
                --output tsv 2>/dev/null || echo "pending")

            if [ "$status" = "success" ]; then
                break
            elif [ "$status" = "failed" ]; then
                echo "  ❌ Copy failed for $filename"
                break
            fi
            sleep 1
        done

        ((moved++))

        # Show progress every 10 files
        if [ $((moved % 10)) -eq 0 ]; then
            echo "  📊 Progress: $moved files processed..."
        fi

    done <<< "$blobs"

    echo "  ✅ $subfolder: $moved files moved, $skipped skipped"
    echo
}

# Get all subfolders
echo "🔍 Discovering subfolders..."
subfolders=$(az storage blob list \
    --account-name $STORAGE_ACCOUNT \
    --account-key $ACCOUNT_KEY \
    --container-name $CONTAINER \
    --prefix "$BASE_FOLDER/" \
    --query "[].name" \
    --output tsv | \
    sed "s|$BASE_FOLDER/||; s|/.*||" | \
    sort | uniq)

echo "📂 Found subfolders:"
echo "$subfolders" | while read -r folder; do
    if [ -n "$folder" ]; then
        count=$(az storage blob list \
            --account-name $STORAGE_ACCOUNT \
            --account-key $ACCOUNT_KEY \
            --container-name $CONTAINER \
            --prefix "$BASE_FOLDER/$folder/" \
            --query "length([])" \
            --output tsv)
        echo "  • $folder ($count files)"
    fi
done
echo

# Process each subfolder
total_moved=0
for subfolder in $subfolders; do
    if [ -n "$subfolder" ] && [ "$subfolder" != "$BASE_FOLDER" ]; then
        moved=$(flatten_subfolder "$subfolder")
        # Extract number from output (this is a bit hacky but works)
        moved_count=$(echo "$moved" | grep -o '[0-9]\+ files moved' | grep -o '[0-9]\+')
        total_moved=$((total_moved + moved_count))
    fi
done

echo "🎉 Flattening complete!"
echo "📊 Total files moved: $total_moved"
echo
echo "🧹 Next steps:"
echo "1. Verify files were moved correctly"
echo "2. Remove old subfolders (optional)"
echo "3. Update any applications that reference the old paths"