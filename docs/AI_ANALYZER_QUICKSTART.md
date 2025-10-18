# AI Note Analyzer - Quick Reference

## 🚀 Quick Start

```bash
./start-ai-suite.sh
```

This starts both servers and opens http://localhost:8080 in your browser.

## 🧪 Manual Testing

### Test the API directly
```bash
curl -X POST http://127.0.0.1:8081/api/analyze-note \
  -H 'Content-Type: application/json' \
  -d '{"note":"67 year old man with history of heart failure presents with chest pain and shortness of breath. BP 140/90, HR 88. EKG shows atrial fibrillation."}'
```

### Test in the browser
1. Paste a clinical note in the text area
2. Click "Parse"
3. Scroll to the bottom of the rendered output
4. Look for the "AI-POWERED CLINICAL INSIGHTS" section

### Check if AI is available
```javascript
// In browser console
const available = await window.checkAIAnalyzerAvailability();
console.log('AI available:', available);
```

## ⚙️ Configuration

### Disable AI Analysis
Edit `src/parsers/aiAnalyzer.js`:
```javascript
const USE_AI_ANALYZER = false;  // Change to false
```

### Change Server Port
Edit `src/parsers/aiAnalyzer.js`:
```javascript
const AI_SERVER_URL = 'http://your-server:port';
```

## 📊 What Gets Generated

### Assessment Points
- Clinical impressions based on note content
- Pattern-matched conditions (heart failure, AFib, etc.)
- Risk stratification reminders

### Plan Items
- Evidence-based management recommendations
- GDMT optimization suggestions
- Follow-up planning
- Patient education points

### Citations
- Links to relevant clinical guidelines
- Supporting documentation URLs
- Internal reference materials

## 🔧 Troubleshooting

### AI section not appearing?
1. Check console for errors: `Ctrl+Shift+I` → Console tab
2. Verify AI server is running: `curl http://127.0.0.1:8081/health`
3. Check feature flag in `aiAnalyzer.js`
4. Ensure note is > 100 characters

### "AI enrichment failed" in console?
- Network connectivity issue
- AI server not running
- CORS misconfiguration

### No assessment or plan generated?
- Note too short (< 100 chars)
- No recognized clinical patterns
- Check server logs: `cat /tmp/ai-search-server.log`

## 📝 Example Output

```
============================================================
AI-POWERED CLINICAL INSIGHTS
============================================================

AI Assessment Points:
  1. Heart failure with reduced ejection fraction - requires optimization of guideline-directed medical therapy
  2. Atrial fibrillation - assess CHA2DS2-VASc score and anticoagulation status
  3. Chest pain - consider acute coronary syndrome vs non-cardiac etiology

AI Recommended Plan:
  1. Optimize GDMT: ACE-I/ARB/ARNI, beta-blocker, MRA, SGLT2i per guidelines
  2. Monitor fluid status and daily weights
  3. Cardiology follow-up in 2-4 weeks
  4. Calculate CHA2DS2-VASc score and initiate/continue anticoagulation if indicated
  5. Continue current medications as prescribed

Supporting Guidelines:
  [1] Heart Failure Guidelines 2023
      https://www.acc.org/...

⚠️  NOTE: AI insights are supplementary. Always verify with clinical judgment.
============================================================
```

## 🛑 Stop Servers

```bash
./stop-ai-servers.sh
```

Or manually:
```bash
kill $(lsof -t -i:8080)
kill $(lsof -t -i:8081)
```

## 📚 Documentation

- Full integration guide: `docs/AI_ANALYZER_INTEGRATION.md`
- Server code: `services/ai-search/routes/analyze-note.js`
- Client code: `src/parsers/aiAnalyzer.js`
- Integration point: `src/parsers/templateRenderer.js` (line ~1876)

## 🎯 Key Features

✅ **Fail-Soft** - Never breaks existing parsing  
✅ **Backward Compatible** - Works with all current code  
✅ **Configurable** - Easy to enable/disable  
✅ **Extensible** - Ready for Azure OpenAI upgrade  
✅ **Privacy-First** - Calls local server, no external data transmission  

## 🔮 Future Enhancements

- [ ] Replace rule-based logic with Azure OpenAI GPT-4
- [ ] Add confidence scores to each suggestion
- [ ] Implement caching layer for repeated notes
- [ ] Interactive citation viewer with PDF preview
- [ ] Differential diagnosis suggestions
- [ ] Drug interaction checking
