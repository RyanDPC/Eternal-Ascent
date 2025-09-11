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
  const cols = Object.keys(row);
  const values = Object.values(row);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const updates = cols
    .filter(c => c !== uniqueCol)
    .map((c, i) => `${c} = EXCLUDED.${c}`)
    .join(', ');
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${uniqueCol}) DO UPDATE SET ${updates}`;
  await pool.query(sql, values);
}

async function insertIfNotExists(pool, table, match, row) {
  const cols = Object.keys(row);
  const values = Object.values(row);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const whereCols = Object.keys(match);
  const whereVals = Object.values(match);
  const whereClause = whereCols.map((c, i) => `${c} = $${cols.length + i + 1}`).join(' AND ');
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) SELECT ${placeholders} WHERE NOT EXISTS (SELECT 1 FROM ${table} WHERE ${whereClause})`;
  await pool.query(sql, [...values, ...whereVals]);
}

async function seedRarities(pool) {
  const data = [
    { name: 'common', display_name: 'Commune', color: '#9CA3AF', probability: 0.65, stat_multiplier: 1.00, description: 'Rareté de base', icon: 'rarity_common.png' },
    { name: 'uncommon', display_name: 'Peu Commune', color: '#10B981', probability: 0.25, stat_multiplier: 1.15, description: 'Améliorée', icon: 'rarity_uncommon.png' },
    { name: 'rare', display_name: 'Rare', color: '#3B82F6', probability: 0.08, stat_multiplier: 1.35, description: 'Rare de qualité', icon: 'rarity_rare.png' },
    { name: 'epic', display_name: 'Épique', color: '#8B5CF6', probability: 0.015, stat_multiplier: 1.65, description: 'Très puissant', icon: 'rarity_epic.png' },
    { name: 'legendary', display_name: 'Légendaire', color: '#F59E0B', probability: 0.004, stat_multiplier: 2.0, description: 'Extraordinaire', icon: 'rarity_legendary.png' },
    { name: 'mythic', display_name: 'Mythique', color: '#EF4444', probability: 0.001, stat_multiplier: 2.5, description: 'Inégalé', icon: 'rarity_mythic.png' }
  ];
  for (const r of data) {
    await upsertByUnique(pool, 'rarities', 'name', r);
  }
}

async function seedItemTypes(pool) {
  const data = [
    { name: 'sword', display_name: 'Épée', category: 'weapon', equip_slot: 'weapon', max_stack: 1, description: 'Arme de mêlée tranchante', icon: 'type_sword.png' },
    { name: 'armor', display_name: 'Armure', category: 'armor', equip_slot: 'chest', max_stack: 1, description: 'Protection corporelle', icon: 'type_armor.png' },
    { name: 'potion', display_name: 'Potion', category: 'consumable', equip_slot: null, max_stack: 20, description: 'Objet consommable', icon: 'type_potion.png' },
    { name: 'material', display_name: 'Matériau', category: 'material', equip_slot: null, max_stack: 999, description: 'Matériau de craft', icon: 'type_material.png' },
    { name: 'currency', display_name: 'Monnaie', category: 'currency', equip_slot: null, max_stack: 999999, description: 'Monnaies du jeu', icon: 'type_currency.png' },
    { name: 'special', display_name: 'Spécial', category: 'special', equip_slot: null, max_stack: 1, description: 'Objet spécial', icon: 'type_special.png' }
  ];
  for (const t of data) {
    await upsertByUnique(pool, 'item_types', 'name', t);
  }
}

async function seedDifficulties(pool) {
  const data = [
    { name: 'easy', display_name: 'Facile', color: '#10B981', icon: '★', description: 'Débutant', stat_multiplier: 1.00, exp_multiplier: 1.00, gold_multiplier: 1.00, order_index: 1 },
    { name: 'normal', display_name: 'Normal', color: '#F59E0B', icon: '★★', description: 'Équilibrée', stat_multiplier: 1.00, exp_multiplier: 1.20, gold_multiplier: 1.20, order_index: 2 },
    { name: 'hard', display_name: 'Difficile', color: '#EF4444', icon: '★★★', description: 'Expérimenté', stat_multiplier: 1.50, exp_multiplier: 1.50, gold_multiplier: 1.50, order_index: 3 }
  ];
  for (const d of data) {
    await upsertByUnique(pool, 'difficulties', 'name', d);
  }
}

async function seedCharacterClasses(pool) {
  const rarityMap = Object.fromEntries((await pool.query('SELECT id, name FROM rarities')).rows.map(r => [r.name, r.id]));
  const data = [
    {
      name: 'warrior', display_name: 'Guerrier', description: 'Combattant robuste', rarity_id: rarityMap.common, probability: 0.30,
      base_stats: { health: 150, mana: 50, attack: 25, defense: 20, magic_attack: 8, magic_defense: 10 },
      stat_ranges: { health: [140, 160], mana: [45, 55] }, starting_equipment: ['Épée de Fer', 'Armure de Cuir', 'Bottes de Cuir'], icon: 'warrior_icon'
    },
    {
      name: 'mage', display_name: 'Mage', description: 'Maîtrise de la magie', rarity_id: rarityMap.common, probability: 0.30,
      base_stats: { health: 100, mana: 120, attack: 12, defense: 15, magic_attack: 28, magic_defense: 22 },
      stat_ranges: { mana: [100, 130] }, starting_equipment: ['Bâton Simple', 'Robe'], icon: 'mage_icon'
    }
  ];
  for (const c of data) {
    await upsertByUnique(pool, 'character_classes', 'name', c);
  }
}

async function seedItems(pool) {
  const typeMap = Object.fromEntries((await pool.query('SELECT id, name FROM item_types')).rows.map(r => [r.name, r.id]));
  const rarityMap = Object.fromEntries((await pool.query('SELECT id, name FROM rarities')).rows.map(r => [r.name, r.id]));
  const data = [
    { name: 'iron_sword', display_name: 'Épée de Fer', description: 'Une épée basique en fer forgé', type_id: typeMap.sword, rarity_id: rarityMap.common, level_requirement: 1, base_stats: { attack: 25, durability: 100, speed: 12 }, stat_ranges: { attack: [23, 27] }, effects: [{ type: 'passive', name: 'sharpness', value: 5 }], icon: 'iron_sword_icon', image: 'iron_sword.png' },
    { name: 'leather_armor', display_name: 'Armure de Cuir', description: 'Protection légère', type_id: typeMap.armor, rarity_id: rarityMap.common, level_requirement: 1, base_stats: { defense: 10 }, stat_ranges: {}, effects: [], icon: 'leather_armor_icon', image: null },
    { name: 'health_potion', display_name: 'Potion de Soins', description: 'Restaure 50 PV', type_id: typeMap.potion, rarity_id: rarityMap.common, level_requirement: 1, base_stats: {}, stat_ranges: {}, effects: [{ type: 'instant', name: 'heal', healing: 50 }], icon: 'potion_health.png', image: null }
  ];
  for (const i of data) {
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
  const diffMap = Object.fromEntries((await pool.query('SELECT id, name FROM difficulties')).rows.map(r => [r.name, r.id]));
  const data = [
    { name: 'goblin_cave', display_name: 'Grotte des Gobelins', description: 'Une grotte sombre peuplée de gobelins', level_requirement: 3, difficulty_id: diffMap.easy, estimated_duration: 5, rewards: [{ type: 'experience', min: 150, max: 250 }], requirements: [{ type: 'level', value: 3 }], enemies: [{ name: 'goblin_warrior', level: 3, quantity: 2 }], icon: 'cave_icon', theme: 'cave' }
  ];
  for (const d of data) {
    await upsertByUnique(pool, 'dungeons', 'name', d);
  }
}

async function seedEnemies(pool) {
  const rarityMap = Object.fromEntries((await pool.query('SELECT id, name FROM rarities')).rows.map(r => [r.name, r.id]));
  const data = [
    { name: 'goblin_warrior', display_name: 'Gobelin Guerrier', description: 'Gobelin armé d\'une épée rouillée', type: 'humanoid', level: 2, rarity_id: rarityMap.common, health: 120, attack: 25, defense: 18, magic_attack: 8, magic_defense: 12, speed: 95, experience_reward: 25, gold_reward: 8, abilities: [], weaknesses: [{ element: 'fire', multiplier: 1.5 }], resistances: [{ element: 'earth', multiplier: 0.8 }], loot_table: [{ item_name: 'health_potion', chance: 0.3, quantity_min: 1, quantity_max: 2 }], icon: 'enemy_goblin_warrior.png' }
  ];
  for (const e of data) {
    await insertIfNotExists(pool, 'enemies', { name: e.name }, e);
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
    await seedRarities(pool);
    await seedItemTypes(pool);
    await seedDifficulties(pool);
    await seedCharacterClasses(pool);
    await seedItems(pool);
    await seedSkills(pool);
    await seedDungeons(pool);
    await seedEnemies(pool);
    await seedQuests(pool);
    console.log('✅ Seeding completed');
  } catch (e) {
    console.error('❌ Seeding failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) run();



