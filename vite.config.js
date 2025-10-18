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
  },

  // Preview config (for testing build)
  preview: {
    port: 5173,
    open: false,
  },
});
