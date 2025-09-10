#!/usr/bin/env node
/*
 * One-off migration: widen DECIMAL precision on characters numeric columns
 * Fixes: numeric field overflow (e.g., critical_damage 150.00 into DECIMAL(4,2))
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function getDbConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false, require: true },
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
  };
}

async function main() {
  const pool = new Pool(getDbConfig());
  const client = await pool.connect();
  try {
    console.log('Applying DECIMAL precision updates on characters...');
    await client.query('BEGIN');

    // Drop dependent views to allow ALTER TYPE
    console.log('Dropping dependent views...');
    await client.query(`
      DROP VIEW IF EXISTS guild_members_full;
      DROP VIEW IF EXISTS guilds_full;
      DROP VIEW IF EXISTS dungeons_with_progress;
      DROP VIEW IF EXISTS character_inventory_full;
      DROP VIEW IF EXISTS enemies_with_combat_info;
      DROP VIEW IF EXISTS items_with_stats;
      DROP VIEW IF EXISTS quests_with_progress;
      DROP VIEW IF EXISTS characters_full;
    `);

    // Widen columns that can overflow with existing defaults/values
    console.log('Altering columns on characters...');
    await client.query(
      `ALTER TABLE characters 
         ALTER COLUMN critical_rate TYPE DECIMAL(5,2) USING critical_rate::DECIMAL(5,2),
         ALTER COLUMN critical_damage TYPE DECIMAL(5,2) USING critical_damage::DECIMAL(5,2),
         ALTER COLUMN dodge_chance TYPE DECIMAL(5,2) USING dodge_chance::DECIMAL(5,2),
         ALTER COLUMN block_chance TYPE DECIMAL(5,2) USING block_chance::DECIMAL(5,2),
         ALTER COLUMN parry_chance TYPE DECIMAL(5,2) USING parry_chance::DECIMAL(5,2);`
    );

    // Recreate views
    console.log('Recreating views...');
    const viewsSqlPath = path.join(__dirname, '..', 'database-views.sql');
    const viewsSql = fs.readFileSync(viewsSqlPath, 'utf8');
    await client.query(viewsSql);

    await client.query('COMMIT');
    console.log('✅ DECIMAL precision updated successfully.');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('💥 Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  main();
}


