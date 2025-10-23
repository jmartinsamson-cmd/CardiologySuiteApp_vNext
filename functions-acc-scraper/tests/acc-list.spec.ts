import { describe, it, expect, vi } from 'vitest';
import { scrapeListPage } from '../src/lib/acc-list.js';
import * as http from '../src/lib/http.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('acc-list scraper', () => {
  it('should parse list page HTML', async () => {
    // Load fixture
    const fixturePath = path.join(__dirname, '../fixtures/acc/journal-scans-list.html');
    const html = await fs.readFile(fixturePath, 'utf-8');

    // Mock HTTP response
    vi.spyOn(http, 'fetchWithRetry').mockResolvedValue(html);

    const items = await scrapeListPage('https://www.acc.org/Latest-in-Cardiology/Journal-Scans', 1);

    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);
    
    // Check structure of first item
    const firstItem = items[0];
    expect(firstItem).toHaveProperty('url');
    expect(firstItem).toHaveProperty('title');
    expect(firstItem).toHaveProperty('section');
    expect(firstItem.section).toBe('Journal Scans');
  });

  it('should handle pagination', async () => {
    const page1Html = '<html><body><a class="next" href="/page2">Next</a></body></html>';
    const page2Html = '<html><body>Last page</body></html>';

    vi.spyOn(http, 'fetchWithRetry')
      .mockResolvedValueOnce(page1Html)
      .mockResolvedValueOnce(page2Html);

    const items = await scrapeListPage('https://www.acc.org/test', 2);

    expect(http.fetchWithRetry).toHaveBeenCalledTimes(2);
  });

  it('should de-duplicate items by URL', async () => {
    const htmlWithDupes = `
      <html><body>
        <article>
          <a href="/article-1">Article 1</a>
        </article>
        <article>
          <a href="/article-1">Article 1 Duplicate</a>
        </article>
        <article>
          <a href="/article-2">Article 2</a>
        </article>
      </body></html>
    `;

    vi.spyOn(http, 'fetchWithRetry').mockResolvedValue(htmlWithDupes);

    const items = await scrapeListPage('https://www.acc.org/test', 1);

    // Should only have 2 unique URLs
    const urls = new Set(items.map(i => i.url));
    expect(urls.size).toBe(2);
  });

  it('should extract section from URL', async () => {
    const html = '<html><body><article><a href="/Latest-in-Cardiology/Articles/2024/article-1">Test</a></article></body></html>';
    vi.spyOn(http, 'fetchWithRetry').mockResolvedValue(html);

    const items = await scrapeListPage('https://www.acc.org/Latest-in-Cardiology/Articles', 1);

    expect(items[0].section).toBe('Articles');
  });
});
