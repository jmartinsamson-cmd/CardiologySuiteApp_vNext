#!/bin/bash

# Reorganize edu-content blob container
# Flatten all subfolders and move files to root level

set -e

CONTAINER="edu-content"
ACCOUNT="cardiologysuitepub"
CONNECTION_STRING="${AZURE_STORAGE_CONNECTION_STRING:-UseEnvironmentVariable}"

echo "Starting edu-content reorganization..."

# Get all blob names
echo "Fetching blob list..."
BLOBS=$(az storage blob list --container-name $CONTAINER --connection-string "$CONNECTION_STRING" --query "[].name" --output tsv)

# Count total blobs
TOTAL_BLOBS=$(echo "$BLOBS" | wc -l)
echo "Found $TOTAL_BLOBS blobs to process"

# Process each blob
PROCESSED=0
MOVED=0
SKIPPED=0

# Use process substitution to avoid subshell issues
while read -r blob; do
    ((PROCESSED++))
    echo "Processing $PROCESSED/$TOTAL_BLOBS: $blob"

    # Skip if already at root level (no slash)
    if [[ "$blob" != *"/"* ]]; then
        echo "  Already at root level, skipping"
        ((SKIPPED++))
        continue
    fi

    # Extract filename and folder
    filename=$(basename "$blob")
    folder=$(dirname "$blob")

    # Create new name with folder prefix to avoid conflicts
    new_name="${folder//\//-}_${filename}"

    # Check if target already exists
    if az storage blob exists --container-name $CONTAINER --name "$new_name" --connection-string "$CONNECTION_STRING" --query exists --output tsv | grep -q "true"; then
        echo "  Target $new_name already exists, skipping"
        ((SKIPPED++))
        continue
    fi

    # Copy blob to new location
    echo "  Moving to: $new_name"
    az storage blob copy start \
        --destination-blob "$new_name" \
        --destination-container $CONTAINER \
        --source-blob "$blob" \
        --source-container $CONTAINER \
        --connection-string "$CONNECTION_STRING" \
        --output none

    # Wait for copy to complete
    while true; do
        status=$(az storage blob show \
            --container-name $CONTAINER \
            --name "$new_name" \
            --connection-string "$CONNECTION_STRING" \
            --query "properties.copy.status" \
            --output tsv 2>/dev/null || echo "failed")

        if [[ "$status" == "success" ]]; then
            break
        elif [[ "$status" == "failed" ]]; then
            echo "  Copy failed for $blob"
            break
        fi

        echo "  Waiting for copy to complete..."
        sleep 2
    done

    # Delete original blob
    if [[ "$status" == "success" ]]; then
        az storage blob delete \
            --container-name $CONTAINER \
            --name "$blob" \
            --connection-string "$CONNECTION_STRING" \
            --output none
        ((MOVED++))
        echo "  Successfully moved $blob -> $new_name"
    fi

done < <(echo "$BLOBS")

echo "Reorganization complete!"
echo "Total processed: $PROCESSED"
echo "Successfully moved: $MOVED"
echo "Skipped: $SKIPPED"

# Clean up empty folders (this would require additional logic for Azure blob storage)
echo "Note: Empty folder cleanup would need to be done manually or with additional scripting"