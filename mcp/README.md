# ai-search MCP server

This MCP server exposes your existing ai-search backend (http://localhost:8081) to Copilot Chat via Model Context Protocol tools.

## Available Tools
- **querySearchIndex**: Query Azure AI Search index for cardiology content
- **analyzeText**: Analyze clinical notes and generate Assessment/Plan with GPT-4
- **parseAzureNote**: Summarize and parse cardiology notes from Azure Blob Storage using GPT refinement

## Prereqs
- Backend running locally at http://localhost:8081
  - From repo root:
    - `npm run start:search` (uses services/ai-search/server.js)
- Node 18+

## Run the MCP server
- From repo root:
  - `npm run mcp:ai-search` (default stdio mode for Copilot)
  - `MCP_MODE=http npm run mcp:ai-search` (HTTP SSE mode on port 8091)

Optional env:
- AI_SEARCH_BASE_URL (default http://localhost:8081)
- MCP_MODE (default "stdio" for Copilot; set "http" for SSE server)
- MCP_HTTP_PORT (default 8091, for http mode only)

## Configure Copilot Chat (VS Code)
Add to your Copilot Chat MCP custom servers (UI) or settings.json:

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

Copilot will detect the tools `querySearchIndex`, `analyzeText`, and `parseAzureNote` automatically.

## Validate
1) Start backend: `npm run start:search:8081` (or `cd services/ai-search && node server.js`)
2) Configure Copilot MCP in VS Code (see settings above)
3) Reload VS Code window or restart Copilot
4) In Copilot Chat, ask: "@workspace What MCP tools are available?" — you should see all three tools

## Demo prompts

### Query cardiology index
```
Using querySearchIndex, search for "NSTEMI management" and show top 3 results
```

### Analyze clinical note
```
Using analyzeText, analyze this NSTEMI case:
Patient: 68-year-old male with chest pain, troponin 0.36, ST depressions V4-V6, CKD stage 3.
Generate Assessment and Plan.
```

### Parse Azure Blob note
```
Using parseAzureNote, retrieve and analyze the note from container "cardiology-data" blob "NSTEMI_case.txt"
```

## HTTP SSE mode (optional)
For testing without Copilot integration:
```bash
MCP_MODE=http npm run mcp:ai-search
# Server runs on http://localhost:8091
# Health: curl http://localhost:8091/mcp/health
```

The assistant should call `analyzeText`, and may also call `querySearchIndex` to cite guidelines if your index contains them.
