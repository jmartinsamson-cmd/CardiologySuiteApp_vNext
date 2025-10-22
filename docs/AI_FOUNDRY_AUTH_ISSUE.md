# Azure AI Foundry Extension - Tenant Authentication Issue

## Problem
The Azure AI Foundry VS Code extension is caching authentication tokens for the wrong tenant (`33e01921-4d64-4f8c-a055-5bdaffd5e33d`) instead of the correct tenant (`86fd6795-dcf9-4164-935b-72cf98b01b3d`).

## Root Cause
The extension uses VS Code's built-in Microsoft Account authentication provider, which caches tokens in the browser session (since we're in a Codespace). This cache persists even after:
- Signing out from Azure in VS Code
- Clearing VS Code extension caches
- Uninstalling and reinstalling the extension
- Clearing Azure CLI credentials

## Verified Configuration
✅ Azure CLI authenticated to correct tenant: `86fd6795-dcf9-4164-935b-72cf98b01b3d`
✅ Subscription: `6ae15877-96d9-4771-928c-080c755701e4` (Azure subscription 1)
✅ `.vscode/aifoundry.json` configured with correct tenant
✅ `.vscode/settings.json` configured with correct Azure settings
✅ AI Foundry resource: `jsamb-mgvbqri7-eastus2` in resource group `cardiologysuite_group`

## Attempted Fixes (All Failed)
1. ❌ Cleared `~/.vscode-server/data/User/globalStorage/*`
2. ❌ Cleared `~/.vscode-remote/data/User/globalStorage/*`
3. ❌ Removed `~/.azure` and re-authenticated with `az login --tenant`
4. ❌ Uninstalled and reinstalled AI Foundry extension
5. ❌ Signed out from Azure in VS Code (`Azure: Sign Out`)
6. ❌ Cleared all Azure/Microsoft caches in VS Code directories
7. ❌ Added explicit tenant configuration to `.vscode/settings.json`
8. ❌ Set environment variables for `AZURE_TENANT_ID` and `AZURE_SUBSCRIPTION_ID`

## Workarounds

### Option 1: Use Azure CLI and REST API Instead
Since Azure CLI is correctly authenticated, you can access Azure AI Foundry resources via CLI and REST API:

```bash
# Get AI Foundry resource details
az cognitiveservices account show \
  --name jsamb-mgvbqri7-eastus2 \
  --resource-group cardiologysuite_group

# Get access token for Azure AI
az account get-access-token --resource https://cognitiveservices.azure.com/

# Use the token with REST API calls to your AI Foundry endpoint
# Endpoint: https://jsamb-mgvbqri7-eastus2.cognitiveservices.azure.com/
```

### Option 2: Use Different Browser Profile
In GitHub Codespaces, the authentication is tied to your browser session:

1. Open Codespace in a **different browser** or **incognito/private window**
2. When the AI Foundry extension prompts to sign in, use an account that **only** has access to tenant `86fd6795...`
3. This will force fresh authentication without the cached wrong-tenant token

### Option 3: Use Azure Portal
Access AI Foundry features directly through Azure Portal:
- Go to: https://portal.azure.com/
- Navigate to: AI Foundry resource `jsamb-mgvbqri7-eastus2`
- Use the portal UI for vector stores, agents, and deployments

### Option 4: Wait for Extension Update
This appears to be a bug in the AI Foundry extension's authentication flow. The extension should respect:
- The `tenantId` in `.vscode/aifoundry.json`
- The `azure.tenant` setting in `.vscode/settings.json`
- Azure CLI credentials when browser auth fails

Consider reporting this issue to the extension maintainers.

## Current Status
- ✅ Azure CLI: Working correctly with tenant `86fd6795...`
- ✅ Backend RAG system: Fully operational via REST API
- ❌ VS Code AI Foundry Extension: Stuck using wrong tenant `33e01921...`

## Recommendation
For now, use **Azure CLI + REST API** to access AI Foundry resources. The RAG system in this project uses REST API calls and will work correctly since it uses Azure CLI credentials.

Example test:
```bash
# This works because it uses Azure CLI auth
curl -X POST http://localhost:8081/api/analyze-note \
  -H "Content-Type: application/json" \
  -d '{"note":"87F with AFib, CHF (EF 35%), BNP 3445"}' | jq .
```

## Files
- Configuration: `.vscode/aifoundry.json`
- Settings: `.vscode/settings.json`
- Azure CLI config: `~/.azure/config`
- Helper script: `scripts/fix-ai-foundry-auth.sh`
