/// <reference types="@playwright/test" />
import { defineConfig, devices } from "@playwright/test";

// Use Vite preview server for SPA testing
const PORT = 5173;
const HOST = "localhost";
const ORIGIN = `http://${HOST}:${PORT}`;

export default defineConfig({
  // Keep tests in ./tests for sanity; adjust if yours live elsewhere.
  testDir: ".",

  // One solid matcher; supports .js/.ts/.mjs/.cjs/.jsx/.tsx
  testMatch: /.*\.spec\.(?:[cm]?js|[cm]?ts|jsx|tsx)$/,

  // Perf-friendly defaults
  workers: 1,                    // deterministic perf numbers
  fullyParallel: false,
  timeout: 30_000,

  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },

  // Use Vite preview server (already running or start with npm run preview)
  webServer: {
    // build is executed in CI prior to this; here we force preview to our port
    command: `npm run preview -- --port ${PORT}`,
    url: `${ORIGIN}`, // Playwright waits until this responds
    reuseExistingServer: true,   // Always reuse for faster tests
    timeout: 60_000,             // give CI more time to boot server
    cwd: "..",                   // relative to repo root
  },

  use: {
    baseURL: ORIGIN,             // so page.goto('/index.html') works
    actionTimeout: 10_000,
    headless: true,              // Run headless chromium
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",  // helpful when a perf test flakes
    ...devices["Desktop Chrome"],
  },

  // Visual baselines
  snapshotDir: "./snapshots",
  snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{arg}{ext}",
});
