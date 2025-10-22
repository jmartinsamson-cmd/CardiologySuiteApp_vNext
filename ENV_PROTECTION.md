# .env File Protection

## ⚠️ IMPORTANT: Do Not Delete This File

This directory contains your Azure credentials in `.env` and `.env.backup`.

### Protection Measures in Place:

1. **Git Ignore**: `.env` and `.env.*` are in `.gitignore` - never committed
2. **Git Attributes**: `.env` marked as export-ignore in `.gitattributes`
3. **Backup**: `.env.backup` is a read-only copy (chmod 400)
4. **Restore Script**: Run `./scripts/restore-env.sh` to restore from backup

### If .env Gets Deleted:

```bash
# Automatic restore from backup
./scripts/restore-env.sh
```

### Manual Restore:

```bash
cp .env.backup .env
chmod 600 .env
```

### Current Configuration:

- **Azure OpenAI**: Configured ✓
- **Azure AI Search**: Configured ✓
- **Deployment**: gpt-4.1-minisamson

### Test Connection:

```bash
node test-azure-ai.js
```

---

**Note**: These files are gitignored and will never be committed to the repository. They are safe from git operations like `git clean`, `git reset`, etc.
