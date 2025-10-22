# Azure AI Search & HPI Paraphrasing Implementation - Summary

## ✅ Completed Tasks

### 1. Azure AI Search Index Created
- **Index Name**: `cardiology-index`
- **Location**: `infra/search/cardiology-index.json`
- **Features**:
  - 8 fields (id, title, sourceId, content, url, chunkIndex, createdAt, embedding)
  - Vector search enabled (1536 dimensions, HNSW algorithm)
  - Configured for hybrid text + vector search

**Status**: ✅ Index successfully created in Azure

### 2. Sample Documents Indexed
- **Count**: 5 cardiology guideline documents
- **Topics**: 
  - ACC/AHA NSTEMI Guidelines
  - Heart Failure Management (ESC)
  - Atrial Fibrillation Anticoagulation
  - Aortic Stenosis Intervention Criteria
  - Acute Decompensated Heart Failure

**Status**: ✅ All 5 documents indexed successfully (HTTP 201)

### 3. Infrastructure Scripts Added

#### `scripts/create-search-index.mjs`
- Creates the Azure AI Search index using REST API
- Loads credentials from `.env` file automatically
- Validates index creation and reports field count

#### `scripts/push_search_docs.mjs`
- Uploads sample cardiology documents to the index
- Uses merge-or-upload strategy
- Reports indexing status for each document

**npm scripts added to `package.json`**:
```json
"search:index:create": "az search index create...",
"search:index:put": "node scripts/create-search-index.mjs",
"search:push:samples": "node scripts/push_search_docs.mjs"
```

### 4. Environment Configuration Updated

**New variables in `.env`**:
```env
AZURE_SEARCH_NAME=cardiologysuite-search
AZURE_SEARCH_ADMIN_KEY=***REDACTED***
AZURE_OPENAI_HPI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_EMBED_DEPLOYMENT=text-embedding-3-small
OPENAI_ENDPOINT=https://cardiologysuite-openai.openai.azure.com/
OPENAI_API_KEY=***REDACTED***
OPENAI_API_VERSION=2024-02-15-preview
```

### 5. HPI Paraphrasing Configuration
- **File**: `services/ai-search/routes/paraphrase-hpi.js`
- **Changes**: 
  - Now uses `AZURE_OPENAI_HPI_DEPLOYMENT` env var (configurable)
  - Falls back to `AZURE_OPENAI_DEPLOYMENT` if not set
  - Logs deployment name for debugging

**Status**: ⚠️ Configured but deployment not found in Azure (404 error)

### 6. Search Error Handling Improved
- **File**: `services/ai-search/routes/analyze-note.js`
- **Changes**:
  - Gracefully handles 404 index not found errors
  - Returns empty citations array instead of crashing
  - Logs helpful message: "Create index with: npm run search:index:put"
  - Fixed field selection to match actual index schema (removed 'category')

**Status**: ✅ Search now works with graceful fallback

## 🔄 Current Status

### Working Features:
1. ✅ **Azure AI Search Index** - Created and operational
2. ✅ **Sample Documents** - 5 cardiology guidelines indexed
3. ✅ **AI Note Analysis** - GPT-4 powered analysis working
4. ✅ **Search Citations** - Can query index for relevant guidelines
5. ✅ **Graceful Fallback** - Service handles missing index/deployments

### Known Issues:
1. ⚠️ **HPI Paraphrasing**: Returns 404 - deployment `gpt-4o-mini` not found in Azure OpenAI
   - **Cause**: Deployment name mismatch or deployment doesn't exist
   - **Fallback**: Uses rule-based paraphrasing
   - **Fix**: Create deployment in Azure OpenAI or update `AZURE_OPENAI_HPI_DEPLOYMENT` env var

2. ⚠️ **Azure OpenAI Deployment**: The `gpt-4o-mini` deployment may not exist
   - Check Azure OpenAI service for actual deployment names
   - Update `.env` with correct deployment name

## 📝 Verification Commands

```bash
# Verify index exists
curl -s http://localhost:8081/health | jq '.'

# Test AI analysis (should return assessment + plan + citations)
curl -X POST http://localhost:8081/api/analyze-note \
  -H "Content-Type: application/json" \
  -d '{"note":"87F with AFib, CHF, dyspnea"}' | jq '.citations'

# Test HPI paraphrasing (will fail with 404 until deployment exists)
curl -X POST http://localhost:8081/api/paraphrase-hpi \
  -H "Content-Type: application/json" \
  -d '{"hpi":"Patient presents with dyspnea..."}' | jq '.'

# Search the index directly
curl -X POST "https://cardiologysuite-search.search.windows.net/indexes/cardiology-index/docs/search?api-version=2024-07-01" \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_QUERY_KEY" \
  -d '{"search": "heart failure", "top": 3}'
```

## 🎯 Next Steps

1. **Create Azure OpenAI Deployment** (if needed):
   - Go to Azure Portal → Azure OpenAI
   - Create deployment named `gpt-4o-mini` (or update env var)
   - Model: `gpt-4o-mini` or `gpt-4`

2. **Add More Documents**:
   - Edit `scripts/push_search_docs.mjs`
   - Add more cardiology guidelines
   - Run `npm run search:push:samples`

3. **Enable Vector Search** (optional):
   - Generate embeddings for content
   - Add embedding vectors to documents
   - Use hybrid search (text + vector)

## 📁 Files Modified/Created

**Created**:
- `infra/search/cardiology-index.json`
- `scripts/create-search-index.mjs`
- `scripts/push_search_docs.mjs`

**Modified**:
- `package.json` (added search scripts)
- `.env` (added search & OpenAI config)
- `services/ai-search/routes/paraphrase-hpi.js` (configurable deployment)
- `services/ai-search/routes/analyze-note.js` (graceful error handling)

## 🔐 Security Notes

- ✅ `.env` file is git-ignored (credentials safe)
- ✅ Admin key separate from query key
- ✅ CORS properly configured
- ✅ Error messages don't leak credentials
