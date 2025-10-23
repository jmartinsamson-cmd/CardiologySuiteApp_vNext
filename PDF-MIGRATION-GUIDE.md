# PDF Migration to Azure Blob Storage - Safety Checklist

## ✅ Pre-Migration Checklist

- [x] Storage account identified: `cardiologysuitepub`
- [x] Container identified: `edu-content`
- [x] 24 PDFs identified (111.82MB, files ≥ 1MB)
- [x] Only 2 code references found (in `data/cardiology_diagnoses/cardiology.json`)
- [x] Upload script created: `scripts/upload-pdfs-to-blob.sh`
- [x] Reference update script created: `scripts/update-pdf-references.cjs`
- [x] Backup strategy: Script creates backup list and JSON backups

## 📋 Migration Steps

### Step 1: Upload PDFs to Blob Storage
```bash
./scripts/upload-pdfs-to-blob.sh
```

**What it does:**
- Authenticates with Azure CLI
- Finds all PDFs ≥ 1MB in `src/assets/pdfs/`
- Asks for confirmation before uploading
- Uploads to `edu-content/pdfs/` folder
- Creates backup list with original → blob URL mapping
- Sets proper content type and cache headers

**Safety features:**
- Dry-run preview before upload
- Creates backup list
- Shows progress for each file
- Reports success/failure count

### Step 2: Update Code References
```bash
node scripts/update-pdf-references.cjs
```

**What it does:**
- Finds all PDF references in `data/cardiology_diagnoses/cardiology.json`
- Replaces local paths with blob URLs
- Creates timestamped backup before modifying
- Reports number of replacements

**Example transformation:**
```json
// Before
"path": "/src/assets/pdfs/cardiology/heart-failure/cardiomyopathy-notes.pdf"

// After
"path": "https://cardiologysuitepub.blob.core.windows.net/edu-content/pdfs/cardiology/heart-failure/cardiomyopathy-notes.pdf"
```

### Step 3: Verify Everything Works
```bash
# Start dev server
npm run dev

# Test PDF loading in browser
# Check browser console for any 404 errors
```

### Step 4: Remove Local PDFs (Optional - After Verification)
```bash
# Remove PDFs from working directory
find src/assets/pdfs -name "*.pdf" -size +1M -delete

# Remove from git
git rm src/assets/pdfs/cardiology/**/*.pdf
git rm src/assets/pdfs/general/**/*.pdf

# Commit changes
git commit -m "refactor: Move large PDFs to Azure Blob Storage

- Migrated 24 PDFs (111.82MB) to edu-content container
- Updated references in cardiology.json
- PDFs now served from: https://cardiologysuitepub.blob.core.windows.net/edu-content/pdfs/
- Reduces repo size by ~112MB"
```

### Step 5: Clean Git History (Optional - Advanced)
**⚠️ Only do this after successful verification and team coordination**

```bash
# This removes PDFs from entire git history
# Requires force push - coordinate with team first!

# Install BFG Repo-Cleaner (safer than git-filter-branch)
brew install bfg  # or download from https://rtyley.github.io/bfg-repo-cleaner/

# Clone fresh mirror
git clone --mirror https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext.git

# Remove PDFs from history
bfg --delete-files '*.pdf' --no-blob-protection CardiologySuiteApp_vNext.git

# Clean up
cd CardiologySuiteApp_vNext.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ coordinate with team!)
git push --force

# Re-clone your working copy
cd ..
rm -rf CardiologySuiteApp_vNext
git clone https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext.git
```

## 🔒 Safety Features

1. **Backups**: 
   - Upload script creates `pdf-backup-list-TIMESTAMP.txt`
   - Update script creates `*.backup-TIMESTAMP` for modified files

2. **Verification**:
   - Test in dev environment before committing
   - Check browser console for 404 errors
   - Validate JSON: `npm run validate:data`

3. **Rollback Plan**:
   ```bash
   # If something goes wrong, restore from backup:
   cp data/cardiology_diagnoses/cardiology.json.backup-* data/cardiology_diagnoses/cardiology.json
   
   # PDFs are still in blob storage and local repo until you delete them
   ```

## 📊 Expected Benefits

- **Repo size reduction**: ~112MB removed (files ≥ 1MB)
- **Git history cleanup**: Can reclaim ~110MB from history
- **Performance**: CDN delivery faster than app serving
- **Cost**: <$0.01/month for 112MB storage
- **Maintainability**: Update PDFs without redeploying app

## ⚠️ Important Notes

- Small PDFs (< 1MB) remain in repo for quick reference
- Blob URLs are publicly accessible (same as current static serving)
- Container already has proper access policy (blob public access)
- Cache headers set to 1 year for optimal CDN performance

## 🆘 Troubleshooting

**If PDFs don't load:**
1. Check browser console for exact error
2. Verify blob URL is accessible: `curl -I <blob-url>`
3. Check container access policy in Azure Portal
4. Restore from backup if needed

**If upload fails:**
1. Check Azure CLI authentication: `az account show`
2. Verify storage account permissions
3. Check network connectivity
4. Try uploading individual file via Azure Portal

## ✅ Success Criteria

- [ ] All 24 PDFs uploaded to blob storage
- [ ] All JSON references updated
- [ ] PDFs load correctly in browser
- [ ] No console errors
- [ ] JSON validates: `npm run validate:data`
- [ ] Committed changes to git
