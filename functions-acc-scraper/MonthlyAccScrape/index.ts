import { app, InvocationContext, Timer } from '@azure/functions';
import { scrapeAndNormalize } from '../src/lib/orchestrator.js';
import { log } from '../src/lib/log.js';

/**
 * Monthly ACC.org Scraper
 * CRON: "0 0 12 1 * *" = 12:00 UTC on the 1st of each month
 * 
 * Time zone mapping:
 * - 12:00 UTC = 06:00 America/Chicago (CST, UTC-6) during winter
 * - 12:00 UTC = 07:00 America/Chicago (CDT, UTC-5) during DST (Mar-Nov)
 * 
 * To change to a different time, adjust the CRON schedule:
 * Format: {second} {minute} {hour} {day} {month} {day-of-week}
 * Examples:
 * - "0 0 6 1 * *"  = 06:00 UTC on 1st (00:00 CST / 01:00 CDT)
 * - "0 30 15 1 * *" = 15:30 UTC on 1st (09:30 CST / 10:30 CDT)
 */
export async function monthlyAccScrape(
  timer: Timer,
  context: InvocationContext
): Promise<void> {
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  log.info('ACC scraper started', {
    runId,
    scheduled: timer.scheduleStatus?.last,
    next: timer.scheduleStatus?.next,
    isPastDue: timer.isPastDue
  });

  try {
    const result = await scrapeAndNormalize();
    
    log.info('ACC scraper completed successfully', {
      runId,
      stats: result.stats,
      blobPath: result.blobPath
    });

    context.log(`✅ Scraped ${result.stats.normalized} items, saved to ${result.blobPath}`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    log.error('ACC scraper failed', {
      runId,
      error: errorMessage
    });

    context.error(`❌ Scraper failed: ${errorMessage}`);
    throw error; // Re-throw to mark Function as failed
  }
}

// Register the timer trigger function
app.timer('MonthlyAccScrape', {
  schedule: '0 0 12 1 * *',
  handler: monthlyAccScrape
});
