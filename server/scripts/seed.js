#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

async function run() {
  await new Promise((resolve, reject) => {
    const cp = spawn(process.execPath, [path.join(__dirname, 'seed-all.js')], { stdio: 'inherit', env: process.env });
    cp.on('exit', (code) => code === 0 ? resolve() : reject(new Error('seed-all failed')));
  });
}

if (require.main === module) {
  run().then(() => { console.log('✅ Seed done'); process.exit(0); }).catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); });
}

