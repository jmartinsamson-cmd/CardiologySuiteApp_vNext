// eslint.config.cjs
const js = require("@eslint/js");
const globals = require("globals");
const playwright = require("eslint-plugin-playwright");

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // Ignore junk/build output
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**", ".next/**", ".parcel-cache/**"],
  },

  // App source: allow both browser + node (so process/module are known)
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node, // <— enables process, module, __dirname, etc.
      },
    },
    extends: [js.configs.recommended, "plugin:prettier/recommended"],
    rules: {
      // Don't fail builds for unused vars; warn, and allow _prefix to intentionally ignore
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

      // Prevent infinite loop bug: disallow while(regex.exec()) without global flag
      "no-restricted-syntax": [
        "error",
        {
          selector: "WhileStatement > AssignmentExpression[right.type='CallExpression'][right.callee.property.name='exec']",
          message: "Avoid while(regex.exec()) - use matchAll() with global flag or add zero-length guard to prevent infinite loops"
        }
      ],
    },
  },

  // Test files (Playwright/Jest-like globals)
  {
    files: ["tests/**/*.{js,ts}", "**/*.{test,spec}.{js,ts}"],
    plugins: { playwright },
    extends: ["plugin:playwright/recommended"],
    languageOptions: {
      globals: {
        ...globals.node,     // tests run in Node
        ...globals.browser,  // many E2E tests touch the DOM
      },
    },
    rules: {
      "no-undef": "off", // test runners define globals dynamically
    },
  },
];
