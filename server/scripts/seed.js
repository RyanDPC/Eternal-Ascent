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

async function upsertByUnique(pool, table, uniqueCol, row) {
  // Stringify JSON/array values to satisfy JSONB columns
  const normalized = {};
  for (const [k, v] of Object.entries(row)) {
    if (v !== null && typeof v === 'object') {
      normalized[k] = JSON.stringify(v);
    } else {
      normalized[k] = v;
    }
  }
  const cols = Object.keys(normalized);
  const values = Object.values(normalized);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const updates = cols
    .filter(c => c !== uniqueCol)
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(', ');
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${uniqueCol}) DO UPDATE SET ${updates}`;
  try {
    await pool.query(sql, values);
  } catch (e) {
    console.error(`🛑 upsertByUnique failed for table=${table} uniqueCol=${uniqueCol}`);
    console.error('Row:', JSON.stringify(row));
    throw e;
  }
}

async function insertIfNotExists(pool, table, match, row) {
  // Stringify JSON/array values to satisfy JSONB columns
  const normalized = {};
  for (const [k, v] of Object.entries(row)) {
    if (v !== null && typeof v === 'object') {
      normalized[k] = JSON.stringify(v);
    } else {
      normalized[k] = v;
    }
  }
  const cols = Object.keys(normalized);
  const values = Object.values(normalized);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const whereCols = Object.keys(match);
  const whereVals = Object.values(match);
  const whereClause = whereCols.map((c, i) => `${c} = $${cols.length + i + 1}`).join(' AND ');
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) SELECT ${placeholders} WHERE NOT EXISTS (SELECT 1 FROM ${table} WHERE ${whereClause})`;
  try {
    await pool.query(sql, [...values, ...whereVals]);
  } catch (e) {
    console.error(`🛑 insertIfNotExists failed for table=${table}`);
    console.error('Match:', JSON.stringify(match));
    console.error('Row:', JSON.stringify(row));
    throw e;
  }
}

async function seedRarities(pool) {
  const sidRarities = require('../data/sid/rarities');
  for (const r of sidRarities) {
    const row = {
      name: r.name,
      display_name: r.display_name,
      color: r.color,
      probability: r.probability,
      stat_multiplier: r.stat_multiplier,
      description: r.description,
      icon: r.icon
    };
    await upsertByUnique(pool, 'rarities', 'name', row);
  }
}

async function seedItemTypes(pool) {
  const data = [
    { name: 'weapon', display_name: 'Arme', category: 'weapon', equip_slot: 'weapon', max_stack: 1, description: 'Arme générique', icon: 'type_weapon.png' },
    { name: 'armor', display_name: 'Armure', category: 'armor', equip_slot: 'chest', max_stack: 1, description: 'Protection corporelle', icon: 'type_armor.png' },
    { name: 'helmet', display_name: 'Casque', category: 'armor', equip_slot: 'head', max_stack: 1, description: 'Protection de tête', icon: 'type_helmet.png' },
    { name: 'legs', display_name: 'Jambières', category: 'armor', equip_slot: 'legs', max_stack: 1, description: 'Protection des jambes', icon: 'type_legs.png' },
    { name: 'boots', display_name: 'Bottes', category: 'armor', equip_slot: 'boots', max_stack: 1, description: 'Protection des pieds', icon: 'type_boots.png' },
    { name: 'gloves', display_name: 'Gants', category: 'armor', equip_slot: 'gloves', max_stack: 1, description: 'Protection des mains', icon: 'type_gloves.png' },
    { name: 'shield', display_name: 'Bouclier', category: 'armor', equip_slot: 'accessory', max_stack: 1, description: 'Protection additionnelle', icon: 'type_shield.png' },
    { name: 'ring', display_name: 'Anneau', category: 'special', equip_slot: 'ring', max_stack: 2, description: 'Bijou anneau', icon: 'type_ring.png' },
    { name: 'necklace', display_name: 'Collier', category: 'special', equip_slot: 'necklace', max_stack: 1, description: 'Bijou collier', icon: 'type_necklace.png' },
    { name: 'accessory', display_name: 'Accessoire', category: 'special', equip_slot: 'accessory', max_stack: 1, description: 'Accessoire divers', icon: 'type_accessory.png' },
    { name: 'potion', display_name: 'Potion', category: 'consumable', equip_slot: null, max_stack: 99, description: 'Potion consommable', icon: 'type_potion.png' },
    { name: 'elixir', display_name: 'Élixir', category: 'consumable', equip_slot: null, max_stack: 99, description: 'Élixir consommable', icon: 'type_elixir.png' },
    { name: 'food', display_name: 'Nourriture', category: 'consumable', equip_slot: null, max_stack: 99, description: 'Nourriture', icon: 'type_food.png' },
    { name: 'consumable', display_name: 'Consommable', category: 'consumable', equip_slot: null, max_stack: 99, description: 'Objet consommable', icon: 'type_consumable.png' },
    { name: 'material', display_name: 'Matériau', category: 'material', equip_slot: null, max_stack: 999, description: 'Matériau de craft', icon: 'type_material.png' },
    { name: 'key', display_name: 'Clé', category: 'special', equip_slot: null, max_stack: 99, description: 'Clés de donjons', icon: 'type_key.png' },
    { name: 'scroll', display_name: 'Parchemin', category: 'special', equip_slot: null, max_stack: 99, description: 'Parchemin magique', icon: 'type_scroll.png' },
    { name: 'artifact', display_name: 'Artefact', category: 'special', equip_slot: null, max_stack: 1, description: 'Artefact unique', icon: 'type_artifact.png' },
    { name: 'special', display_name: 'Spécial', category: 'special', equip_slot: null, max_stack: 1, description: 'Objet spécial', icon: 'type_special.png' },
    { name: 'tool', display_name: 'Outil', category: 'special', equip_slot: null, max_stack: 99, description: 'Outil utilitaire', icon: 'type_tool.png' },
    { name: 'currency', display_name: 'Monnaie', category: 'currency', equip_slot: null, max_stack: 999999, description: 'Monnaies du jeu', icon: 'type_currency.png' }
  ];
  for (const t of data) {
    await upsertByUnique(pool, 'item_types', 'name', t);
  }
}

async function seedDifficulties(pool) {
  const sidDiffs = require('../data/sid/difficulties');
  const all = sidDiffs.getAllDifficulties();
  for (const d of all) {
    const row = {
      name: d.name,
      display_name: d.display_name,
      color: d.color,
      icon: d.icon,
      description: d.description,
      stat_multiplier: d.stat_multiplier,
      exp_multiplier: d.exp_multiplier,
      gold_multiplier: d.gold_multiplier,
      order_index: d.order
    };
    await upsertByUnique(pool, 'difficulties', 'name', row);
  }
}

async function seedCharacterClasses(pool) {
  const sidClasses = require('../data/sid/character_classes');
  const rarityRows = (await pool.query('SELECT id, name FROM rarities')).rows;
  const rarityMap = Object.fromEntries(rarityRows.map(r => [r.name, r.id]));
  for (const c of sidClasses) {
    const row = {
      name: c.name,
      display_name: c.display_name,
      description: c.description,
      rarity_id: rarityMap[c.rarity] || rarityMap.common,
      probability: c.probability || 0.01,
      base_stats: {},
      stat_ranges: c.stat_ranges || {},
      unique_perk: c.unique_perk || null,
      starting_equipment: c.starting_equipment || [],
      icon: c.icon || null
    };
    await upsertByUnique(pool, 'character_classes', 'name', row);
  }
}

async function seedItems(pool) {
  const consumables = require('../data/sid/consumables');
  const materials = require('../data/sid/materials');
  const specials = require('../data/sid/special_items');
  const currency = require('../data/sid/currency');
  const sidItems = require('../data/sid/items');

  const typeRows = (await pool.query('SELECT id, name FROM item_types')).rows;
  const rarityRows = (await pool.query('SELECT id, name FROM rarities')).rows;
  const typeMap = Object.fromEntries(typeRows.map(r => [r.name, r.id]));
  const rarityMap = Object.fromEntries(rarityRows.map(r => [r.name, r.id]));

  const normalizeType = (t) => {
    if (!t) return 'special';
    const x = String(t).toLowerCase();
    if (['sword','bow','staff','dagger','weapon'].includes(x)) return 'weapon';
    if (['armor','chest','robe'].includes(x)) return 'armor';
    if (['helmet','head'].includes(x)) return 'helmet';
    if (['legs','pants'].includes(x)) return 'legs';
    if (['boots'].includes(x)) return 'boots';
    if (['gloves'].includes(x)) return 'gloves';
    if (['shield'].includes(x)) return 'shield';
    if (['ring'].includes(x)) return 'ring';
    if (['necklace','amulet'].includes(x)) return 'necklace';
    if (['accessory'].includes(x)) return 'accessory';
    if (['potion','elixir','food','consumable'].includes(x)) return x;
    if (['material'].includes(x)) return 'material';
    if (['key','scroll','artifact','special','tool'].includes(x)) return x;
    return 'special';
  };

  const toItemRow = (src, typeName) => ({
    name: src.id || src.name,
    display_name: src.display_name || src.name || src.id,
    description: src.description,
    type_id: typeMap[normalizeType(typeName || src.type)] || typeMap.special,
    rarity_id: rarityMap[src.rarity] || rarityMap.common,
    level_requirement: src.level_requirement || 1,
    base_stats: src.base_stats || {},
    stat_ranges: src.stat_ranges || {},
    effects: Array.isArray(src.effects) ? src.effects : (src.effects ? [src.effects] : []),
    icon: src.icon || null,
    image: null
  });

  const all = [];
  for (const c of consumables) {
    const kind = c.type === 'elixir' ? 'elixir' : (c.type === 'food' ? 'food' : (c.type === 'potion' ? 'potion' : 'potion'));
    all.push(toItemRow(c, kind));
  }
  for (const m of materials) {
    all.push(toItemRow(m, 'material'));
  }
  for (const s of specials) {
    const kind = ['key','scroll','artifact','special'].includes(s.type) ? s.type : 'special';
    all.push(toItemRow(s, kind));
  }
  for (const curr of currency) {
    all.push(toItemRow(curr, 'currency'));
  }

  // Import main items dataset (weapons, armors, etc.)
  if (Array.isArray(sidItems)) {
    for (const it of sidItems) {
      all.push(toItemRow(it, it.type));
    }
  }

  for (const i of all) {
    await upsertByUnique(pool, 'items', 'name', i);
  }
}

async function seedSkills(pool) {
  const data = [
    { name: 'basic_attack', display_name: 'Attaque Basique', description: 'Une attaque simple', type: 'offensive', class: 'warrior', available_classes: ['warrior'], level_requirement: 1, mana_cost: 0, cooldown: 1, damage: { base: 50, scaling: 'attack', multiplier: 1.0 }, healing: null, shield: null, buffs: null, debuffs: null, effects: [{ type: 'damage', base_damage: 50 }], duration: null, icon: '⚔️', animation: 'sword_attack' },
    { name: 'power_strike', display_name: 'Frappe Puissante', description: 'Attaque chargée', type: 'offensive', class: 'warrior', available_classes: ['warrior'], level_requirement: 3, mana_cost: 15, cooldown: 5, damage: { base: 180, scaling: 'attack', multiplier: 1.5 }, healing: null, shield: null, buffs: null, debuffs: { stun: { duration: 1.5, probability: 0.3 } }, effects: [{ type: 'damage', base_damage: 180 }], duration: null, icon: '💥', animation: 'power_strike' },
    { name: 'fireball', display_name: 'Boule de Feu', description: 'Projette une boule de feu', type: 'offensive', class: 'mage', available_classes: ['mage'], level_requirement: 3, mana_cost: 20, cooldown: 4, damage: { base: 120, scaling: 'magic_attack', multiplier: 1.3 }, healing: null, shield: null, buffs: null, debuffs: null, effects: [{ type: 'damage', base_damage: 120 }], duration: null, icon: '🔥', animation: 'cast_fireball' }
  ];
  for (const s of data) {
    await upsertByUnique(pool, 'skills', 'name', s);
  }
}

async function seedDungeons(pool) {
  const sidDungeons = require('../data/sid/dungeons');
  const diffRows = (await pool.query('SELECT id, name FROM difficulties')).rows;
  const diffMap = Object.fromEntries(diffRows.map(r => [r.name, r.id]));

  const generated = sidDungeons.getDungeons();
  for (const d of generated) {
    const minutes = (() => {
      const v = d.estimated_duration;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const m = v.match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 10;
      }
      return 10;
    })();

    const rewards = [
      d.exp_reward != null ? { type: 'experience', value: d.exp_reward } : null,
      d.gold_reward != null ? { type: 'gold', value: d.gold_reward } : null,
      d.rewards ? { type: 'bundle', loot: d.rewards } : null
    ].filter(Boolean);

    const requirements = Array.isArray(d.requirements)
      ? d.requirements
      : (d.requirements && d.requirements.level ? [{ type: 'level', value: d.requirements.level }] : []);

    const row = {
      name: d.name,
      display_name: d.display_name,
      description: d.description,
      level_requirement: d.level_requirement || (d.requirements && d.requirements.level) || 1,
      difficulty_id: diffMap[d.difficulty] || null,
      estimated_duration: minutes,
      rewards,
      requirements,
      enemies: Array.isArray(d.enemies) ? d.enemies : [],
      icon: d.icon || null,
      theme: d.theme || null
    };

    if (!row.difficulty_id) continue; // skip if diff missing
    await upsertByUnique(pool, 'dungeons', 'name', row);
  }
}

async function seedEnemies(pool) {
  const sidEnemies = require('../data/sid/enemies');
  const rarityMap = Object.fromEntries((await pool.query('SELECT id, name FROM rarities')).rows.map(r => [r.name, r.id]));

  const collect = [].concat(
    sidEnemies.beginnerEnemies || [],
    sidEnemies.intermediateEnemies || [],
    sidEnemies.bosses || [],
    sidEnemies.legendaryEnemies || [],
    sidEnemies.eternalEnemies || []
  );

  for (const e of collect) {
    const row = {
      name: e.id || e.name,
      display_name: e.name || e.display_name || (e.id || '').replace(/_/g, ' '),
      description: e.description || null,
      type: e.type || 'beast',
      level: e.level || 1,
      rarity_id: rarityMap[e.rarity] || rarityMap.common,
      health: e.hp || e.health || 100,
      attack: e.attack || 10,
      defense: e.defense || 10,
      magic_attack: e.magic || e.magic_attack || 0,
      magic_defense: e.magic_defense || 0,
      speed: e.speed || 100,
      experience_reward: e.exp || e.experience || e.experience_reward || 0,
      gold_reward: e.gold || e.gold_reward || 0,
      abilities: Array.isArray(e.abilities) ? e.abilities : [],
      weaknesses: Array.isArray(e.weaknesses) ? e.weaknesses : [],
      resistances: Array.isArray(e.resistances) ? e.resistances : [],
      loot_table: Array.isArray(e.loot) ? e.loot : (Array.isArray(e.loot_table) ? e.loot_table : []),
      icon: e.icon || null
    };
    await insertIfNotExists(pool, 'enemies', { name: row.name }, row);
  }
}

async function seedQuests(pool) {
  const data = [
    { title: 'Premiers Pas', description: 'Tuez 5 gobelins', type: 'main', level_requirement: 1, rewards: [{ type: 'experience', value: 100 }], requirements: [{ type: 'level', value: 1 }], objectives: [{ type: 'kill', target: 'goblins', quantity: 5 }], icon: 'quest_first_steps.png' }
  ];
  for (const q of data) {
    await insertIfNotExists(pool, 'quests', { title: q.title, type: q.type }, q);
  }
}

async function run() {
  const pool = new Pool(getDbConfig());
  try {
    console.log('🌱 Seeding database (idempotent)...');
    console.log('→ rarities');
    await seedRarities(pool); // from SID
    console.log('→ item_types');
    await seedItemTypes(pool); // extended types
    console.log('→ difficulties');
    await seedDifficulties(pool); // from SID (19)
    console.log('→ character_classes');
    await seedCharacterClasses(pool); // simple demo classes
    console.log('→ items');
    await seedItems(pool); // from SID consumables/materials/special/currency
    console.log('→ skills');
    await seedSkills(pool); // demo skills (kept)
    console.log('→ enemies');
    await seedEnemies(pool); // from SID
    console.log('→ dungeons');
    await seedDungeons(pool); // from SID generator
    console.log('→ quests');
    await seedQuests(pool);

    // Activity events (optional, idempotent)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_events (
        id SERIAL PRIMARY KEY,
        character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
        type VARCHAR(40) NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_activity_events_character_id_created_at ON activity_events(character_id, created_at DESC);
    `);
    const chr = await pool.query('SELECT id FROM characters ORDER BY id LIMIT 1');
    if (chr.rows.length) {
      const cid = chr.rows[0].id;
      await pool.query(
        `INSERT INTO activity_events (character_id, type, description, metadata, created_at)
         SELECT $1, x.type, x.description, x.metadata::jsonb, NOW() - (x.idx || ' minutes')::interval
         FROM (VALUES
           (1, 'character_created', 'Personnage créé', '{}'),
           (5, 'login', 'Connexion au jeu', '{}'),
           (15, 'quest_progress', 'Progression de quête', '{"quest":"Premiers Pas"}')
         ) AS x(idx, type, description, metadata)
         WHERE NOT EXISTS (
           SELECT 1 FROM activity_events ae WHERE ae.character_id = $1 AND ae.type = x.type AND ae.description = x.description
         )
        `,
        [cid]
      );
    }

    console.log('✅ Seeding completed');
  } catch (e) {
    console.error('❌ Seeding failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) run();

