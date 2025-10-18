/**
 * Debug Instrumentation for Note Generation Flow
 * Provides call graph tracing, data shape validation, and fault detection
 *
 * Gate all verbose logs behind localStorage.getItem('DEBUG') === 'true'
 */

/* eslint-disable no-undef */

// ============================================================================
// DEBUG MODE CHECK
// ============================================================================

/**
 * Check if debug mode is enabled
 * Set via: localStorage.setItem('DEBUG', 'true')
 */
window.isDebugMode = function () {
  return localStorage.getItem("DEBUG") === "true";
};

// ============================================================================
// A. CALL GRAPH & BREAKPOINT LOGGING
// ============================================================================

/**
 * Trace function calls with data shape inspection
 * Only logs when DEBUG=true in localStorage
 */
window.trace = function (label, data, options = {}) {
  if (!window.isDebugMode()) return data;

  const timestamp = new Date().toISOString();
  const { showSample = true, maxKeys = 10 } = options;

  console.group(`🔍 TRACE [${timestamp}] ${label}`);

  // Type information
  console.log("Type:", typeof data);
  console.log("Is Array:", Array.isArray(data));
  console.log("Is Null:", data === null);
  console.log("Is Undefined:", data === undefined);

  // Object inspection
  if (data && typeof data === "object") {
    const keys = Object.keys(data);
    console.log("Object Keys Count:", keys.length);
    console.log(
      "Object Keys:",
      keys.slice(0, maxKeys).join(", ") + (keys.length > maxKeys ? "..." : ""),
    );

    if (showSample && keys.length > 0) {
      console.log("Sample Values:");
      keys.slice(0, 5).forEach((key) => {
        const value = data[key];
        const valuePreview =
          typeof value === "string" ? value.substring(0, 100) : value;
        console.log(`  ${key}:`, valuePreview);
      });
    }
  }

  // String inspection
  if (typeof data === "string") {
    console.log("String Length:", data.length);
    console.log("String Preview:", data.substring(0, 200));
  }

  // Full data (collapsed)
  console.groupCollapsed("Full Data");
  console.log(data);
  console.groupEnd();

  console.groupEnd();

  return data; // Allow chaining
};

/**
 * Call graph node - tracks function execution
 */
class CallGraphNode {
  constructor(name, input, startTime) {
    this.name = name;
    this.input = input;
    this.startTime = startTime;
    this.endTime = null;
    this.output = null;
    this.error = null;
    this.children = [];
  }

  complete(output) {
    this.endTime = Date.now();
    this.output = output;
  }

  fail(error) {
    this.endTime = Date.now();
    this.error = error;
  }

  getDuration() {
    return this.endTime ? this.endTime - this.startTime : null;
  }
}

/**
 * Call graph tracker
 */
window.CallGraph = {
  root: null,
  stack: [],

  start(name, input) {
    const node = new CallGraphNode(name, input, Date.now());

    if (this.stack.length === 0) {
      this.root = node;
    } else {
      const parent = this.stack[this.stack.length - 1];
      parent.children.push(node);
    }

    this.stack.push(node);
    if (window.isDebugMode()) {
      console.log(`📞 CALL: ${name}`, { inputType: typeof input });
    }
    return node;
  },

  end(output) {
    if (this.stack.length === 0) return;

    const node = this.stack.pop();
    node.complete(output);
    if (window.isDebugMode()) {
      console.log(`✅ RETURN: ${node.name}`, {
        duration: node.getDuration() + "ms",
        outputType: typeof output,
      });
    }
    return output;
  },

  error(err) {
    if (this.stack.length === 0) return;

    const node = this.stack.pop();
    node.fail(err);
    if (window.isDebugMode()) {
      console.error(`❌ ERROR: ${node.name}`, {
        duration: node.getDuration() + "ms",
        error: err.message,
      });
    }
  },

  print() {
    if (!window.isDebugMode()) return;
    console.group("📊 CALL GRAPH");
    this._printNode(this.root, 0);
    console.groupEnd();
  },

  _printNode(node, depth) {
    if (!node) return;

    const indent = "  ".repeat(depth);
    const status = node.error ? "❌" : "✅";
    const duration = node.getDuration();

    console.log(`${indent}${status} ${node.name} (${duration}ms)`);

    if (node.error) {
      console.log(`${indent}  Error: ${node.error.message}`);
    }

    node.children.forEach((child) => this._printNode(child, depth + 1));
  },

  reset() {
    this.root = null;
    this.stack = [];
  },
};

// ============================================================================
// B. DOM SELECTOR VERIFICATION
// ============================================================================

/**
 * Verify DOM elements exist and are accessible
 * Only logs in debug mode
 */
window.verifySelectors = function () {
  if (!window.isDebugMode()) return true;

  const selectors = {
    // Input elements
    "vs-paste": "textarea#vs-paste",
    "vs-parse": "button#vs-parse",
    "vs-clear": "button#vs-clear",

    // Output elements
    "rendered-output": "textarea#rendered-output",
    "template-renderer-panel": "section#template-renderer-panel",
    "renderer-status": "div#renderer-status",

    // Control elements
    "template-select": "select#template-select",
    "smartphrase-toggle": "input#smartphrase-toggle",
    "copy-output-btn": "button#copy-output-btn",
    "download-output-btn": "button#download-output-btn",
    "clear-output-btn": "button#clear-output-btn",
  };

  console.group("🔎 DOM Selector Verification");

  let allFound = true;

  Object.entries(selectors).forEach(([id, selector]) => {
    const element = document.getElementById(id);
    const found = !!element;

    if (found) {
      console.log(`✅ ${id}: FOUND`, element.tagName);
    } else {
      console.error(`❌ ${id}: NOT FOUND (expected: ${selector})`);
      allFound = false;
    }
  });

  console.log(
    "\n" + (allFound ? "✅ All selectors valid" : "❌ Some selectors missing"),
  );
  console.groupEnd();

  return allFound;
};

// ============================================================================
// C. FAULT-PROOF ERROR INSTRUMENTATION
// ============================================================================

/**
 * Global error handlers
 * Always active for production safety - verbose logging gated by DEBUG mode
 */
window.setupErrorHandlers = function () {
  // Synchronous errors
  window.onerror = function (message, source, lineno, colno, error) {
    // Always log errors (production safety)
    console.error("💥 GLOBAL ERROR:", {
      message,
      source,
      line: lineno,
      column: colno,
      error: error?.stack,
    });

    // Verbose details only in debug mode
    if (window.isDebugMode()) {
      console.group("🔍 ERROR DETAILS");
      console.log("Message:", message);
      console.log("Source:", source);
      console.log("Line:", lineno, "Column:", colno);
      console.log("Stack:", error?.stack);
      console.groupEnd();
    }

    // Show user-friendly error
    if (window.templateRenderer) {
      window.templateRenderer.showError(
        "An unexpected error occurred. Check console for details.",
      );
    }

    return false; // Allow default handling
  };

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", function (event) {
    // Always log rejections (production safety)
    console.error("💥 UNHANDLED PROMISE REJECTION:", {
      reason: event.reason,
      promise: event.promise,
    });

    // Verbose details only in debug mode
    if (window.isDebugMode()) {
      console.group("🔍 REJECTION DETAILS");
      console.log("Reason:", event.reason);
      console.log("Promise:", event.promise);
      if (event.reason?.stack) {
        console.log("Stack:", event.reason.stack);
      }
      console.groupEnd();
    }

    // Show user-friendly error
    if (window.templateRenderer) {
      window.templateRenderer.showError(
        "An async operation failed. Check console for details.",
      );
    }
  });

  if (window.isDebugMode()) {
    console.log("✅ Global error handlers installed (DEBUG mode enabled)");
  }
};

/**
 * Safe wrapper for parser stages
 * Verbose logs only in debug mode
 */
window.safeParse = function (stageName, fn, input) {
  try {
    if (window.isDebugMode()) {
      console.log(`🔧 Starting stage: ${stageName}`);
    }
    const result = fn(input);
    if (window.isDebugMode()) {
      console.log(`✅ Completed stage: ${stageName}`);
    }
    return result;
  } catch (error) {
    // Always log errors (production safety)
    console.error(`❌ Failed stage: ${stageName}`, {
      error: error.message,
      stack: error.stack,
      inputSample: typeof input === "string" ? input.substring(0, 100) : input,
    });
    throw new Error(`Parser stage "${stageName}" failed: ${error.message}`);
  }
};

// ============================================================================
// D. SCHEMA GUARDS
// ============================================================================

/**
 * Validate data schema at parser stage boundaries
 * Verbose logs only in debug mode, errors always logged
 */
window.validateSchema = function (
  stageName,
  data,
  requiredKeys = [],
  options = {},
) {
  const { allowNull = false, allowEmpty = false } = options;

  // Null check
  if (data === null) {
    if (!allowNull) {
      throw new Error(`[${stageName}] Output is null (not allowed)`);
    }
    return true;
  }

  // Undefined check
  if (data === undefined) {
    throw new Error(`[${stageName}] Output is undefined`);
  }

  // Type check
  if (typeof data !== "object") {
    throw new Error(
      `[${stageName}] Output is not an object (got: ${typeof data})`,
    );
  }

  // Array check (usually not expected for parser output)
  if (Array.isArray(data) && window.isDebugMode()) {
    console.warn(`[${stageName}] Output is an array (might be unexpected)`);
  }

  // Empty check
  const keys = Object.keys(data);
  if (keys.length === 0 && !allowEmpty) {
    throw new Error(`[${stageName}] Output is empty object`);
  }

  // Required keys check
  const missingKeys = requiredKeys.filter((key) => !(key in data));
  if (missingKeys.length > 0) {
    // Always log validation failures
    console.error(`[${stageName}] Schema validation failed:`, {
      missingKeys,
      actualKeys: keys,
      dataSample: JSON.stringify(data).substring(0, 200),
    });
    throw new Error(
      `[${stageName}] Missing required keys: ${missingKeys.join(", ")}`,
    );
  }

  if (window.isDebugMode()) {
    console.log(`✅ Schema valid for stage: ${stageName}`, {
      keys: keys.length,
    });
  }
  return true;
};

/**
 * Schema definitions for each parser stage
 */
window.ParserSchemas = {
  PARSED_NOTE: {
    required: ["sections", "fullText"],
    optional: ["vitals", "labs", "medications"],
  },

  NORMALIZED_SECTIONS: {
    required: [],
    optional: ["HPI", "ASSESSMENT", "PLAN", "PMH", "VITALS", "LABS"],
  },

  RENDERED_OUTPUT: {
    required: [],
    optional: [],
  },
};

// ============================================================================
// E. DATA SHAPE COMPARISON
// ============================================================================

/**
 * Compare expected vs actual data shapes
 * Only logs in debug mode
 */
window.compareShapes = function (expected, actual, label = "Data") {
  if (!window.isDebugMode()) return;

  console.group(`📊 Shape Comparison: ${label}`);

  console.log("Expected Type:", typeof expected);
  console.log("Actual Type:", typeof actual);

  if (typeof expected === "object" && typeof actual === "object") {
    const expectedKeys = Object.keys(expected || {});
    const actualKeys = Object.keys(actual || {});

    const missingKeys = expectedKeys.filter((k) => !actualKeys.includes(k));
    const extraKeys = actualKeys.filter((k) => !expectedKeys.includes(k));
    const commonKeys = expectedKeys.filter((k) => actualKeys.includes(k));

    console.log("Expected Keys:", expectedKeys);
    console.log("Actual Keys:", actualKeys);
    console.log("Missing Keys:", missingKeys.length ? missingKeys : "None");
    console.log("Extra Keys:", extraKeys.length ? extraKeys : "None");
    console.log("Common Keys:", commonKeys);

    // Compare values for common keys
    commonKeys.forEach((key) => {
      const expectedType = typeof expected[key];
      const actualType = typeof actual[key];

      if (expectedType !== actualType) {
        console.warn(`Type mismatch for key "${key}":`, {
          expected: expectedType,
          actual: actualType,
        });
      }
    });
  }

  console.groupEnd();
};

// ============================================================================
// F. ASYNC TIMING & DOM READINESS
// ============================================================================

/**
 * Wait for DOM to be fully ready
 */
window.domReady = function () {
  return new Promise((resolve) => {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      // DOM is already ready
      resolve();
    } else {
      // Wait for DOMContentLoaded
      document.addEventListener("DOMContentLoaded", () => resolve());
    }
  });
};

/**
 * Wait for specific element to exist in DOM
 */
window.waitForElement = function (selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Check if element already exists
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    // Poll for element
    const interval = setInterval(() => {
      const element = document.querySelector(selector);

      if (element) {
        clearInterval(interval);
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error(`Timeout waiting for element: ${selector}`));
      }
    }, 100);
  });
};

/**
 * Wait for all critical elements to be ready
 * Verbose logs only in debug mode
 */
window.waitForCriticalElements = async function () {
  const criticalSelectors = [
    "#vs-paste",
    "#vs-parse",
    "#rendered-output",
    "#template-renderer-panel",
  ];

  if (window.isDebugMode()) {
    console.log("⏳ Waiting for critical elements...");
  }

  try {
    await Promise.all(
      criticalSelectors.map((selector) => waitForElement(selector, 5000)),
    );
    if (window.isDebugMode()) {
      console.log("✅ All critical elements ready");
    }
    return true;
  } catch (error) {
    // Always log failures
    console.error("❌ Failed to find critical elements:", error.message);
    return false;
  }
};

/**
 * Ensure event handlers are attached after route/DOM is ready
 * Verbose logs only in debug mode
 */
window.ensureHandlersReady = async function (attachFunction) {
  await domReady();
  await waitForCriticalElements();

  if (typeof attachFunction === "function") {
    if (window.isDebugMode()) {
      console.log("🔗 Attaching event handlers...");
    }
    attachFunction();
    if (window.isDebugMode()) {
      console.log("✅ Event handlers attached");
    }
  }
};

// ============================================================================
// G. INITIALIZATION
// ============================================================================

/**
 * Initialize debug instrumentation
 * Error handlers always active, verbose logs gated by DEBUG mode
 */
window.initDebugInstrumentation = function () {
  if (window.isDebugMode()) {
    console.log(
      "🔧 Initializing debug instrumentation (DEBUG mode enabled)...",
    );
    console.log('💡 To disable: localStorage.removeItem("DEBUG")');
  }

  // Setup error handlers (always active)
  setupErrorHandlers();

  // Verify DOM after slight delay (only in debug mode)
  if (window.isDebugMode()) {
    setTimeout(() => {
      verifySelectors();
    }, 100);
  }

  // Add utility to window for easy access
  window.debug = {
    trace: window.trace,
    callGraph: window.CallGraph,
    verify: window.verifySelectors,
    validate: window.validateSchema,
    compare: window.compareShapes,
    safeParse: window.safeParse,
    domReady: window.domReady,
    waitForElement: window.waitForElement,
    waitForCriticalElements: window.waitForCriticalElements,
    ensureHandlersReady: window.ensureHandlersReady,
    enable: () => {
      localStorage.setItem("DEBUG", "true");
      console.log("✅ Debug mode enabled. Reload page to see verbose logs.");
    },
    disable: () => {
      localStorage.removeItem("DEBUG");
      console.log("✅ Debug mode disabled. Reload page to apply.");
    },
    status: () => {
      const enabled = window.isDebugMode();
      console.log(`Debug mode: ${enabled ? "✅ ENABLED" : "❌ DISABLED"}`);
      if (!enabled) {
        console.log("💡 Enable with: window.debug.enable()");
      }
    },
  };

  if (window.isDebugMode()) {
    console.log("✅ Debug instrumentation ready");
    console.log("💡 Use window.debug.* for debugging utilities");
    console.log("💡 Disable with: window.debug.disable()");
  }
};

// Auto-initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDebugInstrumentation);
} else {
  initDebugInstrumentation();
}
