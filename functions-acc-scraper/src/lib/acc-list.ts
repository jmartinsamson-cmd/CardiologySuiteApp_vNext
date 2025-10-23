/**
 * ACC.org list page scraper
 * Extracts article links from section list pages with pagination support
 */

import * as cheerio from 'cheerio';
import { fetchWithRetry } from './http.js';
import { log } from './log.js';

export interface ListItem {
  title: string;
  url: string;
  date?: string;
  section: string;
}

interface ListPageResult {
  items: ListItem[];
  nextPageUrl?: string;
}

/**
 * Canonicalize URL (remove fragments, normalize)
 */
export function canonicalizeUrl(url: string, baseUrl: string): string {
  try {
    const fullUrl = new URL(url, baseUrl);
    // Remove hash fragments
    fullUrl.hash = '';
    return fullUrl.toString();
  } catch {
    return url;
  }
}

/**
 * Extract section name from URL
 */
function getSectionName(url: string): string {
  const match = url.match(/Latest-in-Cardiology\/([\w-]+)/i) || url.match(/\/([\w-]+)$/i);
  return match ? match[1].replace(/-/g, ' ') : 'Other';
}

/**
 * Parse ACC.org list page and extract item links
 */
export async function scrapeListPage(url: string, maxPages: number = 3): Promise<ListItem[]> {
  const allItems = new Set<string>();
  const section = getSectionName(url);
  let currentUrl: string | undefined = url;
  let pageCount = 0;

  while (currentUrl && pageCount < maxPages) {
    log.info('Scraping list page', { url: currentUrl, pageCount: pageCount + 1, section });

    try {
      const response = await fetchWithRetry(currentUrl);
      const html = response.body;
      const $ = cheerio.load(html);

      // Try multiple selectors for ACC.org structure
      const items: ListItem[] = [];

      // Strategy 1: Look for article cards/items
      $('.card, .item, .result, article').each((_: number, elem: any) => {
        const $elem = $(elem);
        const $link = $elem.find('a[href*="/Latest-in-Cardiology/"], a[href*="/Guidelines/"]').first();
        const $title = $elem.find('h2, h3, h4, .title').first();
        const $date = $elem.find('time[datetime], .date, .published').first();

        if ($link.length && $link.attr('href')) {
          const itemUrl = canonicalizeUrl($link.attr('href')!, url);
          const title = ($title.text() || $link.text()).trim();
          const dateStr = $date.attr('datetime') || $date.text().trim();

          if (title && itemUrl) {
            items.push({
              title,
              url: itemUrl,
              date: dateStr || undefined,
              section
            });
          }
        }
      });

      // Strategy 2: Direct link selection if Strategy 1 found nothing
      if (items.length === 0) {
        $('a[href*="/Latest-in-Cardiology/"], a[href*="/Guidelines/"]').each((_: number, elem: any) => {
          const $link = $(elem);
          const href = $link.attr('href');
          
          if (href && !href.includes('?') && !href.includes('#')) {
            const itemUrl = canonicalizeUrl(href, url);
            const title = $link.text().trim();

            if (title && title.length > 10) {
              items.push({
                title,
                url: itemUrl,
                section
              });
            }
          }
        });
      }

      log.debug('Found items on page', { count: items.length, url: currentUrl });

      // De-duplicate by URL
      items.forEach(item => {
        allItems.add(JSON.stringify(item));
      });

      // Look for next page link
      const $nextLink = $('a.next, a[rel="next"], a:contains("Next"), a:contains("Older"), .pagination a').last();
      const nextHref = $nextLink.attr('href');

      if (nextHref && pageCount + 1 < maxPages) {
        currentUrl = canonicalizeUrl(nextHref, url);
      } else {
        currentUrl = undefined;
      }

      pageCount++;

    } catch (error) {
      log.error('Failed to scrape list page', { 
        url: currentUrl, 
        error: error instanceof Error ? error.message : String(error) 
      });
      break;
    }
  }

  // Convert back from Set
  const uniqueItems: ListItem[] = Array.from(allItems).map(json => JSON.parse(json));

  log.info('List scraping complete', { 
    section, 
    totalItems: uniqueItems.length, 
    pagesScraped: pageCount 
  });

  return uniqueItems;
}
