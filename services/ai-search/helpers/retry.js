/* eslint-env node */

/**
 * Exponential backoff with optional jitter and retry filter.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{
 *   retries?: number,
 *   baseMs?: number,
 *   maxMs?: number,
 *   jitter?: boolean,
 *   retryOn?: (err: any) => boolean
 * }} [opts]
 * @returns {Promise<T>}
 */
export async function withBackoff(fn, opts = {}) {
  const {
    retries = 4,
    baseMs = 200,
    maxMs = 4000,
    jitter = true,
    retryOn = (err) => {
      const s = err?.status ?? err?.statusCode ?? err?.response?.status;
      return s === 429 || (s >= 500 && s < 600);
    },
  } = opts;

  let attempt = 0;
  /** @type {any} */
  let lastErr;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (!retryOn(e) || attempt === retries) throw e;
      const delay = Math.min(maxMs, baseMs * 2 ** attempt) * (jitter ? 0.75 + Math.random() * 0.5 : 1);
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }
  throw lastErr;
}
