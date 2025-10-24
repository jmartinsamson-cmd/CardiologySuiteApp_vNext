#!/usr/bin/env node

/**
 * Send Alert Webhook Script
 * Sends alert payload to Slack/Teams webhook on health check failure
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const https = require('node:https');

const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;
const GITHUB_SHA = process.env.GITHUB_SHA;
const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID;

if (!ALERT_WEBHOOK_URL) {
  console.error('❌ ALERT_WEBHOOK_URL environment variable is required');
  process.exit(1);
}

if (!GITHUB_SHA) {
  console.error('❌ GITHUB_SHA environment variable is required');
  process.exit(1);
}

/**
 * Send webhook payload
 */
function sendWebhook(payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(ALERT_WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CardiologySuite-UptimeMonitor/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Webhook sent successfully');
          resolve(undefined);
        } else {
          reject(new Error(`Webhook failed with status ${res.statusCode || 'unknown'}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * Main function
 */
async function sendAlert() {
  try {
    // Read metrics from file
    const metrics = JSON.parse(readFileSync('uptime-metrics.json', 'utf8'));

    // Create alert payload
    const alertPayload = {
      text: `🚨 **Cardiology Suite Health Check FAILED**`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Cardiology Suite Health Check FAILED'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Status:* DOWN`
            },
            {
              type: 'mrkdwn',
              text: `*Timestamp:* ${new Date(metrics.timestamp).toLocaleString()}`
            },
            {
              type: 'mrkdwn',
              text: `*Commit SHA:* \`${GITHUB_SHA.substring(0, 7)}\``
            },
            {
              type: 'mrkdwn',
              text: `*Run ID:* ${GITHUB_RUN_ID}`
            }
          ]
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Requests:* ${metrics.totalRequests}`
            },
            {
              type: 'mrkdwn',
              text: `*Successful:* ${metrics.successfulRequests}`
            },
            {
              type: 'mrkdwn',
              text: `*Error Rate:* ${metrics.errorRate}%`
            },
            {
              type: 'mrkdwn',
              text: `*P95 Latency:* ${metrics.p95Latency}ms`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Failed Requests:* ${metrics.failedRequests.length > 0 ? metrics.failedRequests.map(f => {
              const status = f.status || 'ERROR';
              const errorMsg = f.error ? ` (${f.error})` : '';
              return `\n• ${status}: ${f.latency}ms${errorMsg}`;
            }).join('') : 'None'}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext/actions/runs/${GITHUB_RUN_ID}|View GitHub Action> | <https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext/issues?q=is%3Aopen+label%3Auptime-health|View Issues>`
          }
        }
      ]
    };

    console.log('📤 Sending alert webhook...');
    await sendWebhook(alertPayload);
    console.log('✅ Alert sent successfully');

  } catch (error) {
    console.error('❌ Failed to send alert webhook:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the alert sender
try {
  await sendAlert();
} catch (error) {
  console.error('💥 Alert webhook script failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}