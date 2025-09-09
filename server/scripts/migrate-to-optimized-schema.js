#!/usr/bin/env node

/**
 * Script de migration vers le schéma optimisé
 * 
 * Ce script :
 * 1. Sauvegarde les données existantes
 * 2. Crée le nouveau schéma optimisé
 * 3. Migre les données avec validation
 * 4. Vérifie l'intégrité des données
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration de la base de données
const pool = new Pool({
  host: process.env.DB_HOST || 'dpg-d2jnela4d50c73891omg-a.frankfurt-postgres.render.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'eterna',
  user: process.env.DB_USER || 'eterna_user',
  password: process.env.DB_PASSWORD || 'u5K6UbCBstAUIXvuIEqlaC7ZyHUor79G',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class SchemaMigrator {
  constructor() {
    this.migrationLog = [];
    this.dataBackup = {};
  }

  /**
   * Log une étape de migration
   */
  log(step, message, success = true) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      step,
      message,
      success
    };
    
    this.migrationLog.push(logEntry);
    console.log(`${success ? '✅' : '❌'} [${step}] ${message}`);
  }

  /**
   * Sauvegarde les données existantes
   */
  async backupExistingData() {
    console.log('💾 Sauvegarde des données existantes...');
    
    const tables = [
      'users', 'characters', 'character_classes', 'rarities', 'item_types', 
      'items', 'character_inventory', 'dungeons', 'quests', 'enemies',
      'character_dungeons', 'character_quests', 'guilds', 'guild_members'
    ];

    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT * FROM ${table}`);
        this.dataBackup[table] = result.rows;
        this.log('BACKUP', `Table ${table}: ${result.rows.length} enregistrements sauvegardés`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          this.log('BACKUP', `Table ${table}: n'existe pas (ignorée)`);
        } else {
          this.log('BACKUP', `Erreur table ${table}: ${error.message}`, false);
        }
      }
    }
  }

  /**
   * Crée le nouveau schéma optimisé
   */
  async createOptimizedSchema() {
    console.log('🏗️ Création du schéma optimisé...');
    
    try {
      const schemaPath = path.join(__dirname, '..', 'database-schema-optimized.sql');
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      
      await pool.query(schemaSQL);
      this.log('SCHEMA', 'Schéma optimisé créé avec succès');
    } catch (error) {
      this.log('SCHEMA', `Erreur création schéma: ${error.message}`, false);
      throw error;
    }
  }

  /**
   * Migre les données vers le nouveau schéma
   */
  async migrateData() {
    console.log('🔄 Migration des données...');
    
    // 1. Migrer les raretés
    await this.migrateRarities();
    
    // 2. Migrer les types d'objets
    await this.migrateItemTypes();
    
    // 3. Migrer les classes de personnages
    await this.migrateCharacterClasses();
    
    // 4. Migrer les difficultés
    await this.migrateDifficulties();
    
    // 5. Migrer les utilisateurs
    await this.migrateUsers();
    
    // 6. Migrer les objets
    await this.migrateItems();
    
    // 7. Migrer les personnages
    await this.migrateCharacters();
    
    // 8. Migrer l'inventaire
    await this.migrateInventory();
    
    // 9. Migrer les donjons
    await this.migrateDungeons();
    
    // 10. Migrer les quêtes
    await this.migrateQuests();
    
    // 11. Migrer les ennemis
    await this.migrateEnemies();
    
    // 12. Migrer les guildes
    await this.migrateGuilds();
  }

  /**
   * Migre les raretés
   */
  async migrateRarities() {
    if (!this.dataBackup.rarities) return;
    
    for (const rarity of this.dataBackup.rarities) {
      try {
        await pool.query(`
          INSERT INTO rarities (name, display_name, color, probability, stat_multiplier, description, icon)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          rarity.name, rarity.display_name, rarity.color, 
          rarity.probability, rarity.stat_multiplier, rarity.description, rarity.icon
        ]);
      } catch (error) {
        this.log('MIGRATE', `Erreur rareté ${rarity.name}: ${error.message}`, false);
      }
    }
    
    this.log('MIGRATE', `Raretés migrées: ${this.dataBackup.rarities.length}`);
  }

  /**
   * Migre les types d'objets
   */
  async migrateItemTypes() {
    // Créer les types d'objets de base
    const itemTypes = [
      { name: 'weapon', display_name: 'Arme', category: 'weapon', equip_slot: 'weapon', max_stack: 1 },
      { name: 'helmet', display_name: 'Casque', category: 'armor', equip_slot: 'head', max_stack: 1 },
      { name: 'chest', display_name: 'Armure', category: 'armor', equip_slot: 'chest', max_stack: 1 },
      { name: 'legs', display_name: 'Jambières', category: 'armor', equip_slot: 'legs', max_stack: 1 },
      { name: 'boots', display_name: 'Bottes', category: 'armor', equip_slot: 'boots', max_stack: 1 },
      { name: 'gloves', display_name: 'Gants', category: 'armor', equip_slot: 'gloves', max_stack: 1 },
      { name: 'accessory', display_name: 'Accessoire', category: 'equipment', equip_slot: 'accessory', max_stack: 1 },
      { name: 'potion', display_name: 'Potion', category: 'consumable', equip_slot: null, max_stack: 99 },
      { name: 'elixir', display_name: 'Élixir', category: 'consumable', equip_slot: null, max_stack: 50 },
      { name: 'food', display_name: 'Nourriture', category: 'consumable', equip_slot: null, max_stack: 99 },
      { name: 'material', display_name: 'Matériau', category: 'material', equip_slot: null, max_stack: 999 },
      { name: 'currency', display_name: 'Monnaie', category: 'currency', equip_slot: null, max_stack: 999999 },
      { name: 'key', display_name: 'Clé', category: 'special', equip_slot: null, max_stack: 10 },
      { name: 'scroll', display_name: 'Parchemin', category: 'special', equip_slot: null, max_stack: 5 },
      { name: 'artifact', display_name: 'Artefact', category: 'special', equip_slot: null, max_stack: 1 }
    ];

    for (const itemType of itemTypes) {
      try {
        await pool.query(`
          INSERT INTO item_types (name, display_name, category, equip_slot, max_stack, description, icon)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          itemType.name, itemType.display_name, itemType.category, 
          itemType.equip_slot, itemType.max_stack, 
          `Description pour ${itemType.display_name}`, `${itemType.name}_icon`
        ]);
      } catch (error) {
        this.log('MIGRATE', `Erreur type ${itemType.name}: ${error.message}`, false);
      }
    }
    
    this.log('MIGRATE', `Types d'objets créés: ${itemTypes.length}`);
  }

  /**
   * Migre les classes de personnages
   */
  async migrateCharacterClasses() {
    if (!this.dataBackup.character_classes) return;
    
    // Récupérer l'ID de la rareté commune
    const commonRarity = await pool.query("SELECT id FROM rarities WHERE name = 'common'");
    const commonRarityId = commonRarity.rows[0]?.id || 1;
    
    for (const charClass of this.dataBackup.character_classes) {
      try {
        // Déterminer la rareté
        let rarityId = commonRarityId;
        if (charClass.rarity) {
          const rarityResult = await pool.query("SELECT id FROM rarities WHERE name = $1", [charClass.rarity]);
          if (rarityResult.rows.length > 0) {
            rarityId = rarityResult.rows[0].id;
          }
        }
        
        await pool.query(`
          INSERT INTO character_classes (name, display_name, description, rarity_id, probability, base_stats, stat_ranges, starting_equipment, icon)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          charClass.name, charClass.display_name, charClass.description, rarityId,
          charClass.probability, JSON.stringify(charClass.base_stats), 
          JSON.stringify(charClass.stat_ranges), JSON.stringify(charClass.starting_equipment), charClass.icon
        ]);
      } catch (error) {
        this.log('MIGRATE', `Erreur classe ${charClass.name}: ${error.message}`, false);
      }
    }
    
    this.log('MIGRATE', `Classes migrées: ${this.dataBackup.character_classes.length}`);
  }

  /**
   * Migre les difficultés
   */
  async migrateDifficulties() {
    const difficulties = [
      { name: 'easy', display_name: 'Facile', color: '#32CD32', icon: '🟢', stat_multiplier: 0.8, exp_multiplier: 0.7, gold_multiplier: 0.7, order_index: 1 },
      { name: 'normal', display_name: 'Normal', color: '#FFD700', icon: '🟡', stat_multiplier: 1.0, exp_multiplier: 1.0, gold_multiplier: 1.0, order_index: 2 },
      { name: 'hard', display_name: 'Difficile', color: '#FF8C00', icon: '🟠', stat_multiplier: 1.3, exp_multiplier: 1.5, gold_multiplier: 1.5, order_index: 3 },
      { name: 'nightmare', display_name: 'Cauchemar', color: '#DC143C', icon: '🔴', stat_multiplier: 1.8, exp_multiplier: 2.0, gold_multiplier: 2.0, order_index: 4 },
      { name: 'hell', display_name: 'Enfer', color: '#8B0000', icon: '⚫', stat_multiplier: 2.5, exp_multiplier: 3.0, gold_multiplier: 3.0, order_index: 5 }
    ];

    for (const difficulty of difficulties) {
      try {
        await pool.query(`
          INSERT INTO difficulties (name, display_name, color, icon, description, stat_multiplier, exp_multiplier, gold_multiplier, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          difficulty.name, difficulty.display_name, difficulty.color, difficulty.icon,
          `Difficulté ${difficulty.display_name}`, difficulty.stat_multiplier, 
          difficulty.exp_multiplier, difficulty.gold_multiplier, difficulty.order_index
        ]);
      } catch (error) {
        this.log('MIGRATE', `Erreur difficulté ${difficulty.name}: ${error.message}`, false);
      }
    }
    
    this.log('MIGRATE', `Difficultés créées: ${difficulties.length}`);
  }

  /**
   * Migre les utilisateurs
   */
  async migrateUsers() {
    if (!this.dataBackup.users) return;
    
    for (const user of this.dataBackup.users) {
      try {
        await pool.query(`
          INSERT INTO users (username, email, password_hash, last_login, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          user.username, user.email, user.password_hash, user.last_login, 
          user.is_active !== false, user.created_at, user.updated_at
        ]);
      } catch (error) {
        this.log('MIGRATE', `Erreur utilisateur ${user.username}: ${error.message}`, false);
      }
    }
    
    this.log('MIGRATE', `Utilisateurs migrés: ${this.dataBackup.users.length}`);
  }

  /**
   * Migre les objets
   */
  async migrateItems() {
    if (!this.dataBackup.items) return;
    
    // Récupérer les mappings des types et raretés
    const typeMapping = await this.getTypeMapping();
    const rarityMapping = await this.getRarityMapping();
    
    for (const item of this.dataBackup.items) {
      try {
        // Déterminer le type d'objet
        let typeId = typeMapping.weapon; // défaut
        if (item.type_id) {
          // Si on a un type_id de l'ancien système
          const oldType = await pool.query("SELECT name FROM item_types WHERE id = $1", [item.type_id]);
          if (oldType.rows.length > 0) {
            const typeName = oldType.rows[0].name;
            typeId = typeMapping[typeName] || typeMapping.weapon;
          }
        } else if (item.type) {
          // Si on a un type string
          typeId = typeMapping[item.type] || typeMapping.weapon;
        }
        
        // Déterminer la rareté
        let rarityId = rarityMapping.common; // défaut
        if (item.rarity_id) {
          const oldRarity = await pool.query("SELECT name FROM rarities WHERE id = $1", [item.rarity_id]);
          if (oldRarity.rows.length > 0) {
            const rarityName = oldRarity.rows[0].name;
            rarityId = rarityMapping[rarityName] || rarityMapping.common;
          }
        } else if (item.rarity) {
          rarityId = rarityMapping[item.rarity] || rarityMapping.common;
        }
        
        await pool.query(`
          INSERT INTO items (name, display_name, description, type_id, rarity_id, level_requirement, base_stats, stat_ranges, effects, icon, image)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          item.name, item.display_name || item.name, item.description, typeId, rarityId,
          item.level_requirement || 1, JSON.stringify(item.base_stats || {}),
          JSON.stringify(item.stat_ranges || {}), JSON.stringify(item.effects || []),
          item.icon, item.image
        ]);
      } catch (error) {
        this.log('MIGRATE', `Erreur objet ${item.name}: ${error.message}`, false);
      }
    }
    
    this.log('MIGRATE', `Objets migrés: ${this.dataBackup.items.length}`);
  }

  /**
   * Migre les personnages
   */
  async migrateCharacters() {
    if (!this.dataBackup.characters) return;
    
    // Récupérer le mapping des classes
    const classMapping = await this.getClassMapping();
    
    for (const character of this.dataBackup.characters) {
      try {
        // Trouver la nouvelle classe
        const classResult = await pool.query("SELECT id FROM character_classes WHERE name = $1", [character.class_name || 'warrior']);
        const classId = classResult.rows[0]?.id || 1;
        
        await pool.query(`
          INSERT INTO characters (
            user_id, name, class_id, level, experience, experience_to_next,
            health, max_health, mana, max_mana, attack, defense, magic_attack, magic_defense,
            critical_rate, critical_damage, vitality, strength, intelligence, agility,
            resistance, precision, endurance, wisdom, constitution, dexterity,
            health_regen, mana_regen, attack_speed, movement_speed, dodge_chance,
            block_chance, parry_chance, spell_power, physical_power, stats
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
        `, [
          character.user_id, character.name, classId, character.level || 1,
          character.experience || 0, character.experience_to_next || 100,
          character.health || 100, character.max_health || character.health || 100,
          character.mana || 50, character.max_mana || character.mana || 50,
          character.attack || 10, character.defense || 10,
          character.magic_attack || 5, character.magic_defense || 5,
          character.critical_rate || 5.0, character.critical_damage || 150.0,
          character.vitality || 10, character.strength || 10, character.intelligence || 10,
          character.agility || 10, character.resistance || 10, character.precision || 10,
          character.endurance || 10, character.wisdom || 10, character.constitution || 10,
          character.dexterity || 10, character.health_regen || 1.0, character.mana_regen || 0.5,
          character.attack_speed || 100.0, character.movement_speed || 100.0,
          character.dodge_chance || 8.0, character.block_chance || 5.0, character.parry_chance || 3.0,
          character.spell_power || 100.0, character.physical_power || 100.0,
          JSON.stringify(character.stats || {})
        ]);
      } catch (error) {
        this.log('MIGRATE', `Erreur personnage ${character.name}: ${error.message}`, false);
      }
    }
    
    this.log('MIGRATE', `Personnages migrés: ${this.dataBackup.characters.length}`);
  }

  /**
   * Migre l'inventaire
   */
  async migrateInventory() {
    if (!this.dataBackup.character_inventory) return;
    
    for (const inventoryItem of this.dataBackup.character_inventory) {
      try {
        await pool.query(`
          INSERT INTO character_inventory (character_id, item_id, quantity, equipped, equipped_slot, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          inventoryItem.character_id, inventoryItem.item_id, inventoryItem.quantity || 1,
          inventoryItem.equipped || false, inventoryItem.equipped_slot,
          inventoryItem.created_at, inventoryItem.updated_at
        ]);
      } catch (error) {
        this.log('MIGRATE', `Erreur inventaire item ${inventoryItem.id}: ${error.message}`, false);
      }
    }
    
    this.log('MIGRATE', `Inventaire migré: ${this.dataBackup.character_inventory.length}`);
  }

  /**
   * Migre les donjons
   */
  async migrateDungeons() {
    if (!this.dataBackup.dungeons) return;
    
    // Récupérer le mapping des difficultés
    const difficultyMapping = await this.getDifficultyMapping();
    
    for (const dungeon of this.dataBackup.dungeons) {
      try {
        const difficultyId = difficultyMapping[dungeon.difficulty] || difficultyMapping.normal;
        
        await pool.query(`
          INSERT INTO dungeons (name, display_name, description, level_requirement, difficulty_id, estimated_duration, rewards, requirements, enemies, icon, theme)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          dungeon.name, dungeon.display_name, dungeon.description, dungeon.level_requirement || 1,
          difficultyId, dungeon.estimated_duration, JSON.stringify(dungeon.rewards || []),
          JSON.stringify(dungeon.requirements || []), JSON.stringify(dungeon.enemies || []),
          dungeon.icon, dungeon.theme
        ]);
      } catch (error) {
        this.log('MIGRATE', `Erreur donjon ${dungeon.name}: ${error.message}`, false);
      }
    }
    
    this.log('MIGRATE', `Donjons migrés: ${this.dataBackup.dungeons.length}`);
  }

  /**
   * Migre les quêtes
   */
  async migrateQuests() {
    if (!this.dataBackup.quests) return;
    
    for (const quest of this.dataBackup.quests) {
      try {
        await pool.query(`
          INSERT INTO quests (title, description, type, level_requirement, rewards, requirements, objectives, icon)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quest.title, quest.description, quest.type || 'side', quest.level_requirement || 1,
          JSON.stringify(quest.rewards || []), JSON.stringify(quest.requirements || []),
          JSON.stringify(quest.objectives || []), quest.icon
        ]);
      } catch (error) {
        this.log('MIGRATE', `Erreur quête ${quest.title}: ${error.message}`, false);
      }
    }
    
    this.log('MIGRATE', `Quêtes migrées: ${this.dataBackup.quests.length}`);
  }

  /**
   * Migre les ennemis
   */
  async migrateEnemies() {
    if (!this.dataBackup.enemies) return;
    
    // Récupérer le mapping des raretés
    const rarityMapping = await this.getRarityMapping();
    
    for (const enemy of this.dataBackup.enemies) {
      try {
        const rarityId = rarityMapping[enemy.rarity] || rarityMapping.common;
        
        await pool.query(`
          INSERT INTO enemies (name, display_name, description, type, level, rarity_id, health, attack, defense, magic_attack, magic_defense, speed, experience_reward, gold_reward, abilities, weaknesses, resistances, loot_table, icon)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `, [
          enemy.name, enemy.display_name || enemy.name, enemy.description, enemy.type || 'monster',
          enemy.level || 1, rarityId, enemy.health || enemy.hp || 100, enemy.attack || 10,
          enemy.defense || 5, enemy.magic_attack || enemy.magic || 0, enemy.magic_defense || 0,
          enemy.speed || 100, enemy.experience_reward || enemy.exp || 0, enemy.gold_reward || enemy.gold || 0,
          JSON.stringify(enemy.abilities || []), JSON.stringify(enemy.weaknesses || []),
          JSON.stringify(enemy.resistances || []), JSON.stringify(enemy.loot_table || enemy.loot || []),
          enemy.icon
        ]);
      } catch (error) {
        this.log('MIGRATE', `Erreur ennemi ${enemy.name}: ${error.message}`, false);
      }
    }
    
    this.log('MIGRATE', `Ennemis migrés: ${this.dataBackup.enemies.length}`);
  }

  /**
   * Migre les guildes
   */
  async migrateGuilds() {
    if (!this.dataBackup.guilds) return;
    
    for (const guild of this.dataBackup.guilds) {
      try {
        await pool.query(`
          INSERT INTO guilds (name, display_name, description, level, experience, experience_to_next, max_members, current_members, guild_coin, guild_honor, emblem, banner, status, created_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          guild.name, guild.display_name, guild.description, guild.level || 1,
          guild.experience || 0, guild.experience_to_next || 1000, guild.max_members || 20,
          guild.current_members || 0, guild.guild_coin || 0, guild.guild_honor || 0,
          guild.emblem, guild.banner, guild.status || 'active', guild.created_by,
          guild.created_at, guild.updated_at
        ]);
      } catch (error) {
        this.log('MIGRATE', `Erreur guilde ${guild.name}: ${error.message}`, false);
      }
    }
    
    this.log('MIGRATE', `Guildes migrées: ${this.dataBackup.guilds.length}`);
  }

  /**
   * Récupère le mapping des types d'objets
   */
  async getTypeMapping() {
    const result = await pool.query('SELECT id, name FROM item_types');
    const mapping = {};
    result.rows.forEach(row => {
      mapping[row.name] = row.id;
    });
    return mapping;
  }

  /**
   * Récupère le mapping des raretés
   */
  async getRarityMapping() {
    const result = await pool.query('SELECT id, name FROM rarities');
    const mapping = {};
    result.rows.forEach(row => {
      mapping[row.name] = row.id;
    });
    return mapping;
  }

  /**
   * Récupère le mapping des classes
   */
  async getClassMapping() {
    const result = await pool.query('SELECT id, name FROM character_classes');
    const mapping = {};
    result.rows.forEach(row => {
      mapping[row.name] = row.id;
    });
    return mapping;
  }

  /**
   * Récupère le mapping des difficultés
   */
  async getDifficultyMapping() {
    const result = await pool.query('SELECT id, name FROM difficulties');
    const mapping = {};
    result.rows.forEach(row => {
      mapping[row.name] = row.id;
    });
    return mapping;
  }

  /**
   * Vérifie l'intégrité des données migrées
   */
  async verifyDataIntegrity() {
    console.log('🔍 Vérification de l\'intégrité des données...');
    
    const checks = [
      { name: 'Utilisateurs', query: 'SELECT COUNT(*) FROM users' },
      { name: 'Personnages', query: 'SELECT COUNT(*) FROM characters' },
      { name: 'Objets', query: 'SELECT COUNT(*) FROM items' },
      { name: 'Inventaire', query: 'SELECT COUNT(*) FROM character_inventory' },
      { name: 'Donjons', query: 'SELECT COUNT(*) FROM dungeons' },
      { name: 'Quêtes', query: 'SELECT COUNT(*) FROM quests' },
      { name: 'Ennemis', query: 'SELECT COUNT(*) FROM enemies' },
      { name: 'Guildes', query: 'SELECT COUNT(*) FROM guilds' }
    ];

    for (const check of checks) {
      try {
        const result = await pool.query(check.query);
        const count = parseInt(result.rows[0].count);
        this.log('VERIFY', `${check.name}: ${count} enregistrements`);
      } catch (error) {
        this.log('VERIFY', `Erreur vérification ${check.name}: ${error.message}`, false);
      }
    }
  }

  /**
   * Génère un rapport de migration
   */
  generateMigrationReport() {
    console.log('\n📋 RAPPORT DE MIGRATION');
    console.log('='.repeat(50));
    
    const successfulSteps = this.migrationLog.filter(log => log.success).length;
    const totalSteps = this.migrationLog.length;
    
    console.log(`\n✅ Étapes réussies: ${successfulSteps}/${totalSteps}`);
    
    console.log('\n📊 Détail des étapes:');
    this.migrationLog.forEach((log, index) => {
      console.log(`   ${index + 1}. [${log.step}] ${log.message}`);
    });
    
    console.log('\n💡 Recommandations post-migration:');
    console.log('   1. Vérifier les performances avec EXPLAIN ANALYZE');
    console.log('   2. Mettre à jour les statistiques avec ANALYZE');
    console.log('   3. Tester les requêtes fréquentes');
    console.log('   4. Configurer le monitoring des performances');
    console.log('   5. Sauvegarder la base de données');
  }

  /**
   * Exécute la migration complète
   */
  async migrate() {
    try {
      console.log('🚀 Début de la migration vers le schéma optimisé...\n');
      
      // Vérifier la connexion
      await pool.query('SELECT NOW()');
      console.log('✅ Connexion à la base de données établie\n');
      
      // Exécuter les étapes de migration
      await this.backupExistingData();
      await this.createOptimizedSchema();
      await this.migrateData();
      await this.verifyDataIntegrity();
      
      // Générer le rapport
      this.generateMigrationReport();
      
      console.log('\n🎉 Migration terminée avec succès !');
      
    } catch (error) {
      console.error('💥 Erreur lors de la migration:', error);
      throw error;
    } finally {
      await pool.end();
    }
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  const migrator = new SchemaMigrator();
  
  migrator.migrate()
    .then(() => {
      console.log('\n🏁 Script de migration terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script de migration échoué:', error);
      process.exit(1);
    });
}

module.exports = SchemaMigrator;

