#!/usr/bin/env node

const axios = require('axios');

async function login() {
  const base = process.env.API_URL || 'http://localhost:3001';
  const email = `char_${Date.now()}@example.com`;
  const username = 'tester_' + Math.random().toString(36).slice(2,8);
  const r1 = await axios.post(`${base}/api/auth/request-email-code`, { email, username });
  const code = r1.data.code;
  const r2 = await axios.post(`${base}/api/auth/verify-email`, { email, code, username, characterName: 'Hero_' + username, className: 'warrior' });
  return { base, token: r2.data.token, characterId: r2.data.character.id };
}

async function run() {
  const { base, token, characterId } = await login();
  const headers = { Authorization: `Bearer ${token}` };

  console.log('[CHAR] Fetch current character...');
  const cur = await axios.get(`${base}/api/characters/current`, { headers });
  if (!cur.data.success) throw new Error('current failed');

  console.log('[CHAR] Fetch character stats...');
  const stats = await axios.get(`${base}/api/characters/${characterId}/stats`, { headers });
  if (!stats.data.success) throw new Error('stats failed');

  console.log('[CHAR] Fetch inventory...');
  const inv = await axios.get(`${base}/api/characters/${characterId}/inventory`, { headers });
  if (!inv.data.success) throw new Error('inventory failed');

  console.log('[CHAR] OK');
}

if (require.main === module) {
  run().then(() => { console.log('[CHAR] Test passed'); process.exit(0); }).catch(e => { console.error('[CHAR] Test failed:', e.message); process.exit(1); });
}


