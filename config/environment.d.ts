/**
 * Type declarations for config/environment.js
 */

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

export interface CorsOrigins {
  development: string[];
  staging: string[];
  production: string[];
}

export interface EnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  isDevelopment: boolean;
  isProduction: boolean;
  aiSearchBase: string;
  corsOrigins: CorsOrigins;
  debugMode: boolean;
  apiTimeout: number;
  retry: RetryConfig;
}

export const config: EnvironmentConfig;
export default config;
