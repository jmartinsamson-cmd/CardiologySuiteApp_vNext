# Medical Q&A with RAG Implementation

## Overview

The Medical Q&A feature implements the **Prompty pattern** from `/docs/ai/MedicalQandA.prompt.yml`, providing evidence-based answers to cardiology questions using Retrieval-Augmented Generation (RAG) with your indexed clinical guidelines.

## Architecture

```
User Question
     ↓
RAG Search (Azure AI Search: edu-index-v2)
     ↓
Retrieved Guidelines (Top 5 PDFs)
     ↓
GPT-4 Analysis (with context)
     ↓
Answer + Citations + Confidence Score
```

## Components

### Backend (`/services/ai-search/medical-qa.js`)

Core RAG implementation:
- `answerMedicalQuestion(question, options)` - Single question with RAG
- `answerMultipleQuestions(questions, options)` - Batch processing
- Confidence scoring based on retrieval quality
- Source citation tracking

### API Routes (`/services/ai-search/routes/medical-qa.js`)

HTTP endpoints:
- **POST /api/medical-qa** - Single question
  ```json
  {
    "question": "How to manage atrial fibrillation?",
    "maxSources": 5,
    "temperature": 0.2
  }
  ```
  
- **POST /api/medical-qa/batch** - Multiple questions (max 10)
  ```json
  {
    "questions": ["Question 1", "Question 2"],
    "maxSources": 5,
    "temperature": 0.2
  }
  ```

### MCP Integration (`/mcp/ai-search-mcp-server.mjs`)

New tool for GitHub Copilot:
- **medicalQA** - Answer medical questions using indexed guidelines
  - Input: `question` (string), `maxSources` (number), `temperature` (number)
  - Output: Answer with citations and confidence score

### Frontend (`/pages/medical-qa.html`)

Interactive UI:
- Question input with example prompts
- Answer display with formatting
- Source citations with scores
- Confidence indicator (color-coded)
- Metadata (retrieval stats, latency)

### Tests (`/test-medical-qa.js`)

Comprehensive test suite:
1. Direct function call test
2. HTTP API single question test
3. HTTP API batch questions test

## Usage

### Direct Function Call (Backend)

```javascript
import { answerMedicalQuestion } from './services/ai-search/medical-qa.js';

const result = await answerMedicalQuestion(
  "Explain the signs and symptoms of AMI and treatment.",
  { maxSources: 5, temperature: 0.2 }
);

console.log('Answer:', result.answer);
console.log('Confidence:', result.confidence);
console.log('Sources:', result.sources);
```

### HTTP API

```bash
curl -X POST http://localhost:8081/api/medical-qa \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are ACC/AHA guidelines for atrial fibrillation?",
    "maxSources": 5,
    "temperature": 0.2
  }'
```

### MCP Tool (Copilot)

```
@workspace Use the medicalQA tool to answer: 
"How should I manage a patient with NSTEMI and CKD?"
```

### Frontend Interface

Open `http://localhost:8080/pages/medical-qa.html` (or your dev server port)

## Response Format

```json
{
  "ok": true,
  "answer": "Acute Myocardial Infarction (AMI) presents with...",
  "sources": [
    {
      "title": "STEMIpolicy.pdf",
      "url": "https://...",
      "score": 18.42
    }
  ],
  "confidence": 0.82,
  "retrieval": {
    "query": "signs and symptoms of AMI",
    "hitsCount": 5,
    "topScore": 18.42,
    "avgScore": 14.3
  },
  "latency": 1234
}
```

## Confidence Scoring

Confidence is calculated from multiple factors:

1. **Search Result Quality (0-0.4)**: Based on top document score
2. **Multiple Sources (0-0.2)**: More sources = higher confidence
3. **Answer Has Citations (0-0.2)**: Presence of [Source N] references
4. **Average Search Score (0-0.2)**: Overall retrieval quality

**Thresholds:**
- ≥ 0.7 = High confidence (green)
- 0.4-0.7 = Medium confidence (orange)
- < 0.4 = Low confidence (red)

## Configuration

Environment variables (`.env`):

```bash
# Azure OpenAI (required)
AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-10-21-preview

# Azure AI Search (required)
AZURE_SEARCH_ENDPOINT=https://cardiologysuite-search-pro.search.windows.net
AZURE_SEARCH_SERVICE_NAME=cardiologysuite-search-pro
AZURE_SEARCH_INDEX=cardiology-index
AZURE_SEARCH_API_KEY=your-key

# RAG Settings
RAG_MAX_CHARS=12000
RAG_TOP_K=5
STRICT_GROUNDING=1
```

## Testing

Run the test suite:

```bash
# Make sure backend server is running
npm run start:search

# In another terminal
node test-medical-qa.js
```

Expected output:
- ✅ Single question answered with sources
- ✅ API endpoint responds correctly
- ✅ Batch processing works
- Confidence scores calculated
- Latency metrics reported

## RAG Data Source

The system uses **Azure AI Search index: edu-index-v2**
- 663 cardiology guideline PDFs (25.81 MB)
- ACC/AHA clinical practice guidelines
- ESC guidelines
- SCAI position papers
- Hospital policies and protocols

**STRICT_GROUNDING=1** ensures GPT-4 uses ONLY these indexed documents.

## System Prompt

The implementation uses a Prompty-style system prompt:

```yaml
You are a cardiovascular medical assistant that provides answers 
to medical questions using ONLY the information from the repository 
files provided below.

CRITICAL RULES:
1. Base ALL answers EXCLUSIVELY on provided guideline documents
2. If answer not in documents, say so explicitly
3. Always cite specific sources using [Source N] notation
4. Provide evidence-based recommendations with guideline class/level
5. Flag any limitations or missing information
```

## Integration Points

### 1. Server Registration

`/services/ai-search/server.js`:
```javascript
import registerMedicalQARoutes from "./routes/medical-qa.js";
// ...
registerMedicalQARoutes(app);
```

### 2. MCP Tool Registration

`/mcp/ai-search-mcp-server.mjs`:
```javascript
{
  name: 'medicalQA',
  description: 'Answer medical questions using RAG...',
  input_schema: { /* ... */ }
}
```

### 3. VS Code Copilot

MCP server must be configured in VS Code settings (already done):
```json
{
  "github.copilot.chat.experimental.contextMode": "enhanced"
}
```

## Development

### Adding New Features

1. **Customize System Prompt**: Edit `/services/ai-search/medical-qa.js` line 30+
2. **Adjust Confidence Scoring**: Modify `calculateConfidence()` logic (lines 100+)
3. **Change RAG Parameters**: Update `searchGuidelines()` call (line 45)
4. **Add UI Features**: Extend `/pages/medical-qa.html`

### Troubleshooting

**No results returned:**
- Check Azure Search index exists: `edu-index-v2`
- Verify `AZURE_SEARCH_INDEX` in `.env`
- Test search directly: `node test-rag-search.js`

**Low confidence scores:**
- Question too broad → try more specific queries
- Limited guideline coverage → check indexed documents
- Adjust `RAG_TOP_K` to retrieve more documents

**Slow responses:**
- Azure OpenAI throttling → check quota
- Large context → reduce `RAG_MAX_CHARS`
- Network latency → check Azure region proximity

## Future Enhancements

- [ ] Add conversation history for follow-up questions
- [ ] Implement query expansion for better retrieval
- [ ] Add specialty filters (e.g., "ACS only", "HF only")
- [ ] Cache common questions
- [ ] Add feedback mechanism to improve responses
- [ ] Integrate with clinical note parser for context-aware Q&A

## References

- Prompty Template: `/docs/ai/MedicalQandA.prompt.yml`
- RAG Implementation: `/services/ai-search/rag/azureSearchClient.js`
- Azure AI Search Docs: https://learn.microsoft.com/azure/search/
- OpenAI API Docs: https://platform.openai.com/docs/api-reference

---

**Status**: ✅ Implemented and tested
**Last Updated**: October 2025
**Maintainer**: Cardiology Suite Team
