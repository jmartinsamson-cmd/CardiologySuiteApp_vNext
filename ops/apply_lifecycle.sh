#!/bin/bash

# Apply Azure Storage lifecycle management policy based on blob index tags
# This script manages retention for education content based on retention_class tags

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICY_FILE="$SCRIPT_DIR/lifecycle-policy.json"
STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT:-cardiologysuitepub}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" >&2
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*" >&2
}

# Check if Azure CLI is installed and logged in
check_az_cli() {
    if ! command -v az &> /dev/null; then
        error "Azure CLI is not installed. Please install it first."
        exit 1
    fi

    if ! az account show &> /dev/null; then
        error "Not logged in to Azure CLI. Please run 'az login' first."
        exit 1
    fi
}

# Validate policy file exists
validate_policy_file() {
    if [[ ! -f "$POLICY_FILE" ]]; then
        error "Lifecycle policy file not found: $POLICY_FILE"
        exit 1
    fi

    if ! jq empty "$POLICY_FILE" 2>/dev/null; then
        error "Invalid JSON in policy file: $POLICY_FILE"
        exit 1
    fi
}

# Get storage account resource group if not provided
get_resource_group() {
    if [[ -z "$RESOURCE_GROUP" ]]; then
        log "Finding resource group for storage account: $STORAGE_ACCOUNT"
        RESOURCE_GROUP=$(az storage account show \
            --name "$STORAGE_ACCOUNT" \
            --query 'resourceGroup' \
            --output tsv 2>/dev/null)

        if [[ -z "$RESOURCE_GROUP" ]]; then
            error "Could not find resource group for storage account: $STORAGE_ACCOUNT"
            error "Please set AZURE_RESOURCE_GROUP environment variable"
            exit 1
        fi

        log "Found resource group: $RESOURCE_GROUP"
    fi
}

# Apply lifecycle policy
apply_lifecycle_policy() {
    log "Applying lifecycle management policy to storage account: $STORAGE_ACCOUNT"

    # Check if policy already exists
    local existing_policy
    existing_policy=$(az storage account management-policy show \
        --account-name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --output json 2>/dev/null || echo "")

    if [[ -n "$existing_policy" ]]; then
        warning "Lifecycle policy already exists. Updating..."
        az storage account management-policy update \
            --account-name "$STORAGE_ACCOUNT" \
            --resource-group "$RESOURCE_GROUP" \
            --policy "$POLICY_FILE"
    else
        log "Creating new lifecycle management policy"
        az storage account management-policy create \
            --account-name "$STORAGE_ACCOUNT" \
            --resource-group "$RESOURCE_GROUP" \
            --policy "$POLICY_FILE"
    fi
}

# Show current policy
show_current_policy() {
    log "Current lifecycle management policy:"
    az storage account management-policy show \
        --account-name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --output json | jq '.policy' 2>/dev/null || echo "No policy found"
}

# Validate policy application
validate_policy() {
    log "Validating policy application..."

    # Check if blob index tags are enabled (required for tag-based lifecycle)
    local index_tags_enabled
    index_tags_enabled=$(az storage account show \
        --name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --query 'isHnsEnabled' \
        --output tsv 2>/dev/null)

    if [[ "$index_tags_enabled" != "true" ]]; then
        warning "Blob index tags may not be enabled on this storage account."
        warning "Tag-based lifecycle policies require hierarchical namespace (HNS) to be enabled."
    fi

    # Show policy rules summary
    log "Policy rules summary:"
    jq -r '.rules[] | "- \(.name): \(.definition.actions.baseBlob | keys[])"' "$POLICY_FILE" 2>/dev/null || echo "Could not parse policy rules"
}

# Main execution
main() {
    log "Azure Storage Lifecycle Management Script"
    log "=========================================="

    check_az_cli
    validate_policy_file
    get_resource_group

    log "Storage Account: $STORAGE_ACCOUNT"
    log "Resource Group: $RESOURCE_GROUP"
    log "Policy File: $POLICY_FILE"

    apply_lifecycle_policy
    success "Lifecycle policy applied successfully"

    show_current_policy
    validate_policy

    success "Script completed successfully"
    log "Note: Lifecycle policies may take up to 24 hours to take effect"
}

# Show usage if requested
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    cat << EOF
Azure Storage Lifecycle Management Script

This script applies lifecycle management policies to Azure Storage accounts
based on blob index tags for automated retention management.

Environment Variables:
  AZURE_STORAGE_ACCOUNT    Storage account name (default: cardiologysuitepub)
  AZURE_RESOURCE_GROUP     Resource group name (auto-detected if not set)

Policy Rules:
  - temp: Delete after 30 days
  - refresh_annual: Cool after 90d, Archive after 180d, Delete after 365d
  - permanent: Cool after 365d, Archive after 3 years

Usage:
  $0 [options]

Options:
  --help, -h    Show this help message

Examples:
  # Apply to default storage account
  $0

  # Apply to specific storage account
  AZURE_STORAGE_ACCOUNT=myaccount $0

EOF
    exit 0
fi

main "$@"