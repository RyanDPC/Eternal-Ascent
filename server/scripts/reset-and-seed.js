#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

async function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running ${scriptName}...`);
    const cp = spawn(process.execPath, [path.join(__dirname, scriptName)], { 
      stdio: 'inherit', 
      env: process.env 
    });
    
    cp.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${scriptName} failed with code ${code}`);
        reject(new Error(`${scriptName} failed`));
      }
    });
    
    cp.on('error', (error) => {
      console.error(`❌ Error running ${scriptName}:`, error);
      reject(error);
    });
  });
}

async function run() {
  try {
    // 1. Reset de la base de données (schéma + vues)
    await runScript('reset.js');
    
    // 2. Seed des données (DB-only, idempotent)
    await runScript('seed.js');
    
    console.log('🎉 Database reset and seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Reset and seed failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
