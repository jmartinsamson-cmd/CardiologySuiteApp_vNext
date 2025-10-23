# Cardiology Education Blob Organizer (Python CLI)

One-click backfill reorganization for existing cardiology education files in Azure Blob Storage. The tool classifies each file and moves it into a lifecycle-friendly folder structure, applying Blob Index Tags for governance and search.

## What it does

- Connects using DefaultAzureCredential or a connection string
- Enumerates all blobs under `incoming/` (default) or the container root
- Classifies each file by filename and optional content into:
  `{ docType, condition, source_org, year, audience, evidence_level, retention_class, phi, needs_review }`
- Moves each blob to `/education/{docType}/{condition}/{year}/{source_org}/filename`
- Sets Blob Index Tags with the same keys
- If classification is uncertain, tags `needs_review=yes` and moves to `/education/_unsorted/`
- Supports standard Blob accounts and ADLS Gen2 (Hierarchical Namespace) accounts
- Optional enrichment with Azure OpenAI or Document Intelligence when credentials are present
- Produces a CSV audit log of actions (source, destination, tags, status, errors)

## Install

Create a virtual environment (recommended) and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

  --prefix incoming/ \
  --dry-run

Choose one of the following:

1) Connection string
- Set environment variable `AZURE_STORAGE_CONNECTION_STRING` or pass `--connection-string`.

2) DefaultAzureCredential
  --container education \
  --prefix incoming/

For ADLS Gen2 rename performance, also pass `--use-adls` or allow auto-detect.

Optional services:
- Azure OpenAI (improves classification): set `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and optionally `AZURE_OPENAI_DEPLOYMENT` then use `--use-openai`.
- Azure Document Intelligence (text extraction from PDFs): set `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`, `AZURE_DOCUMENT_INTELLIGENCE_KEY` then use `--use-docint`.

  --container education \
## Run

Dry run preview (no writes):

```bash
python organize_blobs.py \
  --container education \
  --prefix incoming/ \
  --container education \
  --dry-run
```

With connection string explicitly:

```bash
python organize_blobs.py \
  --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \

Tag-only mode (set Blob Index Tags but do not move files):

```bash
python organize_blobs.py \
  --account-url https://<account>.blob.core.windows.net \
  --container education \
  --tag-only
```

Limit number of files processed (e.g., first 25):

```bash
python organize_blobs.py \
  --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \
  --container education \
  --prefix incoming/ \
  --max-files 25
```

Authenticate using SAS instead of DefaultAzureCredential:

```bash
python organize_blobs.py \
  --account-url https://<account>.blob.core.windows.net \
  --sas-token "$AZURE_STORAGE_SAS" \
  --container education \
  --prefix incoming/
```
  --container education \
  --prefix incoming/
```

Using DefaultAzureCredential:

```bash
python organize_blobs.py \
  --account-url https://<account>.blob.core.windows.net \
  --container education \
  --prefix incoming/
```

Force ADLS Gen2 rename (if Hierarchical Namespace enabled):

```bash
python organize_blobs.py \
  --account-url https://<account>.blob.core.windows.net \
  --container education \
  --use-adls
```

Custom audit log path:

```bash
python organize_blobs.py --container education --audit-log ./education_organize_audit.csv
```

## Classification schema

- docType: guideline | slide_deck | textbook_chapter | article_RCT | review | protocol_handout | calculator | image_figure | notes | dataset | website_snapshot
- condition: ACS | STEMI | NSTEMI | OMI | AF | HF | HCM | valvular | pericarditis | syncope | hypertension | PAD | EP | congenital | cardiology_general
- source_org: ACC | AHA | ESC | NEJM | JAMA | Lancet | Goldman-Cecil | CIS | internal
- year: YYYY (from filename or last-modified)
- audience: clinician (default)
- evidence_level: heuristic (e.g., guideline, RCT, review) or empty
- retention_class: refresh_annual (default)
- phi: no (default)
- needs_review: yes/no

## Notes

- Moves use server-side rename for ADLS Gen2 where available, otherwise copy+delete.
- Blob Index Tags are applied to the destination blob.
- Content extraction is conservative (size-limited); when in doubt, the tool prefers `needs_review=yes` to avoid misclassification.
 - `--tag-only` will set tags on the source blob without moving it.
 - Use `--max-files` to do cautious first passes.
 - You can provide a SAS token via `--sas-token` for environments without Azure CLI or Managed Identity.

## Troubleshooting

- Permission errors: ensure your identity has Storage Blob Data Contributor on the container.
- ADLS rename 409/40901: path exists; use `--overwrite` to replace or review naming collisions.
- OpenAI/Doc Intelligence errors: run without `--use-openai`/`--use-docint`.
 - If using SAS, ensure it includes required permissions (r, w, c, d, t) for reading, writing, creating, deleting, and tagging.

## License

MIT.
