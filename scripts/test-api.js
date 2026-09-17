// ═══════════════════════════════════════════════════════════════════
// CREATIVEORBITZ API TEST SUITE (scripts/test-api.js)
// ═══════════════════════════════════════════════════════════════════
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function runTests() {
  console.log('🧪 Starting API Test Suite against ' + BASE_URL + '...\n');
  let passed = 0;
  let failed = 0;

  async function assert(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASSED: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ✗ FAILED: ${name} → ${e.message}`);
      failed++;
    }
  }

  // 1. Test /api/projects
  await assert('GET /api/projects returns array of projects', async () => {
    const res = await fetch(`${BASE_URL}/api/projects`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('Expected non-empty array');
  });

  // 2. Test /api/leads validation (missing fields)
  await assert('POST /api/leads rejects invalid payload (missing name/email)', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A' }) // too short, no email
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 3. Test /api/leads success
  await assert('POST /api/leads accepts valid project inquiry', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alexander Wright',
        email: 'alex.wright@venturestudios.co',
        phone: '+1 555-0192',
        company: 'Venture Studios',
        country: 'United States',
        service: 'Full Creative Partner',
        budget: '$2,500+',
        description: 'Need complete video production & AI content scaling.',
        timeline: 'Immediate (within 2 weeks)',
        reference_url: 'https://youtube.com/@venturestudios'
      })
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Expected success: true');
  });

  // 4. Test /api/contact validation
  await assert('POST /api/contact rejects missing message', async () => {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com' })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 5. Test /api/contact success
  await assert('POST /api/contact accepts valid message', async () => {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Elena Rostova',
        email: 'elena@rostovadesign.com',
        subject: 'Partnership & White Label Video Production',
        message: 'Hello, we are an agency looking to white-label your editing team.'
      })
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Expected success: true');
  });

  // 6. Test /api/newsletter
  await assert('POST /api/newsletter accepts valid email', async () => {
    const res = await fetch(`${BASE_URL}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'founder@scalingbrand.com' })
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Expected success: true');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests();
