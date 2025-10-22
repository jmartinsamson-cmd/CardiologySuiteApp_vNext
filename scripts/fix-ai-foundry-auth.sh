#!/bin/bash

# Azure AI Foundry Extension - Force Re-authentication Script
# This script helps clear all cached authentication and force fresh sign-in

echo "=== Azure AI Foundry Authentication Reset ==="
echo ""
echo "Step 1: Sign out from Microsoft account in VS Code"
echo "  - Press Ctrl+Shift+P"
echo "  - Type: 'Microsoft: Sign Out'"
echo "  - Select your account and sign out"
echo ""
echo "Step 2: Sign out from Azure account in VS Code"
echo "  - Press Ctrl+Shift+P"
echo "  - Type: 'Azure: Sign Out'"
echo "  - Confirm sign out"
echo ""
echo "Step 3: Close and reopen the AI Foundry sidebar"
echo "  - Click the AI Foundry icon in the sidebar"
echo "  - Click the 'Sign In' button"
echo "  - Make sure to select tenant: 86fd6795-dcf9-4164-935b-72cf98b01b3d"
echo ""
echo "Step 4: Verify authentication"
echo "  - Run: az account show"
echo "  - Should show tenant: 86fd6795-dcf9-4164-935b-72cf98b01b3d"
echo ""
echo "=== Current Azure CLI Status ==="
az account show --query '{tenant: tenantId, subscription: name}' 2>/dev/null || echo "Not authenticated"
echo ""
echo "=== Workspace Configuration ==="
echo "Tenant ID in .vscode/aifoundry.json:"
grep tenantId /workspaces/CardiologySuiteApp_vNext/.vscode/aifoundry.json | head -1
echo ""
echo "Subscription in .vscode/aifoundry.json:"
grep subscriptionId /workspaces/CardiologySuiteApp_vNext/.vscode/aifoundry.json | head -1
