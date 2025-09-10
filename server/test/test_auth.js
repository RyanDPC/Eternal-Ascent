#!/usr/bin/env node

const axios = require('axios');

async function run() {
  const base = process.env.API_URL || 'http://localhost:3001';
  const email = `auth_${Date.now()}@example.com`;
  const username = 'tester_' + Math.random().toString(36).slice(2,8);
  console.log('[AUTH] Requesting email code...');
  const r1 = await axios.post(`${base}/api/auth/request-email-code`, { email, username });
  console.log('[AUTH] request-email-code ok');
  const code = r1.data.code; // only in dev
  if (!code) {
    throw new Error('No code returned (prod mode)');
  }
  console.log('[AUTH] Verifying code...');
  const r2 = await axios.post(`${base}/api/auth/verify-email`, { email, code, username, characterName: 'Hero_' + username, className: 'warrior' });
  if (!r2.data || !r2.data.token || !r2.data.character) throw new Error('Verify failed');
  console.log('[AUTH] OK');
}

if (require.main === module) {
  run().then(() => { console.log('[AUTH] Test passed'); process.exit(0); }).catch(e => { console.error('[AUTH] Test failed:', e.message); process.exit(1); });
}


