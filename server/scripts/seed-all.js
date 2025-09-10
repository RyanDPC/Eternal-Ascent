#!/usr/bin/env node

const { Pool } = require('pg');

// SID data
const rarities = require('../data/sid/rarities');
const characterClasses = require('../data/sid/character_classes');
const dungeonsManager = require('../data/sid/dungeons');
const quests = require('../data/sid/quests');
const enemies = require('../data/sid/enemies');
const consumables = require('../data/sid/consumables');
const materials = require('../data/sid/materials');
const currency = require('../data/sid/currency');
const items = require('../data/sid/items');
const difficultiesData = require('../data/sid/difficulties');

function getDbConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false, require: true },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    };
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

class Seeder {
  constructor() {
    this.pool = new Pool(getDbConfig());
  }

  async query(sql, params = []) {
    const client = await this.pool.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }

  async getSingle(sql, params = []) {
    const r = await this.query(sql, params);
    return r.rows[0] || null;
  }

  async getIdByName(table, name) {
    const r = await this.getSingle(`SELECT id FROM ${table} WHERE name = $1`, [name]);
    return r ? r.id : null;
  }

  async ensureRarity(r) {
    await this.query(`
      INSERT INTO rarities (name, display_name, color, probability, stat_multiplier, description, icon)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        color = EXCLUDED.color,
        probability = EXCLUDED.probability,
        stat_multiplier = EXCLUDED.stat_multiplier,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        updated_at = NOW()
    `, [
      r.name,
      r.display_name || r.name,
      r.color || '#9CA3AF',
      r.probability ?? 1.0,
      r.stat_multiplier ?? 1.0,
      r.description || '',
      r.icon || null
    ]);
    return this.getIdByName('rarities', r.name);
  }

  async ensureItemType({ name, display_name, category, equip_slot = null, max_stack = 1, description = null, icon = null }) {
    await this.query(`
      INSERT INTO item_types (name, display_name, category, equip_slot, max_stack, description, icon)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        category = EXCLUDED.category,
        equip_slot = EXCLUDED.equip_slot,
        max_stack = EXCLUDED.max_stack,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        updated_at = NOW()
    `, [name, display_name || name, category, equip_slot, max_stack, description, icon]);
    return this.getIdByName('item_types', name);
  }

  mapSubTypeToItemType(subType, type) {
    const lower = (subType || type || '').toLowerCase();
    if (['dagger','sword','bow','staff','axe','mace','spear','shield'].includes(lower)) return { name: lower, display: lower, category: 'weapon', equip: 'weapon', stack: 1 };
    if (['armor','chest','chestplate'].includes(lower)) return { name: 'armor', display: 'armor', category: 'armor', equip: 'chest', stack: 1 };
    if (['helmet','helm','head'].includes(lower)) return { name: 'helmet', display: 'helmet', category: 'armor', equip: 'head', stack: 1 };
    if (['gloves','hand'].includes(lower)) return { name: 'gloves', display: 'gloves', category: 'armor', equip: 'gloves', stack: 1 };
    if (['boots','feet'].includes(lower)) return { name: 'boots', display: 'boots', category: 'armor', equip: 'boots', stack: 1 };
    if (['ring'].includes(lower)) return { name: 'ring', display: 'ring', category: 'special', equip: 'ring', stack: 10 };
    if (['necklace','amulet'].includes(lower)) return { name: 'necklace', display: 'necklace', category: 'special', equip: 'necklace', stack: 5 };
    if (['potion','consumable'].includes(lower)) return { name: 'potion', display: 'potion', category: 'consumable', equip: null, stack: 99 };
    if (['material'].includes(lower)) return { name: 'material', display: 'material', category: 'material', equip: null, stack: 999 };
    if (['currency'].includes(lower)) return { name: 'currency', display: 'currency', category: 'currency', equip: null, stack: 999999 };
    return { name: lower || 'special', display: lower || 'special', category: 'special', equip: null, stack: 99 };
  }

  async seedRarities() {
    console.log('   💎 Raretés...');
    for (const r of rarities) {
      await this.ensureRarity(r);
    }
  }

  async seedItemTypes() {
    console.log('   🎒 Types d\'objets...');
    const base = [
      { name: 'dagger', display_name: 'Dague', category: 'weapon', equip_slot: 'weapon', max_stack: 1 },
      { name: 'sword', display_name: 'Épée', category: 'weapon', equip_slot: 'weapon', max_stack: 1 },
      { name: 'bow', display_name: 'Arc', category: 'weapon', equip_slot: 'weapon', max_stack: 1 },
      { name: 'shield', display_name: 'Bouclier', category: 'armor', equip_slot: 'weapon', max_stack: 1 },
      { name: 'armor', display_name: 'Armure', category: 'armor', equip_slot: 'chest', max_stack: 1 },
      { name: 'helmet', display_name: 'Casque', category: 'armor', equip_slot: 'head', max_stack: 1 },
      { name: 'gloves', display_name: 'Gants', category: 'armor', equip_slot: 'gloves', max_stack: 1 },
      { name: 'boots', display_name: 'Bottes', category: 'armor', equip_slot: 'boots', max_stack: 1 },
      { name: 'ring', display_name: 'Anneau', category: 'special', equip_slot: 'ring', max_stack: 10 },
      { name: 'necklace', display_name: 'Collier', category: 'special', equip_slot: 'necklace', max_stack: 5 },
      { name: 'potion', display_name: 'Potion', category: 'consumable', equip_slot: null, max_stack: 99 },
      { name: 'material', display_name: 'Matériau', category: 'material', equip_slot: null, max_stack: 999 },
      { name: 'currency', display_name: 'Monnaie', category: 'currency', equip_slot: null, max_stack: 999999 },
      { name: 'special', display_name: 'Spécial', category: 'special', equip_slot: null, max_stack: 99 }
    ];
    for (const t of base) await this.ensureItemType(t);
  }

  async insertItem(payload) {
    const rarityId = await this.getIdByName('rarities', payload.rarity || 'common')
      || await this.ensureRarity({ name: payload.rarity || 'common' });
    const map = this.mapSubTypeToItemType(payload.subType, payload.type);
    const typeId = await this.ensureItemType({ name: map.name, display_name: map.display, category: map.category, equip_slot: map.equip, max_stack: map.stack });

    // Upsert manuel basé sur name (pas de contrainte unique dans le schéma)
    const existing = await this.getSingle('SELECT id FROM items WHERE name = $1', [payload.name]);
    if (existing) {
      await this.query(`
        UPDATE items SET
          display_name = $2,
          description = $3,
          type_id = $4,
          rarity_id = $5,
          level_requirement = $6,
          base_stats = $7,
          stat_ranges = $8,
          effects = $9,
          icon = $10,
          image = $11,
          updated_at = NOW()
        WHERE id = $1
      `, [
        existing.id,
        payload.name,
        payload.description || '',
        typeId,
        rarityId,
        payload.level || payload.level_requirement || 1,
        JSON.stringify(payload.base_stats || payload.stats || {}),
        JSON.stringify(payload.stat_ranges || {}),
        JSON.stringify(Array.isArray(payload.effects) ? payload.effects : (payload.effect ? [payload.effect] : [])),
        payload.icon || null,
        payload.image || null
      ]);
    } else {
      await this.query(`
        INSERT INTO items (
          name, display_name, description, type_id, rarity_id, level_requirement,
          base_stats, stat_ranges, effects, icon, image
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      `, [
        payload.name,
        payload.name,
        payload.description || '',
        typeId,
        rarityId,
        payload.level || payload.level_requirement || 1,
        JSON.stringify(payload.base_stats || payload.stats || {}),
        JSON.stringify(payload.stat_ranges || {}),
        JSON.stringify(Array.isArray(payload.effects) ? payload.effects : (payload.effect ? [payload.effect] : [])),
        payload.icon || null,
        payload.image || null
      ]);
    }
  }

  async seedItems() {
    console.log('   ⚔️ Objets...');
    // Currency
    for (const it of (currency || [])) {
      await this.insertItem({
        id: it.name,
        name: it.display_name || it.name,
        description: it.description,
        type: 'currency',
        rarity: it.rarity || 'common',
        level_requirement: it.level_requirement || 1,
        base_stats: it.base_stats,
        stat_ranges: it.stat_ranges,
        effects: it.effects,
        icon: it.icon
      });
    }
    // Consumables
    for (const it of (consumables || [])) {
      await this.insertItem({
        id: it.name,
        name: it.display_name || it.name,
        description: it.description,
        type: 'consumable',
        rarity: it.rarity || 'common',
        level_requirement: it.level_requirement || 1,
        base_stats: it.base_stats,
        stat_ranges: it.stat_ranges,
        effects: it.effects,
        icon: it.icon
      });
    }
    // Materials
    for (const it of (materials || [])) {
      await this.insertItem({
        id: it.name,
        name: it.display_name || it.name,
        description: it.description,
        type: 'material',
        rarity: it.rarity || 'common',
        level_requirement: it.level_requirement || 1,
        base_stats: it.base_stats,
        stat_ranges: it.stat_ranges,
        effects: it.effects,
        icon: it.icon
      });
    }
    // Large item catalog
    if (items && typeof items === 'object') {
      for (const group of Object.values(items)) {
        if (Array.isArray(group)) {
          for (const it of group) {
            await this.insertItem({
              id: it.id,
              name: it.name || it.id,
              description: it.description || '',
              type: it.type,
              subType: it.subType,
              rarity: it.rarity || 'common',
              level: it.level || 1,
              base_stats: it.stats || it.base_stats || {},
              effects: it.effects || (it.effect ? [it.effect] : []),
              icon: it.icon
            });
          }
        }
      }
    }
  }

  async seedCharacterClasses() {
    console.log('   📊 Classes...');
    for (const c of characterClasses) {
      const rarityId = await this.getIdByName('rarities', c.rarity || 'common') || await this.ensureRarity({ name: c.rarity || 'common' });
      await this.query(`
        INSERT INTO character_classes (
          name, display_name, description, rarity_id, probability,
          base_stats, stat_ranges, starting_equipment, icon
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          rarity_id = EXCLUDED.rarity_id,
          probability = EXCLUDED.probability,
          base_stats = EXCLUDED.base_stats,
          stat_ranges = EXCLUDED.stat_ranges,
          starting_equipment = EXCLUDED.starting_equipment,
          icon = EXCLUDED.icon,
          updated_at = NOW()
      `, [
        c.name,
        c.display_name || c.name,
        c.description || '',
        rarityId,
        c.probability || 0.98,
        JSON.stringify(c.base_stats || {}),
        JSON.stringify(c.stat_ranges || {}),
        JSON.stringify(c.starting_equipment || []),
        c.icon || null
      ]);
    }
  }

  async seedDifficultiesAndDungeons() {
    console.log('   🧭 Difficultés & Donjons...');
    difficultiesData.generateDifficulties();
    const baseDiffs = [
      ...difficultiesData.getAllDifficulties(),
      { name: 'normal', display_name: 'Normal' },
      { name: 'nightmare', display_name: 'Nightmare' },
      { name: 'hell', display_name: 'Hell' },
      { name: 'divine', display_name: 'Divine' }
    ];
    const diffIdByName = {};
    for (const d of baseDiffs) {
      await this.query(`
        INSERT INTO difficulties (name, display_name, color, icon, description, stat_multiplier, exp_multiplier, gold_multiplier, order_index)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (name) DO NOTHING
      `, [d.name, d.display_name || d.name, d.color || '#888888', d.icon || '⭐', d.description || '', d.stat_multiplier || 1.0, d.exp_multiplier || 1.0, d.gold_multiplier || 1.0, d.order || d.order_index || 1]);
      diffIdByName[d.name] = await this.getIdByName('difficulties', d.name);
    }

    const dungeons = dungeonsManager.getDungeons();
    for (const d of dungeons) {
      const diffId = diffIdByName[d.difficulty] || diffIdByName['easy'];
      const rewardsArr = Array.isArray(d.rewards) ? d.rewards : (d.rewards ? [d.rewards] : []);
      const reqsArr = Array.isArray(d.requirements) ? d.requirements : (d.requirements ? [d.requirements] : []);
      const enemiesArr = Array.isArray(d.enemies) ? d.enemies : [];
      await this.query(`
        INSERT INTO dungeons (
          name, display_name, description, level_requirement, difficulty_id, estimated_duration,
          rewards, requirements, enemies, icon, theme
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          level_requirement = EXCLUDED.level_requirement,
          difficulty_id = EXCLUDED.difficulty_id,
          estimated_duration = EXCLUDED.estimated_duration,
          rewards = EXCLUDED.rewards,
          requirements = EXCLUDED.requirements,
          enemies = EXCLUDED.enemies,
          icon = EXCLUDED.icon,
          theme = EXCLUDED.theme,
          updated_at = NOW()
      `, [
        d.name,
        d.display_name || d.name,
        d.description || '',
        d.level_requirement || 1,
        diffId,
        d.estimated_duration || 5,
        JSON.stringify(rewardsArr),
        JSON.stringify(reqsArr),
        JSON.stringify(enemiesArr),
        d.icon || null,
        d.theme || null
      ]);
    }
  }

  async seedQuests() {
    console.log('   📜 Quêtes...');
    for (const q of quests) {
      const existing = await this.getSingle('SELECT id FROM quests WHERE title = $1', [q.title]);
      const rewardsArr = Array.isArray(q.rewards) ? q.rewards : (q.rewards ? [q.rewards] : []);
      const reqsArr = Array.isArray(q.requirements) ? q.requirements : (q.requirements ? [q.requirements] : []);
      const objArr = Array.isArray(q.objectives) ? q.objectives : (q.objectives ? [q.objectives] : []);
      // Normaliser le type pour matcher le CHECK du schéma
      const t = (q.type || 'main').toLowerCase();
      const mapQuestType = (type) => {
        if (['main','side','daily','weekly','guild','event'].includes(type)) return type;
        if (['exploration','mystery'].includes(type)) return 'side';
        if (['kill','boss','defense','ascension','mastery'].includes(type)) return 'main';
        return 'main';
      };
      const questType = mapQuestType(t);
      if (existing) {
        await this.query(`
          UPDATE quests SET
            description = $2,
            type = $3,
            level_requirement = $4,
            rewards = $5,
            requirements = $6,
            objectives = $7,
            icon = $8,
            updated_at = NOW()
          WHERE id = $1
        `, [
          existing.id,
          q.description || '',
          questType,
          q.level_requirement || 1,
          JSON.stringify(rewardsArr),
          JSON.stringify(reqsArr),
          JSON.stringify(objArr),
          q.icon || null
        ]);
      } else {
        await this.query(`
          INSERT INTO quests (title, description, type, level_requirement, rewards, requirements, objectives, icon)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [
          q.title,
          q.description || '',
          questType,
          q.level_requirement || 1,
          JSON.stringify(rewardsArr),
          JSON.stringify(reqsArr),
          JSON.stringify(objArr),
          q.icon || null
        ]);
      }
    }
  }

  async seedEnemies() {
    console.log('   👹 Ennemis...');
    const push = async (e) => {
      const rarityId = await this.getIdByName('rarities', e.rarity || 'common') || await this.ensureRarity({ name: e.rarity || 'common' });
      const enemyKeyName = e.id || (e.name ? e.name.toLowerCase().replace(/\s+/g,'_') : undefined) || `enemy_${Date.now()}`;
      const existing = await this.getSingle('SELECT id FROM enemies WHERE name = $1', [enemyKeyName]);
      if (existing) {
        await this.query(`
          UPDATE enemies SET
            display_name = $2,
            description = $3,
            type = $4,
            level = $5,
            rarity_id = $6,
            health = $7,
            attack = $8,
            defense = $9,
            magic_attack = $10,
            magic_defense = $11,
            speed = $12,
            experience_reward = $13,
            gold_reward = $14,
            abilities = $15,
            weaknesses = $16,
            resistances = $17,
            loot_table = $18,
            icon = $19,
            updated_at = NOW()
          WHERE id = $1
        `, [
          existing.id,
          e.name,
          e.description || '',
          e.type || 'beast',
          e.level || 1,
          rarityId,
          e.hp || e.health || 10,
          e.attack || 1,
          e.defense || 0,
          e.magic || e.magic_attack || 0,
          e.magic_defense || Math.floor((e.magic || 0) / 2),
          e.speed || 100,
          e.exp || e.experience_reward || 0,
          e.gold || e.gold_reward || 0,
          JSON.stringify(e.abilities || []),
          JSON.stringify(e.weaknesses || []),
          JSON.stringify(e.resistances || []),
          JSON.stringify(e.loot || e.loot_table || []),
          e.icon || null
        ]);
      } else {
        await this.query(`
          INSERT INTO enemies (
            name, display_name, description, type, level, rarity_id,
            health, attack, defense, magic_attack, magic_defense, speed,
            experience_reward, gold_reward,
            abilities, weaknesses, resistances, loot_table, icon
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        `, [
          enemyKeyName,
          e.name,
          e.description || '',
          e.type || 'beast',
          e.level || 1,
          rarityId,
          e.hp || e.health || 10,
          e.attack || 1,
          e.defense || 0,
          e.magic || e.magic_attack || 0,
          e.magic_defense || Math.floor((e.magic || 0) / 2),
          e.speed || 100,
          e.exp || e.experience_reward || 0,
          e.gold || e.gold_reward || 0,
          JSON.stringify(e.abilities || []),
          JSON.stringify(e.weaknesses || []),
          JSON.stringify(e.resistances || []),
          JSON.stringify(e.loot || e.loot_table || []),
          e.icon || null
        ]);
      }
    };

    if (enemies && typeof enemies === 'object') {
      for (const group of Object.values(enemies)) {
        if (Array.isArray(group)) {
          for (const e of group) await push(e);
        }
      }
    }
  }

  async run() {
    try {
      console.log('🌱 Seeding complet démarré...');
      // Ensure auth tables exist for email verification
      await this.query(`
        CREATE TABLE IF NOT EXISTS auth_codes (
          id SERIAL PRIMARY KEY,
          email VARCHAR(100) NOT NULL,
          code VARCHAR(10) NOT NULL,
          purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('register','login','verify')),
          expires_at TIMESTAMP NOT NULL,
          consumed_at TIMESTAMP,
          attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await this.query(`ALTER TABLE IF NOT EXISTS users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT false`);
      await this.query(`ALTER TABLE IF NOT EXISTS users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP`);
      await this.seedRarities();
      await this.seedItemTypes();
      await this.seedItems();
      await this.seedCharacterClasses();
      await this.seedDifficultiesAndDungeons();
      await this.seedQuests();
      await this.seedEnemies();
      console.log('✅ Seeding terminé avec succès.');
    } catch (err) {
      console.error('💥 Seeding échoué:', err);
      process.exitCode = 1;
    } finally {
      await this.pool.end();
    }
  }
}

if (require.main === module) {
  const seeder = new Seeder();
  seeder.run();
}


