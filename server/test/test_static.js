#!/usr/bin/env node

const axios = require('axios');

async function run() {
  const base = process.env.API_URL || 'http://localhost:3001';
  console.log('[STATIC] Fetch classes...');
  const classes = await axios.get(`${base}/api/static/classes`);
  if (!classes.data.success) throw new Error('classes failed');

  console.log('[STATIC] Fetch rarities...');
  const rarities = await axios.get(`${base}/api/static/rarities`);
  if (!rarities.data.success) throw new Error('rarities failed');

  console.log('[STATIC] Fetch items types...');
  const types = await axios.get(`${base}/api/static/items/types`);
  if (!types.data.success) throw new Error('types failed');

  console.log('[STATIC] OK');
}

if (require.main === module) {
  run().then(() => { console.log('[STATIC] Test passed'); process.exit(0); }).catch(e => { console.error('[STATIC] Test failed:', e.message); process.exit(1); });
}


