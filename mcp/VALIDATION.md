# MCP validation steps

## Start backend on 8081

```bash
npm run start:search:8081
```

## Start MCP server (in a separate terminal)

```bash
npm run mcp:ai-search
```

## Add Copilot Chat MCP config (VS Code settings)

```json
{
  "copilot.experimental.modelContextProtocol.servers": [
    {
      "id": "ai-search",
      "command": "npm",
      "args": ["run", "mcp:ai-search"],
      "env": {
        "AI_SEARCH_BASE_URL": "http://localhost:8081"
      }
    }
  ]
}

```

## Verify detection and tools
Ask Copilot Chat:
- "@workspace What MCP tools are available from ai-search?"

You should see:
- `querySearchIndex` (Query Azure AI Search index)
- `analyzeText` (Analyze clinical notes)
- `parseAzureNote` (Parse Azure Blob cardiology notes)

## Demo prompts

### 1. Query cardiology index
```
Using querySearchIndex, search for "NSTEMI management guidelines" and show top 3 results
```

### 2. Analyze clinical text
```
Using ai-search tools, analyze this NSTEMI case and generate Assessment and Plan:
Patient: 68-year-old with chest pain, troponin 0.36, ST depressions V4-V6, CKD stage 3.
```

### 3. Parse Azure Blob note (requires Azure Storage setup)
```
Using parseAzureNote, retrieve and analyze the note from container "cardiology-data" blob "NSTEMI_case.txt"
```

**Expected behavior:**
- Copilot should call `analyzeText` or `parseAzureNote` for clinical analysis
- May call `querySearchIndex` for supporting evidence from your Azure index
- Returns structured Assessment/Plan with GPT-4 refinement
