function safeRequire(moduleId) {
  try {
    // eslint-disable-next-line global-require
    return require(moduleId).default;
  } catch (error) {
    return () => ({});
  }
}

module.exports = {
  ignoreMatches: [
    "@playwright/test",
    "@size-limit/*",
    "tailwindcss",
    "vite",
    "ts-node",
    "typescript",
    "eslint",
    "eslint-plugin-*",
    "@typescript-eslint/*",
    "@modelcontextprotocol/*",
  ],
  ignoreDirs: ["dist", "reports", "docs", "tests/fixtures"],
  specials: [
    safeRequire("depcheck/dist/special/eslint"),
    safeRequire("depcheck/dist/special/babel"),
    safeRequire("depcheck/dist/special/bin"),
    safeRequire("depcheck/dist/special/webpack"),
  ],
};
