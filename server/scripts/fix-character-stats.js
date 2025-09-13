#!/usr/bin/env node

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const characterStatsUtil = require('../utils/characterStats');

// Charger .env local si présent
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach((line) => {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) process.env[k] = rest.join('=').trim();
  });
}

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

function midOfRange(range, fallback) {
  try {
    if (Array.isArray(range) && range.length === 2) {
      const a = Number(range[0]);
      const b = Number(range[1]);
      if (Number.isFinite(a) && Number.isFinite(b)) return Math.floor((a + b) / 2);
    }
  } catch (_) {}
  return Number(fallback) || 0;
}

async function main() {
  const pool = new Pool(getDbConfig());
  const client = await pool.connect();
  try {
    console.log('🔧 Recalcul des stats des personnages...');
    const { rows: chars } = await client.query(`
      SELECT 
        c.*, 
        cc.name AS class_code,
        cc.stat_ranges
      FROM characters c
      JOIN character_classes cc ON c.class_id = cc.id
      ORDER BY c.id
    `);

    let updated = 0;
    for (const c of chars) {
      // Construire des bases saines à partir des ranges si les valeurs sont nulles/0
      const ranges = c.stat_ranges || {};
      const base = {
        health: c.health && c.health > 0 ? Number(c.health) : midOfRange(ranges.health, 120),
        max_health: c.max_health && c.max_health > 0 ? Number(c.max_health) : midOfRange(ranges.health, 120),
        mana: c.mana && c.mana > 0 ? Number(c.mana) : midOfRange(ranges.mana, 60),
        max_mana: c.max_mana && c.max_mana > 0 ? Number(c.max_mana) : midOfRange(ranges.mana, 60),
        attack: c.attack && c.attack > 0 ? Number(c.attack) : midOfRange(ranges.attack, 18),
        defense: c.defense && c.defense > 0 ? Number(c.defense) : midOfRange(ranges.defense, 16),
        magic_attack: c.magic_attack && c.magic_attack > 0 ? Number(c.magic_attack) : midOfRange(ranges.magic_attack, 14),
        magic_defense: c.magic_defense && c.magic_defense > 0 ? Number(c.magic_defense) : midOfRange(ranges.magic_defense, 14),
        critical_rate: Number(c.critical_rate) || 5.0,
        critical_damage: Number(c.critical_damage) || 150.0,
        vitality: Number(c.vitality) || 10,
        strength: Number(c.strength) || 10,
        intelligence: Number(c.intelligence) || 10,
        agility: Number(c.agility) || 10,
        resistance: Number(c.resistance) || 10,
        precision: Number(c.precision) || 10,
        endurance: Number(c.endurance) || 10,
        wisdom: Number(c.wisdom) || 10,
        constitution: Number(c.constitution) || 10,
        dexterity: Number(c.dexterity) || 10,
        health_regen: Number(c.health_regen) || 1.0,
        mana_regen: Number(c.mana_regen) || 0.5,
        attack_speed: Number(c.attack_speed) || 100.0,
        movement_speed: Number(c.movement_speed) || 100.0,
        dodge_chance: Number(c.dodge_chance) || 8.0,
        block_chance: Number(c.block_chance) || 5.0,
        parry_chance: Number(c.parry_chance) || 3.0,
        spell_power: Number(c.spell_power) || 100.0,
        physical_power: Number(c.physical_power) || 100.0
      };

      // Récupérer les objets équipés
      const { rows: eq } = await client.query(`
        SELECT i.*, it.name as item_type_name, it.equip_slot
        FROM character_inventory ci
        JOIN items i ON ci.item_id = i.id
        JOIN item_types it ON i.type_id = it.id
        WHERE ci.character_id = $1 AND ci.equipped = true
      `, [c.id]);

      const finalStats = characterStatsUtil.calculateFinalStats(base, eq);
      await characterStatsUtil.updateCharacterStats(client, c.id, finalStats);
      updated++;
    }

    console.log(`✅ Stats recalculées pour ${updated} personnage(s).`);
  } catch (e) {
    console.error('❌ Erreur migration stats:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  main();
}


