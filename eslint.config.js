import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    ignores: ["node_modules/**", "dist/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        location: "readonly",
        navigator: "readonly",
        alert: "readonly",
        confirm: "readonly",
        HTMLElement: "readonly",
        CustomEvent: "readonly",
        URLSearchParams: "readonly",
        Blob: "readonly",
        URL: "readonly",
        performance: "readonly",
        PerformanceObserver: "readonly",
        module: "readonly",
        // Browser runtime APIs used in src
        requestAnimationFrame: "readonly",
        AbortController: "readonly",
        Worker: "readonly",
        MessageChannel: "readonly",
        SVGSVGElement: "readonly",
        MutationObserver: "readonly",
        Node: "readonly",
      },
    },
    rules: {
      // Allow unused args if intentionally ignored via leading underscore
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["scripts/**/*.js", "scripts/**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  // TypeScript in src (browser globals)
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        location: "readonly",
        navigator: "readonly",
        alert: "readonly",
        confirm: "readonly",
        HTMLElement: "readonly",
        CustomEvent: "readonly",
        URLSearchParams: "readonly",
        Blob: "readonly",
        URL: "readonly",
        performance: "readonly",
        PerformanceObserver: "readonly",
        module: "readonly",
        requestAnimationFrame: "readonly",
        AbortController: "readonly",
        Worker: "readonly",
        MessageChannel: "readonly",
        SVGSVGElement: "readonly",
        MutationObserver: "readonly",
        Node: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // TypeScript in scripts (Node globals)
  {
    files: ["scripts/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        process: "readonly",
        console: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
