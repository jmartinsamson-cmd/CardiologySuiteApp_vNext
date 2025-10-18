# Migration Guide: Creating CardiologySuiteApp_vNext Repository

This guide will help you migrate the current codebase to a new GitHub repository.

## Step 1: Create the Repository on GitHub

You need to create the repository manually on GitHub since the token doesn't have repository creation permissions.

### Via GitHub Web Interface:

1. Go to https://github.com/new
2. Set **Repository name**: `CardiologySuiteApp_vNext`
3. Set **Description**: `Modern Cardiology Clinical Decision Support Suite with AI-Enhanced Features`
4. Choose **Public** (or Private if preferred)
5. **DO NOT** initialize with README, .gitignore, or license (we have those already)
6. Click **Create repository**

## Step 2: Prepare Local Repository

The following files have been created/updated for the new repository:
- ✅ `README.md` - Comprehensive project documentation
- ✅ `LICENSE` - MIT License with clinical disclaimer
- ✅ `.gitignore` - Complete Node/Vite/VSCode ignore rules
- ✅ `CONTRIBUTING.md` - Contribution guidelines
- ✅ `DEPLOYMENT.md` - Deployment instructions
- ✅ `services/ai-search/.env.example` - Environment template

## Step 3: Initialize Fresh Git Repository

```bash
# Navigate to project directory
cd /workspaces/cardiology-site

# Create a backup of current git state (optional but recommended)
cp -r .git .git.backup

# Remove current git tracking (WARNING: Make sure you've committed any important work!)
rm -rf .git

# Initialize fresh repository
git init

# Add all files
git add .

# Create initial commit
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
```

## Step 4: Connect to New Remote

After creating the repository on GitHub, connect it:

```bash
# Add the new remote
git remote add origin https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext.git

# Verify remote
git remote -v

# Create main branch
git branch -M main

# Push to new repository
git push -u origin main
```

## Step 5: Set Up Branch Protection (Optional but Recommended)

On GitHub:
1. Go to **Settings** > **Branches**
2. Add rule for `main` branch:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

## Step 6: Configure GitHub Actions (Optional)

The repository includes CI/CD workflow examples in `DEPLOYMENT.md`. To enable:

1. Create `.github/workflows/ci.yml` for continuous integration
2. Add required secrets in GitHub repository settings:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN` (if using Azure Static Web Apps)
   - Any other deployment credentials

## Step 7: Update Domain/URL Settings

Once deployed:

1. **Azure Static Web Apps**: Configure custom domain in Azure Portal
2. **GitHub Pages**: Update repository settings > Pages > Custom domain
3. **Vercel/Netlify**: Configure custom domain in platform dashboard

To replace the old URL with the new one:
- Update DNS records to point to new deployment
- Set up redirects from old URL to new URL if needed
- Update any external links to the application

## Step 8: Verify Deployment

```bash
# Clone the new repository in a separate directory to verify
cd ..
git clone https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext.git test-clone
cd test-clone

# Install and test
npm install
npm run dev

# Run tests
npm run test:unit
npm run lint
npm run validate:data
```

## Step 9: Archive Old Repository (Optional)

If you want to preserve the old repository:

1. Go to old repository: https://github.com/jmartinsamson-cmd/cardiology-site
2. Settings > General > Danger Zone
3. Archive repository (makes it read-only)
4. Add a README notice pointing to the new repository

## Rollback Plan

If something goes wrong:

```bash
# Restore the old .git directory
rm -rf .git
cp -r .git.backup .git

# Verify old remote
git remote -v
```

## Quick Command Summary

```bash
# After creating repo on GitHub:
cd /workspaces/cardiology-site
git init
git add .
git commit -m "Initial commit: CardiologySuiteApp vNext"
git branch -M main
git remote add origin https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext.git
git push -u origin main
```

## Notes

- The new repository will have a clean git history
- All files from the current workspace will be included
- The README.md is comprehensive and production-ready
- .gitignore is configured for Node.js, Vite, and VS Code
- License includes clinical disclaimer
- Contributing guidelines are included

## Support

If you encounter any issues during migration:
1. Check GitHub's documentation on creating repositories
2. Verify git remote configuration with `git remote -v`
3. Check push permissions with your GitHub account
4. Ensure you have the latest git version

---

Created: October 2025
