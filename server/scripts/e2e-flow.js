#!/usr/bin/env node

// E2E: email code login/register → profile → basic actions
const axios = require('axios');

async function run() {
  try {
    const base = process.env.API_URL || 'http://localhost:3001';
    const email = process.env.TEST_EMAIL || `test_${Date.now()}@example.com`;
    const username = 'tester_' + Math.random().toString(36).slice(2,8);

    const r1 = await axios.post(`${base}/api/auth/request-email-code`, { email, username });
    console.log('request-email-code:', { success: r1.data.success, mailSent: r1.data.mailSent, purpose: r1.data.purpose });
    const code = r1.data.code; // dev only
    if (!code) {
      console.log('No code returned (prod). Please check your inbox and run verify manually.');
      return;
    }

    const r2 = await axios.post(`${base}/api/auth/verify-email`, { email, code, username, characterName: 'Hero_' + username, className: 'warrior' });
    console.log('verify-email:', { success: r2.data.success, user: r2.data.user, character: r2.data.character });

    const token = r2.data.token;
    const characterId = r2.data.character.id;
    const headers = { Authorization: `Bearer ${token}` };

    // sanity call
    await axios.get(`${base}/api/user/profile`, { headers });
    console.log('✅ E2E email-code flow completed');
  } catch (e) {
    console.error('❌ E2E flow failed:', e.response?.data || e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}


