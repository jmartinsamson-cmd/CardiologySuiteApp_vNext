# Deployment Guide - CardiologySuiteApp vNext

This guide covers deploying the CardiologySuiteApp vNext to various hosting platforms.

## 🚀 Quick Deployment Options

### Option 1: Azure Static Web Apps (Recommended)

Azure Static Web Apps provides the best integration with the AI services already in use.

#### Prerequisites
- Azure account with active subscription
- Azure CLI installed
- GitHub repository

#### Steps

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name cardiology-suite-rg \
  --location eastus

# Create Static Web App
az staticwebapp create \
  --name cardiology-suite-app \
  --resource-group cardiology-suite-rg \
  --source https://github.com/YOUR_USERNAME/CardiologySuiteApp_vNext \
  --location eastus \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github

# Build the app
npm run build

# Deploy
az staticwebapp deploy \
  --name cardiology-suite-app \
  --resource-group cardiology-suite-rg \
  --source ./dist
```

#### Configuration

Create `.github/workflows/azure-static-web-apps.yml`:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build CSS
        run: npm run build:css
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          output_location: "dist"
```

### Option 2: GitHub Pages

Free hosting for public repositories.

#### Steps

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add deployment script to package.json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}

# Update vite.config.js for GitHub Pages
export default defineConfig({
  base: '/CardiologySuiteApp_vNext/',
  // ... rest of config
});

# Deploy
npm run deploy
```

#### GitHub Actions Workflow

Create `.github/workflows/deploy-gh-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build CSS
        run: npm run build:css
      
      - name: Build
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### Option 3: Vercel

Easy deployment with great DX.

#### Steps

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

#### Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Option 4: Netlify

Similar to Vercel with drag-and-drop deployment.

#### Steps

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

#### Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## 🔧 AI Search Service Deployment

The AI search service needs to be deployed separately as a Node.js backend.

### Azure App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name cardiology-ai-search-plan \
  --resource-group cardiology-suite-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name cardiology-ai-search \
  --resource-group cardiology-suite-rg \
  --plan cardiology-ai-search-plan \
  --runtime "NODE:16-lts"

# Configure environment variables
az webapp config appsettings set \
  --name cardiology-ai-search \
  --resource-group cardiology-suite-rg \
  --settings \
    AZURE_SEARCH_ENDPOINT=https://cardiologysuite-search-pro.search.windows.net \
    AZURE_SEARCH_INDEX=cardiology-index \
    AZURE_SEARCH_API_KEY=your-key \
    AZURE_OPENAI_ENDPOINT=your-openai-endpoint \
    AZURE_OPENAI_KEY=your-openai-key \
    PORT=8080

# Deploy code
cd services/ai-search
zip -r deploy.zip .
az webapp deployment source config-zip \
  --resource-group cardiology-suite-rg \
  --name cardiology-ai-search \
  --src deploy.zip
```

### Docker Deployment

Create `services/ai-search/Dockerfile`:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 8081

CMD ["node", "server.js"]
```

Build and run:

```bash
# Build
docker build -t cardiology-ai-search ./services/ai-search

# Run locally
docker run -p 8081:8081 \
  --env-file services/ai-search/.env \
  cardiology-ai-search

# Push to registry
docker tag cardiology-ai-search your-registry.azurecr.io/cardiology-ai-search:latest
docker push your-registry.azurecr.io/cardiology-ai-search:latest
```

## 🔒 Environment Variables

### Frontend (Static Site)

These are built into the frontend at build time:

```bash
VITE_API_BASE_URL=https://your-api.azurewebsites.net
VITE_ENVIRONMENT=production
```

### Backend (AI Search Service)

These are runtime environment variables:

```bash
# Azure Search
AZURE_SEARCH_ENDPOINT=https://cardiologysuite-search-pro.search.windows.net
AZURE_SEARCH_SERVICE_NAME=cardiologysuite-search-pro
AZURE_SEARCH_INDEX=cardiology-index
AZURE_SEARCH_API_KEY=your-api-key

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com
AZURE_OPENAI_KEY=your-openai-key
AZURE_OPENAI_DEPLOYMENT=gpt-4-deployment
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Server
PORT=8081
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://your-app.azurestaticapps.net

# Cache
CACHE_MAX_SIZE=100
CACHE_TTL_MS=3600000
```

## 📊 Monitoring & Telemetry

### Azure Application Insights

```bash
# Install dependencies
npm install --save applicationinsights

# Add to services/ai-search/server.js
import appInsights from 'applicationinsights';

appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .start();
```

### Environment Variable

```bash
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key;...
```

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change all default credentials
- [ ] Set up HTTPS/TLS certificates (automatic with most platforms)
- [ ] Configure CORS properly (restrict to your domain)
- [ ] Set security headers (CSP, X-Frame-Options, etc.)
- [ ] Enable rate limiting on API endpoints
- [ ] Set up monitoring and alerting
- [ ] Configure backup and disaster recovery
- [ ] Review and test error handling
- [ ] Audit dependencies (`npm audit`)
- [ ] Remove development/debug code
- [ ] Set `NODE_ENV=production`

## 📈 Performance Optimization

### Pre-deployment

```bash
# Build with optimizations
npm run build

# Analyze bundle size
npm run build:analyze

# Check bundle size limits
npm run size
```

### CDN Configuration

For static assets, consider using Azure CDN or Cloudflare:

1. Upload built assets to Azure Blob Storage or S3
2. Configure CDN to serve from blob storage
3. Update asset URLs in your app

### Caching Headers

Configure proper cache headers for static assets:

```
# index.html - no cache
Cache-Control: no-cache, no-store, must-revalidate

# JS/CSS with hash - long cache
Cache-Control: public, max-age=31536000, immutable

# Other assets
Cache-Control: public, max-age=86400
```

## 🧪 Pre-Deployment Testing

```bash
# Run all tests
npm run test:unit
npm run test:e2e
npm run test:visual
npm run test:a11y

# Validate data
npm run validate:data
npm run validate:features

# Security audit
npm run security:check

# Build and preview
npm run build
npm run preview
```

## 🔄 CI/CD Pipeline

Example GitHub Actions workflow for comprehensive CI/CD:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Validate data
        run: npm run validate:data
      
      - name: Unit tests
        run: npm run test:unit
      
      - name: E2E tests
        run: npm run test:e2e
      
      - name: Security audit
        run: npm run security:check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build CSS
        run: npm run build:css
      
      - name: Build app
        run: npm run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
      
      # Add deployment steps for your platform here
```

## 📞 Support

For deployment issues:
- Check deployment logs on your platform
- Review security and firewall settings
- Verify environment variables are set correctly
- Consult platform-specific documentation

---

**Last Updated**: October 2025
