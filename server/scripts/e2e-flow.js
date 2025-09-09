#!/usr/bin/env node

// E2E: register → quests → start quest → save combat log
const axios = require('axios');

async function run() {
  try {
    const base = 'http://localhost:3001/api';
    const username = `user_${Date.now()}`;
    const email = `${username}@example.com`;
    const password = 'password123';

    const reg = await axios.post(`${base}/auth/register`, { username, email, password });
    const token = reg.data.token;
    const characterId = reg.data.character.id;

    const headers = { Authorization: `Bearer ${token}` };

    const quests = await axios.get(`${base}/systems/quests/available/character/${characterId}`, { headers });
    const first = (quests.data.data?.daily || [])[0] || (quests.data.data?.weekly || [])[0];
    if (first) {
      await axios.post(`${base}/systems/quests/start`, { characterId, questId: first.id }, { headers });
    }

    // Save a tiny combat log (gzip on server)
    await axios.post(`${base}/combat-sessions`, {
      characterId,
      dungeonId: 1,
      result: 'win',
      log: { events: [{ t: 0, type: 'attack', dmg: 10 }], summary: 'ok' }
    }, { headers });

    console.log('✅ E2E flow completed');
  } catch (e) {
    console.error('❌ E2E flow failed:', e.response?.data || e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

