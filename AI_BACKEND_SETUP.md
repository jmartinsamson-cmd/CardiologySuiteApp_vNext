# AI Backend Setup Guide

## Quick Start (Development Mode)

The AI backend service provides two main features:
1. **Clinical Note Analysis** - AI-powered analysis of clinical notes
2. **HPI Paraphrasing** - AI-powered paraphrasing of History of Present Illness

## Option 1: Start with Mock/Fallback Mode (Works WITHOUT Azure)

The service will start and gracefully handle missing Azure credentials by:
- Returning empty results for search queries
- Falling back to rule-based analysis for clinical notes
- Skipping AI paraphrasing (returns original text)

```bash
# Start the service (it will run on port 8081)
npm run start:search:8081
```

Your clinical note parser will continue to work, just without AI enhancements.

## Option 2: Full Setup with Azure Services (Requires Azure Account)

To enable full AI-powered features, you need:

### 1. Azure AI Search (for cardiology knowledge base)
- Create an Azure AI Search service
- Create an index named `cardiology-index` (or customize)
- Get your endpoint and query key

### 2. Azure OpenAI (for GPT-4 analysis)
- Create an Azure OpenAI service
- Deploy a `gpt-4o-mini` model (or customize deployment name)
- Get your endpoint and API key

### 3. Update `.env` file

Edit `/workspaces/CardiologySuiteApp_vNext/.env`:

```env
# Replace these with your actual Azure credentials:
AZURE_SEARCH_ENDPOINT=https://YOUR-SERVICE.search.windows.net
AZURE_SEARCH_INDEX=cardiology-index
AZURE_SEARCH_QUERY_KEY=YOUR-SEARCH-KEY

AZURE_OPENAI_ENDPOINT=https://YOUR-SERVICE.openai.azure.com/
AZURE_OPENAI_API_KEY=YOUR-OPENAI-KEY
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini

PORT=8081
ENABLE_ANALYSIS_CACHE=true
```

### 4. Start the service

```bash
npm run start:search:8081
```

## Testing the Service

Once running, you can test it:

```bash
# Health check
curl http://localhost:8081/health

# Test note analysis (requires Azure OpenAI)
curl -X POST http://localhost:8081/api/analyze-note \
  -H "Content-Type: application/json" \
  -d '{"noteText": "Patient presents with chest pain..."}'

# Test HPI paraphrasing (requires Azure OpenAI)
curl -X POST http://localhost:8081/api/paraphrase-hpi \
  -H "Content-Type: application/json" \
  -d '{"hpi": "87 year old female with history of..."}'
```

## Using the Service with Your Clinical Note Parser

Once the service is running on port 8081, your clinical note parser will automatically:
1. Send notes for AI analysis when you click "Parse"
2. Attempt to paraphrase the HPI section
3. Fall back gracefully if the service is unavailable

## Current Status

✅ Service code is ready
✅ Dependencies installed
✅ `.env` file created with template
⚠️  Azure credentials needed for full functionality
✅ Will work in fallback mode without credentials

## Next Steps

**Choose one:**

1. **Quick Test (No Azure)**: Run `npm run start:search:8081` now to test with fallback mode
2. **Full Setup**: Get Azure credentials, update `.env`, then run the service

The service will run either way - AI features just won't be available without Azure credentials.
