# ACC.org Monthly Scraper

Azure Functions TypeScript project that scrapes ACC.org content monthly, normalizes it with Azure OpenAI, and saves to Blob Storage.

## Features

- **Timer Trigger**: Runs monthly on the 1st at 12:00 UTC (06:00 CST / 07:00 CDT)
- **Multi-Section Scraping**: Scrapes 4 ACC.org sections (Journal Scans, Clinical Trials, Articles, Guidelines)
- **Pagination Support**: Scrapes up to 3 pages per section
- **Azure OpenAI Normalization**: Uses gpt-4.1-mini to normalize content into strict JSON schema
- **Blob Storage**: Saves output to `acc-updates/{YYYY-MM}/updates.json`
- **Rate Limiting**: 500ms delay between requests with exponential backoff on failures
- **ETag Caching**: HTTP cache headers for efficient re-fetching
- **Structured Logging**: JSON logs for Azure Application Insights
- **De-duplication**: By URL, title, and date
- **Date Filtering**: Only recent items (last 60 days)

## Architecture

```
MonthlyAccScrape/         # Timer trigger function
src/lib/
  ├── orchestrator.ts     # Main pipeline
  ├── acc-list.ts         # List page scraper (pagination)
  ├── acc-item.ts         # Item page scraper
  ├── normalize.ts        # Azure OpenAI normalization
  ├── blob.ts             # Blob Storage upload
  ├── http.ts             # HTTP client with retry/cache
  ├── date.ts             # Date normalization
  └── log.ts              # Structured logging
scripts/
  └── dry-run.ts          # Local testing script
tests/                    # Vitest unit tests
```

## Prerequisites

- Node.js 18+
- Azure Functions Core Tools v4
- Azure OpenAI deployment (gpt-4.1-mini or similar)
- Azure Storage Account with Blob Container

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:

```env
# Azure OpenAI
AOAI_ENDPOINT=https://your-resource.openai.azure.com
AOAI_KEY=your-api-key-here
AOAI_DEPLOYMENT=gpt-4o-mini

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
BLOB_CONTAINER=cards-updates

# Scraping Configuration
ACC_START_URLS=["https://www.acc.org/Latest-in-Cardiology/Journal-Scans","https://www.acc.org/Latest-in-Cardiology/Clinical-Trials","https://www.acc.org/Latest-in-Cardiology/Articles","https://www.acc.org/Guidelines"]
MAX_PAGES_PER_SECTION=3
REQUEST_DELAY_MS=500

# Azure Functions (local only)
AzureWebJobsStorage=UseDevelopmentStorage=true
FUNCTIONS_WORKER_RUNTIME=node
```

### 3. Build TypeScript

```bash
npm run build
```

## Local Development

### Dry Run (without blob upload)

Test the full pipeline without uploading to Blob Storage:

```bash
npm run dry-run
```

This will:
- Scrape all configured ACC.org sections
- Parse and extract content
- Normalize with Azure OpenAI
- Show stats and first 2 items
- **Skip blob upload**

### Dry Run with Upload

To actually upload to Blob Storage:

```bash
npm run dry-run -- --write
```

### Run Local Azure Functions

Start the Functions runtime locally:

```bash
func start
```

Or with npm:

```bash
npm start
```

The timer trigger will run on schedule (monthly). To test immediately, you can manually invoke:

```bash
curl -X POST http://localhost:7071/admin/functions/MonthlyAccScrape
```

## Testing

Run unit tests:

```bash
npm test
```

With coverage:

```bash
npm run test:coverage
```

## Code Quality

### Lint

```bash
npm run lint
```

Auto-fix:

```bash
npm run lint:fix
```

### Format

```bash
npm run format
```

## Deployment

### Deploy to Azure Functions

1. Create Azure Function App (Node 18, Linux)
2. Configure environment variables in Azure Portal (Application Settings)
3. Deploy:

```bash
func azure functionapp publish <your-function-app-name>
```

Or use CI/CD with GitHub Actions.

### Environment Variables in Azure

Add these in **Configuration > Application Settings**:

- `AOAI_ENDPOINT`
- `AOAI_KEY`
- `AOAI_DEPLOYMENT`
- `AZURE_STORAGE_CONNECTION_STRING`
- `BLOB_CONTAINER`
- `ACC_START_URLS` (JSON array string)
- `MAX_PAGES_PER_SECTION` (default: 3)
- `REQUEST_DELAY_MS` (default: 500)
- `APPINSIGHTS_INSTRUMENTATIONKEY` (optional, for monitoring)

## Output Schema

The scraper outputs JSON to `acc-updates/{YYYY-MM}/updates.json`:

```json
[
  {
    "source": "ACC",
    "section": "Journal Scans",
    "sourceUrl": "https://www.acc.org/...",
    "title": "Study Title Here",
    "pubDate": "2024-01-15",
    "authors": ["Author One", "Author Two"],
    "studyType": "RCT",
    "keyFindings": [
      "Finding 1",
      "Finding 2"
    ],
    "clinicalTakeaways": [
      "Takeaway 1"
    ],
    "links": [
      {
        "label": "DOI",
        "url": "https://doi.org/..."
      }
    ]
  }
]
```

## CRON Schedule

The function runs on CRON schedule: `0 0 12 1 * *`

- **UTC**: 12:00 on the 1st of each month
- **CST (Winter)**: 06:00 on the 1st
- **CDT (Summer)**: 07:00 on the 1st

Azure Functions uses UTC internally. To change schedule, edit `MonthlyAccScrape/function.json`.

## Monitoring

Logs are structured JSON for easy parsing in Application Insights:

```json
{
  "timestamp": "2024-01-15T12:00:00.000Z",
  "level": "info",
  "message": "Pipeline completed",
  "data": {
    "stats": { "sections": 4, "normalized": 42, ... },
    "elapsedMin": "5.23",
    "blobPath": "acc-updates/2024-01/updates.json"
  }
}
```

Query in Application Insights:

```kusto
traces
| where customDimensions.level == "error"
| project timestamp, message, customDimensions
```

## Troubleshooting

### Error: Cannot find module '@azure/functions'

Run `npm install` to install dependencies.

### Error: No ACC_START_URLS configured

Ensure `ACC_START_URLS` is set in `.env` (local) or Application Settings (Azure).

### Error: Azure OpenAI API error: 401

Check `AOAI_KEY` and `AOAI_ENDPOINT` are correct.

### Error: BlobServiceClient error

Verify `AZURE_STORAGE_CONNECTION_STRING` is valid and `BLOB_CONTAINER` exists.

### Scraper returns no items

- Check ACC.org site structure hasn't changed
- Run with `LOG_LEVEL=debug` for verbose output
- Inspect HTML with `fixtures/` samples

## Development Workflow

1. Make changes to `src/lib/*.ts`
2. Run `npm run build` to compile
3. Test with `npm run dry-run`
4. Run unit tests: `npm test`
5. Lint: `npm run lint:fix`
6. Format: `npm run format`
7. Deploy: `func azure functionapp publish <name>`

## License

MIT

## Support

For issues or questions, open a GitHub issue or contact the maintainers.
