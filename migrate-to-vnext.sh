#!/bin/bash
# Migration Script for CardiologySuiteApp_vNext
# Run this script after creating the repository on GitHub

set -e  # Exit on error

echo "🚀 CardiologySuiteApp vNext Migration Script"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the cardiology-site directory?"
    exit 1
fi

echo "✅ Current directory confirmed"
echo ""

# Confirm with user
echo "⚠️  WARNING: This will:"
echo "   1. Backup your current .git directory to .git.backup"
echo "   2. Initialize a fresh git repository"
echo "   3. Create an initial commit with all files"
echo "   4. Set up the new remote"
echo ""
read -p "Have you created the CardiologySuiteApp_vNext repository on GitHub? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please create the repository first:"
    echo "  1. Go to https://github.com/new"
    echo "  2. Repository name: CardiologySuiteApp_vNext"
    echo "  3. Description: Modern Cardiology Clinical Decision Support Suite with AI-Enhanced Features"
    echo "  4. DO NOT initialize with README, .gitignore, or license"
    echo ""
    exit 1
fi

echo ""
echo "📦 Step 1: Backing up current git state..."
if [ -d ".git" ]; then
    cp -r .git .git.backup
    echo "✅ Backup created at .git.backup"
else
    echo "ℹ️  No .git directory found, skipping backup"
fi

echo ""
echo "🔄 Step 2: Initializing fresh repository..."
rm -rf .git
git init
echo "✅ Fresh repository initialized"

echo ""
echo "📝 Step 3: Adding all files..."
git add .
echo "✅ Files staged"

echo ""
echo "💾 Step 4: Creating initial commit..."
git commit -m "Initial commit: CardiologySuiteApp vNext

Modern Cardiology Clinical Decision Support Suite with:
- AI-enhanced clinical note parsing (GPT-4 integration)
- Interactive clinical decision trees (ACS pathways)
- Comprehensive cardiology reference database
- Privacy-first architecture (zero PHI storage)
- Progressive Web App capabilities
- Azure AI Search integration
- Modern ES6+ modular architecture
"
echo "✅ Initial commit created"

echo ""
echo "🌐 Step 5: Setting up remote..."
git branch -M main
git remote add origin https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext.git
echo "✅ Remote configured"

echo ""
echo "⬆️  Step 6: Pushing to GitHub..."
git push -u origin main

echo ""
echo "🎉 Migration Complete!"
echo ""
echo "✅ Repository successfully migrated to:"
echo "   https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext"
echo ""
echo "📋 Next steps:"
echo "   1. Visit your new repository on GitHub"
echo "   2. Review the README.md"
echo "   3. Set up branch protection (Settings > Branches)"
echo "   4. Configure deployment (see DEPLOYMENT.md)"
echo "   5. Update your domain/URL settings"
echo ""
echo "🔄 Rollback available:"
echo "   If needed, run: rm -rf .git && cp -r .git.backup .git"
echo ""
