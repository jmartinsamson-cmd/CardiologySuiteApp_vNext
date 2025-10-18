/**
 * Parse Note Coordinator
 *
 * Coordinates note parsing with optimal performance:
 * - Attempts Web Worker parsing first (5s timeout)
 * - Falls back to chunked main-thread async parsing
 * - Ensures UI updates happen in single RAF writes
 * - Provides progress feedback
 */

// Import scheduler if available
const yieldToMain = window.yieldToMain || (async () => {
  return new Promise(resolve => setTimeout(resolve, 0));
});

const scheduleUIUpdate = window.scheduleUIUpdate || ((fn) => {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      fn();
      resolve();
    });
  });
});

/**
 * Parse a clinical note with optimal performance
 * @param {string} text - Note text to parse
 * @param {Object} options - Options
 * @param {boolean} options.useWorker - Try web worker first (default: true)
 * @param {number} options.workerTimeout - Worker timeout ms (default: 5000)
 * @param {Function} options.onProgress - Progress callback (phase: string) => void
 * @returns {Promise<Object>} Parsed note result
 */
async function parseNoteOptimal(text, options = {}) {
  const {
    useWorker = true,
    workerTimeout = 5000,
    onProgress = null
  } = options;

  console.log('🚀 Parse Coordinator: Starting parse');

  // Try worker first if enabled and available
  if (useWorker && typeof Worker !== 'undefined' && window.parserWorkerAvailable) {
    try {
      if (onProgress) onProgress('worker');
      console.log('⚙️  Attempting Web Worker parse...');

      const result = await parseWithWorker(text, workerTimeout);

      console.log('✅ Web Worker parse succeeded');
      return result;
    } catch (err) {
      console.warn('⚠️  Web Worker parse failed, falling back to main thread:', err.message);
    }
  }

  // Fallback: Chunked main-thread parsing
  if (onProgress) onProgress('main-thread');
  console.log('🔄 Using main-thread async parse...');

  const result = await parseWithMainThread(text, onProgress);

  console.log('✅ Main-thread parse succeeded');
  return result;
}

/**
 * Parse with Web Worker
 * @param {string} text - Note text
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Object>}
 */
function parseWithWorker(text, timeout) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('src/parsers/parser.worker.js');
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      worker.terminate();
      reject(new Error('Worker timeout after ' + timeout + 'ms'));
    }, timeout);

    worker.onmessage = (e) => {
      clearTimeout(timer);
      if (!timedOut) {
        worker.terminate();
        if (e.data.error) {
          reject(new Error(e.data.error));
        } else {
          resolve(e.data.result);
        }
      }
    };

    worker.onerror = (err) => {
      clearTimeout(timer);
      if (!timedOut) {
        worker.terminate();
        reject(err);
      }
    };

    // Send parse request
    worker.postMessage({ type: 'parse', text });
  });
}

/**
 * Parse with main thread (async with yielding)
 * @param {string} text - Note text
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>}
 */
async function parseWithMainThread(text, onProgress) {
  // Use async parser if available
  if (typeof window.parseClinicalNoteFullAsync === 'function') {
    return await window.parseClinicalNoteFullAsync(text);
  }

  // Fallback to sync parser wrapped with yields
  if (typeof window.parseClinicalNoteFull === 'function') {
    console.warn('Using sync parser (no async version available)');

    // Truncate if too long
    if (text.length > 200000) {
      text = text.slice(0, 200000);
      console.warn('Input truncated to 200k chars');
    }

    // Run in chunks with yields
    await yieldToMain();
    const result = window.parseClinicalNoteFull(text);
    await yieldToMain();

    return result;
  }

  throw new Error('No parser function available');
}

/**
 * Update UI with parse result (single RAF write)
 * @param {HTMLElement} outputElement - Output textarea/div
 * @param {string} htmlContent - Rendered HTML
 * @returns {Promise<void>}
 */
async function updateUIWithResult(outputElement, htmlContent) {
  return scheduleUIUpdate(() => {
    // Single write operation
    if (outputElement.tagName === 'TEXTAREA') {
      outputElement.value = htmlContent;
    } else {
      outputElement.innerHTML = htmlContent;
    }
  });
}

/**
 * Complete parse-and-render pipeline
 * @param {string} noteText - Input note text
 * @param {HTMLElement} outputElement - Output element
 * @param {Function} renderFn - Render function (parsedNote) => htmlString
 * @param {Object} options - Options
 * @returns {Promise<Object>} Parsed note
 */
async function parseAndRender(noteText, outputElement, renderFn, options = {}) {
  console.time('⏱️ Parse and Render: Total');

  // Parse
  console.time('⏱️ Parse and Render: Parse');
  const parsed = await parseNoteOptimal(noteText, options);
  console.timeEnd('⏱️ Parse and Render: Parse');

  await yieldToMain();

  // Render
  console.time('⏱️ Parse and Render: Render');
  const html = renderFn(parsed);
  console.timeEnd('⏱️ Parse and Render: Render');

  await yieldToMain();

  // Update UI (single write)
  console.time('⏱️ Parse and Render: UI Update');
  await updateUIWithResult(outputElement, html);
  console.timeEnd('⏱️ Parse and Render: UI Update');

  console.timeEnd('⏱️ Parse and Render: Total');

  return parsed;
}

// Export functions
if (typeof window !== 'undefined') {
  window.parseNoteOptimal = parseNoteOptimal;
  window.parseAndRender = parseAndRender;
  window.updateUIWithResult = updateUIWithResult;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseNoteOptimal,
    parseAndRender,
    updateUIWithResult
  };
}
