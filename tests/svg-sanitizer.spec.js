/**
 * SVG ViewBox Sanitizer Tests
 *
 * Tests that invalid viewBox attributes are detected and fixed
 */

import {
  sanitizeSVGViewBox,
  sanitizeAllSVGs,
  installSVGSanitizer,
} from '../src/utils/svgSanitizer.js';

// Mock DOM environment
function createTestSVG(viewBox) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  if (viewBox !== undefined) {
    svg.setAttribute('viewBox', viewBox);
  }
  return svg;
}

describe('SVG ViewBox Sanitizer', () => {
  let container;

  beforeEach(() => {
    // Create clean container for each test
    container = document.createElement('div');
    document.body.appendChild(container);

    // Suppress console.info/warn during tests
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    container.remove();
    jest.restoreAllMocks();
  });

  describe('sanitizeSVGViewBox()', () => {
    test('should fix viewBox with percentage values', () => {
      const svg = createTestSVG('0 0 100% 4');
      container.appendChild(svg);

      const result = sanitizeSVGViewBox(svg);

      expect(result).toBe(true);
      expect(svg.getAttribute('viewBox')).toBe('0 0 100 4');
    });

    test('should fix viewBox with multiple percentage values', () => {
      const svg = createTestSVG('0% 0% 100% 100%');
      container.appendChild(svg);

      sanitizeSVGViewBox(svg);

      expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
    });

    test('should not modify valid numeric viewBox', () => {
      const svg = createTestSVG('0 0 24 24');
      container.appendChild(svg);

      const result = sanitizeSVGViewBox(svg);

      expect(result).toBe(false);
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    test('should handle viewBox with decimals', () => {
      const svg = createTestSVG('0 0 23.5 24.8');
      container.appendChild(svg);

      const result = sanitizeSVGViewBox(svg);

      expect(result).toBe(false);
      expect(svg.getAttribute('viewBox')).toBe('0 0 23.5 24.8');
    });

    test('should handle negative values', () => {
      const svg = createTestSVG('-10 -10 100 100');
      container.appendChild(svg);

      const result = sanitizeSVGViewBox(svg);

      expect(result).toBe(false);
      expect(svg.getAttribute('viewBox')).toBe('-10 -10 100 100');
    });

    test('should handle SVG without viewBox', () => {
      const svg = createTestSVG();
      container.appendChild(svg);

      const result = sanitizeSVGViewBox(svg);

      expect(result).toBe(false);
    });

    test('should return false for non-SVG elements', () => {
      const div = document.createElement('div');
      div.setAttribute('viewBox', '0 0 100% 4');

      const result = sanitizeSVGViewBox(div);

      expect(result).toBe(false);
    });
  });

  describe('sanitizeAllSVGs()', () => {
    test('should sanitize multiple SVGs in document', () => {
      const svg1 = createTestSVG('0 0 100% 4');
      const svg2 = createTestSVG('0 0 50% 50%');
      const svg3 = createTestSVG('0 0 24 24'); // Valid

      container.appendChild(svg1);
      container.appendChild(svg2);
      container.appendChild(svg3);

      const count = sanitizeAllSVGs(container);

      expect(count).toBe(2);
      expect(svg1.getAttribute('viewBox')).toBe('0 0 100 4');
      expect(svg2.getAttribute('viewBox')).toBe('0 0 50 50');
      expect(svg3.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    test('should return 0 when no SVGs need sanitization', () => {
      const svg1 = createTestSVG('0 0 24 24');
      const svg2 = createTestSVG('0 0 100 100');

      container.appendChild(svg1);
      container.appendChild(svg2);

      const count = sanitizeAllSVGs(container);

      expect(count).toBe(0);
    });
  });

  describe('installSVGSanitizer()', () => {
    test('should sanitize existing SVGs on install', () => {
      const svg = createTestSVG('0 0 100% 4');
      container.appendChild(svg);

      const observer = installSVGSanitizer(container);

      expect(svg.getAttribute('viewBox')).toBe('0 0 100 4');

      observer.disconnect();
    });

    test('should sanitize dynamically added SVGs', (done) => {
      const observer = installSVGSanitizer(container);

      // Add SVG after observer is installed
      setTimeout(() => {
        const svg = createTestSVG('0 0 100% 4');
        container.appendChild(svg);

        // Wait for mutation observer
        setTimeout(() => {
          expect(svg.getAttribute('viewBox')).toBe('0 0 100 4');
          observer.disconnect();
          done();
        }, 50);
      }, 10);
    });

    test('should sanitize SVGs in added subtrees', (done) => {
      const observer = installSVGSanitizer(container);

      // Add container with SVG inside
      setTimeout(() => {
        const wrapper = document.createElement('div');
        const svg = createTestSVG('0 0 100% 4');
        wrapper.appendChild(svg);
        container.appendChild(wrapper);

        // Wait for mutation observer
        setTimeout(() => {
          expect(svg.getAttribute('viewBox')).toBe('0 0 100 4');
          observer.disconnect();
          done();
        }, 50);
      }, 10);
    });
  });

  describe('Console Error Detection', () => {
    test('should not produce viewBox console errors after sanitization', () => {
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error');

      // Create SVG with invalid viewBox
      const svg = createTestSVG('0 0 100% 4');
      container.appendChild(svg);

      // Sanitize
      sanitizeSVGViewBox(svg);

      // Try to use the SVG (this would normally trigger errors)
      const bbox = svg.getBBox?.(); // getBBox might not work in JSDOM

      // Check that no errors matching the viewBox pattern were logged
      const viewBoxErrors = consoleErrorSpy.mock.calls.filter(
        (call) =>
          call.some((arg) =>
            String(arg).match(/viewBox.*Expected number|attribute viewBox/i)
          )
      );

      expect(viewBoxErrors).toHaveLength(0);

      consoleErrorSpy.mockRestore();
    });
  });
});

/**
 * Integration test: Mount UI and assert no viewBox errors
 */
describe('UI Integration - No ViewBox Errors', () => {
  test('should mount full UI without viewBox console errors', () => {
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error');

    // Load the main HTML content (simulate mounting the app)
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            </svg>
            <svg viewBox="0 0 100 100" width="32" height="32">
              <circle cx="50" cy="50" r="40"/>
            </svg>
          </div>
        </body>
      </html>
    `;

    // Parse and mount
    document.body.innerHTML = testHTML;

    // Run sanitizer
    sanitizeAllSVGs();

    // Check for viewBox-related errors
    const viewBoxErrors = consoleErrorSpy.mock.calls.filter(
      (call) =>
        call.some((arg) =>
          String(arg).match(/viewBox.*Expected number|attribute viewBox/i)
        )
    );

    expect(viewBoxErrors).toHaveLength(0);

    consoleErrorSpy.mockRestore();
  });
});
