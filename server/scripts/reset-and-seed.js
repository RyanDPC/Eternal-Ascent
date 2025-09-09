#!/usr/bin/env node
/*
 * Eternal Ascent - Reset & Seed (Render-compatible)
 * - Applies server/database-schema.sql to the target DB
 * - Applies server/database-views.sql to the target DB
 * - Runs server/scripts/seed-all.js
 *
 * Usage:
 *   DATABASE_URL=... node server/scripts/reset-and-seed.js
 *   or set DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD (and DB_SSL=true if needed)
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { spawn } = require('child_process');

function getDbConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false, require: true },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }
  const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  for (const v of required) {
    if (!process.env[v]) {
      throw new Error(`Missing env ${v}. Provide DATABASE_URL or all DB_* vars.`);
    }
  }
  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: useSsl ? { rejectUnauthorized: false, require: true } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

async function applySql(pool, filePath, label) {
  let sql = fs.readFileSync(filePath, 'utf8');
  // VACUUM cannot run inside a transaction block when sent programmatically.
  // Remove VACUUM statements; ANALYZE is safe to keep.
  sql = sql
    .split('\n')
    .filter((line) => !/^\s*VACUUM\b/i.test(line))
    .join('\n');

  console.log(`\n[DB] Applying ${label}: ${path.relative(process.cwd(), filePath)}`);
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log(`[DB] OK: ${label}`);
  } finally {
    client.release();
  }
}

async function runSeedAll() {
  console.log('\n[Seed] Running seed-all.js ...');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, 'seed-all.js')], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`seed-all.js exited with code ${code}`));
    });
  });
  console.log('[Seed] Done.');
}

async function main() {
  console.log('===============================================');
  console.log(' Eternal Ascent - Reset & Seed (Render DB)');
  console.log('===============================================');

  const pool = new Pool(getDbConfig());
  try {
    const schemaFile = path.join(__dirname, '..', 'database-schema.sql');
    const viewsFile = path.join(__dirname, '..', 'database-views.sql');

    await applySql(pool, schemaFile, 'schema');
    await applySql(pool, viewsFile, 'views');
    await runSeedAll();

    console.log('\n✅ Database reset and seed completed successfully.');
  } catch (err) {
    console.error('\n💥 Error during reset/seed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}


