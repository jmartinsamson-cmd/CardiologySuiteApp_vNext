#!/bin/bash

# Azure Blob Storage Reorganization Preview
# Shows how files would be organized WITHOUT making changes

STORAGE_ACCOUNT="cardiologysuitepub"
CONTAINER="edu-content"
BASE_FOLDER="education"

echo "📂 Blob Storage Reorganization Preview"
echo "════════════════════════════════════════"
echo ""

# Get storage account key
ACCOUNT_KEY=$(az storage account keys list --account-name $STORAGE_ACCOUNT --resource-group cardiologysuite --query "[0].value" -o tsv 2>/dev/null)

# File pattern mapping to categories
organize_file() {
    local filename="$1"
    local bn
    bn=$(basename "$filename")
    
    # Guidelines and protocols
    if [[ $bn =~ (guideline|protocol|algorithm|CHF_Guide|AtrialFib|CAD_) ]]; then
        echo "guidelines"
    # Calculators
    elif [[ $bn =~ (calculator|CHADVASC|scoring|risk) ]]; then
        echo "calculators"
    # Educational materials
    elif [[ $bn =~ (lecture|notes|study|exam|test|teaching|Blueprints|Cardiovascular.*Physiology|Cardiovascular.*Pharmacology) ]]; then
        echo "education"
    # Images and figures
    elif [[ $bn =~ \.(jpg|jpeg|png|gif|svg)$ ]] || [[ $bn =~ (978-0-323|drawing|EKG.*Basics|figure) ]]; then
        echo "images"
    # Procedures and documentation
    elif [[ $bn =~ (Documentation|Objective|Subjective|post.*op|template|form) ]]; then
        echo "procedures"
    # Medications
    elif [[ $bn =~ (Antiplatelet|Beta.*Blocker|ACE-I|ARB|Vasopressor|Antibiotics|pharmacology) ]]; then
        echo "medications"
    # Quick references
    elif [[ $bn =~ (^BP\.pdf|^CP\.pdf|^CCD\.pdf|^CMO\.pdf|Directory) ]]; then
        echo "references"
    # Textbook chapters
    elif [[ $bn =~ (chapter|Acute.*Coronary|syndrome) ]]; then
        echo "textbooks"
    # Default to root
    else
        echo "root"
    fi
}

# Get all blobs
echo "🔍 Analyzing 723 files..."
BLOBS=$(az storage blob list --account-name $STORAGE_ACCOUNT --account-key "$ACCOUNT_KEY" --container-name $CONTAINER --prefix "$BASE_FOLDER/" --query "[].name" -o tsv)

# Count by category
declare -A CATEGORY_COUNTS
declare -A CATEGORY_EXAMPLES
TOTAL_FILES=0

while IFS= read -r blob; do
    if [[ -z "$blob" ]]; then continue; fi
    
    category=$(organize_file "$blob")
    ((CATEGORY_COUNTS[$category]++))
    
    # Store first 3 examples
    if [[ ${CATEGORY_COUNTS[$category]} -le 3 ]]; then
        CATEGORY_EXAMPLES[$category]+="    • $(basename "$blob")"$'\n'
    fi
    
    ((TOTAL_FILES++))
done <<< "$BLOBS"

echo ""
echo "📊 Proposed Organization:"
echo ""

for category in guidelines calculators education images procedures medications references textbooks root; do
    count=${CATEGORY_COUNTS[$category]:-0}
    if [[ $count -gt 0 ]]; then
        printf "  %-15s %3d files\n" "$category/" "$count"
        echo "${CATEGORY_EXAMPLES[$category]}"
    fi
done

echo "  ────────────────────────────────────"
printf "  %-15s %3d files\n" "TOTAL:" "$TOTAL_FILES"
echo ""
echo "✅ Preview complete - no changes made"
