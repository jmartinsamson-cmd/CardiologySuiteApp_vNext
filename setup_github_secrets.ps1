$ErrorActionPreference='Stop'

# === INPUTS (edit these 2) ===
$AppObjectId = "<YOUR_AAD_APP_OBJECT_ID>"   # objectId of the App/SP (NOT appId)
$FormRecKey  = "<YOUR_FORM_RECOGNIZER_KEY>" # Key 1/2 from your Form Recognizer
# =============================

# Resolve tenant/subscription from current az context
az account show -o none 2>$null
$TenantId = az account show -o tsv --query tenantId
$SubId    = az account show -o tsv --query id

if (-not $TenantId -or -not $SubId) { throw "Run 'az login' first." }

# Resolve clientId (appId) from objectId
$ClientId = az ad app show --id $AppObjectId --query appId -o tsv
if (-not $ClientId) { throw "Could not resolve clientId (appId) from objectId: $AppObjectId" }

# Optional: quick sanity ping on Form Recognizer key length
if ($FormRecKey.Length -lt 20) { Write-Warning "Form Recognizer key looks short. Double-check in Azure Portal > Keys."; }

# Print exact values to set in GitHub
$RepoSlug = (git config --get remote.origin.url) -replace '(git@|https://)github.com[:/]|\.git',''
$SecretsUrl = "https://github.com/$RepoSlug/settings/secrets/actions"
$VarsUrl    = "https://github.com/$RepoSlug/settings/variables/actions"

@"
========================================================
GitHub → Settings → Secrets and variables → Actions → Secrets
Set these 4 secrets:

AZURE_CLIENT_ID       = $ClientId
AZURE_TENANT_ID       = $TenantId
AZURE_SUBSCRIPTION_ID = $SubId
AZURE_VISION_KEY      = $FormRecKey

GitHub → Settings → Secrets and variables → Actions → Variables
Set this variable:

TEST_BLOB_NAME = education/Antibiotics_First_Line_Treatments.pdf

Links:
• Secrets:   $SecretsUrl
• Variables: $VarsUrl
========================================================
"@ | Write-Host

"Tenant: $TenantId"
"Subscription: $SubId"
"ClientId: $ClientId"
"Ready to add secrets/variable in GitHub UI."