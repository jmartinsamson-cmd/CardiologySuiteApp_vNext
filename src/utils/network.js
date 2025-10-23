/**
 * Network Utility - Safe Fetch with Error Handling
 *
 * Provides a wrapper around fetch API with consistent error handling,
 * timeouts, retries, and better error messages.
 *
 * Usage:
 *   import { safeFetch, fetchJSON } from './src/utils/network.js';
 *
 *   const data = await fetchJSON('/api/data');
 *   const response = await safeFetch('/api/endpoint', { method: 'POST', body: ... });
 */
import { config } from '../../config/environment.js';
import { debugLog, debugWarn, debugError } from './logger.js';
/**
 * Custom error class for network failures
 */
export class NetworkError extends Error {
    constructor(message, url, status, response) {
        super(message);
        this.name = 'NetworkError';
        this.url = url;
        this.status = status;
        this.response = response;
    }
}
/**
 * Fetch with timeout
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds
 * @returns Promise resolving to Response
 */
async function fetchWithTimeout(url, options = {}, timeout = config.apiTimeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    }
    catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new NetworkError(`Request timeout after ${timeout}ms`, url, null, null);
        }
        throw error;
    }
}
/**
 * Delay for retry backoff
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Safe fetch with automatic retries and error handling
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retryConfig - Retry configuration
 * @returns Promise resolving to Response
 * @throws NetworkError if all retries fail
 */
export async function safeFetch(url, options = {}, retryConfig = config.retry) {
    const { maxAttempts, delayMs, backoffMultiplier } = retryConfig;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            debugLog(`🌐 Fetching (attempt ${attempt}/${maxAttempts}):`, url);
            const response = await fetchWithTimeout(url, options);
            if (!response.ok) {
                throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`, url, response.status, response);
            }
            debugLog(`✅ Fetch success:`, url);
            return response;
        }
        catch (error) {
            lastError = error;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            debugWarn(`❌ Fetch attempt ${attempt} failed:`, errorMessage);
            // Don't retry on client errors (4xx) except 429 (rate limit)
            if (error instanceof NetworkError && error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
                debugWarn('Client error detected, skipping retries');
                break;
            }
            // Retry with exponential backoff
            if (attempt < maxAttempts) {
                const backoffDelay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
                debugLog(`⏳ Retrying in ${backoffDelay}ms...`);
                await delay(backoffDelay);
            }
        }
    }
    // All retries failed
    debugError(`💥 All ${maxAttempts} fetch attempts failed for:`, url);
    if (!lastError) {
        throw new NetworkError('All fetch attempts failed', url, null, null);
    }
    throw lastError;
}
/**
 * Fetch and parse JSON with error handling
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Promise resolving to parsed JSON data
 * @throws NetworkError if fetch fails or JSON parsing fails
 */
export async function fetchJSON(url, options = {}) {
    try {
        const response = await safeFetch(url, options);
        return await response.json();
    }
    catch (error) {
        if (error instanceof NetworkError) {
            throw error;
        }
        // JSON parsing error
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new NetworkError(`Failed to parse JSON response: ${message}`, url, null, null);
    }
}
/**
 * Fetch and parse text with error handling
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Promise resolving to response text
 * @throws NetworkError if fetch fails
 */
export async function fetchText(url, options = {}) {
    const response = await safeFetch(url, options);
    return await response.text();
}
/**
 * POST JSON data with error handling
 * @param url - URL to post to
 * @param data - Data to send (will be JSON.stringify'd)
 * @param options - Additional fetch options
 * @returns Promise resolving to parsed JSON response
 */
export async function postJSON(url, data, options = {}) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (options.headers) {
        Object.assign(headers, options.headers);
    }
    return fetchJSON(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        ...options
    });
}
/**
 * Check if a URL is reachable (HEAD request)
 * @param url - URL to check
 * @returns Promise resolving to true if reachable
 */
export async function isReachable(url) {
    try {
        const response = await fetchWithTimeout(url, { method: 'HEAD' }, 5000);
        return response.ok;
    }
    catch {
        return false;
    }
}
/**
 * Download file as blob with progress tracking
 * @param url - URL to download
 * @param onProgress - Progress callback (bytesLoaded, bytesTotal)
 * @returns Promise resolving to Blob
 */
export async function downloadBlob(url, onProgress) {
    const response = await safeFetch(url);
    if (!response.body) {
        throw new NetworkError('Response body is null', url, response.status, response);
    }
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? Number.parseInt(contentLength, 10) : 0;
    let loaded = 0;
    const reader = response.body.getReader();
    const chunks = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        chunks.push(value);
        loaded += value.length;
        if (onProgress && total > 0) {
            onProgress(loaded, total);
        }
    }
    return new Blob(chunks);
}
export default {
    safeFetch,
    fetchJSON,
    fetchText,
    postJSON,
    isReachable,
    downloadBlob,
    NetworkError
};
//# sourceMappingURL=network.js.map