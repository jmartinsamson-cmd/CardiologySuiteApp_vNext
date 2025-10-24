#!/bin/bash

# Azure Blob Storage Reorganization Script
# Organizes edu-content into logical categories

STORAGE_ACCOUNT="cardiologysuitepub"
CONTAINER="edu-content"
BASE_FOLDER="education"

echo "📂 Reorganizing Azure Blob Storage"
echo "════════════════════════════════════"
echo ""

# Get storage account key
ACCOUNT_KEY=$(az storage account keys list --account-name $STORAGE_ACCOUNT --resource-group cardiologysuite --query "[0].value" -o tsv 2>/dev/null)

# Define new folder structure
declare -A CATEGORIES=(
    ["guidelines"]="Clinical practice guidelines, protocols, and treatment algorithms"
    ["calculators"]="Clinical calculators and scoring tools"
    ["education"]="Educational materials, lectures, and teaching resources"
    ["images"]="Figures, diagrams, EKGs, and visual references"
    ["procedures"]="Procedural guides and documentation templates"
    ["medications"]="Pharmacology references and drug information"
    ["references"]="Quick reference cards and cheat sheets"
    ["textbooks"]="Textbook chapters and comprehensive reviews"
)

# File pattern mapping to categories
organize_file() {
    local filename="$1"
    local basename=$(basename "$filename")
    
    # Guidelines and protocols
    if [[ $basename =~ (guideline|protocol|algorithm|CHF_Guide|AtrialFib|CAD_) ]]; then
        echo "guidelines"
    # Calculators
    elif [[ $basename =~ (calculator|CHADVASC|scoring|risk) ]]; then
        echo "calculators"
    # Educational materials
    elif [[ $basename =~ (lecture|notes|study|exam|test|teaching|Blueprints|Cardiovascular.*Physiology|Cardiovascular.*Pharmacology) ]]; then
        echo "education"
    # Images and figures
    elif [[ $basename =~ \.(jpg|jpeg|png|gif|svg)$ ]] || [[ $basename =~ (978-0-323|drawing|EKG.*Basics|figure) ]]; then
        echo "images"
    # Procedures and documentation
    elif [[ $basename =~ (Documentation|Objective|Subjective|post.*op|template|form) ]]; then
        echo "procedures"
    # Medications
    elif [[ $basename =~ (Antiplatelet|Beta.*Blocker|ACE-I|ARB|Vasopressor|Antibiotics|pharmacology) ]]; then
        echo "medications"
    # Quick references
    elif [[ $basename =~ (^BP\.pdf|^CP\.pdf|^CCD\.pdf|^CMO\.pdf|Directory) ]]; then
        echo "references"
    # Textbook chapters
    elif [[ $basename =~ (chapter|Acute.*Coronary|syndrome) ]]; then
        echo "textbooks"
    # Default to root
    else
        echo "root"
    fi
}

# Get all blobs
echo "🔍 Analyzing current structure..."
BLOBS=$(az storage blob list --account-name $STORAGE_ACCOUNT --account-key "$ACCOUNT_KEY" --container-name $CONTAINER --prefix "$BASE_FOLDER/" --query "[].name" -o tsv)

# Count by category
declare -A CATEGORY_COUNTS
TOTAL_FILES=0

while IFS= read -r blob; do
    if [[ -z "$blob" ]]; then continue; fi
    
    category=$(organize_file "$blob")
    ((CATEGORY_COUNTS[$category]++))
    ((TOTAL_FILES++))
done <<< "$BLOBS"

echo "📊 Proposed organization:"
echo ""
for category in "${!CATEGORIES[@]}"; do
    count=${CATEGORY_COUNTS[$category]:-0}
    description=${CATEGORIES[$category]}
    if [[ $count -gt 0 ]]; then
        printf "  %-15s %3d files - %s\n" "$category:" "$count" "$description"
    fi
done
echo "  ────────────────────────────────"
printf "  %-15s %3d files\n" "root:" "${CATEGORY_COUNTS[root]:-0}"
printf "  %-15s %3d files\n" "TOTAL:" "$TOTAL_FILES"
echo ""

read -p "Proceed with reorganization? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 0
fi

# Perform reorganization
echo ""
echo "🚀 Starting reorganization..."
MOVED_COUNT=0
SKIPPED_COUNT=0

while IFS= read -r source_blob; do
    if [[ -z "$source_blob" ]]; then continue; fi
    
    filename=$(basename "$source_blob")
    category=$(organize_file "$source_blob")
    
    if [[ "$category" == "root" ]]; then
        # Keep in root
        target_blob="$BASE_FOLDER/$filename"
    else
        # Move to category folder
        target_blob="$BASE_FOLDER/$category/$filename"
    fi
    
    # Skip if already in correct location
    if [[ "$source_blob" == "$target_blob" ]]; then
        ((SKIPPED_COUNT++))
        continue
    fi
    
    # Check if target exists
    EXISTS=$(az storage blob exists --account-name $STORAGE_ACCOUNT --account-key "$ACCOUNT_KEY" --container-name $CONTAINER --name "$target_blob" --query "exists" -o tsv 2>/dev/null)
    
    if [[ "$EXISTS" == "true" ]]; then
        echo "  ⚠️  Skipping (exists): $target_blob"
        ((SKIPPED_COUNT++))
        continue
    fi
    
    # Copy to new location
    az storage blob copy start \
        --account-name $STORAGE_ACCOUNT \
        --account-key "$ACCOUNT_KEY" \
        --source-container $CONTAINER \
        --source-blob "$source_blob" \
        --destination-container $CONTAINER \
        --destination-blob "$target_blob" \
        --output none 2>/dev/null
    
    if [[ $? -eq 0 ]]; then
        ((MOVED_COUNT++))
        if (( MOVED_COUNT % 50 == 0 )); then
            echo "  📊 Progress: $MOVED_COUNT files organized..."
        fi
    fi
    
done <<< "$BLOBS"

echo ""
echo "✅ Reorganization complete!"
echo "  • Files organized: $MOVED_COUNT"
echo "  • Files skipped: $SKIPPED_COUNT"
echo "  • Total processed: $TOTAL_FILES"
echo ""
echo "🧹 Note: Old files still exist. Run cleanup script to remove duplicates after verification."
