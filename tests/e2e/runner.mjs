#!/usr/bin/env node

/**
 * tests/e2e/runner.mjs
 * 
 * Zero-dependency native Node.js ESM End-to-End test runner for the Sezzle FinTech Calculator.
 * Validates health probes, arbitrary precision decimal operations, extreme scales,
 * domain error catalog mappings, history ring buffer lifecycle, and Nginx reverse proxy routes.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
};

let totalPassed = 0;
let totalFailed = 0;
const failures = [];

function assert(condition, message, details = '') {
  if (!condition) {
    throw new Error(`${message}${details ? ` -> ${details}` : ''}`);
  }
}

async function test(suiteName, testName, fn) {
  process.stdout.write(`  ${colors.dim}•${colors.reset} ${testName} ... `);
  try {
    await fn();
    totalPassed++;
    console.log(`${colors.green}✓ PASS${colors.reset}`);
  } catch (err) {
    totalFailed++;
    console.log(`${colors.red}✗ FAIL${colors.reset}`);
    failures.push({ suite: suiteName, test: testName, error: err.message });
  }
}

async function waitForService(url, serviceName, timeoutMs = 30000) {
  const start = Date.now();
  process.stdout.write(`Waiting for ${serviceName} at ${url} to be ready... `);
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`${colors.green}Ready!${colors.reset}`);
        return true;
      }
    } catch {
      // Continue polling
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.log(`${colors.red}Timed out after ${timeoutMs}ms!${colors.reset}`);
  throw new Error(`Service ${serviceName} at ${url} did not become ready in time.`);
}

async function run() {
  console.log(`\n${colors.bold}${colors.magenta}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  Sezzle FinTech Calculator — End-to-End Test Suite  ${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}====================================================${colors.reset}\n`);
  console.log(`Backend Target:  ${colors.bold}${BACKEND_URL}${colors.reset}`);
  console.log(`Frontend Target: ${colors.bold}${FRONTEND_URL}${colors.reset}\n`);

  // Wait for services
  await waitForService(`${BACKEND_URL}/api/v1/health`, 'Backend API');
  await waitForService(`${FRONTEND_URL}/`, 'Frontend Web Server');

  console.log(`\n${colors.bold}Executing Test Suites:${colors.reset}\n`);

  // ==========================================
  // Suite 1: Healthcheck & Liveness Probe
  // ==========================================
  console.log(`${colors.bold}${colors.cyan}[Suite 1: Health & Liveness Probe]${colors.reset}`);
  
  await test('Suite 1', 'GET /api/v1/health returns 200 OK with healthy status', async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/health`);
    assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    assert(data.status === 'healthy', `Expected status "healthy", got "${data.status}"`);
    assert(data.service === 'calculator-api', `Unexpected service name: ${data.service}`);
  });

  // ==========================================
  // Suite 2: Financial Precision Domain Operations
  // ==========================================
  console.log(`\n${colors.bold}${colors.cyan}[Suite 2: Financial Precision Domain Engine]${colors.reset}`);

  await test('Suite 2', 'Addition: 0.1 + 0.2 = exactly 0.3 without IEEE 754 drift', async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'add', a: '0.1', b: '0.2' }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.result === '0.3', `Expected "0.3", got "${data.result}"`);
    assert(data.expression === '0.1 + 0.2 = 0.3', `Unexpected expression: ${data.expression}`);
  });

  await test('Suite 2', 'Subtraction: high-precision scale cancellation to integer 1', async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'subtract',
        a: '1.000000000000000000001',
        b: '0.000000000000000000001',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.result === '1', `Expected "1", got "${data.result}"`);
  });

  await test('Suite 2', 'Multiplication: micro-decimal times large scale integer equals 1', async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'multiply', a: '0.00000005', b: '20000000' }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.result === '1', `Expected "1", got "${data.result}"`);
  });

  await test('Suite 2', 'Division: 10 / 2 = 5 and 1 / 8 = 0.125', async () => {
    const res1 = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'divide', a: '10', b: '2' }),
    });
    const data1 = await res1.json();
    assert(data1.result === '5', `Expected "5", got "${data1.result}"`);

    const res2 = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'divide', a: '1', b: '8' }),
    });
    const data2 = await res2.json();
    assert(data2.result === '0.125', `Expected "0.125", got "${data2.result}"`);
  });

  await test('Suite 2', 'Power: positive and negative integer exponents (2^3 = 8, 2^-3 = 0.125)', async () => {
    const res1 = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'power', a: '2', b: '3' }),
    });
    const data1 = await res1.json();
    assert(data1.result === '8', `Expected "8", got "${data1.result}"`);

    const res2 = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'power', a: '2', b: '-3' }),
    });
    const data2 = await res2.json();
    assert(data2.result === '0.125', `Expected "0.125", got "${data2.result}"`);
  });

  await test('Suite 2', 'Square Root: Newton-Raphson approximation (sqrt(16) = 4, sqrt(0.04) = 0.2)', async () => {
    const res1 = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'sqrt', a: '16' }),
    });
    const data1 = await res1.json();
    assert(data1.result === '4', `Expected "4", got "${data1.result}"`);

    const res2 = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'sqrt', a: '0.04' }),
    });
    const data2 = await res2.json();
    assert(data2.result === '0.2', `Expected "0.2", got "${data2.result}"`);
  });

  await test('Suite 2', 'Percentage: unary (25% = 0.25) and binary (15% of 200 = 30)', async () => {
    const res1 = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'percentage', a: '25' }),
    });
    const data1 = await res1.json();
    assert(data1.result === '0.25', `Expected "0.25", got "${data1.result}"`);

    const res2 = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'percentage', a: '15', b: '200' }),
    });
    const data2 = await res2.json();
    assert(data2.result === '30', `Expected "30", got "${data2.result}"`);
  });

  // ==========================================
  // Suite 3: Extreme Scale Calculations
  // ==========================================
  console.log(`\n${colors.bold}${colors.cyan}[Suite 3: Extreme Scale Invariants (Up to 10^400)]${colors.reset}`);

  await test('Suite 3', 'Extreme power: 10^400 evaluates to 1 followed by 400 zeros', async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'power', a: '10', b: '400' }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    const expected = '1' + '0'.repeat(400);
    assert(data.result === expected, `Result length mismatch: got ${data.result.length}, expected 401`);
  });

  await test('Suite 3', 'Extreme square root: sqrt(10^400) = 10^200', async () => {
    const radicand = '1' + '0'.repeat(400);
    const expected = '1' + '0'.repeat(200);
    const res = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'sqrt', a: radicand }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.result === expected, `Expected 10^200, got string with length ${data.result.length}`);
  });

  // ==========================================
  // Suite 4: Strict Error Catalog & HTTP Mapping
  // ==========================================
  console.log(`\n${colors.bold}${colors.cyan}[Suite 4: Strict Domain Error Catalog]${colors.reset}`);

  await test('Suite 4', 'Division by zero triggers DIVISION_BY_ZERO (HTTP 400)', async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'divide', a: '10', b: '0' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.code === 'DIVISION_BY_ZERO', `Expected code DIVISION_BY_ZERO, got ${data.code}`);
    assert(typeof data.error === 'string' && data.error.length > 0, 'Missing error message');
  });

  await test('Suite 4', 'Negative square root triggers NEGATIVE_SQUARE_ROOT (HTTP 400)', async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'sqrt', a: '-9' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.code === 'NEGATIVE_SQUARE_ROOT', `Expected code NEGATIVE_SQUARE_ROOT, got ${data.code}`);
  });

  await test('Suite 4', 'Exponent > 1000 triggers EXPONENT_OUT_OF_BOUNDS (HTTP 400)', async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'power', a: '2', b: '1001' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.code === 'EXPONENT_OUT_OF_BOUNDS', `Expected code EXPONENT_OUT_OF_BOUNDS, got ${data.code}`);
  });

  await test('Suite 4', 'Malformed payload / invalid JSON triggers MALFORMED_JSON (HTTP 400)', async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"operation": "add", a: broken}',
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.code === 'MALFORMED_JSON', `Expected code MALFORMED_JSON, got ${data.code}`);
  });

  await test('Suite 4', 'Disallowed HTTP method triggers METHOD_NOT_ALLOWED (HTTP 405)', async () => {
    const res = await fetch(`${BACKEND_URL}/api/v1/health`, { method: 'POST' });
    assert(res.status === 405, `Expected 405, got ${res.status}`);
  });

  // ==========================================
  // Suite 5: History Ring Buffer Lifecycle
  // ==========================================
  console.log(`\n${colors.bold}${colors.cyan}[Suite 5: History Ring Buffer & Atomic IDs]${colors.reset}`);

  await test('Suite 5', 'Ring buffer captures calculations, caps at 20, orders newest first', async () => {
    // Generate 25 distinct calculations to test buffer overflow eviction
    for (let i = 1; i <= 25; i++) {
      await fetch(`${BACKEND_URL}/api/v1/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'add', a: `${i}`, b: '1' }),
      });
    }

    const res = await fetch(`${BACKEND_URL}/api/v1/history`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.items), 'items must be an array');
    assert(data.items.length === 20, `Ring buffer must cap at 20, got ${data.items.length}`);
    
    // First item must be the most recent calculation (25 + 1 = 26)
    assert(data.items[0].result === '26', `Newest item result expected 26, got ${data.items[0].result}`);
    assert(data.items[0].id !== undefined, 'Calculation item must have an atomic id');
  });

  // ==========================================
  // Suite 6: Frontend Reverse Proxy Validation
  // ==========================================
  console.log(`\n${colors.bold}${colors.cyan}[Suite 6: Frontend Reverse Proxy & Static Assets]${colors.reset}`);

  await test('Suite 6', 'Nginx proxies /api/v1/health transparently on port 3000', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/v1/health`);
    assert(res.status === 200, `Expected 200 through proxy, got ${res.status}`);
    const data = await res.json();
    assert(data.status === 'healthy', `Expected healthy status, got ${data.status}`);
  });

  await test('Suite 6', 'Nginx proxies /api/v1/calculate transparently on port 3000', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'multiply', a: '6', b: '7' }),
    });
    assert(res.status === 200, `Expected 200 through proxy, got ${res.status}`);
    const data = await res.json();
    assert(data.result === '42', `Expected "42", got "${data.result}"`);
  });

  await test('Suite 6', 'Frontend serves SPA HTML document on root /', async () => {
    const res = await fetch(`${FRONTEND_URL}/`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const text = await res.text();
    assert(text.includes('<!doctype html>') || text.includes('<html'), 'Expected valid HTML document');
    assert(text.includes('root') || text.includes('Sezzle'), 'Expected root container in HTML');
  });

  // ==========================================
  // Summary Report
  // ==========================================
  console.log(`\n${colors.bold}${colors.magenta}====================================================${colors.reset}`);
  console.log(`${colors.bold}  End-to-End Test Run Summary${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}====================================================${colors.reset}`);
  console.log(`  Total Passed:  ${colors.green}${colors.bold}${totalPassed}${colors.reset}`);
  console.log(`  Total Failed:  ${totalFailed > 0 ? colors.red : colors.green}${colors.bold}${totalFailed}${colors.reset}`);
  console.log(`  Total Tests:   ${totalPassed + totalFailed}\n`);

  if (totalFailed > 0) {
    console.log(`${colors.red}${colors.bold}Failures:${colors.reset}`);
    failures.forEach((f, idx) => {
      console.log(`  ${idx + 1}) [${f.suite}] ${f.test}: ${f.error}`);
    });
    process.exit(1);
  }

  console.log(`${colors.green}${colors.bold}All End-to-End tests passed successfully!${colors.reset}\n`);
}

run().catch((err) => {
  console.error(`\n${colors.red}${colors.bold}Fatal E2E Runner Error:${colors.reset}`, err);
  process.exit(1);
});
