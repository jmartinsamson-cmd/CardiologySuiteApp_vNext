import { debugLog, debugWarn, debugError } from "./logger.js";

/**
 * SVG ViewBox Sanitizer - Browser Version (Loop-Safe)
 *
 * Normalizes invalid viewBox attributes that may contain percentage values
 * or be injected by browser extensions. Runs as a runtime guard to prevent
 * console errors like: "Error: <svg> attribute viewBox: Expected number"
 *
 * This version uses global namespace for browser compatibility.
 * Features:
 * - WeakSet tracking to prevent infinite loops
 * - Batched processing via requestIdleCallback for performance
 * - Only mutates viewBox if it actually changes
 * - Does NOT observe attributes (only childList/subtree)
 */

(function (window) {
  'use strict';

  const SVGSanitizer = {
    // Track sanitized SVGs to prevent infinite loops
    sanitizedSVGs: new WeakSet(),

    // Queue for batched processing
    processingQueue: [],
    processingScheduled: false,

    /**
     * Sanitize a single SVG element's viewBox attribute
     * @param {SVGElement} svg - The SVG element to sanitize
     * @returns {boolean} True if sanitization was needed
     */
    sanitizeSVGViewBox(svg) {
      if (!(svg instanceof SVGSVGElement)) {
        return false;
      }

      // Skip if already sanitized (prevent infinite loop)
      if (SVGSanitizer.sanitizedSVGs.has(svg)) {
        return false;
      }

      const viewBox = svg.getAttribute('viewBox');

      // No viewBox - mark as processed and skip
      if (!viewBox) {
        SVGSanitizer.sanitizedSVGs.add(svg);
        return false;
      }

      // Check if viewBox contains invalid characters (%, non-numeric values except whitespace, dot, and minus)
        const hasInvalidChars = /[^0-9\s.-]/.test(viewBox);

      if (!hasInvalidChars) {
        // Mark as sanitized even if valid (so we don't check again)
        SVGSanitizer.sanitizedSVGs.add(svg);
        return false;
      }

      try {
        // Parse viewBox: "minX minY width height"
        const parts = viewBox.trim().split(/\s+/);

        if (parts.length !== 4) {
          debugWarn('[SVG Sanitizer] Invalid viewBox format:', viewBox);
          SVGSanitizer.sanitizedSVGs.add(svg);
          return false;
        }

        // Convert percentage values to numeric
        // Example: "0 0 100% 4" -> "0 0 100 4"
        const sanitized = parts.map(function (part) {
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
          SVGSanitizer.sanitizedSVGs.add(svg);
          return false;
        }

        // Mark as sanitized BEFORE setAttribute to prevent infinite loop
        SVGSanitizer.sanitizedSVGs.add(svg);

        svg.setAttribute('viewBox', newViewBox);

        debugLog('[SVG Sanitizer] Fixed viewBox: "' + viewBox + '" -> "' + newViewBox + '"');
        return true;
      } catch (err) {
        debugError('[SVG Sanitizer] Error sanitizing viewBox:', err);
        SVGSanitizer.sanitizedSVGs.add(svg); // Mark as processed to avoid retrying
        return false;
      }
    },

    /**
     * Process queued SVGs in batches
     */
    processBatch() {
      const startTime = performance.now();
      const maxBatchTime = 16; // Max 16ms per batch to maintain 60fps

      while (SVGSanitizer.processingQueue.length > 0 && (performance.now() - startTime) < maxBatchTime) {
        const svg = SVGSanitizer.processingQueue.shift();
        SVGSanitizer.sanitizeSVGViewBox(svg);
      }

      // If more items remain, schedule next batch
      if (SVGSanitizer.processingQueue.length > 0) {
        SVGSanitizer.scheduleProcessing();
      } else {
        SVGSanitizer.processingScheduled = false;
      }
    },

    /**
     * Schedule batch processing using requestIdleCallback (fallback to requestAnimationFrame)
     */
    scheduleProcessing() {
      if (SVGSanitizer.processingScheduled) {
        return;
      }

      SVGSanitizer.processingScheduled = true;

      if (window.requestIdleCallback) {
        window.requestIdleCallback(function() {
          SVGSanitizer.processBatch();
        }, { timeout: 100 });
      } else {
        window.requestAnimationFrame(function() {
          SVGSanitizer.processBatch();
        });
      }
    },

    /**
     * Add SVGs to processing queue
     * @param {NodeList|Array} svgs - SVG elements to queue
     */
    queueSVGs(svgs) {
      for (var i = 0; i < svgs.length; i++) {
        if (!SVGSanitizer.sanitizedSVGs.has(svgs[i])) {
          SVGSanitizer.processingQueue.push(svgs[i]);
        }
      }
      SVGSanitizer.scheduleProcessing();
    },

    /**
     * Sanitize all SVG elements in the document
     * @param {Document|Element} root - Root element to search within (defaults to document)
     * @returns {number} Number of SVGs queued for sanitization
     */
    sanitizeAllSVGs(root) {
      root = root || document;
      const svgs = root.querySelectorAll('svg');

      if (svgs.length > 0) {
        SVGSanitizer.queueSVGs(svgs);
        debugLog('[SVG Sanitizer] Queued ' + svgs.length + ' SVG element(s) for processing');
      }

      return svgs.length;
    },

    /**
     * Install a MutationObserver to watch for dynamically added SVGs
     * (e.g., from browser extensions or dynamic content)
     * @param {Element} root - Root element to observe (defaults to document.body)
     * @returns {MutationObserver} The observer instance (call .disconnect() to stop)
     */
    installSVGSanitizer(root) {
      root = root || document.body;

      // Initial sanitization
      SVGSanitizer.sanitizeAllSVGs(root);

      // Watch for new SVGs being added
      const observer = new MutationObserver(function (mutations) {
        const newSVGs = [];

        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the node itself is an SVG
              if (node.tagName === 'svg') {
                newSVGs.push(node);
              }

              // Check for SVGs within the added subtree
              if (node.querySelectorAll) {
                const svgs = node.querySelectorAll('svg');
                for (var i = 0; i < svgs.length; i++) {
                  newSVGs.push(svgs[i]);
                }
              }
            }
          });
        });

        // Batch process all new SVGs
        if (newSVGs.length > 0) {
          SVGSanitizer.queueSVGs(newSVGs);
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
    },

    /**
     * Run sanitization on DOMContentLoaded and install observer
     * Call this once during app initialization
     */
    initSVGSanitizer() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          SVGSanitizer.installSVGSanitizer();
        });
      } else {
        // DOM already loaded
        SVGSanitizer.installSVGSanitizer();
      }
    }
  };

  // Expose to global namespace
  window.SVGSanitizer = SVGSanitizer;

  // Auto-initialize by default
  SVGSanitizer.initSVGSanitizer();

})(window);
