# ACC Scraper - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Functions (Timer Trigger)               │
│                     CRON: 0 0 12 1 * *                          │
│                   (Monthly at 12:00 UTC on 1st)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ MonthlyAccScrape     │
                  │ (index.ts)           │
                  │ - Structured logging │
                  │ - Error handling     │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   Orchestrator       │
                  │ (orchestrator.ts)    │
                  │ - Main pipeline      │
                  │ - Coordination       │
                  └──────────┬───────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Configuration│    │ HTTP Client  │    │   Logging    │
│              │    │  (http.ts)   │    │   (log.ts)   │
│ - ENV vars   │    │ - Retry      │    │ - Structured │
│ - Start URLs │    │ - Backoff    │    │ - JSON       │
│ - Max pages  │    │ - ETag cache │    │ - Levels     │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Data Flow Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                         STEP 1: SCRAPE LISTS                     │
└─────────────────────────────────────────────────────────────────┘

ACC.org Start URLs
    │
    ├─ https://www.acc.org/Latest-in-Cardiology/Journal-Scans
    ├─ https://www.acc.org/Latest-in-Cardiology/Clinical-Trials
    ├─ https://www.acc.org/Latest-in-Cardiology/Articles
    └─ https://www.acc.org/Guidelines
         │
         ▼
    acc-list.ts (for each URL)
         │
         ├─ Page 1: Extract article links (cheerio selectors)
         ├─ Page 2: Follow "Next" pagination link
         └─ Page 3: Max pages reached (configurable)
              │
              ▼
    De-duplicate by URL
         │
         ▼
    ListItem[] (url, title, section, date)


┌─────────────────────────────────────────────────────────────────┐
│                      STEP 2: SCRAPE ITEMS                        │
└─────────────────────────────────────────────────────────────────┘

ListItem[]
    │
    ▼
acc-item.ts (for each item)
    │
    ├─ Fetch article HTML
    ├─ Extract: title, date, authors, body, links
    ├─ Handle errors gracefully
    └─ Rate limiting (500ms delay)
         │
         ▼
    RawItem[] (rawTitle, rawDate, rawBody, authors[], links[])


┌─────────────────────────────────────────────────────────────────┐
│                      STEP 3: FILTER BY DATE                      │
└─────────────────────────────────────────────────────────────────┘

RawItem[]
    │
    ▼
date.ts (isRecentDate)
    │
    ├─ Check if pubDate within last 60 days
    └─ Keep only recent items
         │
         ▼
    Filtered RawItem[]


┌─────────────────────────────────────────────────────────────────┐
│                  STEP 4: NORMALIZE WITH AI                       │
└─────────────────────────────────────────────────────────────────┘

Filtered RawItem[]
    │
    ▼
normalize.ts (for each item)
    │
    ├─ Create structured prompt
    ├─ Call Azure OpenAI (gpt-4.1-mini, temp=0)
    ├─ Parse JSON response
    ├─ Validate with Zod schema
    └─ Retry on failure (2 attempts)
         │
         ▼
    NormalizedItem[]
         │
    Schema:
    {
      source: 'ACC',
      section: enum,
      sourceUrl: string,
      title: string,
      pubDate: YYYY-MM-DD,
      authors: string[],
      studyType: enum | null,
      keyFindings: string[],
      clinicalTakeaways: string[],
      links: Array<{label, url}>
    }


┌─────────────────────────────────────────────────────────────────┐
│                    STEP 5: DE-DUPLICATE                          │
└─────────────────────────────────────────────────────────────────┘

NormalizedItem[]
    │
    ▼
orchestrator.ts (deduplicateItems)
    │
    ├─ Create key: URL + title + pubDate
    ├─ Use Set<string> to track seen items
    └─ Keep first occurrence only
         │
         ▼
    Unique NormalizedItem[]


┌─────────────────────────────────────────────────────────────────┐
│                   STEP 6: UPLOAD TO BLOB                         │
└─────────────────────────────────────────────────────────────────┘

Unique NormalizedItem[]
    │
    ▼
blob.ts (uploadToBlob)
    │
    ├─ Get current year-month (YYYY-MM)
    ├─ Create blob path: acc-updates/{YYYY-MM}/updates.json
    ├─ Create container if not exists
    ├─ Upload JSON (pretty print, UTF-8)
    └─ Set metadata & headers
         │
         ▼
    Blob Storage
    └─ https://{account}.blob.core.windows.net/cards-updates/
         └─ acc-updates/
              ├─ 2024-01/updates.json
              ├─ 2024-02/updates.json
              └─ 2024-03/updates.json


┌─────────────────────────────────────────────────────────────────┐
│                        FINAL OUTPUT                              │
└─────────────────────────────────────────────────────────────────┘

{
  "stats": {
    "sections": 4,
    "listItems": 87,
    "itemsScraped": 85,
    "itemsFiltered": 42,
    "normalized": 40,
    "failed": 2,
    "duplicates": 3
  },
  "blobPath": "cards-updates/acc-updates/2024-01/updates.json",
  "items": [
    { /* NormalizedItem 1 */ },
    { /* NormalizedItem 2 */ },
    ...
  ]
}
```

## Module Responsibilities

### 1. **MonthlyAccScrape/index.ts**
- Timer trigger entry point
- Calls orchestrator
- Logs execution stats
- Handles errors and rethrows

### 2. **orchestrator.ts**
- Main pipeline coordinator
- Loads configuration
- Calls all modules in sequence
- Aggregates statistics
- Returns final result

### 3. **acc-list.ts**
- Scrapes list pages
- Handles pagination (max 3 pages)
- Multiple selector strategies
- De-duplicates by URL
- Returns: `ListItem[]`

### 4. **acc-item.ts**
- Scrapes individual articles
- Extracts: title, date, authors, body, links
- Error handling per item
- Returns: `RawItem[]`

### 5. **normalize.ts**
- Calls Azure OpenAI API
- Structured prompts
- Zod schema validation
- Retry logic
- Returns: `NormalizedItem[]`

### 6. **blob.ts**
- Uploads to Azure Blob Storage
- Creates container if needed
- Sets metadata & headers
- Returns: `UploadResult`

### 7. **http.ts**
- HTTP client with undici
- Exponential backoff + jitter
- ETag/Last-Modified caching
- Rate limiting (500ms delay)
- Returns: HTML string

### 8. **date.ts**
- Normalizes dates to YYYY-MM-DD
- Checks if date is recent (60 days)
- Returns: ISO date string or null

### 9. **log.ts**
- Structured JSON logging
- Levels: debug, info, warn, error
- Application Insights compatible
- Outputs: console (stdout/stderr)

## Error Handling Strategy

```
┌─────────────────┐
│  HTTP Request   │
│   Fails (5xx)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retry #1        │
│ Wait: 1s + jitter│
└────────┬────────┘
         │ (still fails)
         ▼
┌─────────────────┐
│ Retry #2        │
│ Wait: 2s + jitter│
└────────┬────────┘
         │ (still fails)
         ▼
┌─────────────────┐
│ Retry #3        │
│ Wait: 4s + jitter│
└────────┬────────┘
         │ (still fails)
         ▼
┌─────────────────┐
│ Throw Error     │
│ Log & Continue  │
│ (skip this item)│
└─────────────────┘
```

**Resilience Features:**
- HTTP requests: 3 retries with exponential backoff
- Azure OpenAI: 2 retries with backoff
- Item scraping: Errors logged but don't stop pipeline
- Normalization: Failed items logged, rest continue
- Blob upload: Single attempt, throws on failure

## Performance Characteristics

**Estimated Runtime** (for 100 articles):
- List scraping (12 pages × 500ms delay): ~6 seconds
- Item scraping (100 articles × 500ms delay): ~50 seconds
- OpenAI normalization (100 calls × 2s avg): ~200 seconds
- Blob upload: <1 second
- **Total**: ~4-5 minutes

**Memory Usage**:
- Cheerio parsing: ~10MB per page
- Items in memory: ~1KB per normalized item
- Peak memory: ~50-100MB

**Rate Limits**:
- ACC.org: 500ms between requests (conservative)
- Azure OpenAI: TPM depends on deployment
- Blob Storage: No limits for this usage

## Monitoring & Observability

### Application Insights Query Examples

**Failed normalizations:**
```kusto
traces
| where customDimensions.level == "error"
| where message contains "normalization failed"
| project timestamp, customDimensions
```

**Pipeline stats:**
```kusto
traces
| where message == "Pipeline completed"
| project timestamp, customDimensions.stats
```

**HTTP retries:**
```kusto
traces
| where message contains "Retry attempt"
| summarize count() by tostring(customDimensions.url)
```

### Alerts to Configure

1. **Function Failures**: Alert if function fails 2x in a row
2. **Low Output**: Alert if normalized items < 10
3. **High Duration**: Alert if execution > 10 minutes
4. **OpenAI Errors**: Alert on 429 (rate limit) or 5xx errors

## Security Considerations

✅ **Environment Variables**: Never committed to git  
✅ **API Keys**: Stored in Azure Key Vault (recommended) or App Settings  
✅ **Blob Access**: Container-level permissions, not account-level  
✅ **HTTPS Only**: All external requests use HTTPS  
✅ **No PHI**: Public ACC.org content only (no patient data)  
✅ **Rate Limiting**: Respectful scraping with delays  
✅ **User-Agent**: Identifies bot: `ACC-Scraper/1.0`

## Scalability

**Current Design** (Monthly batch):
- Single-threaded execution
- Sequential processing (one item at a time)
- Suitable for 100-500 articles/month

**Future Enhancements** (if needed):
- Parallel item scraping (Promise.all with batch size)
- Queue-based processing (Service Bus)
- Distributed execution (Durable Functions)
- Incremental updates (only new articles since last run)
