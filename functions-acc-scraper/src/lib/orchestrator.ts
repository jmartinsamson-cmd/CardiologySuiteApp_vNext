/**
 * Main orchestrator for ACC.org scraping pipeline
 */

import { scrapeListPage } from './acc-list.js';
import { scrapeItemPages } from './acc-item.js';
import { normalizeItems } from './normalize.js';
import { uploadToBlob } from './blob.js';
import { getCurrentYearMonth, isRecentDate } from './date.js';
import { log } from './log.js';
import type { RawItem } from './acc-item.js';
import type { NormalizedItem } from './normalize.js';

interface ScrapeStats {
  sections: number;
  listItems: number;
  itemsScraped: number;
  itemsFiltered: number;
  normalized: number;
  failed: number;
  duplicates: number;
}

interface ScrapeResult {
  stats: ScrapeStats;
  blobPath: string;
  items: NormalizedItem[];
}

/**
 * De-duplicate items by canonical URL + title + date
 */
function deduplicateItems(items: NormalizedItem[]): NormalizedItem[] {
  const seen = new Set<string>();
  const unique: NormalizedItem[] = [];

  for (const item of items) {
    const key = `${item.sourceUrl}|${item.title}|${item.pubDate}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Main scraping and normalization pipeline
 */
export async function scrapeAndNormalize(): Promise<ScrapeResult> {
  const startTime = Date.now();
  
  log.info('Starting ACC.org scrape pipeline');

  const stats: ScrapeStats = {
    sections: 0,
    listItems: 0,
    itemsScraped: 0,
    itemsFiltered: 0,
    normalized: 0,
    failed: 0,
    duplicates: 0
  };

  try {
    // Get configuration
    const startUrlsJson = process.env.ACC_START_URLS || '[]';
    const startUrls: string[] = JSON.parse(startUrlsJson);
    const maxPages = parseInt(process.env.MAX_PAGES_PER_SECTION || '3', 10);

    if (startUrls.length === 0) {
      throw new Error('No ACC_START_URLS configured');
    }

    stats.sections = startUrls.length;
    log.info('Configuration loaded', { sections: stats.sections, maxPages });

    // Step 1: Scrape list pages from all sections
    const allListItems = [];
    for (const url of startUrls) {
      const items = await scrapeListPage(url, maxPages);
      allListItems.push(...items);
    }
    stats.listItems = allListItems.length;

    log.info('List scraping complete', { totalItems: stats.listItems });

    // Step 2: Scrape individual item pages
    const rawItems = await scrapeItemPages(allListItems);
    stats.itemsScraped = rawItems.length;

    // Step 3: Filter items to recent ones (last 60 days)
    const recentItems = rawItems.filter(item => {
      if (!item.rawDate) return true; // Include if no date
      return isRecentDate(item.rawDate, 60);
    });
    stats.itemsFiltered = recentItems.length;

    log.info('Filtered to recent items', {
      scraped: stats.itemsScraped,
      recent: stats.itemsFiltered,
      dropped: stats.itemsScraped - stats.itemsFiltered
    });

    // Step 4: Normalize with Azure OpenAI
    const normalized = await normalizeItems(recentItems);
    stats.normalized = normalized.length;
    stats.failed = stats.itemsFiltered - stats.normalized;

    // Step 5: De-duplicate
    const unique = deduplicateItems(normalized);
    stats.duplicates = normalized.length - unique.length;

    log.info('Normalization complete', {
      normalized: stats.normalized,
      failed: stats.failed,
      unique: unique.length,
      duplicates: stats.duplicates
    });

    // Step 6: Upload to Blob Storage
    const yearMonth = getCurrentYearMonth();
    const uploadResult = await uploadToBlob(unique, yearMonth);

    const elapsedMs = Date.now() - startTime;
    const elapsedMin = (elapsedMs / 1000 / 60).toFixed(2);

    log.info('Pipeline completed', {
      stats,
      elapsedMin,
      blobPath: uploadResult.blobPath
    });

    return {
      stats,
      blobPath: uploadResult.blobPath,
      items: unique
    };

  } catch (error) {
    log.error('Pipeline failed', {
      error: error instanceof Error ? error.message : String(error),
      stats
    });
    throw error;
  }
}
