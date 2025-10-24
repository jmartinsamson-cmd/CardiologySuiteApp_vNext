#!/bin/bash

# Simple reorganization script for edu-content blob container - process first 5 files

set -e

CONTAINER="edu-content"
CONNECTION_STRING="${AZURE_STORAGE_CONNECTION_STRING:-UseEnvironmentVariable}"

echo "Testing edu-content reorganization with first 5 files..."

# Get first 5 blob names as array
mapfile -t BLOBS < <(az storage blob list --container-name $CONTAINER --connection-string "$CONNECTION_STRING" --query "[].name" --output tsv | head -5)

echo "Found ${#BLOBS[@]} blobs to process"

# Process each blob
PROCESSED=0
MOVED=0
SKIPPED=0

for blob in "${BLOBS[@]}"; do
    ((PROCESSED++))
    echo "Processing $PROCESSED/5: $blob"

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

    echo "  Would move to: $new_name"
    echo "  (Skipping actual move for test - uncomment to enable)"

    # Uncomment these lines to actually perform the move:
    # az storage blob copy start --destination-blob "$new_name" --destination-container $CONTAINER --source-blob "$blob" --source-container $CONTAINER --connection-string "$CONNECTION_STRING" --output none
    # echo "  Copy started, waiting..."
    # sleep 3
    # az storage blob delete --container-name $CONTAINER --name "$blob" --connection-string "$CONNECTION_STRING" --output none
    # ((MOVED++))
    # echo "  Successfully moved $blob -> $new_name"

done

echo "Test complete!"
echo "Total processed: $PROCESSED"
echo "Would move: $((PROCESSED - SKIPPED))"
echo "Skipped: $SKIPPED"