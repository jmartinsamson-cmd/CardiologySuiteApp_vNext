/**
 * Date normalization utility
 * Converts various date formats to ISO YYYY-MM-DD
 */

/**
 * Parse and normalize a date string to ISO format (YYYY-MM-DD)
 * @param dateStr - Date string in various formats
 * @returns ISO date string or null if invalid
 */
export function normalizeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;

  try {
    // Try parsing as ISO date first
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return null;
    }

    // Return YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Check if a date is within the last N days
 * @param dateStr - ISO date string
 * @param days - Number of days
 * @returns true if date is recent
 */
export function isRecentDate(dateStr: string, days: number): boolean {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    return diffDays >= 0 && diffDays <= days;
  } catch {
    return false;
  }
}

/**
 * Get current year-month string (YYYY-MM)
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
