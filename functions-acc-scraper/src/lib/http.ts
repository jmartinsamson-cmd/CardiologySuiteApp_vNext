/**
 * HTTP client with retry logic, ETag caching, and rate limiting
 */

import { fetch } from 'undici';
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

// Helper predicates and utilities (kept outside main function to reduce complexity)
function isSuccess(status: number) { return status >= 200 && status < 300; }
function isRetryable(status: number) { return status === 429 || status >= 500; }
function shouldInitialDelay(attempt: number, delay: number) { return attempt > 0 || delay > 0; }
type Outcome = 'success' | 'retryable' | 'clientError';
function classifyStatus(status: number): Outcome {
  if (isSuccess(status)) return 'success';
  if (isRetryable(status)) return 'retryable';
  return 'clientError';
}

function buildResponseHeaders(h: Headers): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of h.entries()) out[key] = value;
  return out;
}

function makeSuccess(
  status: number,
  headers: Record<string, string | string[]>,
  body: string
): FetchResult {
  return {
    body,
    status,
    headers,
    etag: typeof headers['etag'] === 'string' ? headers['etag'] : undefined,
    lastModified: typeof headers['last-modified'] === 'string' ? headers['last-modified'] : undefined,
  };
}

async function attemptFetch(
  url: string,
  method: string,
  requestHeaders: Record<string, string>,
  body?: string
): Promise<
  | { ok: true; status: number; responseHeaders: Record<string, string | string[]>; responseBody: string }
  | { ok: false; error: Error }
> {
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body,
      redirect: 'follow',
    });
    const responseBody = await response.text();
    const status = response.status;
    const responseHeaders = buildResponseHeaders(response.headers as unknown as Headers);
    return { ok: true, status, responseHeaders, responseBody };
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    return { ok: false, error };
  }
}

/**
 * Fetch URL with retry logic and rate limiting
 */
/* eslint-disable-next-line sonarjs/cognitive-complexity -- Retry logic has explicit control flow; helpers extract duplication */
export async function fetchWithRetry( // NOSONAR
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult> {
  

  const {
    method = 'GET',
    headers = {},
    body,
    maxRetries = 3,
    delayMs = Number.parseInt(process.env.REQUEST_DELAY_MS || '500', 10)
  } = options;

  const requestHeaders = {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    ...headers
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (shouldInitialDelay(attempt, delayMs)) await sleep(delayMs);
    log.debug('HTTP request', { url, attempt, method });

    const res = await attemptFetch(url, method, requestHeaders, body);
    let shouldRetry = false;

    if (res.ok) {
      const { status, responseHeaders, responseBody } = res;
      const outcome = classifyStatus(status);
      if (outcome === 'success') {
        return makeSuccess(status, responseHeaders, responseBody);
      }
      if (outcome === 'retryable') {
        shouldRetry = attempt < maxRetries;
        if (!shouldRetry) lastError = new Error(`HTTP ${status}: ${url}`);
        log.warn('Retryable HTTP error', { url, status, attempt, backoffMs: calculateBackoff(attempt) });
      } else {
        lastError = new Error(`HTTP ${status}: ${url}`);
      }
    } else {
      lastError = res.error;
      shouldRetry = attempt < maxRetries;
      if (!shouldRetry) {
        log.error('HTTP request failed after retries', { url, error: lastError.message, attempts: maxRetries + 1 });
      }
    }

    if (!shouldRetry) break;

    const backoffMs = calculateBackoff(attempt);
    log.warn('HTTP request failed, retrying', {
      url,
      error: lastError ? lastError.message : 'retryable status',
      attempt,
      backoffMs,
    });
    await sleep(backoffMs);
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
