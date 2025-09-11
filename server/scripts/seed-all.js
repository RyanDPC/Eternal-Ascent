#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Import des données existantes
const skillManager = require('../data/sid/skills');
const characterClasses = require('../data/sid/character_classes');
const rarities = require('../data/sid/rarities');
const difficulties = require('../data/sid/difficulties');
const dungeons = require('../data/sid/dungeons');
const items = require('../data/sid/items');
const enemies = require('../data/sid/enemies');
const quests = require('../data/sid/quests');
const talents = require('../data/sid/talents');
const guilds = require('../data/sid/guilds');
const consumables = require('../data/sid/consumables');
const currency = require('../data/sid/currency');
const equipments = require('../data/sid/equipments');
const materials = require('../data/sid/materials');
const specialItems = require('../data/sid/special_items');

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

async function checkTableExists(pool, tableName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);
  return result.rows[0].exists;
}

async function seedSkills(pool) {
  try {
    console.log('🌱 Seeding skills...');
    
    if (!(await checkTableExists(pool, 'skills'))) {
      console.log('⚠️ Table skills does not exist, skipping...');
      return;
    }
    
    await pool.query('DELETE FROM skills');
    console.log('🗑️ Cleared existing skills');
    
    const skills = skillManager.getAllSkills();
    
    for (const skill of skills) {
      await pool.query(`
        INSERT INTO skills (
          name, display_name, description, type, class, available_classes,
          level_requirement, mana_cost, cooldown, damage, healing, shield,
          buffs, debuffs, effects, duration, icon, animation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        skill.name,
        skill.display_name,
        skill.description,
        skill.type,
        skill.class,
        JSON.stringify(skill.available_classes),
        skill.level_requirement,
        skill.mana_cost,
        skill.cooldown,
        skill.damage ? JSON.stringify(skill.damage) : null,
        skill.healing ? JSON.stringify(skill.healing) : null,
        skill.shield ? JSON.stringify(skill.shield) : null,
        skill.buffs ? JSON.stringify(skill.buffs) : null,
        skill.debuffs ? JSON.stringify(skill.debuffs) : null,
        JSON.stringify(skill.effects),
        skill.duration,
        skill.icon,
        skill.animation
      ]);
    }
    
    console.log(`✅ Successfully seeded ${skills.length} skills`);
    
  } catch (error) {
    console.error('❌ Error seeding skills:', error);
    throw error;
  }
}

async function seedItemTypes(pool) {
  try {
    console.log('🌱 Seeding item types...');
    
    if (!(await checkTableExists(pool, 'item_types'))) {
      console.log('⚠️ Table item_types does not exist, skipping...');
      return;
    }
    
    await pool.query('DELETE FROM item_types');
    console.log('🗑️ Cleared existing item types');
    
    const itemTypes = [
      { name: 'weapon', display_name: 'Arme', category: 'weapon', equip_slot: 'weapon', max_stack: 1, description: 'Armes de combat' },
      { name: 'armor', display_name: 'Armure', category: 'armor', equip_slot: 'chest', max_stack: 1, description: 'Protection corporelle' },
      { name: 'consumable', display_name: 'Consommable', category: 'consumable', equip_slot: null, max_stack: 99, description: 'Objets à usage unique' },
      { name: 'material', display_name: 'Matériau', category: 'material', equip_slot: null, max_stack: 999, description: 'Matériaux de craft' },
      { name: 'currency', display_name: 'Monnaie', category: 'currency', equip_slot: null, max_stack: 999999, description: 'Monnaies du jeu' },
      { name: 'special', display_name: 'Spécial', category: 'special', equip_slot: null, max_stack: 1, description: 'Objets spéciaux' }
    ];
    
    for (const itemType of itemTypes) {
      await pool.query(`
        INSERT INTO item_types (name, display_name, category, equip_slot, max_stack, description)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        itemType.name,
        itemType.display_name,
        itemType.category,
        itemType.equip_slot,
        itemType.max_stack,
        itemType.description
      ]);
    }
    
    console.log(`✅ Successfully seeded ${itemTypes.length} item types`);
    
  } catch (error) {
    console.error('❌ Error seeding item types:', error);
    throw error;
  }
}

async function seedRarities(pool) {
  try {
    console.log('🌱 Seeding rarities...');
    
    if (!(await checkTableExists(pool, 'rarities'))) {
      console.log('⚠️ Table rarities does not exist, skipping...');
      return;
    }
    
    await pool.query('DELETE FROM rarities');
    console.log('🗑️ Cleared existing rarities');
    
    for (const rarity of rarities) {
      await pool.query(`
        INSERT INTO rarities (name, display_name, color, probability, stat_multiplier, description, icon)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        rarity.name,
        rarity.display_name,
        rarity.color,
        rarity.probability,
        rarity.stat_multiplier,
        rarity.description,
        rarity.icon
      ]);
    }
    
    console.log(`✅ Successfully seeded ${rarities.length} rarities`);
    
  } catch (error) {
    console.error('❌ Error seeding rarities:', error);
    throw error;
  }
}

async function seedCharacterClasses(pool) {
  try {
    console.log('🌱 Seeding character classes...');
    
    if (!(await checkTableExists(pool, 'character_classes'))) {
      console.log('⚠️ Table character_classes does not exist, skipping...');
      return;
    }
    
    await pool.query('DELETE FROM character_classes');
    console.log('🗑️ Cleared existing character classes');
    
    // Récupérer les IDs des rarités
    const rarityMap = {};
    const rarityResult = await pool.query('SELECT id, name FROM rarities');
    rarityResult.rows.forEach(row => {
      rarityMap[row.name] = row.id;
    });
    
    for (const charClass of characterClasses) {
      const rarityId = rarityMap[charClass.rarity];
      if (!rarityId) {
        console.warn(`⚠️ Rarity '${charClass.rarity}' not found for class '${charClass.name}', skipping...`);
        continue;
      }
      
      await pool.query(`
        INSERT INTO character_classes (name, display_name, description, rarity_id, probability, base_stats, stat_ranges, starting_equipment, icon)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        charClass.name,
        charClass.display_name,
        charClass.description,
        rarityId,
        charClass.probability,
        JSON.stringify(charClass.base_stats),
        JSON.stringify(charClass.stat_ranges),
        JSON.stringify(charClass.starting_equipment),
        charClass.icon
      ]);
    }
    
    console.log(`✅ Successfully seeded ${characterClasses.length} character classes`);
    
  } catch (error) {
    console.error('❌ Error seeding character classes:', error);
    throw error;
  }
}

async function seedDifficulties(pool) {
  try {
    console.log('🌱 Seeding difficulties...');
    
    if (!(await checkTableExists(pool, 'difficulties'))) {
      console.log('⚠️ Table difficulties does not exist, skipping...');
      return;
    }
    
    await pool.query('DELETE FROM difficulties');
    console.log('🗑️ Cleared existing difficulties');
    
    const difficultiesData = difficulties.getAllDifficulties();
    
    for (const difficulty of difficultiesData) {
      await pool.query(`
        INSERT INTO difficulties (name, display_name, color, icon, description, stat_multiplier, exp_multiplier, gold_multiplier, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        difficulty.name,
        difficulty.display_name,
        difficulty.color,
        difficulty.icon,
        difficulty.description,
        difficulty.stat_multiplier,
        difficulty.exp_multiplier,
        difficulty.gold_multiplier,
        difficulty.order
      ]);
    }
    
    console.log(`✅ Successfully seeded ${difficultiesData.length} difficulties`);
    
  } catch (error) {
    console.error('❌ Error seeding difficulties:', error);
    throw error;
  }
}

async function seedDungeons(pool) {
  try {
    console.log('🌱 Seeding dungeons...');
    
    if (!(await checkTableExists(pool, 'dungeons'))) {
      console.log('⚠️ Table dungeons does not exist, skipping...');
      return;
    }
    
    await pool.query('DELETE FROM dungeons');
    console.log('🗑️ Cleared existing dungeons');
    
    const dungeonsData = dungeons.getDungeons();
    
    // Récupérer les IDs des difficultés
    const difficultyMap = {};
    const difficultyResult = await pool.query('SELECT id, name FROM difficulties');
    difficultyResult.rows.forEach(row => {
      difficultyMap[row.name] = row.id;
    });
    
    for (const dungeon of dungeonsData) {
      const difficultyId = difficultyMap[dungeon.difficulty];
      if (!difficultyId) {
        console.warn(`⚠️ Difficulty '${dungeon.difficulty}' not found for dungeon '${dungeon.name}', skipping...`);
        continue;
      }
      
      await pool.query(`
        INSERT INTO dungeons (name, display_name, description, level_requirement, difficulty_id, estimated_duration, rewards, requirements, enemies, icon, theme)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        dungeon.name,
        dungeon.display_name,
        dungeon.description,
        dungeon.level_requirement,
        difficultyId,
        dungeon.estimated_duration,
        JSON.stringify(dungeon.rewards || []),
        JSON.stringify(Array.isArray(dungeon.requirements) ? dungeon.requirements : []),
        JSON.stringify(dungeon.enemies || []),
        dungeon.icon,
        dungeon.theme
      ]);
    }
    
    console.log(`✅ Successfully seeded ${dungeonsData.length} dungeons`);
    
  } catch (error) {
    console.error('❌ Error seeding dungeons:', error);
    throw error;
  }
}

async function seedItems(pool) {
  try {
    console.log('🌱 Seeding items...');
    
    if (!(await checkTableExists(pool, 'items'))) {
      console.log('⚠️ Table items does not exist, skipping...');
      return;
    }
    
    await pool.query('DELETE FROM items');
    console.log('🗑️ Cleared existing items');
    
    // Récupérer les IDs des types et rarités
    const typeMap = {};
    const rarityMap = {};
    
    const typeResult = await pool.query('SELECT id, name FROM item_types');
    typeResult.rows.forEach(row => {
      typeMap[row.name] = row.id;
    });
    
    const rarityResult = await pool.query('SELECT id, name FROM rarities');
    rarityResult.rows.forEach(row => {
      rarityMap[row.name] = row.id;
    });
    
    // Récupérer tous les items de toutes les catégories
    const itemsData = [];
    Object.values(items).forEach(category => {
      if (Array.isArray(category)) {
        itemsData.push(...category);
      }
    });
    
    for (const item of itemsData) {
      const typeId = typeMap[item.type] || 1; // Fallback to first type
      const rarityId = rarityMap[item.rarity] || 1; // Fallback to first rarity
      
      await pool.query(`
        INSERT INTO items (name, display_name, description, type_id, rarity_id, level_requirement, base_stats, stat_ranges, effects, icon, image)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          type_id = EXCLUDED.type_id,
          rarity_id = EXCLUDED.rarity_id,
          level_requirement = EXCLUDED.level_requirement,
          base_stats = EXCLUDED.base_stats,
          stat_ranges = EXCLUDED.stat_ranges,
          effects = EXCLUDED.effects,
          icon = EXCLUDED.icon,
          image = EXCLUDED.image,
          updated_at = CURRENT_TIMESTAMP
      `, [
        item.id, // Utiliser l'id unique au lieu du name
        item.name, // display_name = name pour les items
        item.description,
        typeId,
        rarityId,
        item.level || 1, // level_requirement = level
        JSON.stringify(item.stats || {}), // base_stats = stats
        JSON.stringify({}), // stat_ranges vide pour l'instant
        JSON.stringify([item.effect || '']), // effects = effect
        item.icon,
        item.image || null
      ]);
    }
    
    console.log(`✅ Successfully seeded ${itemsData.length} items`);
    
  } catch (error) {
    console.error('❌ Error seeding items:', error);
    throw error;
  }
}

async function seedEnemies(pool) {
  try {
    console.log('🌱 Seeding enemies...');
    
    if (!(await checkTableExists(pool, 'enemies'))) {
      console.log('⚠️ Table enemies does not exist, skipping...');
      return;
    }
    
    await pool.query('DELETE FROM enemies');
    console.log('🗑️ Cleared existing enemies');
    
    // Récupérer les IDs des rarités
    const rarityMap = {};
    const rarityResult = await pool.query('SELECT id, name FROM rarities');
    rarityResult.rows.forEach(row => {
      rarityMap[row.name] = row.id;
    });
    
    // Récupérer tous les ennemis de toutes les catégories
    const enemiesData = [];
    Object.values(enemies).forEach(category => {
      if (Array.isArray(category)) {
        enemiesData.push(...category);
      }
    });
    
    for (const enemy of enemiesData) {
      const rarityId = rarityMap[enemy.rarity] || 1; // Fallback to first rarity
      
      await pool.query(`
        INSERT INTO enemies (name, display_name, description, type, level, rarity_id, health, attack, defense, magic_attack, magic_defense, speed, experience_reward, gold_reward, abilities, weaknesses, resistances, loot_table, icon)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        enemy.id, // Utiliser l'id unique
        enemy.name, // display_name = name pour les ennemis
        enemy.description,
        enemy.type,
        enemy.level,
        rarityId,
        enemy.hp, // health = hp
        enemy.attack,
        enemy.defense,
        enemy.magic || 0, // magic_attack = magic
        enemy.magic || 0, // magic_defense = magic
        enemy.speed || 100,
        enemy.exp || 0, // experience_reward = exp
        enemy.gold || 0, // gold_reward = gold
        JSON.stringify(enemy.abilities || []),
        JSON.stringify(enemy.weaknesses || []),
        JSON.stringify(enemy.resistances || []),
        JSON.stringify(enemy.loot || []), // loot_table = loot
        enemy.icon
      ]);
    }
    
    console.log(`✅ Successfully seeded ${enemiesData.length} enemies`);
    
  } catch (error) {
    console.error('❌ Error seeding enemies:', error);
    throw error;
  }
}

async function seedQuests(pool) {
  try {
    console.log('🌱 Seeding quests...');
    
    if (!(await checkTableExists(pool, 'quests'))) {
      console.log('⚠️ Table quests does not exist, skipping...');
      return;
    }
    
    await pool.query('DELETE FROM quests');
    console.log('🗑️ Cleared existing quests');
    
    const questsData = quests;
    const allowedTypes = new Set(['main','side','daily','weekly','guild','event']);
    
    for (const quest of questsData) {
      const requirements = Array.isArray(quest.requirements)
        ? quest.requirements
        : (quest.requirements ? [quest.requirements] : []);
      const rewards = Array.isArray(quest.rewards)
        ? quest.rewards
        : (quest.rewards ? [quest.rewards] : []);
      await pool.query(`
        INSERT INTO quests (title, description, type, level_requirement, rewards, requirements, objectives, icon)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        quest.title,
        quest.description,
        allowedTypes.has(quest.type) ? quest.type : 'side',
        quest.level_requirement || 1,
        JSON.stringify(rewards),
        JSON.stringify(requirements),
        JSON.stringify(Array.isArray(quest.objectives) ? quest.objectives : []),
        quest.icon
      ]);
    }
    
    console.log(`✅ Successfully seeded ${questsData.length} quests`);
    
  } catch (error) {
    console.error('❌ Error seeding quests:', error);
    throw error;
  }
}

async function run() {
  const pool = new Pool(getDbConfig());
  try {
    console.log('🚀 Starting comprehensive data seeding...');
    
    // Seed dans l'ordre des dépendances
    await seedItemTypes(pool);
    await seedRarities(pool);
    await seedCharacterClasses(pool);
    await seedDifficulties(pool);
    await seedSkills(pool);
    await seedDungeons(pool);
    await seedItems(pool);
    await seedEnemies(pool);
    await seedQuests(pool);
    
    console.log('✅ All seeding completed successfully!');
    console.log('🎯 Database is now fully populated with all static data');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  run();
}
