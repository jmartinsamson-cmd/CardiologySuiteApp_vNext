#!/bin/bash

# Dead Code Removal Script
# Based on analysis in DEAD_CODE_REPORT.md
# Only removes files with HIGH confidence they are unused

set -e

echo "════════════════════════════════════════════════════════════"
echo "           DEAD CODE REMOVAL SCRIPT"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "This script will remove truly unused files from the codebase."
echo "See DEAD_CODE_REPORT.md for full analysis."
echo ""
echo "⚠️  WARNING: This will delete files permanently!"
echo ""
read -p "Do you want to continue? (type 'yes' to proceed): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted. No files were deleted."
    exit 0
fi

echo ""
echo "📦 Creating backup before deletion..."
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="backups/pre-cleanup-$timestamp"
mkdir -p "$backup_dir"

# Backup files we're about to delete
files_to_backup=(
    "src/core/app.fixed.js"
    "src/core/router.js"
    "src/parsers/noteUtils.js"
    "src/utils/parserHelpers_clean.js"
    "src/utils/cardiac-guidelines.js"
    "src/utils/diagnostic-reasoning.js"
    "src/utils/error-reporting.js"
    "src/utils/progressBar.js"
    "src/utils/storage.js"
    "src/utils/unknownWordsTracker.js"
    "src/enhanced/afib-integration.js"
    "src/ui/navigation.js"
    "src/ui/test-parser.js"
)

for file in "${files_to_backup[@]}"; do
    if [ -f "$file" ]; then
        mkdir -p "$backup_dir/$(dirname "$file")"
        cp "$file" "$backup_dir/$file"
    fi
done

# Backup directories
dirs_to_backup=(
    "src/features/calculators"
    "src/features/decision-trees"
    "src/features/note-tools"
    "src/ui/components"
    "src/ui/patterns"
    "src/ui/shell"
)

for dir in "${dirs_to_backup[@]}"; do
    if [ -d "$dir" ]; then
        mkdir -p "$backup_dir/$(dirname "$dir")"
        cp -r "$dir" "$backup_dir/$dir"
    fi
done

echo "✅ Backup created: $backup_dir"
echo ""

# Delete individual files
echo "🗑️  Removing unused individual files..."

files_to_delete=(
    "src/core/app.fixed.js"
    "src/core/router.js"
    "src/parsers/noteUtils.js"
    "src/utils/parserHelpers_clean.js"
    "src/utils/cardiac-guidelines.js"
    "src/utils/diagnostic-reasoning.js"
    "src/utils/error-reporting.js"
    "src/utils/progressBar.js"
    "src/utils/storage.js"
    "src/utils/unknownWordsTracker.js"
    "src/enhanced/afib-integration.js"
    "src/ui/navigation.js"
    "src/ui/test-parser.js"
)

deleted_files=0
for file in "${files_to_delete[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "  ✓ Deleted: $file"
        ((deleted_files++))
    fi
done

echo "Deleted $deleted_files individual file(s)"
echo ""

# Delete entire unused feature directories
echo "🗑️  Removing unused feature directories..."

dirs_to_delete=(
    "src/features/calculators"
    "src/features/decision-trees"
    "src/features/note-tools"
    "src/ui/components"
    "src/ui/patterns"
    "src/ui/shell"
)

deleted_dirs=0
for dir in "${dirs_to_delete[@]}"; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        echo "  ✓ Deleted directory: $dir"
        ((deleted_dirs++))
    fi
done

echo "Deleted $deleted_dirs director(ies)"
echo ""

# Clean up empty parent directories
echo "🧹 Cleaning up empty parent directories..."
empty_dirs=(
    "src/enhanced"
    "src/features"
    "src/ui"
)

for dir in "${empty_dirs[@]}"; do
    if [ -d "$dir" ] && [ -z "$(ls -A "$dir")" ]; then
        rmdir "$dir"
        echo "  ✓ Removed empty: $dir"
    fi
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Dead code removal complete!"
echo ""
echo "📊 Summary:"
echo "  - Files deleted: $deleted_files"
echo "  - Directories deleted: $deleted_dirs"
echo "  - Backup location: $backup_dir"
echo ""
echo "⚠️  Next steps:"
echo "  1. Run tests: npm run test:unit"
echo "  2. Check pages load: open index.html, guidelines.html, meds.html"
echo "  3. Verify no console errors"
echo "  4. If everything works, commit the changes"
echo "  5. If issues occur, restore from backup"
echo ""
echo "To restore from backup:"
echo "  cp -r $backup_dir/* ."
echo ""
echo "════════════════════════════════════════════════════════════"
