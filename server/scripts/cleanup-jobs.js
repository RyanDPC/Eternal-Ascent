#!/usr/bin/env node

const { Pool } = require('pg');

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

async function run() {
  const pool = new Pool(getDbConfig());
  try {
    await pool.query(`DELETE FROM auth_codes WHERE expires_at < NOW() OR consumed_at IS NOT NULL`);
    await pool.query(`DELETE FROM refresh_tokens WHERE (expires_at IS NOT NULL AND expires_at < NOW()) OR revoked_at IS NOT NULL`);
    console.log('✅ Cleanup done');
  } catch (e) {
    console.error('❌ Cleanup failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) run();

