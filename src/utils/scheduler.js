// @ts-nocheck
/**
 * Main Thread Scheduler Utilities
 *
 * Provides cooperative scheduling primitives to prevent long tasks
 * and maintain UI responsiveness during heavy computation.
 */

/**
 * Yield control to the browser's main thread
 * Uses scheduler.postTask (if available) or requestAnimationFrame as fallback
 * @returns {Promise<void>}
 */
export async function yieldToMain() {
  // Priority 1: Use scheduler.postTask with 'background' priority (Chrome 94+)
  if ('scheduler' in window && 'postTask' in window.scheduler) {
    return window.scheduler.postTask(() => {}, { priority: 'background' });
  }

  // Priority 2: Use MessageChannel (faster than setTimeout)
  if (typeof MessageChannel !== 'undefined') {
    return new Promise(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = resolve;
      channel.port2.postMessage(null);
    });
  }

  // Priority 3: Use requestAnimationFrame
  if (typeof requestAnimationFrame !== 'undefined') {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        // Double RAF to ensure paint happens
        requestAnimationFrame(resolve);
      });
    });
  }

  // Fallback: setTimeout(0)
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Yield to main thread if enough time has elapsed since last yield
 * @param {number} lastYieldTime - Timestamp of last yield (from performance.now())
 * @param {number} threshold - Time threshold in ms (default: 50ms)
 * @returns {Promise<number>} New timestamp after yield (or same if no yield)
 */
export async function yieldIfNeeded(lastYieldTime, threshold = 50) {
  const now = performance.now();
  if (now - lastYieldTime > threshold) {
    await yieldToMain();
    return performance.now();
  }
  return lastYieldTime;
}

/**
 * Execute a function with automatic yielding
 * Useful for processing arrays or iterating over data
 * @param {Function} fn - Function to execute
 * @param {Object} options - Options
 * @param {number} options.yieldEvery - Yield every N iterations (default: 50)
 * @returns {Promise<any>} Result of the function
 */
export async function withYielding(fn, options = {}) {
  const { yieldEvery = 50 } = options;
  let lastYield = performance.now();
  let iterations = 0;

  const yieldWrapper = async () => {
    iterations++;
    if (iterations >= yieldEvery) {
      lastYield = await yieldIfNeeded(lastYield, 0);
      iterations = 0;
    }
  };

  return fn(yieldWrapper);
}

/**
 * Process an array in chunks with yielding between chunks
 * @param {Array} array - Array to process
 * @param {Function} processor - Function to call for each item (item, index) => {}
 * @param {number} chunkSize - Items per chunk (default: 50)
 * @returns {Promise<void>}
 */
export async function processArrayInChunks(array, processor, chunkSize = 50) {
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      await processor(chunk[j], i + j);
    }
    // Yield after each chunk
    if (i + chunkSize < array.length) {
      await yieldToMain();
    }
  }
}

/**
 * Run task with timeout
 * @param {Function} task - Async task to run
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<{result: any, timedOut: boolean}>}
 */
export async function runWithTimeout(task, timeoutMs) {
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve({ result: null, timedOut: true });
    }, timeoutMs);
  });

  const taskPromise = task().then(result => ({ result, timedOut: false }));

  return Promise.race([taskPromise, timeoutPromise]);
}

/**
 * Schedule a UI update using requestAnimationFrame
 * Ensures DOM writes happen during the browser's paint phase
 * @param {Function} updateFn - Function that performs DOM updates
 * @returns {Promise<void>}
 */
export function scheduleUIUpdate(updateFn) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      updateFn();
      resolve();
    });
  });
}

/**
 * Batch multiple DOM writes into a single requestAnimationFrame
 * @param {Function[]} updates - Array of update functions
 * @returns {Promise<void>}
 */
export function batchUIUpdates(updates) {
  return scheduleUIUpdate(() => {
    for (const update of updates) {
      update();
    }
  });
}
