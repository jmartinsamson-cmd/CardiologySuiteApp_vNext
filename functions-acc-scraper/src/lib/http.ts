/**
 * HTTP client with retry logic, ETag caching, and rate limiting
 */

import { request } from 'undici';
import { log } from './log.js';

const USER_AGENT = 'ACC-Scraper/1.0 (Medical Education; +https://github.com/cardiology-suite)';

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  maxRetries?: number;
  delayMs?: number;
}

interface FetchResult {
  body: string;
  status: number;
  headers: Record<string, string | string[]>;
  etag?: string;
  lastModified?: string;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff with jitter
 */
function calculateBackoff(attempt: number, baseDelayMs: number = 1000): number {
  const exponentialDelay = Math.min(baseDelayMs * Math.pow(2, attempt), 30000);
  const jitter = Math.random() * 1000;
  return exponentialDelay + jitter;
}

/**
 * Fetch URL with retry logic and rate limiting
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult> {
  const {
    method = 'GET',
    headers = {},
    body,
    maxRetries = 3,
    delayMs = parseInt(process.env.REQUEST_DELAY_MS || '500', 10)
  } = options;

  const requestHeaders = {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    ...headers
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Rate limiting delay (skip on first request)
      if (attempt > 0 || delayMs > 0) {
        await sleep(delayMs);
      }

      log.debug('HTTP request', { url, attempt, method });

      const response = await request(url, {
        method: method as HttpMethod,
        headers: requestHeaders,
        body
      });

      const responseBody = await response.body.text();
      const status = response.statusCode;

      // Extract headers
      const responseHeaders: Record<string, string | string[]> = {};
      for (const [key, value] of Object.entries(response.headers)) {
        if (value) responseHeaders[key] = value;
      }

      // Success responses (200-299)
      if (status >= 200 && status < 300) {
        return {
          body: responseBody,
          status,
          headers: responseHeaders,
          etag: typeof responseHeaders['etag'] === 'string' ? responseHeaders['etag'] : undefined,
          lastModified: typeof responseHeaders['last-modified'] === 'string' 
            ? responseHeaders['last-modified'] 
            : undefined
        };
      }

      // Rate limit or server error - retry with backoff
      if (status === 429 || status >= 500) {
        const backoffMs = calculateBackoff(attempt);
        log.warn('Retryable HTTP error', { url, status, attempt, backoffMs });
        
        if (attempt < maxRetries) {
          await sleep(backoffMs);
          continue;
        }
      }

      // Client error (4xx) - don't retry
      throw new Error(`HTTP ${status}: ${url}`);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const backoffMs = calculateBackoff(attempt);
        log.warn('HTTP request failed, retrying', { 
          url, 
          error: lastError.message, 
          attempt, 
          backoffMs 
        });
        await sleep(backoffMs);
      } else {
        log.error('HTTP request failed after retries', { 
          url, 
          error: lastError.message, 
          attempts: maxRetries + 1 
        });
      }
    }
  }

  throw lastError || new Error('Unknown fetch error');
}

/**
 * Fetch with ETag/Last-Modified support
 * Returns null if resource hasn't changed (304 Not Modified)
 */
export async function fetchWithCache(
  url: string,
  etag?: string,
  lastModified?: string
): Promise<FetchResult | null> {
  const headers: Record<string, string> = {};
  
  if (etag) {
    headers['If-None-Match'] = etag;
  }
  
  if (lastModified) {
    headers['If-Modified-Since'] = lastModified;
  }

  try {
    const result = await fetchWithRetry(url, { headers });
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a 304 Not Modified
    if (errorMessage.includes('304')) {
      log.debug('Resource not modified', { url });
      return null;
    }
    
    throw error;
  }
}
