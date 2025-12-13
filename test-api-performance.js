#!/usr/bin/env node

/**
 * API Performance Testing Script
 * Tests all your critical endpoints and measures latency
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:8000';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function getPerformanceEmoji(ms) {
  if (ms < 100) return '⚡';
  if (ms < 300) return '✅';
  if (ms < 500) return '🟡';
  if (ms < 1000) return '🟠';
  if (ms < 2000) return '🔴';
  return '🐢';
}

function getPerformanceColor(ms) {
  if (ms < 100) return 'green';
  if (ms < 500) return 'yellow';
  return 'red';
}

async function testEndpoint(name, url, options = {}) {
  const fullUrl = `${API_BASE_URL}${url}`;

  try {
    const startTime = Date.now();
    const response = await fetch(fullUrl, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const endTime = Date.now();

    const latency = endTime - startTime;
    const emoji = getPerformanceEmoji(latency);
    const color = getPerformanceColor(latency);

    const status = response.ok ? colorize('✓', 'green') : colorize('✗', 'red');
    const latencyText = colorize(`${latency}ms`, color);

    console.log(
      `${status} ${emoji} ${name.padEnd(30)} ${latencyText} (${response.status})`,
    );

    return {
      name,
      url,
      latency,
      status: response.status,
      ok: response.ok,
    };
  } catch (error) {
    console.log(
      `${colorize('✗', 'red')} ❌ ${name.padEnd(30)} ${colorize('FAILED', 'red')} - ${error.message}`,
    );
    return {
      name,
      url,
      latency: -1,
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

async function runPerformanceTest() {
  console.log('\n' + colorize('═'.repeat(70), 'cyan'));
  console.log(colorize('  🚀 API PERFORMANCE TEST', 'cyan'));
  console.log(colorize('═'.repeat(70), 'cyan') + '\n');
  console.log(colorize(`Testing: ${API_BASE_URL}`, 'gray'));
  console.log(colorize(`Time: ${new Date().toISOString()}`, 'gray') + '\n');

  const results = [];

  // Test endpoints (add your token if needed)
  const TOKEN = process.env.AUTH_TOKEN || '';
  const authHeaders = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};

  console.log(colorize('📊 Testing Endpoints...', 'cyan') + '\n');

  // Public endpoints
  results.push(await testEndpoint('Health Check', '/ping'));
  results.push(await testEndpoint('Database Ping', '/ping/db'));

  // Auth endpoints (if you have test credentials)
  // results.push(await testEndpoint('Login', '/auth/login', {
  //   method: 'POST',
  //   body: { email: 'test@example.com', password: 'password' }
  // }));

  // Protected endpoints (requires token)
  if (TOKEN) {
    results.push(
      await testEndpoint('Profile View Me', '/profile/view/me', {
        headers: authHeaders,
      }),
    );
    results.push(
      await testEndpoint('List Rooms', '/rooms', { headers: authHeaders }),
    );
    results.push(
      await testEndpoint('Moments Feed', '/moments?limit=10', {
        headers: authHeaders,
      }),
    );
    results.push(
      await testEndpoint('Friends List', '/social/friends?limit=10', {
        headers: authHeaders,
      }),
    );
  }

  // Summary
  console.log('\n' + colorize('═'.repeat(70), 'cyan'));
  console.log(colorize('  📈 SUMMARY', 'cyan'));
  console.log(colorize('═'.repeat(70), 'cyan') + '\n');

  const successful = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const avgLatency =
    successful.length > 0
      ? Math.round(
          successful.reduce((sum, r) => sum + r.latency, 0) / successful.length,
        )
      : 0;

  console.log(`Total Tests:     ${results.length}`);
  console.log(`${colorize('Successful:', 'green')}      ${successful.length}`);
  console.log(`${colorize('Failed:', 'red')}          ${failed.length}`);
  console.log(
    `Average Latency: ${colorize(`${avgLatency}ms`, getPerformanceColor(avgLatency))}`,
  );

  // Performance breakdown
  const fast = successful.filter((r) => r.latency < 300).length;
  const medium = successful.filter(
    (r) => r.latency >= 300 && r.latency < 1000,
  ).length;
  const slow = successful.filter((r) => r.latency >= 1000).length;

  console.log('\nPerformance Breakdown:');
  console.log(`  ⚡ Fast (<300ms):     ${colorize(fast, 'green')}`);
  console.log(`  🟡 Medium (300-1s):   ${colorize(medium, 'yellow')}`);
  console.log(`  🐢 Slow (>1s):        ${colorize(slow, 'red')}`);

  // Slowest endpoints
  if (successful.length > 0) {
    console.log('\n' + colorize('🐢 Slowest Endpoints:', 'yellow'));
    successful
      .sort((a, b) => b.latency - a.latency)
      .slice(0, 3)
      .forEach((r, i) => {
        console.log(
          `  ${i + 1}. ${r.name} - ${colorize(`${r.latency}ms`, 'red')}`,
        );
      });
  }

  console.log('\n' + colorize('═'.repeat(70), 'cyan') + '\n');

  // Exit code
  process.exit(failed.length > 0 ? 1 : 0);
}

// Run the test
runPerformanceTest().catch(console.error);
