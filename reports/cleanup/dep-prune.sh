#!/usr/bin/env bash
set -euo pipefail
# Suggested commands based on depcheck analysis
npm uninstall --save-dev @axe-core/playwright
npm uninstall --save-dev @eslint/js
npm uninstall --save-dev @types/node
npm uninstall --save-dev htmlhint
npm uninstall --save-dev json-server
npm uninstall --save-dev rollup-plugin-visualizer
npm uninstall --save-dev undici
