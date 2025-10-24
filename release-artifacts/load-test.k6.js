import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10, // 10 virtual users
  duration: '30s', // Test duration
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'], // Error rate should be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:7071';

export default function () {
  // Health check
  let response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'health status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // API smoke test
  response = http.get(`${BASE_URL}/api/ping`);
  check(response, {
    'ping status is 200': (r) => r.status === 200,
  });

  // Session save test
  const payload = {
    sessionId: `test-${Date.now()}`,
    data: { test: true }
  };

  response = http.post(`${BASE_URL}/api/sessions/save`, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'session save status is 200': (r) => r.status === 200,
  });

  sleep(1); // Wait 1 second between iterations
}