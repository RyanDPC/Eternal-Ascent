const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'eterna_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Middleware pour injecter le service de cache
const injectCacheService = (req, res, next) => {
  req.cacheService = req.app.locals.cacheService;
  next();
};

// Helper to fallback to DB when cache missing
const withFallback = (fetchFromCache, fetchFromDb) => async () => {
  const data = await fetchFromCache();
  if (data && data.length) return data;
  if (fetchFromDb) return await fetchFromDb();
  return null;
};

/**
 * GET /api/static/classes
 * Récupère toutes les classes de personnages (avec cache)
 */
router.get('/classes', injectCacheService, async (req, res) => {
  try {
    const getData = withFallback(
      () => req.cacheService.getStaticData('character_classes'),
      async () => {
        try {
          const result = await req.app.locals.dataService.pool.query(`
            SELECT cc.*, r.name as rarity_name
            FROM character_classes cc
            JOIN rarities r ON cc.rarity_id = r.id
          `);
          return result.rows;
        } catch (_) { return null; }
      }
    );
    const classes = await getData();
    
    if (!classes) {
      return res.status(503).json({ error: 'Données non disponibles' });
    }

    res.json({
      success: true,
      classes: classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        display_name: cls.display_name,
        description: cls.description,
        rarity: cls.rarity_name,
        probability: cls.probability,
        base_stats: cls.base_stats,
        stat_ranges: cls.stat_ranges,
        starting_equipment: cls.starting_equipment,
        icon: cls.icon
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching character classes:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/static/items
 * Récupère tous les items avec filtres (avec cache)
 */
router.get('/items', injectCacheService, async (req, res) => {
  try {
    const { type, rarity, level_min, level_max, page = 1, limit = 50 } = req.query;
    
    const getItems = withFallback(
      () => req.cacheService.getStaticData('items'),
      async () => {
        try {
          const result = await req.app.locals.dataService.pool.query(`
            SELECT i.*, it.name as type_name, it.category, r.name as rarity_name, r.color as rarity_color
            FROM items i
            JOIN item_types it ON i.type_id = it.id
            JOIN rarities r ON i.rarity_id = r.id
            ORDER BY i.id
          `);
          return result.rows;
        } catch (_) { return null; }
      }
    );
    let items = await getItems();
    
    if (!items) {
      return res.status(503).json({ error: 'Données non disponibles' });
    }

    // Appliquer les filtres
    if (type) {
      items = items.filter(item => item.type_name === type);
    }
    
    if (rarity) {
      items = items.filter(item => item.rarity_name === rarity);
    }
    
    if (level_min) {
      items = items.filter(item => item.level_requirement >= parseInt(level_min));
    }
    
    if (level_max) {
      items = items.filter(item => item.level_requirement <= parseInt(level_max));
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedItems = items.slice(startIndex, endIndex);

    res.json({
      success: true,
      items: paginatedItems.map(item => ({
        id: item.id,
        name: item.name,
        display_name: item.display_name,
        description: item.description,
        type: {
          name: item.type_name,
          category: item.category
        },
        rarity: {
          name: item.rarity_name,
          color: item.rarity_color
        },
        level_requirement: item.level_requirement,
        base_stats: item.base_stats,
        stat_ranges: item.stat_ranges,
        effects: item.effects,
        icon: item.icon
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: items.length,
        total_pages: Math.ceil(items.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching items:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/static/items/types
 * Récupère tous les types d'objets (avec cache)
 */
router.get('/items/types', injectCacheService, async (req, res) => {
  try {
    const getTypes = withFallback(
      () => req.cacheService.getStaticData('item_types'),
      async () => {
        try {
          const result = await req.app.locals.dataService.pool.query('SELECT * FROM item_types');
          return result.rows;
        } catch (_) { return null; }
      }
    );
    const itemTypes = await getTypes();
    
    if (!itemTypes) {
      return res.status(503).json({ error: 'Données non disponibles' });
    }

    res.json({
      success: true,
      types: itemTypes.map(type => ({
        id: type.id,
        name: type.name,
        display_name: type.display_name,
        category: type.category,
        equip_slot: type.equip_slot,
        max_stack: type.max_stack,
        description: type.description,
        icon: type.icon
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching item types:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/static/rarities
 * Récupère toutes les raretés (avec cache)
 */
router.get('/rarities', injectCacheService, async (req, res) => {
  try {
    const getRarities = withFallback(
      () => req.cacheService.getStaticData('rarities'),
      async () => {
        try {
          const result = await req.app.locals.dataService.pool.query('SELECT * FROM rarities');
          return result.rows;
        } catch (_) { return null; }
      }
    );
    const rarities = await getRarities();
    
    if (!rarities) {
      return res.status(503).json({ error: 'Données non disponibles' });
    }

    res.json({
      success: true,
      rarities: rarities.map(rarity => ({
        id: rarity.id,
        name: rarity.name,
        display_name: rarity.display_name,
        color: rarity.color,
        probability: rarity.probability,
        stat_multiplier: rarity.stat_multiplier,
        description: rarity.description,
        icon: rarity.icon
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching rarities:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/static/skills
 * Récupère toutes les compétences (avec cache)
 */
router.get('/skills', injectCacheService, async (req, res) => {
  try {
    const { type, level_min, level_max } = req.query;
    
    const getSkills = withFallback(
      () => req.cacheService.getStaticData('skills'),
      async () => {
        try {
          const result = await req.app.locals.dataService.pool.query('SELECT * FROM skills');
          return result.rows;
        } catch (_) { return null; }
      }
    );
    let skills = await getSkills();
    
    if (!skills) {
      return res.status(503).json({ error: 'Données non disponibles' });
    }

    // Appliquer les filtres
    if (type) {
      skills = skills.filter(skill => skill.type === type);
    }
    
    if (level_min) {
      skills = skills.filter(skill => skill.level_requirement >= parseInt(level_min));
    }
    
    if (level_max) {
      skills = skills.filter(skill => skill.level_requirement <= parseInt(level_max));
    }

    res.json({
      success: true,
      skills: skills.map(skill => ({
        id: skill.id,
        name: skill.name,
        display_name: skill.display_name,
        description: skill.description,
        type: skill.type,
        level_requirement: skill.level_requirement,
        mana_cost: skill.mana_cost,
        cooldown: skill.cooldown,
        damage: skill.damage,
        healing: skill.healing,
        shield: skill.shield,
        buffs: skill.buffs,
        debuffs: skill.debuffs,
        effects: skill.effects,
        icon: skill.icon
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching skills:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/static/dungeons
 * Récupère tous les donjons (avec cache)
 */
router.get('/dungeons', injectCacheService, async (req, res) => {
  try {
    const { difficulty, level_min, level_max } = req.query;
    
    const getDungeons = withFallback(
      () => req.cacheService.getStaticData('dungeons'),
      async () => {
        try {
          const result = await req.app.locals.dataService.pool.query(`
            SELECT d.*, diff.name as difficulty
            FROM dungeons d
            JOIN difficulties diff ON d.difficulty_id = diff.id
            ORDER BY d.id
          `);
          return result.rows;
        } catch (_) { return null; }
      }
    );
    let dungeons = await getDungeons();
    
    if (!dungeons) {
      return res.status(503).json({ error: 'Données non disponibles' });
    }

    // Appliquer les filtres
    if (difficulty) {
      dungeons = dungeons.filter(dungeon => dungeon.difficulty === difficulty);
    }
    
    if (level_min) {
      dungeons = dungeons.filter(dungeon => dungeon.level_requirement >= parseInt(level_min));
    }
    
    if (level_max) {
      dungeons = dungeons.filter(dungeon => dungeon.level_requirement <= parseInt(level_max));
    }

    res.json({
      success: true,
      dungeons: dungeons.map(dungeon => ({
        id: dungeon.id,
        name: dungeon.name,
        display_name: dungeon.display_name,
        description: dungeon.description,
        level_requirement: dungeon.level_requirement,
        difficulty: dungeon.difficulty,
        estimated_duration: dungeon.estimated_duration,
        rewards: dungeon.rewards,
        requirements: dungeon.requirements,
        enemies: dungeon.enemies,
        icon: dungeon.icon,
        theme: dungeon.theme
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching dungeons:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/static/difficulties
 * Récupère toutes les difficultés (avec cache)
 */
router.get('/difficulties', injectCacheService, async (req, res) => {
  try {
    const getDiffs = withFallback(
      () => req.cacheService.getStaticData('difficulties'),
      async () => {
        try {
          const result = await req.app.locals.dataService.pool.query('SELECT * FROM difficulties ORDER BY order_index, id');
          return result.rows;
        } catch (_) { return null; }
      }
    );
    const diffs = await getDiffs();

    if (!diffs) {
      return res.status(503).json({ error: 'Données non disponibles' });
    }

    res.json({
      success: true,
      difficulties: diffs.map(d => ({
        id: d.id,
        name: d.name,
        display_name: d.display_name,
        color: d.color,
        icon: d.icon,
        description: d.description,
        stat_multiplier: d.stat_multiplier,
        exp_multiplier: d.exp_multiplier,
        gold_multiplier: d.gold_multiplier,
        order_index: d.order_index
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching difficulties:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/static/enemies
 * Récupère tous les ennemis (avec cache)
 */
router.get('/enemies', injectCacheService, async (req, res) => {
  try {
    const { type, level_min, level_max, rarity } = req.query;
    
    const getEnemies = withFallback(
      () => req.cacheService.getStaticData('enemies'),
      async () => {
        try {
          const result = await req.app.locals.dataService.pool.query(`
            SELECT e.*, r.name as rarity_name, r.color as rarity_color
            FROM enemies e
            JOIN rarities r ON e.rarity_id = r.id
            ORDER BY e.level
          `);
          return result.rows;
        } catch (_) { return null; }
      }
    );
    let enemies = await getEnemies();
    
    if (!enemies) {
      return res.status(503).json({ error: 'Données non disponibles' });
    }

    // Appliquer les filtres
    if (type) {
      enemies = enemies.filter(enemy => enemy.type === type);
    }
    
    if (level_min) {
      enemies = enemies.filter(enemy => enemy.level >= parseInt(level_min));
    }
    
    if (level_max) {
      enemies = enemies.filter(enemy => enemy.level <= parseInt(level_max));
    }
    
    if (rarity) {
      enemies = enemies.filter(enemy => enemy.rarity_name === rarity);
    }

    res.json({
      success: true,
      enemies: enemies.map(enemy => ({
        id: enemy.id,
        name: enemy.name,
        display_name: enemy.display_name,
        description: enemy.description,
        type: enemy.type,
        level: enemy.level,
        rarity: {
          name: enemy.rarity_name,
          color: enemy.rarity_color
        },
        stats: {
          health: enemy.health,
          attack: enemy.attack,
          defense: enemy.defense,
          magic_attack: enemy.magic_attack,
          magic_defense: enemy.magic_defense,
          speed: enemy.speed
        },
        rewards: {
          experience: enemy.experience_reward,
          gold: enemy.gold_reward
        },
        abilities: enemy.abilities,
        weaknesses: enemy.weaknesses,
        resistances: enemy.resistances,
        loot_table: enemy.loot_table,
        icon: enemy.icon
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching enemies:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/static/cache/status
 * Récupère le statut du cache
 */
router.get('/cache/status', injectCacheService, async (req, res) => {
  try {
    const cacheKeys = [
      'character_classes',
      'rarities',
      'item_types',
      'items',
      'skills',
      'dungeons',
      'enemies'
    ];

    const cacheStatus = {};
    
    for (const key of cacheKeys) {
      const data = await req.cacheService.getStaticData(key);
      cacheStatus[key] = {
        cached: !!data,
        count: data ? data.length : 0
      };
    }

    res.json({
      success: true,
      cache_status: cacheStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching cache status:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * POST /api/static/cache/refresh
 * Rafraîchit le cache des données statiques
 */
router.post('/cache/refresh', injectCacheService, async (req, res) => {
  try {
    await req.cacheService.preloadStaticData(req.app.locals.dataService);
    
    res.json({
      success: true,
      message: 'Cache rafraîchi avec succès',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error refreshing cache:', error);
    res.status(500).json({ error: 'Erreur lors du rafraîchissement du cache' });
  }
});

/**
 * GET /api/static/quests
 * Renvoie la liste des quêtes statiques (compat Frontend)
 */
router.get('/quests', injectCacheService, async (req, res) => {
  try {
    const result = await req.app.locals.dataService.pool.query('SELECT * FROM quests ORDER BY id');
    const quests = result.rows.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      type: q.type,
      min_level: q.level_requirement,
      exp_reward: Array.isArray(q.rewards) ? (q.rewards.find(r => r.type === 'experience')?.value || 0) : 0,
      gold_reward: Array.isArray(q.rewards) ? (q.rewards.find(r => r.type === 'gold')?.value || 0) : 0,
      item_rewards: Array.isArray(q.rewards) ? (q.rewards.filter(r => r.type === 'item') || []) : [],
      objective: Array.isArray(q.objectives) ? q.objectives.map(o => o.type).join(', ') : undefined,
      icon: q.icon
    }));
    res.json({ success: true, quests });
  } catch (error) {
    console.error('❌ Error fetching quests:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// ===== ENDPOINTS DE PAGES OPTIMISÉES =====

/**
 * GET /api/dashboard
 * Endpoint optimisé pour le dashboard avec toutes les données nécessaires
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  const pool = new Pool(getDbConfig());
  
  try {
    const userId = req.user.id;
    
    // Récupérer toutes les données nécessaires en une seule requête
    const dashboardQuery = `
      WITH character_data AS (
        SELECT 
          c.*,
          cc.display_name as class_name,
          cc.base_stats as class_base_stats,
          cc.description as class_description,
          u.email,
          u.username,
          u.created_at as user_created_at
        FROM characters c
        JOIN character_classes cc ON c.class_id = cc.id
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = $1
      ),
      character_stats AS (
        SELECT calculate_character_stats(c.id) as calculated_stats
        FROM characters c
        WHERE c.user_id = $1
      ),
      inventory_data AS (
        SELECT 
          ci.*,
          i.name as item_name,
          i.display_name as item_display_name,
          i.description as item_description,
          i.level_requirement,
          i.base_stats as item_base_stats,
          i.rarity_id,
          r.name as rarity_name,
          r.display_name as rarity_display_name,
          r.color as rarity_color,
          it.name as item_type_name,
          it.display_name as item_type_display_name,
          it.equip_slot
        FROM character_inventory ci
        JOIN items i ON ci.item_id = i.id
        JOIN rarities r ON i.rarity_id = r.id
        JOIN item_types it ON i.type_id = it.id
        WHERE ci.character_id = (SELECT id FROM characters WHERE user_id = $1)
      ),
      skills_data AS (
        SELECT 
          s.*,
          cs.level as learned_level,
          cs.learned_at
        FROM skills s
        LEFT JOIN character_skills cs ON s.id = cs.skill_id 
          AND cs.character_id = (SELECT id FROM characters WHERE user_id = $1)
        WHERE s.class_id = (SELECT class_id FROM characters WHERE user_id = $1)
           OR s.class_id IS NULL
      ),
      achievements_data AS (
        SELECT 
          a.*,
          ca.unlocked_at,
          ca.progress
        FROM achievements a
        LEFT JOIN character_achievements ca ON a.id = ca.achievement_id 
          AND ca.character_id = (SELECT id FROM characters WHERE user_id = $1)
      ),
      dungeons_data AS (
        SELECT 
          d.*,
          diff.display_name as difficulty_display_name,
          diff.multiplier as difficulty_multiplier
        FROM dungeons d
        JOIN difficulties diff ON d.difficulty = diff.name
        WHERE d.level_requirement <= (SELECT level FROM characters WHERE user_id = $1)
        ORDER BY d.level_requirement ASC
        LIMIT 10
      ),
      quests_data AS (
        SELECT 
          q.*,
          qt.display_name as quest_type_display_name
        FROM quests q
        LEFT JOIN quest_types qt ON q.type = qt.name
        WHERE q.min_level <= (SELECT level FROM characters WHERE user_id = $1)
        ORDER BY q.min_level ASC
        LIMIT 10
      )
      SELECT 
        (SELECT row_to_json(character_data) FROM character_data) as character,
        (SELECT calculated_stats FROM character_stats) as calculated_stats,
        (SELECT array_agg(row_to_json(inventory_data)) FROM inventory_data) as inventory,
        (SELECT array_agg(row_to_json(skills_data)) FROM skills_data) as skills,
        (SELECT array_agg(row_to_json(achievements_data)) FROM achievements_data) as achievements,
        (SELECT array_agg(row_to_json(dungeons_data)) FROM dungeons_data) as recommended_dungeons,
        (SELECT array_agg(row_to_json(quests_data)) FROM quests_data) as recommended_quests
    `;
    
    let result = await pool.query(dashboardQuery, [userId]);
    let data;
    
    if (result.rows.length === 0) {
      // Créer un personnage par défaut si l'utilisateur n'en a pas
      const createCharacterQuery = `
        INSERT INTO characters (
          user_id, name, class_id, level, experience, experience_to_next,
          health, max_health, mana, max_mana, attack, defense, 
          magic_attack, magic_defense, critical_rate, critical_damage,
          vitality, strength, intelligence, agility, resistance, precision,
          endurance, wisdom, constitution, dexterity,
          health_regen, mana_regen, attack_speed, movement_speed,
          dodge_chance, block_chance, parry_chance, spell_power, physical_power
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35)
        RETURNING id, name, level
      `;
      
      const defaultName = `Hero_${userId}`;
      await pool.query(createCharacterQuery, [
        userId, defaultName, 1, // Classe par défaut (warrior)
        1, 0, 100, // Level 1, 0 XP, 100 XP pour next level
        150, 150, 50, 50, // HP/MP
        25, 20, 8, 10, // Attack/Defense
        5.0, 150.0, // Crit
        10, 10, 10, 10, 10, 10, 10, 10, 10, 10, // Stats secondaires
        1.0, 0.5, 100.0, 100.0, 8.0, 5.0, 3.0, 100.0, 100.0 // Stats dérivées
      ]);
      
      // Relancer la requête après création du personnage
      result = await pool.query(dashboardQuery, [userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Impossible de créer un personnage' });
      }
    }
    
    data = result.rows[0];
    
    // Structurer la réponse optimisée
    const optimizedResponse = {
      character: {
        ...data.character,
        stats: data.calculated_stats,
        inventory: data.inventory || [],
        skills: data.skills || [],
        achievements: data.achievements || [],
        recommended_dungeons: data.recommended_dungeons || [],
        recommended_quests: data.recommended_quests || []
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    res.json(optimizedResponse);
    
  } catch (error) {
    console.error('Erreur dashboard optimisé:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    await pool.end();
  }
});

/**
 * GET /api/character
 * Endpoint optimisé pour la page personnage
 */
router.get('/character', authenticateToken, async (req, res) => {
  const pool = new Pool(getDbConfig());
  
  try {
    const userId = req.user.id;
    
    const characterQuery = `
      WITH character_data AS (
        SELECT 
          c.*,
          cc.display_name as class_name,
          cc.base_stats as class_base_stats,
          cc.description as class_description,
          cc.skills as class_skills,
          u.email,
          u.username,
          u.created_at as user_created_at
        FROM characters c
        JOIN character_classes cc ON c.class_id = cc.id
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = $1
      ),
      character_stats AS (
        SELECT calculate_character_stats(c.id) as calculated_stats
        FROM characters c
        WHERE c.user_id = $1
      ),
      inventory_data AS (
        SELECT 
          ci.*,
          i.name as item_name,
          i.display_name as item_display_name,
          i.description as item_description,
          i.level_requirement,
          i.base_stats as item_base_stats,
          i.rarity_id,
          r.name as rarity_name,
          r.display_name as rarity_display_name,
          r.color as rarity_color,
          it.name as item_type_name,
          it.display_name as item_type_display_name,
          it.equip_slot
        FROM character_inventory ci
        JOIN items i ON ci.item_id = i.id
        JOIN rarities r ON i.rarity_id = r.id
        JOIN item_types it ON i.type_id = it.id
        WHERE ci.character_id = (SELECT id FROM characters WHERE user_id = $1)
      ),
      equipped_items AS (
        SELECT 
          ci.*,
          i.name as item_name,
          i.display_name as item_display_name,
          i.description as item_description,
          i.level_requirement,
          i.base_stats as item_base_stats,
          i.rarity_id,
          r.name as rarity_name,
          r.display_name as rarity_display_name,
          r.color as rarity_color,
          it.name as item_type_name,
          it.display_name as item_type_display_name,
          it.equip_slot
        FROM character_inventory ci
        JOIN items i ON ci.item_id = i.id
        JOIN rarities r ON i.rarity_id = r.id
        JOIN item_types it ON i.type_id = it.id
        WHERE ci.character_id = (SELECT id FROM characters WHERE user_id = $1)
          AND ci.equipped = true
      ),
      skills_data AS (
        SELECT 
          s.*,
          cs.level as learned_level,
          cs.learned_at,
          cs.upgraded_at
        FROM skills s
        LEFT JOIN character_skills cs ON s.id = cs.skill_id 
          AND cs.character_id = (SELECT id FROM characters WHERE user_id = $1)
        WHERE s.class_id = (SELECT class_id FROM characters WHERE user_id = $1)
           OR s.class_id IS NULL
        ORDER BY s.level_requirement ASC
      ),
      achievements_data AS (
        SELECT 
          a.*,
          ca.unlocked_at,
          ca.progress
        FROM achievements a
        LEFT JOIN character_achievements ca ON a.id = ca.achievement_id 
          AND ca.character_id = (SELECT id FROM characters WHERE user_id = $1)
        ORDER BY a.level_requirement ASC
      )
      SELECT 
        (SELECT row_to_json(character_data) FROM character_data) as character,
        (SELECT calculated_stats FROM character_stats) as calculated_stats,
        (SELECT array_agg(row_to_json(inventory_data)) FROM inventory_data) as inventory,
        (SELECT array_agg(row_to_json(equipped_items)) FROM equipped_items) as equipped_items,
        (SELECT array_agg(row_to_json(skills_data)) FROM skills_data) as skills,
        (SELECT array_agg(row_to_json(achievements_data)) FROM achievements_data) as achievements
    `;
    
    const result = await pool.query(characterQuery, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Personnage non trouvé' });
    }
    
    const data = result.rows[0];
    
    const optimizedResponse = {
      character: {
        ...data.character,
        stats: data.calculated_stats,
        inventory: data.inventory || [],
        equipped_items: data.equipped_items || [],
        skills: data.skills || [],
        achievements: data.achievements || []
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    res.json(optimizedResponse);
    
  } catch (error) {
    console.error('Erreur character optimisé:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    await pool.end();
  }
});

// Helper pour la configuration de la base de données
function getDbConfig() {
  if (process.env.DATABASE_URL) {
    return { 
      connectionString: process.env.DATABASE_URL, 
      ssl: { rejectUnauthorized: false, require: true } 
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

module.exports = router;

