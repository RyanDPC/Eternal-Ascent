const { Pool } = require('pg');
const CacheService = require('./CacheService');
const fs = require('fs');
const path = require('path');

/**
 * Service de données ultra-optimisé pour Eternal Ascent
 * 
 * Ce service utilise :
 * - Requêtes préparées pour les performances
 * - Cache Redis pour les données statiques
 * - Vues SQL optimisées
 * - Index composites
 * - Pagination intelligente
 */
class OptimizedDataService {
  constructor() {
    // Configuration optimisée pour Render PostgreSQL
    const dbConfig = this.getDatabaseConfig();
    
    this.pool = new Pool({
      ...dbConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      // Configuration de retry pour Render
      retryDelayMs: 1000,
      retryAttempts: 3
    });

    this.cache = new CacheService();
    this.preparedStatements = new Map();
    this.initializePreparedStatements();
  }

  /**
   * Configuration de base de données optimisée pour Render
   */
  getDatabaseConfig() {
    // Priorité aux variables d'environnement Render
    if (process.env.DATABASE_URL) {
      // Configuration via DATABASE_URL (format Render)
      return {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
          require: true
        }
      };
    }

    // Configuration via variables individuelles
    const config = {
      host: process.env.DB_HOST || 'dpg-d2jnela4d50c73891omg-a.frankfurt-postgres.render.com',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'eterna',
      user: process.env.DB_USER || 'eterna_user',
      password: process.env.DB_PASSWORD || 'u5K6UbCBstAUIXvuIEqlaC7ZyHUor79G'
    };

    // Configuration SSL optimisée pour Render
    // Toujours utiliser SSL pour les connexions externes
    config.ssl = {
      rejectUnauthorized: false,
      require: true
    };

    return config;
  }

  /**
   * Initialise les requêtes préparées optimisées
   */
  initializePreparedStatements() {
    const statements = {
      // === PERSONNAGES ===
      'get_character_full': `
        SELECT * FROM characters_full WHERE id = $1
      `,
      'get_character_by_user': `
        SELECT * FROM characters_full WHERE user_id = $1
      `,
      'get_character_inventory_full': `
        SELECT * FROM character_inventory_full WHERE character_id = $1
      `,
      'get_character_equipped_items': `
        SELECT * FROM character_inventory_full 
        WHERE character_id = $1 AND equipped = true
        ORDER BY equipped_slot
      `,
      'update_character_stats': `
        UPDATE characters 
        SET level = $1, experience = $2, experience_to_next = $3,
            health = $4, max_health = $5, mana = $6, max_mana = $7,
            attack = $8, defense = $9, magic_attack = $10, magic_defense = $11,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *
      `,
      'equip_item': `
        UPDATE character_inventory 
        SET equipped = true, equipped_slot = $1, updated_at = CURRENT_TIMESTAMP
        WHERE character_id = $2 AND item_id = $3
        RETURNING *
      `,
      'unequip_item': `
        UPDATE character_inventory 
        SET equipped = false, equipped_slot = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE character_id = $1 AND item_id = $2
        RETURNING *
      `,

      // === OBJETS ===
      'get_items_by_filters': `
        SELECT * FROM items_with_stats 
        WHERE ($1::text IS NULL OR type_name = $1)
          AND ($2::text IS NULL OR rarity_name = $2)
          AND ($3::int IS NULL OR level_requirement >= $3)
          AND ($4::int IS NULL OR level_requirement <= $4)
          AND ($5::text IS NULL OR name ILIKE '%' || $5 || '%')
        ORDER BY level_requirement, rarity_name, name
        LIMIT $6 OFFSET $7
      `,
      'get_item_by_id': `
        SELECT * FROM items_with_stats WHERE id = $1
      `,
      'get_items_by_type': `
        SELECT * FROM items_with_stats WHERE type_name = $1
        ORDER BY level_requirement, rarity_name
      `,
      'get_items_by_rarity': `
        SELECT * FROM items_with_stats WHERE rarity_name = $1
        ORDER BY level_requirement, type_name
      `,

      // === DONJONS ===
      'get_dungeons_by_level': `
        SELECT d.*, d.difficulty as difficulty_name, '#FF6B6B' as difficulty_color
        FROM dungeons d
        WHERE d.level_requirement <= $1
        ORDER BY d.level_requirement, d.id
      `,
      'get_dungeon_by_id': `
        SELECT d.*, d.difficulty as difficulty_name, '#FF6B6B' as difficulty_color
        FROM dungeons d
        WHERE d.id = $1
      `,
      'get_character_dungeons': `
        SELECT cd.*, d.name as dungeon_name, d.display_name as dungeon_display_name,
               d.level_requirement, d.difficulty as difficulty_name
        FROM character_dungeons cd
        JOIN dungeons d ON cd.dungeon_id = d.id
        WHERE cd.character_id = $1
        ORDER BY d.level_requirement
      `,

      // === GUILDES ===
      'get_guild_full': `
        SELECT g.*, c.name as creator_name, c.level as creator_level,
               cc.display_name as creator_class
        FROM guilds g
        LEFT JOIN characters c ON g.created_by = c.id
        LEFT JOIN character_classes cc ON c.class_id = cc.id
        WHERE g.id = $1
      `,
      'get_guild_members': `
        SELECT gm.*, c.name as character_name, c.level as character_level,
               cc.display_name as class_name, u.username
        FROM guild_members gm
        JOIN characters c ON gm.character_id = c.id
        JOIN character_classes cc ON c.class_id = cc.id
        JOIN users u ON c.user_id = u.id
        WHERE gm.guild_id = $1
        ORDER BY gm.contribution_points DESC, gm.joined_at
      `,

      // === STATISTIQUES ===
      'get_character_stats_calculated': `
        SELECT *, calculate_character_stats($1) as calculated_stats
        FROM characters_full WHERE id = $1
      `,
      'get_items_popularity': `
        SELECT type_name, rarity_name, COUNT(*) as count, AVG(total_owned) as avg_owned
        FROM items_with_stats
        GROUP BY type_name, rarity_name
        ORDER BY count DESC
      `,

      // === RECHERCHES ===
      'search_items': `
        SELECT * FROM items_with_stats
        WHERE name ILIKE '%' || $1 || '%' OR display_name ILIKE '%' || $1 || '%'
        ORDER BY 
          CASE WHEN name ILIKE $1 || '%' THEN 1 ELSE 2 END,
          level_requirement, rarity_name
        LIMIT $2
      `,
      'search_characters': `
        SELECT * FROM characters_full
        WHERE name ILIKE '%' || $1 || '%'
        ORDER BY level DESC, name
        LIMIT $2
      `,
      'search_guilds': `
        SELECT * FROM guilds
        WHERE name ILIKE '%' || $1 || '%' OR display_name ILIKE '%' || $1 || '%'
        ORDER BY level DESC, current_members DESC
        LIMIT $2
      `
    };

    for (const [name, query] of Object.entries(statements)) {
      this.preparedStatements.set(name, query);
    }
  }

  /**
   * Exécute une requête préparée avec cache
   */
  async executePrepared(queryName, params = [], useCache = false, cacheKey = null, cacheTTL = 300) {
    if (useCache && cacheKey) {
      const cached = await this.cache.getStaticData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const query = this.preparedStatements.get(queryName);
    if (!query) {
      throw new Error(`Prepared statement '${queryName}' not found`);
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(query, params);
      
      if (useCache && cacheKey) {
        await this.cache.cacheStaticData(cacheKey, result.rows, cacheTTL);
      }
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  // =====================================================
  // MÉTHODES POUR LES PERSONNAGES
  // =====================================================

  /**
   * Récupère un personnage complet avec toutes ses données
   */
  async getCharacter(characterId, useCache = true) {
    const cacheKey = `character_full:${characterId}`;
    
    if (useCache) {
      const cached = await this.cache.getCharacterStats(characterId);
      if (cached) {
        return cached;
      }
    }

    const character = await this.executePrepared('get_character_full', [characterId]);
    if (character.length === 0) {
      return null;
    }

    const characterData = character[0];
    
    // Récupérer l'inventaire
    const inventory = await this.getCharacterInventory(characterId, false);
    characterData.inventory = inventory;

    // Calculer les stats finales
    const calculatedStats = await this.calculateCharacterStats(characterData);
    characterData.calculated_stats = calculatedStats;

    if (useCache) {
      await this.cache.cacheCharacterStats(characterId, characterData, 300);
    }

    return characterData;
  }

  /**
   * Récupère un personnage par ID utilisateur
   */
  async getCharacterByUserId(userId, useCache = true) {
    const cacheKey = `character_by_user:${userId}`;
    
    if (useCache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const character = await this.executePrepared('get_character_by_user', [userId]);
    if (character.length === 0) {
      return null;
    }

    const characterData = character[0];
    
    // Récupérer l'inventaire
    const inventory = await this.getCharacterInventory(characterData.id, false);
    characterData.inventory = inventory;

    // Calculer les stats finales
    const calculatedStats = await this.calculateCharacterStats(characterData);
    characterData.calculated_stats = calculatedStats;

    if (useCache) {
      await this.cache.set(cacheKey, characterData, 300);
    }

    return characterData;
  }

  /**
   * Récupère l'inventaire d'un personnage
   */
  async getCharacterInventory(characterId, useCache = true) {
    const cacheKey = `character_inventory:${characterId}`;
    
    if (useCache) {
      const cached = await this.cache.getInventory(characterId);
      if (cached) {
        return cached;
      }
    }

    const inventory = await this.executePrepared('get_character_inventory_full', [characterId]);
    
    if (useCache) {
      await this.cache.cacheInventory(characterId, inventory, 600);
    }

    return inventory;
  }

  /**
   * Récupère les objets équipés d'un personnage
   */
  async getCharacterEquippedItems(characterId, useCache = true) {
    const cacheKey = `character_equipped:${characterId}`;
    
    if (useCache) {
      const cached = await this.cache.getStaticData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const equippedItems = await this.executePrepared('get_character_equipped_items', [characterId]);
    
    if (useCache) {
      await this.cache.cacheStaticData(cacheKey, equippedItems, 300);
    }

    return equippedItems;
  }

  /**
   * Calcule les stats finales d'un personnage avec équipement
   */
  async calculateCharacterStats(character) {
    try {
      // Utiliser la fonction SQL optimisée
      const result = await this.pool.query('SELECT calculate_character_stats($1) as stats', [character.id]);
      return result.rows[0].stats;
    } catch (error) {
      console.warn('Erreur calcul stats SQL, fallback manuel:', error.message);
      
      // Fallback manuel
      const baseStats = character.class_base_stats || {};
      const characterStats = {
        health: character.health,
        max_health: character.max_health,
        mana: character.mana,
        max_mana: character.max_mana,
        attack: character.attack,
        defense: character.defense,
        magic_attack: character.magic_attack,
        magic_defense: character.magic_defense,
        critical_rate: character.critical_rate,
        critical_damage: character.critical_damage
      };

      // Appliquer les bonus d'équipement
      if (character.inventory) {
        for (const item of character.inventory) {
          if (item.equipped && item.item_base_stats) {
            const itemStats = typeof item.item_base_stats === 'string' 
              ? JSON.parse(item.item_base_stats) 
              : item.item_base_stats;

            for (const [stat, value] of Object.entries(itemStats)) {
              if (characterStats[stat] !== undefined) {
                characterStats[stat] += parseInt(value) || 0;
              }
            }
          }
        }
      }

      return characterStats;
    }
  }

  /**
   * Équipe un objet
   */
  async equipItem(characterId, itemId, slot) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Vérifier les contraintes d'équipement
      const canEquip = await client.query('SELECT check_equipment_constraints($1, $2, $3) as can_equip', [characterId, itemId, slot]);
      if (!canEquip.rows[0].can_equip) {
        throw new Error('Contraintes d\'équipement non respectées');
      }
      
      // Déséquiper l'objet actuel dans ce slot
      await client.query(
        'UPDATE character_inventory SET equipped = false, equipped_slot = NULL WHERE character_id = $1 AND equipped_slot = $2',
        [characterId, slot]
      );
      
      // Équiper le nouvel objet
      const result = await client.query(
        'UPDATE character_inventory SET equipped = true, equipped_slot = $1 WHERE character_id = $2 AND item_id = $3 RETURNING *',
        [slot, characterId, itemId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Objet non trouvé dans l\'inventaire');
      }
      
      await client.query('COMMIT');
      
      // Invalider le cache
      await this.cache.invalidateCharacterCache(characterId);
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // =====================================================
  // MÉTHODES POUR LES OBJETS
  // =====================================================

  /**
   * Récupère les objets avec filtres et pagination
   */
  async getItems(filters = {}, pagination = {}) {
    const {
      type = null,
      rarity = null,
      levelMin = null,
      levelMax = null,
      search = null
    } = filters;

    const {
      page = 1,
      limit = 50
    } = pagination;

    const offset = (page - 1) * limit;

    const items = await this.executePrepared('get_items_by_filters', [
      type, rarity, levelMin, levelMax, search, limit, offset
    ]);

    // Compter le total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM items_with_stats 
      WHERE ($1::text IS NULL OR type_name = $1)
        AND ($2::text IS NULL OR rarity_name = $2)
        AND ($3::int IS NULL OR level_requirement >= $3)
        AND ($4::int IS NULL OR level_requirement <= $4)
        AND ($5::text IS NULL OR name ILIKE '%' || $5 || '%')
    `;
    
    const countResult = await this.pool.query(countQuery, [type, rarity, levelMin, levelMax, search]);
    const total = parseInt(countResult.rows[0].total);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Recherche d'objets
   */
  async searchItems(query, limit = 20) {
    return await this.executePrepared('search_items', [query, limit]);
  }

  /**
   * Récupère un objet par ID
   */
  async getItem(itemId) {
    const items = await this.executePrepared('get_item_by_id', [itemId]);
    return items[0] || null;
  }

  // =====================================================
  // MÉTHODES POUR LES DONJONS
  // =====================================================

  /**
   * Récupère les donjons disponibles pour un niveau
   */
  async getDungeonsByLevel(characterLevel, useCache = true) {
    const cacheKey = `dungeons_level:${characterLevel}`;
    
    if (useCache) {
      const cached = await this.cache.getStaticData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const dungeons = await this.executePrepared('get_dungeons_by_level', [characterLevel]);
    
    if (useCache) {
      await this.cache.cacheStaticData(cacheKey, dungeons, 1800);
    }

    return dungeons;
  }

  /**
   * Récupère un donjon par ID
   */
  async getDungeon(dungeonId, useCache = true) {
    const cacheKey = `dungeon:${dungeonId}`;
    
    if (useCache) {
      const cached = await this.cache.getDungeonData(dungeonId);
      if (cached) {
        return cached;
      }
    }

    const dungeons = await this.executePrepared('get_dungeon_by_id', [dungeonId]);
    const dungeon = dungeons[0] || null;
    
    if (useCache && dungeon) {
      await this.cache.cacheDungeonData(dungeonId, dungeon, 3600);
    }

    return dungeon;
  }

  // =====================================================
  // MÉTHODES POUR LES GUILDES
  // =====================================================

  /**
   * Récupère une guilde complète
   */
  async getGuild(guildId, useCache = true) {
    const cacheKey = `guild_full:${guildId}`;
    
    if (useCache) {
      const cached = await this.cache.getGuildData(guildId);
      if (cached) {
        return cached;
      }
    }

    const guilds = await this.executePrepared('get_guild_full', [guildId]);
    if (guilds.length === 0) {
      return null;
    }

    const guildData = guilds[0];
    
    // Récupérer les membres
    const members = await this.executePrepared('get_guild_members', [guildId]);
    guildData.members = members;

    if (useCache) {
      await this.cache.cacheGuildData(guildId, guildData, 1800);
    }

    return guildData;
  }

  // =====================================================
  // MÉTHODES POUR LES STATISTIQUES
  // =====================================================

  /**
   * Récupère les statistiques de popularité des objets
   */
  async getItemsPopularity() {
    return await this.executePrepared('get_items_popularity');
  }

  /**
   * Récupère les stats calculées d'un personnage
   */
  async getCharacterStatsCalculated(characterId) {
    const characters = await this.executePrepared('get_character_stats_calculated', [characterId]);
    return characters[0] || null;
  }

  // =====================================================
  // MÉTHODES DE RECHERCHE
  // =====================================================

  /**
   * Recherche globale
   */
  async search(query, type = 'all', limit = 20) {
    const results = {};

    if (type === 'all' || type === 'items') {
      results.items = await this.searchItems(query, limit);
    }

    if (type === 'all' || type === 'characters') {
      results.characters = await this.executePrepared('search_characters', [query, limit]);
    }

    if (type === 'all' || type === 'guilds') {
      results.guilds = await this.executePrepared('search_guilds', [query, limit]);
    }

    return results;
  }

  // =====================================================
  // MÉTHODES D'INITIALISATION
  // =====================================================

  /**
   * Initialise le service avec préchargement du cache et retry
   */
  async initialize() {
    console.log('🚀 Initializing OptimizedDataService...');
    
    // Tester la connexion avec retry
    await this.testConnectionWithRetry();

    // S'assurer que le schéma est compatible (migrations légères)
    try {
      await this.ensureSchemaFixes();
    } catch (e) {
      console.warn('⚠️ ensureSchemaFixes failed:', e.message);
    }

    // Créer/mettre à jour les vues et index optimisés si absents
    try {
      await this.ensureOptimizedViews();
    } catch (e) {
      console.warn('⚠️ ensureOptimizedViews failed:', e.message);
    }

    // Précharger les données statiques
    try {
      await this.cache.preloadStaticData(this);
    } catch (error) {
      console.warn('⚠️ Cache preload failed, continuing without cache:', error.message);
    }
    
    console.log('✅ OptimizedDataService initialized successfully');
  }

  /**
   * Applique des correctifs de schéma légers (sans perte de données)
   */
  async ensureSchemaFixes() {
    // Étendre la précision de critical_damage pour éviter les overflows (DECIMAL(4,2) -> DECIMAL(6,2))
    const checkQuery = `
      SELECT numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'characters' AND column_name = 'critical_damage'
    `;
    const result = await this.pool.query(checkQuery);
    const row = result.rows[0];
    const needsAlter = !row || (row.numeric_precision && parseInt(row.numeric_precision, 10) <= 4);
    if (needsAlter) {
      console.log('🛠️ Altering characters.critical_damage to DECIMAL(6,2) ...');
      await this.pool.query('ALTER TABLE characters ALTER COLUMN critical_damage TYPE DECIMAL(6,2)');
      console.log('✅ Column critical_damage altered to DECIMAL(6,2)');
    }
  }

  /**
   * Crée/Met à jour les vues et index optimisés nécessaires
   */
  async ensureOptimizedViews() {
    // Vérifier rapidement si une vue clé existe
    const existsRes = await this.pool.query(
      `SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'items_with_stats'`
    );
    if (existsRes.rowCount > 0) {
      // Toujours réappliquer pour garder à jour
      console.log('🔁 Refreshing optimized views...');
    } else {
      console.log('🧱 Creating optimized views...');
    }

    const viewsPath = path.join(__dirname, '..', 'database-views.sql');
    const sql = fs.readFileSync(viewsPath, 'utf8');
    await this.pool.query(sql);
    console.log('✅ Optimized views ensured');
  }

  /**
   * Test de connexion avec retry automatique
   */
  async testConnectionWithRetry(maxRetries = 5, delay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempting database connection (${attempt}/${maxRetries})...`);
        
        const client = await this.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        
        console.log('✅ Database connection established successfully');
        return;
      } catch (error) {
        console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
        }
        
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      }
    }
  }

  /**
   * Ferme les connexions
   */
  async close() {
    await this.pool.end();
    await this.cache.close();
  }
}

module.exports = OptimizedDataService;

