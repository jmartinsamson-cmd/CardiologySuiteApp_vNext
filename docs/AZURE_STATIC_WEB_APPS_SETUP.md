# Azure Static Web Apps Deployment Guide

## Your Setup is Complete! ✅

Your Cardiology Suite app is **ready to deploy** to Azure Static Web Apps with the Medical Q&A API.

## What's Already Configured

✅ **API Functions** (`api/` folder)
- `GET /api/health` - Health check
- `POST /api/medical-qa` - Medical Q&A with RAG
- All dependencies installed
- Environment variables configured

✅ **Static Web App Config** (`staticwebapp.config.json`)
- Routes configured
- Security headers set
- API routing enabled

✅ **GitHub Actions Workflow** (`.github/workflows/azure-static-web-apps.yml`)
- Auto-deploy on push to main
- Environment variables configured
- Pull request previews enabled

## Deployment Steps

### 1. Create Azure Static Web App

Using Azure Portal:
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → Search "Static Web Apps"
3. Click "Create"
4. Fill in:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: `cardiology-suite-rg` (or create new)
   - **Name**: `cardiology-suite-app`
   - **Plan type**: Free (or Standard for production)
   - **Region**: East US 2 (same as your Azure OpenAI)
   - **Deployment source**: GitHub
   - **Organization**: jmartinsamson-cmd
   - **Repository**: CardiologySuiteApp_vNext
   - **Branch**: main
5. **Build Details**:
   - **Build Presets**: Custom
   - **App location**: `/`
   - **Api location**: `api`
   - **Output location**: `` (leave empty)
6. Click "Review + create" → "Create"

### 2. Configure GitHub Secrets

The deployment creates a secret `AZURE_STATIC_WEB_APPS_API_TOKEN` automatically.

Add your Azure secrets in GitHub:
1. Go to: <https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext/settings/secrets/actions>
2. Click "New repository secret" for each:

```
AZURE_OPENAI_ENDPOINT=https://jsamb-mgvbqri7-eastus2.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY=<your-key>
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-minisamson
AZURE_OPENAI_API_VERSION=2025-01-01-preview

AZURE_SEARCH_ENDPOINT=https://cardiologysuite-search.search.windows.net
AZURE_SEARCH_NAME=cardiologysuite-search
AZURE_SEARCH_INDEX=edu-index-v2
AZURE_SEARCH_ADMIN_KEY=<your-key>
AZURE_SEARCH_API_VERSION=2024-07-01
```

### 3. Deploy

**Option A: Automatic (Recommended)**
```bash
# Just push to main branch
git checkout main
git merge feat/parser-training-simplify
git push origin main
```

GitHub Actions will automatically deploy!

**Option B: Manual via Azure CLI**
```bash
# Get your deployment token from Azure Portal
# Settings → API → Deployment token

az staticwebapp deploy \
  --name cardiology-suite-app \
  --resource-group cardiology-suite-rg \
  --app-location . \
  --api-location api \
  --output-location "" \
  --token <your-deployment-token>
```

### 4. Configure Application Settings (Azure Portal)

After deployment, add environment variables in Azure Portal:

1. Go to your Static Web App
2. Click "Configuration" (left menu)
3. Click "Application settings"
4. Add each environment variable:
   - AZURE_OPENAI_ENDPOINT
   - AZURE_OPENAI_API_KEY
   - AZURE_OPENAI_DEPLOYMENT
   - AZURE_OPENAI_API_VERSION
   - AZURE_SEARCH_ENDPOINT
   - AZURE_SEARCH_NAME
   - AZURE_SEARCH_INDEX
   - AZURE_SEARCH_ADMIN_KEY
   - AZURE_SEARCH_API_VERSION

5. Click "Save"

## Your URLs After Deployment

- **App**: `https://cardiology-suite-app.azurestaticapps.net`
- **API Health**: `https://cardiology-suite-app.azurestaticapps.net/api/health`
- **Medical Q&A**: `https://cardiology-suite-app.azurestaticapps.net/api/medical-qa`

## Testing the Deployed API

```bash
# Health check
curl https://cardiology-suite-app.azurestaticapps.net/api/health

# Medical Q&A
curl -X POST https://cardiology-suite-app.azurestaticapps.net/api/medical-qa \
  -H "Content-Type: application/json" \
  -d '{"question":"What is atrial fibrillation?"}'
```

## Features Enabled

✅ **Serverless API** - Azure Functions runs your Medical Q&A API
✅ **RAG System** - Retrieves from 663 cardiology guideline PDFs
✅ **Auto-scaling** - Handles traffic automatically
✅ **Global CDN** - Fast content delivery worldwide
✅ **Free SSL** - HTTPS enabled automatically
✅ **Pull Request Previews** - Test changes before merging
✅ **GitHub Integration** - Auto-deploy on push

## Architecture

```
User → Azure Static Web Apps
         ↓
    Static Content (HTML/CSS/JS)
         ↓
    Azure Functions (/api/*)
         ↓
         ├→ Azure OpenAI (gpt-4.1-minisamson)
         └→ Azure AI Search (edu-index-v2, 663 PDFs)
```

## Cost Estimate

**Free Tier Includes:**
- 100 GB bandwidth/month
- Unlimited API calls
- Custom domains
- SSL certificates
- GitHub integration

**Your Usage:**
- Static content: ~10 MB
- API calls: Pay-per-use (Azure Functions consumption)
- Azure OpenAI: Pay-per-token
- Azure AI Search: Basic tier (already provisioned)

**Estimated Monthly Cost**: $10-50 depending on usage

## Monitoring

View deployment status:
- GitHub Actions: <https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext/actions>
- Azure Portal: <https://portal.azure.com> → Static Web Apps → cardiology-suite-app

Check logs:
- Azure Portal → Static Web App → "Log stream"
- Application Insights (if configured)

## Troubleshooting

**Deployment fails:**
- Check GitHub Actions logs
- Verify secrets are set correctly
- Ensure `api/` folder structure is correct

**API returns 500 errors:**
- Check Application Settings in Azure Portal
- Verify environment variables are set
- Check Azure Functions logs

**Functions not working:**
- Verify `api/host.json` is present
- Check `package.json` has all dependencies
- Ensure functions are in `api/src/functions/`

## Next Steps

1. ✅ Push your code to `main` branch
2. ✅ Create Azure Static Web App (15 minutes)
3. ✅ Configure GitHub secrets (5 minutes)
4. ✅ Add Application Settings in Azure Portal (5 minutes)
5. ✅ Test deployed API (2 minutes)
6. 🎉 Your app is live with serverless Medical Q&A!

## Support

- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions Docs](https://docs.microsoft.com/azure/azure-functions/)
- [GitHub Issues](https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext/issues)
