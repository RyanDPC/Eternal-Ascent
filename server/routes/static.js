const express = require('express');
const router = express.Router();

// Middleware pour injecter le service de cache
const injectCacheService = (req, res, next) => {
  req.cacheService = req.app.locals.cacheService;
  next();
};

/**
 * GET /api/static/classes
 * Récupère toutes les classes de personnages (avec cache)
 */
router.get('/classes', injectCacheService, async (req, res) => {
  try {
    const classes = await req.cacheService.getStaticData('character_classes');
    
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
        rarity: cls.rarity,
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
    
    let items = await req.cacheService.getStaticData('items');
    
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
    const itemTypes = await req.cacheService.getStaticData('item_types');
    
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
    const rarities = await req.cacheService.getStaticData('rarities');
    
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
    
    let skills = await req.cacheService.getStaticData('skills');
    
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
    
    let dungeons = await req.cacheService.getStaticData('dungeons');
    
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
 * GET /api/static/enemies
 * Récupère tous les ennemis (avec cache)
 */
router.get('/enemies', injectCacheService, async (req, res) => {
  try {
    const { type, level_min, level_max, rarity } = req.query;
    
    let enemies = await req.cacheService.getStaticData('enemies');
    
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
 * GET /api/static/difficulties
 * Récupère les difficultés disponibles (depuis SID ou cache)
 */
router.get('/difficulties', injectCacheService, async (req, res) => {
  try {
    // Try cache first
    const cached = await req.cacheService.getStaticData('difficulties');
    let difficulties = cached;

    if (!difficulties) {
      // Fallback to SID generator
      try {
        const difficultyManager = require('../data/sid/difficulties');
        if (difficultyManager.getAllDifficulties().length === 0) {
          difficultyManager.generateDifficulties();
        }
        difficulties = difficultyManager.getAllDifficulties();
        await req.cacheService.cacheStaticData('difficulties', difficulties, 86400);
      } catch (e) {
        return res.status(503).json({ error: 'Données non disponibles' });
      }
    }

    res.json({
      success: true,
      difficulties
    });
  } catch (error) {
    console.error('❌ Error fetching difficulties:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/static/quests
 * Récupère les quêtes disponibles (liste simple)
 */
router.get('/quests', injectCacheService, async (req, res) => {
  try {
    // No cache preloader for quests yet; query DB directly if available
    const db = req.app.locals.dataService?.pool;
    if (!db) {
      return res.status(503).json({ error: 'Données non disponibles' });
    }

    const result = await db.query(
      `SELECT id, title, description, type, level_requirement, icon
       FROM quests
       ORDER BY id`
    );

    // Normalize to expected client shape
    const quests = result.rows.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      type: q.type,
      min_level: q.level_requirement,
      rarity: 'common',
      exp_reward: 0,
      gold_reward: 0,
      objective: 'Compléter la quête',
      location: 'Partout',
      completed: false,
      in_progress: false,
      available: true,
      icon: q.icon || '📜'
    }));

    res.json({ success: true, quests });
  } catch (error) {
    console.error('❌ Error fetching quests:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;

