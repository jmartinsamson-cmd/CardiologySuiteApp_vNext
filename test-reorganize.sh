#!/bin/bash

# Simple test reorganization script for edu-content blob container

set -e

CONTAINER="edu-content"
CONNECTION_STRING="${AZURE_STORAGE_CONNECTION_STRING:-UseEnvironmentVariable}"

echo "Testing edu-content reorganization with first 3 files..."

# Get first 3 blob names
BLOBS=$(az storage blob list --container-name $CONTAINER --connection-string "$CONNECTION_STRING" --query "[].name" --output tsv | head -3)

echo "Processing blobs:"
echo "$BLOBS"

# Process each blob
echo "$BLOBS" | while read -r blob; do
    echo "Processing: $blob"

    # Skip if already at root level (no slash)
    if [[ "$blob" != *"/"* ]]; then
        echo "  Already at root level, skipping"
        continue
    fi

    # Extract filename and folder
    filename=$(basename "$blob")
    folder=$(dirname "$blob")

    # Create new name with folder prefix to avoid conflicts
    new_name="${folder//\//-}_${filename}"

    echo "  Would move to: $new_name"
    echo "  (Skipping actual move for test)"

done

echo "Test complete!"