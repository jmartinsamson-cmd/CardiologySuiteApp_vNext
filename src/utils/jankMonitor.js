/**
 * Jank Monitor (Temporary)
 *
 * Detects long tasks that block the main thread and cause UI freezes.
 * This is a temporary debugging tool to verify the SVG sanitizer fix.
 *
 * Remove this file after verification is complete.
 */

(function(window) {
  'use strict';

  const JANK_THRESHOLD = 50; // ms - tasks longer than this are considered jank
  const LOG_PREFIX = '[Jank Monitor]';

  const JankMonitor = {
    isRunning: false,
    lastFrameTime: performance.now(),
    longTaskCount: 0,
    maxJankDuration: 0,

    /**
     * Start monitoring for long tasks
     */
    start() {
      if (JankMonitor.isRunning) {
        console.warn(LOG_PREFIX, 'Already running');
        return;
      }

      JankMonitor.isRunning = true;
      JankMonitor.lastFrameTime = performance.now();
      JankMonitor.longTaskCount = 0;
      JankMonitor.maxJankDuration = 0;

      console.info(LOG_PREFIX, `Started (threshold: ${JANK_THRESHOLD}ms)`);

      // Use requestAnimationFrame to detect frame drops
      JankMonitor.checkFrame();

      // Also use PerformanceObserver if available
      if ('PerformanceObserver' in window) {
        try {
          JankMonitor.perfObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > JANK_THRESHOLD) {
                JankMonitor.longTaskCount++;
                JankMonitor.maxJankDuration = Math.max(JankMonitor.maxJankDuration, entry.duration);

                console.warn(
                  LOG_PREFIX,
                  `Long task detected: ${entry.duration.toFixed(2)}ms`,
                  `(${entry.name})`,
                  entry
                );
              }
            }
          });

          JankMonitor.perfObserver.observe({ entryTypes: ['longtask', 'measure'] });
          console.info(LOG_PREFIX, 'PerformanceObserver enabled');
        } catch (err) {
          console.warn(LOG_PREFIX, 'PerformanceObserver not supported:', err.message);
        }
      }
    },

    /**
     * Check frame timing via requestAnimationFrame
     */
    checkFrame() {
      if (!JankMonitor.isRunning) {
        return;
      }

      const currentTime = performance.now();
      const frameDuration = currentTime - JankMonitor.lastFrameTime;

      // Detect long frames (jank)
      if (frameDuration > JANK_THRESHOLD) {
        JankMonitor.longTaskCount++;
        JankMonitor.maxJankDuration = Math.max(JankMonitor.maxJankDuration, frameDuration);

        console.warn(
          LOG_PREFIX,
          `Long frame detected: ${frameDuration.toFixed(2)}ms`,
          `(${Math.round(1000 / frameDuration)} FPS)`
        );

        // Capture stack trace to identify the source
        console.trace(LOG_PREFIX, 'Stack trace for long frame');
      }

      JankMonitor.lastFrameTime = currentTime;
      requestAnimationFrame(JankMonitor.checkFrame);
    },

    /**
     * Stop monitoring and show summary
     */
    stop() {
      if (!JankMonitor.isRunning) {
        console.warn(LOG_PREFIX, 'Not running');
        return;
      }

      JankMonitor.isRunning = false;

      if (JankMonitor.perfObserver) {
        JankMonitor.perfObserver.disconnect();
        JankMonitor.perfObserver = null;
      }

      const stats = {
        longTaskCount: JankMonitor.longTaskCount,
        maxJankDuration: JankMonitor.maxJankDuration
      };

      // Write to window for automated tests
      window.__JANK_STATS__ = stats;

      console.info(
        LOG_PREFIX,
        'Stopped',
        `\nLong tasks detected: ${stats.longTaskCount}`,
        `\nMax jank duration: ${stats.maxJankDuration.toFixed(2)}ms`
      );

      if (stats.longTaskCount === 0) {
        console.info(LOG_PREFIX, '✅ No jank detected!');
      } else {
        console.warn(LOG_PREFIX, `⚠️  ${stats.longTaskCount} long task(s) detected`);
      }

      return stats;
    },

    /**
     * Get current statistics
     */
    getStats() {
      return {
        isRunning: JankMonitor.isRunning,
        longTaskCount: JankMonitor.longTaskCount,
        maxJankDuration: JankMonitor.maxJankDuration,
        threshold: JANK_THRESHOLD
      };
    }
  };

  // Expose to global namespace
  window.JankMonitor = JankMonitor;

  // Gate to localhost only (don't incur overhead in production)
  const isLocalhost = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '[::1]';

  if (!isLocalhost) {
    console.info(LOG_PREFIX, 'Disabled (not localhost)');
    return;
  }

  // Auto-start on load (will auto-stop after 30 seconds)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      JankMonitor.start();

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (JankMonitor.isRunning) {
          console.info(LOG_PREFIX, 'Auto-stopping after 30 seconds');
          JankMonitor.stop();
        }
      }, 30000);
    });
  } else {
    JankMonitor.start();

    // Auto-stop after 30 seconds
    setTimeout(() => {
      if (JankMonitor.isRunning) {
        console.info(LOG_PREFIX, 'Auto-stopping after 30 seconds');
        JankMonitor.stop();
      }
    }, 30000);
  }

  console.info(LOG_PREFIX, 'Loaded (will auto-start and stop after 30s)');

})(window);
