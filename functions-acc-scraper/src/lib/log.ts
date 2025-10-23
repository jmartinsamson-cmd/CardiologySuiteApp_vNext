/**
 * Structured logging utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
}

function logEntry(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data })
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'debug':
      console.debug(output);
      break;
    default:
      console.log(output);
  }
}

export const log = {
  debug: (message: string, data?: Record<string, unknown>) => logEntry('debug', message, data),
  info: (message: string, data?: Record<string, unknown>) => logEntry('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => logEntry('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => logEntry('error', message, data)
};
