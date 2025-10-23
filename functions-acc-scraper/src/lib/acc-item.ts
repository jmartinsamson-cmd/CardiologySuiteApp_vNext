/**
 * ACC.org item page scraper
 * Extracts detailed content from individual article pages
 */

import * as cheerio from 'cheerio';
import { fetchWithRetry } from './http.js';
import { normalizeDate } from './date.js';
import { log } from './log.js';
import type { ListItem } from './acc-list.js';

export interface RawItem {
  rawTitle: string;
  rawDate?: string;
  itemUrl: string;
  section: string;
  rawBody: string;
  authors: string[];
  links: Array<{ label: string; url: string }>;
}

/**
 * Scrape individual ACC.org item page
 */
export async function scrapeItemPage(listItem: ListItem): Promise<RawItem | null> {
  try {
    log.debug('Scraping item page', { url: listItem.url });

    const response = await fetchWithRetry(listItem.url);
    const html = response.body;
    const $ = cheerio.load(html);

    // Extract title (prefer h1, fallback to provided title)
    const title = $('h1').first().text().trim() || $('article h2').first().text().trim() || listItem.title;

    // Extract date (look for time element or date pattern)
    let dateStr = $('time[datetime]').first().attr('datetime');
    if (!dateStr) {
      const dateText = $('.date, .published, .post-date').first().text().trim();
      dateStr = dateText || listItem.date;
    }
    const normalizedDate = normalizeDate(dateStr);

    // Extract authors (look for byline, author elements)
    const authors: string[] = [];
    $('.author, .byline, [itemprop="author"]').each((_: number, elem: any) => {
      const authorText = $(elem).text().trim();
      if (authorText) {
        // Split by commas and "and"
        const names = authorText
          .split(/,|\sand\s/i)
          .map(n => n.trim())
          .filter(n => n.length > 0 && n.length < 100);
        authors.push(...names);
      }
    });

    // Extract body content (main article text, limit to 3000 chars)
    const $main = $('article, .content, .main, main').first();
    $main.find('nav, aside, .related, .sidebar, .comments').remove(); // Remove noise
    let body = $main.text().trim();
    if (body.length > 3000) {
      body = body.slice(0, 3000) + '...';
    }

    // Helper function to safely check if URL hostname matches expected domain
    const isValidDomain = (url: string, expectedDomain: string): boolean => {
      try {
        const urlObj = new URL(url, 'https://www.acc.org'); // Resolve relative URLs
        return urlObj.hostname === expectedDomain || urlObj.hostname.endsWith(`.${expectedDomain}`);
      } catch {
        return false; // Invalid URL
      }
    };

    // Extract relevant links (DOI, PDF, ClinicalTrials.gov, etc.)
    const links: Array<{ label: string; url: string }> = [];
    $('a').each((_: number, elem: any) => {
      const $link = $(elem);
      const href = $link.attr('href');
      const text = $link.text().toLowerCase();

      if (href) {
        if (isValidDomain(href, 'doi.org') || text.includes('doi')) {
          links.push({ label: 'DOI', url: href });
        } else if (href.endsWith('.pdf') || text.includes('pdf')) {
          links.push({ label: 'PDF', url: href });
        } else if (isValidDomain(href, 'clinicaltrials.gov')) {
          links.push({ label: 'ClinicalTrials.gov', url: href });
        } else if (text.includes('full text') || text.includes('read more')) {
          links.push({ label: 'Full text', url: href });
        } else if (text.includes('guideline')) {
          links.push({ label: 'Guideline', url: href });
        }
      }
    });

    // De-duplicate links by URL
    const uniqueLinks = Array.from(
      new Map(links.map(l => [l.url, l])).values()
    );

    return {
      rawTitle: title,
      rawDate: normalizedDate || undefined,
      itemUrl: listItem.url,
      section: listItem.section,
      rawBody: body,
      authors: [...new Set(authors)], // De-duplicate authors
      links: uniqueLinks.slice(0, 10) // Limit to 10 links
    };

  } catch (error) {
    log.error('Failed to scrape item page', {
      url: listItem.url,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Scrape multiple item pages in batch
 */
export async function scrapeItemPages(listItems: ListItem[]): Promise<RawItem[]> {
  const results: RawItem[] = [];

  for (const item of listItems) {
    const rawItem = await scrapeItemPage(item);
    if (rawItem) {
      results.push(rawItem);
    }
  }

  log.info('Item scraping complete', {
    total: listItems.length,
    success: results.length,
    failed: listItems.length - results.length
  });

  return results;
}
