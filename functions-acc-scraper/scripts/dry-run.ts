/**
 * Dry-run script for local testing
 * Usage: npm run dry-run [-- --write]
 */

import { config } from 'dotenv';
config(); // Load .env explicitly
import { scrapeAndNormalize } from '../src/lib/orchestrator.js';
import { log } from '../src/lib/log.js';

const writeFlag = process.argv.includes('--write');

if (!writeFlag) {
  log.info('DRY RUN - No blob upload (use --write to enable)');
  // Temporarily override uploadToBlob to prevent actual upload
  process.env.DRY_RUN = 'true';
}

try {
  log.info('Starting dry-run scrape pipeline');

  const result = await scrapeAndNormalize();

  log.info('Dry-run complete', {
    stats: result.stats,
    blobPath: result.blobPath,
    itemCount: result.items.length
  });

  // Show first 2 items as sample
  console.log('\n=== SAMPLE OUTPUT (first 2 items) ===\n');
  console.log(JSON.stringify(result.items.slice(0, 2), null, 2));

  // Show raw data if no items were normalized (likely due to API issues)
  if (result.items.length === 0 && result.stats.itemsScraped > 0) {
    console.log('\n=== RAW SCRAPED DATA (before normalization) ===\n');
    console.log('Note: Normalization failed (likely placeholder Azure OpenAI credentials)');
    console.log('Scraping itself worked successfully!\n');
  }

  console.log(`\n=== STATS ===`);
  console.log(`Sections scraped: ${result.stats.sections}`);
  console.log(`List items found: ${result.stats.listItems}`);
  console.log(`Items scraped: ${result.stats.itemsScraped}`);
  console.log(`Recent items: ${result.stats.itemsFiltered}`);
  console.log(`Normalized: ${result.stats.normalized}`);
  console.log(`Failed: ${result.stats.failed}`);
  console.log(`Duplicates removed: ${result.stats.duplicates}`);
  console.log(`Final unique items: ${result.items.length}`);

  if (writeFlag) {
    console.log(`\nBlob uploaded to: ${result.blobPath}`);
  } else {
    console.log(`\n(No blob upload - this was a dry run)`);
  }

} catch (error) {
  log.error('Dry-run failed', {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
}
