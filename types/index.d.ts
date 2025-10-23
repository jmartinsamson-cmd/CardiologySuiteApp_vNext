/**
 * Global Type Definitions for Cardiology Suite
 * 
 * This file contains custom TypeScript type definitions for:
 * - Window/DOM extensions
 * - ImportMeta extensions for Node.js compatibility
 * - Project-specific interfaces and types
 */

// =============================================================================
// Window & DOM Extensions
// =============================================================================

declare global {
  interface Window {
    /**
     * Debug mode flag - enables conditional logging
     */
    __DEBUG__?: boolean;

    /**
     * Legacy debug mode flag
     */
    isDebugMode?: boolean;

    /**
     * Debug trace function for instrumentation
     */
    trace?: (label: string, data: any) => void;

    /**
     * Citation modal functions
     */
    showCitationModal?: (citations: Citation[]) => void;
    closeCitationModal?: () => void;

    /**
     * Call graph for debugging/instrumentation
     */
    CallGraph?: CallGraph;
  }
}

// =============================================================================
// ImportMeta Extensions (Node.js compatibility)
// =============================================================================

declare global {
  interface ImportMeta {
    /**
     * Environment variables access (Node.js style)
     */
    env?: Record<string, string | undefined>;
  }
}

// =============================================================================
// Core Utility Types
// =============================================================================

/**
 * Configuration for environment detection
 */
export interface EnvironmentConfig {
  environment: 'development' | 'production' | 'test';
  debugMode: boolean;
  aiSearchBase: string;
  apiTimeout: number;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

/**
 * Network request options
 */
export interface NetworkOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Event listener cleanup options
 */
export interface ListenerOptions extends AddEventListenerOptions {
  id?: string;
}

// =============================================================================
// AI/RAG Types
// =============================================================================

/**
 * Search result from Azure Cognitive Search
 */
export interface SearchResult {
  title: string;
  url: string;
  score: number;
  content?: string;
  highlights?: string[];
}

/**
 * Citation for medical sources
 */
export interface Citation {
  source: string;
  evidence: string;
  url: string;
  score?: number;
}

/**
 * AI response with sources and confidence
 */
export interface AIResponse {
  answer: string;
  sources: SearchResult[];
  confidence: number;
  latency?: number;
  retrieval: RetrievalInfo;
}

/**
 * Information about document retrieval
 */
export interface RetrievalInfo {
  query: string;
  hitsCount: number;
  topScore: number;
  avgScore?: number;
}

/**
 * Options for RAG queries
 */
export interface RAGOptions {
  maxSources?: number;
  temperature?: number;
  useCache?: boolean;
}

/**
 * Medical question-answer request
 */
export interface MedicalQARequest {
  question: string;
  options?: RAGOptions;
}

/**
 * Note analysis request
 */
export interface NoteAnalysisRequest {
  noteText: string;
  parserFn?: (text: string) => ParserResult;
}

// =============================================================================
// Parser Types
// =============================================================================

/**
 * Clinical note parser result
 */
export interface ParserResult {
  diagnoses?: string[];
  medications?: string[];
  labs?: Lab[];
  vitals?: Record<string, string | number>;
  demographics?: Demographics;
  allergies?: string[];
  [key: string]: any;
}

/**
 * Lab result
 */
export interface Lab {
  name: string;
  value: string | number;
  unit?: string;
  normal?: string;
  flag?: 'H' | 'L' | 'N';
}

/**
 * Patient demographics
 */
export interface Demographics {
  age?: number;
  gender?: string;
  [key: string]: any;
}

// =============================================================================
// Azure Search Types
// =============================================================================

/**
 * Azure Search configuration
 */
export interface AzureSearchConfig {
  endpoint: string;
  apiKey: string;
  idx: string;
  ver: string;
}

/**
 * Azure Search query options
 */
export interface AzureSearchOptions {
  search?: string;
  filter?: string;
  top?: number;
  skip?: number;
  select?: string[];
  orderby?: string;
}

// =============================================================================
// Call Graph / Instrumentation Types
// =============================================================================

/**
 * Call graph for debugging
 */
export interface CallGraph {
  nodes: CallGraphNode[];
  addNode(node: CallGraphNode): void;
  findNode(name: string): CallGraphNode | undefined;
}

/**
 * Node in the call graph
 */
export interface CallGraphNode {
  name: string;
  input: any;
  startTime: number;
  endTime?: number;
  output?: any;
  error?: Error;
  children: CallGraphNode[];
  parent?: CallGraphNode;
}

/**
 * Instrumentation options
 */
export interface InstrumentationOptions {
  showSample?: boolean;
  maxKeys?: number;
  enabled?: boolean;
}

// =============================================================================
// Express Request/Response Types
// =============================================================================

import type { Request, Response } from 'express';

/**
 * Typed Express request with body type
 */
export interface TypedRequest<T = any> extends Request {
  body: T;
}

/**
 * Typed Express response with JSON type
 */
export interface TypedResponse<T = any> extends Response {
  json: (body: T) => this;
}

/**
 * Express error handler
 */
export type ErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: (err?: any) => void
) => void;

// =============================================================================
// Sanitizer Types
// =============================================================================

/**
 * Options for text sanitization
 */
export interface SanitizeOptions {
  allowHtml?: boolean;
  stripWhitespace?: boolean;
  maxLength?: number;
}

/**
 * SVG sanitization result
 */
export interface SanitizedSVG {
  svg: string;
  warnings: string[];
  safe: boolean;
}

// =============================================================================
// Scheduler Types
// =============================================================================

/**
 * Task for scheduler
 */
export interface ScheduledTask {
  id: string;
  fn: () => void | Promise<void>;
  priority: 'high' | 'medium' | 'low';
  deadline?: number;
  createdAt: number;
}

/**
 * Scheduler options
 */
export interface SchedulerOptions {
  maxConcurrent?: number;
  timeout?: number;
  onError?: (error: Error, task: ScheduledTask) => void;
}

// =============================================================================
// Performance Monitoring Types
// =============================================================================

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  fps: number;
  jank: number;
  longTasks: number;
  memoryUsage?: number;
}

/**
 * Jank monitor options
 */
export interface JankMonitorOptions {
  threshold?: number;
  sampleRate?: number;
  onJank?: (metrics: PerformanceMetrics) => void;
}

// Export empty object to make this a module
export {};
