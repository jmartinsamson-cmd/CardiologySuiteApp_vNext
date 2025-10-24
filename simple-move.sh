#!/bin/bash

# Simple reorganization - move just one file for testing

CONTAINER="edu-content"
CONNECTION_STRING="${AZURE_STORAGE_CONNECTION_STRING:-UseEnvironmentVariable}"

blob="education/006 - Cardiovascular Physiology] EKG Basics - How to Read & Interpret EKGs~ Updated Lecture.pdf"
filename=$(basename "$blob")
folder=$(dirname "$blob")
new_name="${folder//\//-}_${filename}"

echo "Moving: $blob"
echo "To: $new_name"

# Copy
az storage blob copy start \
    --destination-blob "$new_name" \
    --destination-container $CONTAINER \
    --source-blob "$blob" \
    --source-container $CONTAINER \
    --connection-string "$CONNECTION_STRING" \
    --output none

# Wait
sleep 5

# Check status
status=$(az storage blob show \
    --container-name $CONTAINER \
    --name "$new_name" \
    --connection-string "$CONNECTION_STRING" \
    --query "properties.copy.status" \
    --output tsv)

echo "Copy status: $status"

if [[ "$status" == "success" ]]; then
    # Delete original
    az storage blob delete \
        --container-name $CONTAINER \
        --name "$blob" \
        --connection-string "$CONNECTION_STRING" \
        --output none
    echo "Successfully moved!"
else
    echo "Copy failed"
fi