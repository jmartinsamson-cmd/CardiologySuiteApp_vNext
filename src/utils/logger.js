/**
 * Enhanced Logger Utility with PHI Redaction and Structured Logging
 *
 * Features:
 * - Configurable log levels (ERROR, WARN, INFO, DEBUG)
 * - PHI/PII redaction using regex patterns
 * - Request ID tracking for correlation
 * - Structured JSON output for production
 * - Performance timing
 */
// Log levels
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
function safeEnv(key, fallback = 'info') {
    // why: browser has no `process`; support Vite/webpack + global override
    try {
        const g = globalThis;
        const fromGlobal = g.__APP_LOG_LEVEL || g.LOG_LEVEL;
        const fromImportMeta = typeof import.meta !== 'undefined' && import.meta?.env?.VITE_LOG_LEVEL;
        const fromProcess = typeof process !== 'undefined' && process?.env?.[key];
        return (fromGlobal || fromImportMeta || fromProcess || fallback);
    }
    catch {
        return fallback;
    }
}
/**
 * Normalize log level string to enum
 */
function normalizeLevel(level) {
    switch (level.toUpperCase()) {
        case 'ERROR': return LogLevel.ERROR;
        case 'WARN': return LogLevel.WARN;
        case 'INFO': return LogLevel.INFO;
        case 'DEBUG': return LogLevel.DEBUG;
        default: return LogLevel.INFO;
    }
}
// PHI/PII patterns to redact
const PHI_PATTERNS = [
    // Social Security Numbers
    /\b\d{3}-\d{2}-\d{4}\b/g,
    /\b\d{9}\b/g,
    // Phone numbers
    /\b\d{3}-\d{3}-\d{4}\b/g,
    /\b\(\d{3}\)\s*\d{3}-\d{4}\b/g,
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // Medical record numbers (common patterns)
    /\bMRN\s*\d{6,10}\b/gi,
    /\bMR\s*\d{6,10}\b/gi,
    // Dates of birth
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    /\b\d{4}-\d{2}-\d{2}\b/g,
    // Names (basic pattern - can be enhanced)
    /\b(?:Dr\.?|Mr\.?|Mrs\.?|Ms\.?)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g
];
// Current request context
let currentRequestId = null;
/**
 * Set the current request ID for correlation
 */
export function setRequestId(requestId) {
    currentRequestId = requestId;
}
/**
 * Clear the current request ID
 */
export function clearRequestId() {
    currentRequestId = null;
}
/**
 * Get current log level from environment
 */
function getLogLevel() {
    return normalizeLevel(safeEnv('LOG_LEVEL', 'info'));
}
/**
 * Redact PHI/PII from messages and metadata
 */
function redactPHI(text) {
    if (!text)
        return text;
    let redacted = text;
    for (const pattern of PHI_PATTERNS) {
        redacted = redacted.replace(pattern, '[REDACTED]');
    }
    return redacted;
}
/**
 * Redact PHI from objects recursively
 */
function redactObject(obj) {
    if (typeof obj === 'string') {
        return redactPHI(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(redactObject);
    }
    if (obj && typeof obj === 'object') {
        const redacted = {};
        for (const [key, value] of Object.entries(obj)) {
            // Redact known PHI fields
            if (['ssn', 'socialSecurity', 'phone', 'email', 'mrn', 'medicalRecord', 'dob', 'dateOfBirth', 'name', 'patientName'].includes(key.toLowerCase())) {
                redacted[key] = '[REDACTED]';
            }
            else {
                redacted[key] = redactObject(value);
            }
        }
        return redacted;
    }
    return obj;
}
/**
 * Format log entry
 */
function formatLogEntry(level, message, meta, error) {
    const timestamp = new Date().toISOString();
    const entry = {
        timestamp,
        level,
        message: redactPHI(message),
        requestId: currentRequestId
    };
    if (meta) {
        entry.meta = redactObject(meta);
    }
    if (error) {
        entry.error = {
            name: error.name,
            message: redactPHI(error.message),
            stack: error.stack
        };
    }
    return entry;
}
/**
 * Write log entry
 */
function writeLog(level, levelName, message, meta, error) {
    const currentLevel = getLogLevel();
    if (level > currentLevel) {
        return; // Skip if below current log level
    }
    const entry = formatLogEntry(levelName, message, meta, error);
    // In development, use console with colors
    if (safeEnv('NODE_ENV', 'development') !== 'production') {
        const color = {
            ERROR: '\x1b[31m', // Red
            WARN: '\x1b[33m', // Yellow
            INFO: '\x1b[36m', // Cyan
            DEBUG: '\x1b[35m' // Magenta
        }[levelName] || '\x1b[0m';
        const reset = '\x1b[0m';
        const prefix = `${color}[${levelName}]${reset}`;
        console.log(prefix, entry.message);
        if (entry.meta)
            console.log('Meta:', entry.meta);
        if (entry.error)
            console.error('Error:', entry.error);
    }
    else {
        // In production, output structured JSON
        console.log(JSON.stringify(entry));
    }
}
/**
 * Logger class with methods for different levels
 */
class Logger {
    error(message, error, meta) {
        writeLog(LogLevel.ERROR, 'ERROR', message, meta, error);
    }
    warn(message, meta) {
        writeLog(LogLevel.WARN, 'WARN', message, meta);
    }
    info(message, meta) {
        writeLog(LogLevel.INFO, 'INFO', message, meta);
    }
    debug(message, meta) {
        writeLog(LogLevel.DEBUG, 'DEBUG', message, meta);
    }
    /**
     * Log with timing
     */
    time(label) {
        const start = Date.now();
        return () => {
            const duration = Date.now() - start;
            this.debug(`${label} completed`, { duration: `${duration}ms` });
        };
    }
    /**
     * Create child logger with additional context
     */
    child(context) {
        const childLogger = new Logger();
        // In a more advanced implementation, we'd merge context
        return childLogger;
    }
}
// Export singleton instance
export const logger = new Logger();
// Legacy compatibility exports (deprecated - use logger instead)
export function debugLog(...args) {
    logger.debug(args.join(' '));
}
export function debugWarn(...args) {
    logger.warn(args.join(' '));
}
export function debugError(...args) {
    logger.error(args.join(' '));
}
export function debugInfo(...args) {
    logger.info(args.join(' '));
}
export function debugTable(data, columns) {
    if (getLogLevel() >= LogLevel.DEBUG) {
        console.table(data, columns);
    }
}
export function debugTimeStart(label) {
    if (getLogLevel() >= LogLevel.DEBUG) {
        console.time(label);
    }
}
export function debugTimeEnd(label) {
    if (getLogLevel() >= LogLevel.DEBUG) {
        console.timeEnd(label);
    }
}
export function debugGroup(label, fn) {
    if (getLogLevel() >= LogLevel.DEBUG) {
        console.group(label);
        try {
            fn();
        }
        finally {
            console.groupEnd();
        }
    }
    else {
        fn();
    }
}
export function debugAssert(condition, ...args) {
    if (getLogLevel() >= LogLevel.DEBUG) {
        console.assert(condition, ...args);
    }
}
// Default export for backward compatibility
export default {
    log: debugLog,
    warn: debugWarn,
    error: debugError,
    info: debugInfo,
    table: debugTable,
    timeStart: debugTimeStart,
    timeEnd: debugTimeEnd,
    group: debugGroup,
    assert: debugAssert
};
//# sourceMappingURL=logger.js.map