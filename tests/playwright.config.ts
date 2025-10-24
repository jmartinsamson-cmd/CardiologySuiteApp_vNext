/// <reference types="@playwright/test" />
import { defineConfig, devices } from "@playwright/test";

const HOST = process.env.PW_HOST ?? "localhost";
const PORT = Number(process.env.PW_PORT ?? 5173);
const DEFAULT_BASE_URL = `http://${HOST}:${PORT}`;
const BASE_URL = process.env.PW_BASE_URL ?? DEFAULT_BASE_URL;

export default defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.(?:[cm]?js|[cm]?ts|jsx|tsx)$/,
  workers: 1,
  fullyParallel: false,
  retries: 1,
  timeout: 30_000,
  snapshotPathTemplate: "{testDir}/__snapshots__/{projectName}/{testFilePath}/{arg}{ext}",

  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.015,
    },
  },

  webServer: {
    command: `npm run preview -- --port ${PORT} --host ${HOST}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
    cwd: "..",
  },

  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "UTC",
    colorScheme: "light",
    // @ts-expect-error Playwright exposes reducedMotion at runtime
    reducedMotion: "reduce",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        deviceScaleFactor: 1,
        viewport: { width: 1280, height: 900 },
        launchOptions: {
          args: [
            "--disable-gpu",
            "--font-render-hinting=medium",
            "--disable-lcd-text",
            "--disable-font-subpixel-positioning",
          ],
        },
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        deviceScaleFactor: 1,
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        deviceScaleFactor: 1,
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
});
