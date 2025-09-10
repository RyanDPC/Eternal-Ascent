#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function getDbConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false, require: true } };
  }
  const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: useSsl ? { rejectUnauthorized: false, require: true } : false
  };
}

async function applySql(pool, filePath, label) {
  let sql = fs.readFileSync(filePath, 'utf8');
  sql = sql.split('\n').filter(line => !/^\s*VACUUM\b/i.test(line)).join('\n');
  console.log(`[DB] Applying ${label}: ${path.basename(filePath)}`);
  await pool.query(sql);
}

async function run() {
  const pool = new Pool(getDbConfig());
  try {
    const schemaFile = path.join(__dirname, '..', 'database-schema.sql');
    const viewsFile = path.join(__dirname, '..', 'database-views.sql');
    await applySql(pool, schemaFile, 'schema');
    await applySql(pool, viewsFile, 'views');
    console.log('✅ Reset done');
  } catch (e) {
    console.error('❌ Reset failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) run();

