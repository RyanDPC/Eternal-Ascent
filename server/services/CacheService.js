const Redis = require('redis');
const { promisify } = require('util');

class CacheService {
  constructor() {
    // Support both REDIS_URL and individual host/port/password
    const redisConfig = process.env.REDIS_URL ? 
      { url: process.env.REDIS_URL } : 
      {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null
      };

    // In-memory fallback store
    this.memoryStore = new Map();

    try {
      this.redis = Redis.createClient({
        ...redisConfig,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis server refused connection');
            return new Error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.log('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.log('Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });
    } catch (e) {
      this.redis = null;
      console.warn('⚠️ Redis client not created, using memory fallback');
    }

    // Initialize async methods after connection
    this.getAsync = null;
    this.setAsync = null;
    this.delAsync = null;
    this.flushAsync = null;

    if (this.redis) {
      this.redis.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
        // Initialize async methods after connection
        this.getAsync = promisify(this.redis.get).bind(this.redis);
        this.setAsync = promisify(this.redis.set).bind(this.redis);
        this.delAsync = promisify(this.redis.del).bind(this.redis);
        this.flushAsync = promisify(this.redis.flushdb).bind(this.redis);
      });
    }
  }

  /**
   * Cache les données statiques (items, classes, etc.)
   */
  async cacheStaticData(key, data, ttl = 3600) {
    try {
      const serializedData = JSON.stringify(data);
      if (this.setAsync) {
        await this.setAsync(key, serializedData, 'EX', ttl);
      } else {
        const expiresAt = Date.now() + ttl * 1000;
        this.memoryStore.set(key, { value: serializedData, expiresAt });
      }
      // console.log(`📦 Cached static data: ${key}`);
    } catch (error) {
      console.error('❌ Error caching static data:', error);
    }
  }

  /**
   * Récupère les données statiques du cache
   */
  async getStaticData(key) {
    try {
      let cachedData = null;
      if (this.getAsync) {
        cachedData = await this.getAsync(key);
      } else {
        const entry = this.memoryStore.get(key);
        if (entry && entry.expiresAt > Date.now()) {
          cachedData = entry.value;
        } else if (entry) {
          this.memoryStore.delete(key);
        }
      }
      if (cachedData) {
        // console.log(`📦 Retrieved from cache: ${key}`);
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      console.error('❌ Error retrieving cached data:', error);
      return null;
    }
  }

  /**
   * Cache les stats calculées d'un personnage
   */
  async cacheCharacterStats(characterId, stats, ttl = 300) {
    const key = `character_stats:${characterId}`;
    await this.cacheStaticData(key, stats, ttl);
  }

  /**
   * Récupère les stats calculées d'un personnage
   */
  async getCharacterStats(characterId) {
    const key = `character_stats:${characterId}`;
    return await this.getStaticData(key);
  }

  /**
   * Invalide le cache d'un personnage
   */
  async invalidateCharacterCache(characterId) {
    const keys = [
      `character_stats:${characterId}`,
      `character_inventory:${characterId}`,
      `character_equipment:${characterId}`
    ];
    
    for (const key of keys) {
      if (this.delAsync) {
        await this.delAsync(key);
      }
      this.memoryStore.delete(key);
    }
    console.log(`🗑️ Invalidated cache for character: ${characterId}`);
  }

  /**
   * Cache les données d'inventaire
   */
  async cacheInventory(characterId, inventory, ttl = 600) {
    const key = `character_inventory:${characterId}`;
    await this.cacheStaticData(key, inventory, ttl);
  }

  /**
   * Récupère l'inventaire du cache
   */
  async getInventory(characterId) {
    const key = `character_inventory:${characterId}`;
    return await this.getStaticData(key);
  }

  /**
   * Cache les données de guilde
   */
  async cacheGuildData(guildId, data, ttl = 1800) {
    const key = `guild_data:${guildId}`;
    await this.cacheStaticData(key, data, ttl);
  }

  /**
   * Récupère les données de guilde du cache
   */
  async getGuildData(guildId) {
    const key = `guild_data:${guildId}`;
    return await this.getStaticData(key);
  }

  /**
   * Cache les données de donjon
   */
  async cacheDungeonData(dungeonId, data, ttl = 3600) {
    const key = `dungeon_data:${dungeonId}`;
    await this.cacheStaticData(key, data, ttl);
  }

  /**
   * Récupère les données de donjon du cache
   */
  async getDungeonData(dungeonId) {
    const key = `dungeon_data:${dungeonId}`;
    return await this.getStaticData(key);
  }

  /**
   * Précharge toutes les données statiques au démarrage
   */
  async preloadStaticData(dbManager) {
    console.log('🚀 Preloading static data into cache...');
    
    try {
      // Charger les classes de personnages
      const classes = await dbManager.pool.query('SELECT * FROM character_classes');
      await this.cacheStaticData('character_classes', classes.rows, 86400); // 24h

      // Charger les raretés
      const rarities = await dbManager.pool.query('SELECT * FROM rarities');
      await this.cacheStaticData('rarities', rarities.rows, 86400);

      // Charger les types d'objets
      const itemTypes = await dbManager.pool.query('SELECT * FROM item_types');
      await this.cacheStaticData('item_types', itemTypes.rows, 86400);

      // Charger les items (avec pagination pour éviter la surcharge)
      const items = await dbManager.pool.query(`
        SELECT i.*, it.name as type_name, r.name as rarity_name, r.color as rarity_color
        FROM items i
        JOIN item_types it ON i.type_id = it.id
        JOIN rarities r ON i.rarity_id = r.id
        ORDER BY i.id
      `);
      await this.cacheStaticData('items', items.rows, 86400);

      // Charger les compétences (facultatif selon le schéma)
      try {
        const skills = await dbManager.pool.query('SELECT * FROM skills');
        await this.cacheStaticData('skills', skills.rows, 86400);
      } catch (e) {
        console.warn('⚠️ skills table not found, skipping');
      }

      // Charger les donjons
      const dungeons = await dbManager.pool.query('SELECT * FROM dungeons');
      await this.cacheStaticData('dungeons', dungeons.rows, 86400);

      // Charger les ennemis
      const enemies = await dbManager.pool.query(`
        SELECT e.*, r.name as rarity_name, r.color as rarity_color
        FROM enemies e
        JOIN rarities r ON e.rarity_id = r.id
        ORDER BY e.level
      `);
      await this.cacheStaticData('enemies', enemies.rows, 86400);

      console.log('✅ Static data preloaded successfully');
    } catch (error) {
      console.error('❌ Error preloading static data:', error);
    }
  }

  /**
   * Ferme la connexion Redis
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

module.exports = CacheService;

