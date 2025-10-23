/**
 * Environment Configuration
 * 
 * Centralizes environment-specific settings to avoid hardcoding URLs and configuration values.
 * Supports development, staging, and production environments.
 * 
 * Usage:
 *   import { config } from './config/environment.js';
 *   const response = await fetch(`${config.aiSearchBase}/search`, ...);
 */

/**
 * Detect current environment based on hostname and dev mode
 * @returns {'development' | 'staging' | 'production'}
 */
function detectEnvironment() {
  // Check if running in Node.js (tests)
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }

  // Check if running in Vite dev mode
  if (import.meta.env?.DEV) {
    return 'development';
  }

  // Check hostname patterns
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return 'development';
  }
  
  if (hostname.includes('staging') || hostname.includes('test') || hostname.includes('dev')) {
    return 'staging';
  }
  
  return 'production';
}

const environment = detectEnvironment();

/**
 * Configuration object with environment-specific values
 */
export const config = {
  /**
   * Current environment: 'development', 'staging', or 'production'
   */
  environment,

  /**
   * Whether running in development mode
   */
  isDevelopment: environment === 'development',

  /**
   * Whether running in production mode
   */
  isProduction: environment === 'production',

  /**
   * AI Search service base URL
   * - Development: http://localhost:8081
   * - Staging: Can be overridden with env variable
   * - Production: Relative path (same origin)
   */
  aiSearchBase: environment === 'development'
    ? 'http://localhost:8081'
    : (import.meta.env?.VITE_AI_SEARCH_BASE || '/api/ai-search'),

  /**
   * Allowed CORS origins for AI Search service
   * Only used server-side in services/ai-search/server.js
   */
  corsOrigins: {
    development: [
      'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:5173',  // Vite default
      'http://localhost:5500',  // Five Server
      'http://localhost:4280',  // SWA CLI
    ],
    staging: [
      // Add staging origins here
    ],
    production: [
      // Add production origins here (populated from env vars server-side)
    ]
  },

  /**
   * Enable debug logging (console.log statements)
   */
  debugMode: environment === 'development' || import.meta.env?.VITE_DEBUG === 'true',

  /**
   * API timeout in milliseconds
   */
  apiTimeout: environment === 'production' ? 10000 : 30000,

  /**
   * Retry configuration for network requests
   */
  retry: {
    maxAttempts: environment === 'production' ? 3 : 1,
    delayMs: 1000,
    backoffMultiplier: 2
  }
};

/**
 * Log configuration on startup (development only)
 */
if (config.debugMode) {
  console.log('🔧 Environment Configuration:', {
    environment: config.environment,
    aiSearchBase: config.aiSearchBase,
    debugMode: config.debugMode,
    apiTimeout: config.apiTimeout
  });
}

export default config;
