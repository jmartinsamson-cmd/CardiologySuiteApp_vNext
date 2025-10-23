import { describe, it, expect, vi } from 'vitest';
import { scrapeItemPage } from '../src/lib/acc-item.js';
import * as http from '../src/lib/http.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('acc-item scraper', () => {
  it('should parse item page HTML', async () => {
    // Load fixture
    const fixturePath = path.join(__dirname, '../fixtures/acc/item-page.html');
    const html = await fs.readFile(fixturePath, 'utf-8');

    // Mock HTTP response
    vi.spyOn(http, 'fetchWithRetry').mockResolvedValue(html);

    const listItem = {
      url: 'https://www.acc.org/Latest-in-Cardiology/Articles/2024/test-article',
      title: 'Test Article',
      section: 'Articles',
      date: '2024-01-15'
    };

    const item = await scrapeItemPage(listItem);

    expect(item).toBeDefined();
    expect(item.rawTitle).toBeTruthy();
    expect(item.sourceUrl).toBe(listItem.url);
    expect(item.section).toBe('Articles');
  });

  it('should extract authors', async () => {
    const html = `
      <html><body>
        <h1>Study Title</h1>
        <div class="author">John Smith, MD</div>
        <div class="author">Jane Doe, PhD</div>
      </body></html>
    `;

    vi.spyOn(http, 'fetchWithRetry').mockResolvedValue(html);

    const listItem = {
      url: 'https://www.acc.org/test',
      title: 'Test',
      section: 'Articles',
      date: null
    };

    const item = await scrapeItemPage(listItem);

    expect(item.authors).toContain('John Smith, MD');
    expect(item.authors).toContain('Jane Doe, PhD');
  });

  it('should extract relevant links', async () => {
    const html = `
      <html><body>
        <h1>Study</h1>
        <a href="https://doi.org/10.1234/test">DOI Link</a>
        <a href="https://clinicaltrials.gov/ct2/show/NCT12345">Trial Link</a>
        <a href="/full-text.pdf">Full Text PDF</a>
      </body></html>
    `;

    vi.spyOn(http, 'fetchWithRetry').mockResolvedValue(html);

    const listItem = {
      url: 'https://www.acc.org/test',
      title: 'Test',
      section: 'Articles',
      date: null
    };

    const item = await scrapeItemPage(listItem);

    expect(item.links.length).toBeGreaterThan(0);
    expect(item.links.some(l => l.url.includes('doi.org'))).toBe(true);
    expect(item.links.some(l => l.url.includes('clinicaltrials.gov'))).toBe(true);
  });

  it('should handle missing optional fields', async () => {
    const html = `
      <html><body>
        <h1>Minimal Article</h1>
        <article>
          <p>Some content here.</p>
        </article>
      </body></html>
    `;

    vi.spyOn(http, 'fetchWithRetry').mockResolvedValue(html);

    const listItem = {
      url: 'https://www.acc.org/test',
      title: 'Test',
      section: 'Articles',
      date: null
    };

    const item = await scrapeItemPage(listItem);

    expect(item.rawTitle).toBe('Minimal Article');
    expect(item.authors).toEqual([]);
    expect(item.rawDate).toBeNull();
  });
});
