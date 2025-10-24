$ErrorActionPreference='Stop'

# ==== FILL THESE ONCE ====
[Environment]::SetEnvironmentVariable("AZ_APP_OBJECT_ID", "6b0d148b-4791-4a14-9577-a18c2ef03472")      # not the appId/clientId; the objectId
Write-Host "After setting AZ_APP_OBJECT_ID: $($env:AZ_APP_OBJECT_ID)"
[Environment]::SetEnvironmentVariable("AZ_TENANT_ID", "86fd6795-dcf9-4164-935b-72cf98b01b3d")
[Environment]::SetEnvironmentVariable("AZ_SUBSCRIPTION_ID", "6ae15877-96d9-4771-928c-080c755701e4")
$env:GITHUB_REPO        = "jmartinsamson-cmd/CardiologySuiteApp_vNext"  # owner/repo
$env:BRANCH             = "main"   # default branch name
# =========================

function Need($n){ $value = Get-ChildItem "env:$n" -ErrorAction SilentlyContinue | Select -Expand Value; Write-Host "Checking $n : $value"; if(-not $value){ throw "Missing env: $n" } }
"AZ_APP_OBJECT_ID","AZ_TENANT_ID","AZ_SUBSCRIPTION_ID","GITHUB_REPO","BRANCH" | % { Need $_ }

# Resolve clientId (appId) from objectId
$clientId = az ad app show --id $env:AZ_APP_OBJECT_ID --query appId -o tsv
if(-not $clientId){ throw "Could not resolve appId from AZ_APP_OBJECT_ID" }

$issuer  = "https://token.actions.githubusercontent.com"
$aud     = "api://AzureADTokenExchange"
$subjectBranch = "repo:$($env:GITHUB_REPO):ref:refs/heads/$($env:BRANCH)"
$subjectPR     = "repo:$($env:GITHUB_REPO):pull_request"

# Create/Upsert GitHub OIDC federated credentials
$bodyBranch = @{ name="github-oidc-$($env:BRANCH)"; issuer=$issuer; subject=$subjectBranch; audiences=@($aud) } | ConvertTo-Json
$bodyPR     = @{ name="github-oidc-pull_request";  issuer=$issuer; subject=$subjectPR;     audiences=@($aud) } | ConvertTo-Json

az ad app federated-credential create --id $env:AZ_APP_OBJECT_ID --parameters $bodyBranch | Out-Null
az ad app federated-credential create --id $env:AZ_APP_OBJECT_ID --parameters $bodyPR     | Out-Null

"`n✅ Federated credentials created:"
" - $subjectBranch"
" - $subjectPR"

"`nAdd these **repo secrets** in GitHub (Settings → Secrets and variables → Actions):"
"  AZURE_CLIENT_ID       = $clientId"
"  AZURE_TENANT_ID       = $($env:AZ_TENANT_ID)"
"  AZURE_SUBSCRIPTION_ID = $($env:AZ_SUBSCRIPTION_ID)"
"`nThen in your workflow use:"
@"
permissions:
  id-token: write
  contents: read

- uses: azure/login@v1
  with:
    client-id: `${{ secrets.AZURE_CLIENT_ID }}
    tenant-id:  `${{ secrets.AZURE_TENANT_ID }}
    subscription-id: `${{ secrets.AZURE_SUBSCRIPTION_ID }}
"@ | Write-Host