import { debugLog, debugWarn, debugError } from "./logger.js";

/**
 * SVG ViewBox Sanitizer (Loop-Safe)
 *
 * Normalizes invalid viewBox attributes that may contain percentage values
 * or be injected by browser extensions. Runs as a runtime guard to prevent
 * console errors like: "Error: <svg> attribute viewBox: Expected number"
 *
 * Features:
 * - WeakSet tracking to prevent infinite loops
 * - Batched processing via requestIdleCallback for performance
 * - Only mutates viewBox if it actually changes
 * - Does NOT observe attributes (only childList/subtree)
 *
 * @module svgSanitizer
 */

// Track sanitized SVGs to prevent infinite loops
const sanitizedSVGs = new WeakSet();

// Queue for batched processing
let processingQueue = [];
let processingScheduled = false;

/**
 * Sanitize a single SVG element's viewBox attribute
 * @param {SVGElement} svg - The SVG element to sanitize
 * @returns {boolean} True if sanitization was needed
 */
export function sanitizeSVGViewBox(svg) {
  if (!(svg instanceof SVGSVGElement)) {
    return false;
  }

  // Skip if already sanitized (prevent infinite loop)
  if (sanitizedSVGs.has(svg)) {
    return false;
  }

  const viewBox = svg.getAttribute('viewBox');

  // No viewBox - mark as processed and skip
  if (!viewBox) {
    sanitizedSVGs.add(svg);
    return false;
  }

  // Check if viewBox contains invalid characters (%, non-numeric values except whitespace, dot, and minus)
    const hasInvalidChars = /[^0-9\s.-]/.test(viewBox);

  if (!hasInvalidChars) {
    // Mark as sanitized even if valid (so we don't check again)
    sanitizedSVGs.add(svg);
    return false;
  }

  try {
    // Parse viewBox: "minX minY width height"
    const parts = viewBox.trim().split(/\s+/);

    if (parts.length !== 4) {
      debugWarn('[SVG Sanitizer] Invalid viewBox format:', viewBox);
      sanitizedSVGs.add(svg);
      return false;
    }

    // Convert percentage values to numeric
    // Example: "0 0 100% 4" -> "0 0 100 4"
    const sanitized = parts.map(part => {
      // Remove percentage sign
      if (part.includes('%')) {
        const numericValue = parseFloat(part.replace('%', ''));
        if (!isNaN(numericValue)) {
          return String(numericValue);
        }
      }

      // Keep numeric values as-is
      const parsed = parseFloat(part);
      if (!isNaN(parsed)) {
        return String(parsed);
      }

      // Fallback to 0 for invalid values
      debugWarn('[SVG Sanitizer] Invalid viewBox value:', part);
      return '0';
    });

    const newViewBox = sanitized.join(' ');

    // Only mutate if it actually changes
    if (newViewBox === viewBox) {
      sanitizedSVGs.add(svg);
      return false;
    }

    // Mark as sanitized BEFORE setAttribute to prevent infinite loop
    sanitizedSVGs.add(svg);

    svg.setAttribute('viewBox', newViewBox);

    debugLog(`[SVG Sanitizer] Fixed viewBox: "${viewBox}" -> "${newViewBox}"`);
    return true;
  } catch (err) {
    debugError('[SVG Sanitizer] Error sanitizing viewBox:', err);
    sanitizedSVGs.add(svg); // Mark as processed to avoid retrying
    return false;
  }
}

/**
 * Process queued SVGs in batches
 */
function processBatch() {
  const startTime = performance.now();
  const maxBatchTime = 16; // Max 16ms per batch to maintain 60fps

  while (processingQueue.length > 0 && (performance.now() - startTime) < maxBatchTime) {
    const svg = processingQueue.shift();
    sanitizeSVGViewBox(svg);
  }

  // If more items remain, schedule next batch
  if (processingQueue.length > 0) {
    scheduleProcessing();
  } else {
    processingScheduled = false;
  }
}

/**
 * Schedule batch processing using requestIdleCallback (fallback to requestAnimationFrame)
 */
function scheduleProcessing() {
  if (processingScheduled) {
    return;
  }

  processingScheduled = true;

  if (typeof window !== 'undefined' && window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      processBatch();
    }, { timeout: 100 });
  } else if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    window.requestAnimationFrame(() => {
      processBatch();
    });
  } else {
    // Fallback for non-browser environments (tests)
    setTimeout(() => {
      processBatch();
    }, 0);
  }
}

/**
 * Add SVGs to processing queue
 * @param {NodeList|Array} svgs - SVG elements to queue
 */
function queueSVGs(svgs) {
  svgs.forEach(svg => {
    if (!sanitizedSVGs.has(svg)) {
      processingQueue.push(svg);
    }
  });
  scheduleProcessing();
}

/**
 * Sanitize all SVG elements in the document
 * @param {Document|Element} root - Root element to search within (defaults to document)
 * @returns {number} Number of SVGs queued for sanitization
 */
export function sanitizeAllSVGs(root = document) {
  const svgs = root.querySelectorAll('svg');

  if (svgs.length > 0) {
    queueSVGs(svgs);
    debugLog(`[SVG Sanitizer] Queued ${svgs.length} SVG element(s) for processing`);
  }

  return svgs.length;
}

/**
 * Install a MutationObserver to watch for dynamically added SVGs
 * (e.g., from browser extensions or dynamic content)
 * @param {Element} root - Root element to observe (defaults to document.body)
 * @returns {MutationObserver} The observer instance (call .disconnect() to stop)
 */
export function installSVGSanitizer(root = document.body) {
  // Initial sanitization
  sanitizeAllSVGs(root);

  // Watch for new SVGs being added
  const observer = new MutationObserver(mutations => {
    const newSVGs = [];

    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the node itself is an SVG
          if (node.tagName === 'svg') {
            newSVGs.push(node);
          }

          // Check for SVGs within the added subtree
          if (node.querySelectorAll) {
            const svgs = node.querySelectorAll('svg');
            svgs.forEach(svg => newSVGs.push(svg));
          }
        }
      });
    });

    // Batch process all new SVGs
    if (newSVGs.length > 0) {
      queueSVGs(newSVGs);
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    // Do NOT observe attributes to prevent infinite loop on setAttribute
    attributes: false,
  });

  debugLog('[SVG Sanitizer] MutationObserver installed (loop-safe, batched)');
  return observer;
}

/**
 * Run sanitization on DOMContentLoaded and install observer
 * Call this once during app initialization
 */
export function initSVGSanitizer() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      installSVGSanitizer();
    });
  } else {
    // DOM already loaded
    installSVGSanitizer();
  }
}
