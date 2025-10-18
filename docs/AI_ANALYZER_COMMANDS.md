# 🚀 AI Note Analyzer - Quick Commands

## Start/Stop

```bash
# Start everything (AI server + main app)
./start-ai-suite.sh

# Stop everything
./stop-ai-servers.sh
```

## Test Endpoints

```bash
# Health check
curl -s http://127.0.0.1:8081/health | jq .

# Analyze a note
curl -s -X POST http://127.0.0.1:8081/api/analyze-note \
  -H "Content-Type: application/json" \
  -d '{"note":"70F HFrEF, AFib, edema"}' | jq .
```

## Expected Responses

### ✅ Success
```json
{
  "ok": true,
  "assessment": ["Assessment point 1", "Assessment point 2"],
  "plan": ["Plan item 1", "Plan item 2"],
  "citations": [],
  "meta": {...}
}
```

### ❌ Error
```json
{
  "ok": false,
  "error": "Error message",
  "assessment": [],
  "plan": [],
  "citations": []
}
```

## Key Features

✅ **Fail-Soft** - Never breaks base parsing  
✅ **Always Returns Arrays** - No undefined edge cases  
✅ **Consistent Format** - `ok` flag in all responses  
✅ **Graceful Errors** - Empty arrays on failure  

## Files

- **Server**: `services/ai-search/routes/analyze-note.js`
- **Client**: `src/parsers/aiAnalyzer.js`
- **Integration**: `src/parsers/templateRenderer.js` (line ~1876)

## Documentation

- 📖 **Quick Start**: `docs/AI_ANALYZER_QUICKSTART.md`
- 🧪 **Test Results**: `docs/AI_ANALYZER_TEST_RESULTS.md`
- ✅ **Verification**: `docs/AI_ANALYZER_VERIFICATION.md`
