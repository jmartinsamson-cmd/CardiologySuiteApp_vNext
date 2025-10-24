/* @ts-check */
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

const browserAndNodeGlobals = {
  ...globals.browser,   // window, document, etc.
  ...globals.node,      // module, require, process, etc.
  ...globals.es2021,
};

const jestGlobals = {
  ...globals.jest,
};

export default [
  // Base JS rules
  js.configs.recommended,

  // TS rules (type-aware) - only for TS files in main project
  {
    files: ["src/**/*.ts", "types/**/*.d.ts"],
    plugins: {
      "@typescript-eslint": tseslint.plugin
    },
    languageOptions: {
      globals: browserAndNodeGlobals,
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      ...tseslint.configs.recommendedTypeChecked.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      // Keep console allowed for diagnostics-heavy codebase
      "no-console": "off",
      // Allow redeclaring globals since files do this
      "no-redeclare": "off",
      // Make unused vars warnings instead of errors
      "no-unused-vars": "warn",
      "@typescript-eslint/no-unused-vars": "warn"
    }
  },

  // TS files not in main project (tests, functions-acc-scraper) - basic rules only
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["src/**/*.ts", "types/**/*.d.ts"],
    plugins: {
      "@typescript-eslint": tseslint.plugin
    },
    languageOptions: {
      globals: browserAndNodeGlobals,
      parser: tseslint.parser
    },
    rules: {
      // Basic TS rules without type checking
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off",
      "no-redeclare": "off",
      "no-unused-vars": "warn"
    }
  },

  // JS files - no TS rules, disable any TS rules that might be inherited
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: browserAndNodeGlobals
    },
    rules: {
      // Keep console allowed for diagnostics-heavy codebase
      "no-console": "off",
      // Allow redeclaring globals since files do this
      "no-redeclare": "off",
      // Make unused vars warnings
      "no-unused-vars": "warn",
      // Disable TS rules for JS files
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  },

  // Test files - add jest globals
  {
    files: ["**/*.spec.{js,ts}", "**/*.test.{js,ts}", "tests/**"],
    languageOptions: {
      globals: {
        ...browserAndNodeGlobals,
        ...jestGlobals
      }
    },
    rules: {
      "no-console": "off",
      "no-redeclare": "off",
      "no-unused-vars": "warn"
    }
  },

  // Node-centric folders (scripts, tests, tooling) — keep same globals (union) for simplicity
  {
    files: ["scripts/**", "tests/**", "**/*.config.*", ".github/**"],
    languageOptions: {
      globals: browserAndNodeGlobals
    },
    rules: {
      "no-console": "off",
      "no-redeclare": "off",
      "no-unused-vars": "warn"
    }
  },

  // Ignore heavy/non-code folders and problematic files
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "data/**",
      "src/assets/**",
      "src/**/pdfs/**",
      ".vscode/",
      "server.py",
      "**/*.json",  // Ignore all JSON files
      "functions-acc-scraper/**",  // Separate project, ignore for now
      "api/**",  // Azure Functions, different setup
      "services/ai-search/**",  // Node service, different setup
      "pages/**",  // Static pages, different setup
      "staticwebapp.config.json"  // JSON config
    ]
  }
];
