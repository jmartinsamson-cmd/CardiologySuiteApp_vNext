import { defineConfig } from "vite";

export default defineConfig({
  root: ".",

  build: {
    outDir: "dist",
    emptyOutDir: true,

    // Generate sourcemaps for debugging
    sourcemap: true,

    // SPA mode - single index.html entry
    // Lazy routes (#/meds, #/guidelines) use dynamic imports for lazy loading at runtime.
    // Vite performs code-splitting during build time for production, generating separate chunks for these routes.

    // Size warning threshold (500KB)
    chunkSizeWarningLimit: 500,
  },

  // Server config for development
  server: {
    port: 5173,
    open: false,
    // Add helpful security and caching headers in dev to silence common warnings
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      // Vite does not set x-powered-by; Five Server might. This header prevents sniffing issues.
      // Note: Some headers (like removing x-powered-by) are server-specific and cannot be unset here.
    },
  },

  // Preview config (for testing build)
  preview: {
    port: 5173,
    open: false,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  },
});
