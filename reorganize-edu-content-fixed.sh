#!/bin/bash

# Reorganize edu-content blob container using temporary file approach
# More resilient version without set -e

CONTAINER="edu-content"
CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=cardiologysuitepub;AccountKey=DQEN5DozUQSQtgYX3PCCTtVP2/BM9i9TZckRkdiLXY2RSQ0xldsJd/P4B86Agf0hv8pV1IE/2Cwy+AStHCciHg==;EndpointSuffix=core.windows.net"
TEMP_FILE="/tmp/edu_blobs.txt"

echo "Starting edu-content reorganization..."

# Get all blob names and save to temp file
echo "Fetching blob list..."
az storage blob list --container-name $CONTAINER --connection-string "$CONNECTION_STRING" --query "[].name" --output tsv > "$TEMP_FILE"

# Count total blobs
TOTAL_BLOBS=$(wc -l < "$TEMP_FILE")
echo "Found $TOTAL_BLOBS blobs to process"

# Process each blob
PROCESSED=0
MOVED=0
SKIPPED=0
FAILED=0

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
    if az storage blob exists --container-name $CONTAINER --name "$new_name" --connection-string "$CONNECTION_STRING" --query exists --output tsv 2>/dev/null | grep -q "true"; then
        echo "  Target $new_name already exists, skipping"
        ((SKIPPED++))
        continue
    fi

    # Copy blob to new location
    echo "  Moving to: $new_name"
    if ! az storage blob copy start \
        --destination-blob "$new_name" \
        --destination-container $CONTAINER \
        --source-blob "$blob" \
        --source-container $CONTAINER \
        --connection-string "$CONNECTION_STRING" \
        --output none 2>/dev/null; then
        echo "  Failed to start copy for $blob"
        ((FAILED++))
        continue
    fi

    # Wait for copy to complete
    copy_attempts=0
    copy_success=false
    while [[ $copy_attempts -lt 30 ]]; do
        ((copy_attempts++))
        status=$(az storage blob show \
            --container-name $CONTAINER \
            --name "$new_name" \
            --connection-string "$CONNECTION_STRING" \
            --query "properties.copy.status" \
            --output tsv 2>/dev/null || echo "failed")

        if [[ "$status" == "success" ]]; then
            copy_success=true
            break
        elif [[ "$status" == "failed" ]]; then
            echo "  Copy failed for $blob"
            break
        fi

        if [[ $((copy_attempts % 5)) -eq 0 ]]; then
            echo "  Still waiting for copy to complete... ($copy_attempts attempts)"
        fi
        sleep 2
    done

    # Delete original blob if copy succeeded
    if [[ "$copy_success" == "true" ]]; then
        if az storage blob delete \
            --container-name $CONTAINER \
            --name "$blob" \
            --connection-string "$CONNECTION_STRING" \
            --output none 2>/dev/null; then
            ((MOVED++))
            echo "  Successfully moved $blob -> $new_name"
        else
            echo "  Failed to delete original $blob"
            ((FAILED++))
        fi
    else
        echo "  Copy did not complete successfully for $blob"
        ((FAILED++))
    fi

done < "$TEMP_FILE"

# Clean up temp file
rm -f "$TEMP_FILE"

echo "Reorganization complete!"
echo "Total processed: $PROCESSED"
echo "Successfully moved: $MOVED"
echo "Skipped: $SKIPPED"
echo "Failed: $FAILED"