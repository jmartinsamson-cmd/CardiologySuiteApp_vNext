# Cardiology Suite - Azure Functions API

Azure Functions API for the Cardiology Suite Static Web App.

## Project Structure

```
api/
├── src/
│   └── functions/
│       ├── health.js        # Health check endpoint
│       └── medical-qa.js    # Medical Q&A endpoint (RAG integration)
├── host.json               # Azure Functions host configuration
├── package.json            # Dependencies
├── local.settings.json     # Local development settings
└── .gitignore
```

## Available Functions

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Returns API status and available endpoints
- **Response**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-10-22T...",
    "service": "Cardiology Suite API",
    "version": "1.0.0",
    "endpoints": {
      "health": "/api/health",
      "medicalQA": "/api/medical-qa"
    }
  }
  ```

### 2. Medical Q&A
- **Endpoint**: `POST /api/medical-qa` or `GET /api/medical-qa?question=...`
- **Description**: Answers medical questions using RAG from indexed cardiology guidelines
- **Request** (POST):
  ```json
  {
    "question": "What are the signs of atrial fibrillation?",
    "maxSources": 5,
    "temperature": 0.2
  }
  ```
- **Response**:
  ```json
  {
    "question": "What are the signs of atrial fibrillation?",
    "answer": "Atrial fibrillation presents with...",
    "sources": [...],
    "confidence": 0.85,
    "latency": 5234
  }
  ```

## Local Development

### Prerequisites
- Node.js 18+ (already installed)
- Azure Functions Core Tools v4
- Azure Static Web Apps CLI (optional)

### Install Dependencies

```bash
cd api
npm install
```

### Run Locally

```bash
# Start Azure Functions locally
cd api
npm start

# Or from root with Static Web Apps CLI
npm install -g @azure/static-web-apps-cli
swa start http://localhost:8080 --api-location ./api
```

The API will be available at `http://localhost:7071/api`

### Test Endpoints

```bash
# Health check
curl http://localhost:7071/api/health

# Medical Q&A (GET)
curl "http://localhost:7071/api/medical-qa?question=What%20is%20atrial%20fibrillation"

# Medical Q&A (POST)
curl -X POST http://localhost:7071/api/medical-qa \
  -H "Content-Type: application/json" \
  -d '{"question":"What is atrial fibrillation?"}'
```

## Integration with Existing Backend

The `medical-qa.js` function is currently a placeholder. To integrate with your existing RAG system:

### Option 1: Import Medical Q&A Module (Recommended)

```javascript
// Copy services/ai-search/medical-qa.js to api/src/lib/
import { answerMedicalQuestion } from '../lib/medical-qa.js';

app.http('medical-qa', {
    handler: async (request, context) => {
        const body = await request.json();
        const result = await answerMedicalQuestion(body.question, {
            maxSources: body.maxSources || 5,
            temperature: body.temperature || 0.2
        });
        
        return {
            status: 200,
            jsonBody: result
        };
    }
});
```

### Option 2: Proxy to Existing Backend

```javascript
// Call your existing services/ai-search/server.js
const response = await fetch('http://your-backend:8080/api/medical-qa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: body.question })
});

const result = await response.json();
return { status: 200, jsonBody: result };
```

## Environment Variables

Add these to Azure Static Web Apps configuration:

```
AZURE_OPENAI_ENDPOINT=https://...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-minisamson
AZURE_OPENAI_API_VERSION=2025-01-01-preview

AZURE_SEARCH_ENDPOINT=https://cardiologysuite-search-pro.search.windows.net
AZURE_SEARCH_SERVICE_NAME=cardiologysuite-search-pro
AZURE_SEARCH_INDEX=cardiology-index
AZURE_SEARCH_API_KEY=...
```

## Deployment

### Deploy with GitHub Actions

The API will be automatically deployed when you push to your repository if you have Azure Static Web Apps configured with GitHub Actions.

### Manual Deploy

```bash
# Using Azure Static Web Apps CLI
swa deploy --app-location . --api-location api --output-location .

# Or using Azure CLI
az staticwebapp create \
  --name cardiology-suite \
  --resource-group <resource-group> \
  --source https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext \
  --location eastus2 \
  --branch main \
  --app-location / \
  --api-location api \
  --output-location /
```

## Architecture

```
User Browser
    ↓
Azure Static Web Apps
    ↓
    ├─→ Static Content (HTML/CSS/JS)
    └─→ Azure Functions API (/api/*)
            ↓
            ├─→ Azure OpenAI (GPT-4.1)
            └─→ Azure AI Search (edu-index-v2)
```

## Next Steps

1. **Install Azure Functions Core Tools** (if not installed):
   ```bash
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

2. **Copy Medical Q&A Module**:
   ```bash
   cp services/ai-search/medical-qa.js api/src/lib/
   cp services/ai-search/rag/azureSearchClient.js api/src/lib/
   ```

3. **Update medical-qa.js function** to use the imported module

4. **Test locally** with `npm start` in the `api/` directory

5. **Deploy** to Azure Static Web Apps

## Troubleshooting

**Functions not starting:**
- Check Node.js version: `node --version` (should be 18+)
- Install Functions Core Tools: `func --version`
- Check `local.settings.json` configuration

**CORS errors:**
- Azure Static Web Apps handles CORS automatically
- For local development, Functions Core Tools enables CORS by default

**Environment variables not loading:**
- Use `local.settings.json` for local development
- Use Azure Portal → Static Web Apps → Configuration for production

## Resources

- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions Node.js Developer Guide](https://docs.microsoft.com/azure/azure-functions/functions-reference-node)
