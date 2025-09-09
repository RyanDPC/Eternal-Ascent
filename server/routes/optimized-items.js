const express = require('express');
const router = express.Router();

// Middleware pour injecter le service de données
const injectDataService = (req, res, next) => {
  req.dataService = req.app.locals.dataService;
  next();
};

/**
 * GET /api/items
 * Récupère les objets avec filtres et pagination optimisés
 */
router.get('/', injectDataService, async (req, res) => {
  try {
    const {
      type,
      rarity,
      level_min,
      level_max,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filters = {
      type: type || null,
      rarity: rarity || null,
      levelMin: level_min ? parseInt(level_min) : null,
      levelMax: level_max ? parseInt(level_max) : null,
      search: search || null
    };

    const pagination = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100) // Limite max de 100
    };

    const result = await req.dataService.getItems(filters, pagination);
    
    res.json({
      success: true,
      items: result.items.map(item => ({
        id: item.id,
        name: item.name,
        display_name: item.display_name,
        description: item.description,
        type: {
          name: item.type_name,
          display_name: item.type_display_name,
          category: item.type_category,
          equip_slot: item.type_equip_slot,
          max_stack: item.type_max_stack
        },
        rarity: {
          name: item.rarity_name,
          display_name: item.rarity_display_name,
          color: item.rarity_color,
          probability: item.rarity_probability,
          stat_multiplier: item.rarity_stat_multiplier
        },
        level_requirement: item.level_requirement,
        base_stats: item.base_stats,
        stat_ranges: item.stat_ranges,
        effects: item.effects,
        icon: item.icon,
        image: item.image,
        statistics: {
          total_owned: item.total_owned,
          total_equipped: item.total_equipped,
          total_quantity: item.total_quantity
        },
        created_at: item.created_at,
        updated_at: item.updated_at
      })),
      pagination: result.pagination
    });
  } catch (error) {
    console.error('❌ Error fetching items:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/items/:id
 * Récupère un objet par ID
 */
router.get('/:id', injectDataService, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID d\'objet invalide' });
    }

    const item = await req.dataService.getItem(parseInt(id));
    
    if (!item) {
      return res.status(404).json({ error: 'Objet non trouvé' });
    }

    res.json({
      success: true,
      item: {
        id: item.id,
        name: item.name,
        display_name: item.display_name,
        description: item.description,
        type: {
          name: item.type_name,
          display_name: item.type_display_name,
          category: item.type_category,
          equip_slot: item.type_equip_slot,
          max_stack: item.type_max_stack
        },
        rarity: {
          name: item.rarity_name,
          display_name: item.rarity_display_name,
          color: item.rarity_color,
          probability: item.rarity_probability,
          stat_multiplier: item.rarity_stat_multiplier
        },
        level_requirement: item.level_requirement,
        base_stats: item.base_stats,
        stat_ranges: item.stat_ranges,
        effects: item.effects,
        icon: item.icon,
        image: item.image,
        statistics: {
          total_owned: item.total_owned,
          total_equipped: item.total_equipped,
          total_quantity: item.total_quantity
        },
        created_at: item.created_at,
        updated_at: item.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error fetching item:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/items/search/:query
 * Recherche d'objets
 */
router.get('/search/:query', injectDataService, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Requête de recherche trop courte (minimum 2 caractères)' });
    }

    const items = await req.dataService.searchItems(query, parseInt(limit));
    
    res.json({
      success: true,
      query,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        display_name: item.display_name,
        description: item.description,
        type: {
          name: item.type_name,
          category: item.type_category
        },
        rarity: {
          name: item.rarity_name,
          color: item.rarity_color
        },
        level_requirement: item.level_requirement,
        icon: item.icon
      })),
      total: items.length
    });
  } catch (error) {
    console.error('❌ Error searching items:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/items/type/:type
 * Récupère les objets par type
 */
router.get('/type/:type', injectDataService, async (req, res) => {
  try {
    const { type } = req.params;
    const { level_min, level_max, rarity } = req.query;
    
    const items = await req.dataService.executePrepared('get_items_by_type', [type]);
    
    // Appliquer les filtres supplémentaires
    let filteredItems = items;
    
    if (level_min) {
      filteredItems = filteredItems.filter(item => item.level_requirement >= parseInt(level_min));
    }
    
    if (level_max) {
      filteredItems = filteredItems.filter(item => item.level_requirement <= parseInt(level_max));
    }
    
    if (rarity) {
      filteredItems = filteredItems.filter(item => item.rarity_name === rarity);
    }
    
    res.json({
      success: true,
      type,
      items: filteredItems.map(item => ({
        id: item.id,
        name: item.name,
        display_name: item.display_name,
        description: item.description,
        rarity: {
          name: item.rarity_name,
          color: item.rarity_color
        },
        level_requirement: item.level_requirement,
        base_stats: item.base_stats,
        icon: item.icon
      })),
      total: filteredItems.length
    });
  } catch (error) {
    console.error('❌ Error fetching items by type:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/items/rarity/:rarity
 * Récupère les objets par rareté
 */
router.get('/rarity/:rarity', injectDataService, async (req, res) => {
  try {
    const { rarity } = req.params;
    const { level_min, level_max, type } = req.query;
    
    const items = await req.dataService.executePrepared('get_items_by_rarity', [rarity]);
    
    // Appliquer les filtres supplémentaires
    let filteredItems = items;
    
    if (level_min) {
      filteredItems = filteredItems.filter(item => item.level_requirement >= parseInt(level_min));
    }
    
    if (level_max) {
      filteredItems = filteredItems.filter(item => item.level_requirement <= parseInt(level_max));
    }
    
    if (type) {
      filteredItems = filteredItems.filter(item => item.type_name === type);
    }
    
    res.json({
      success: true,
      rarity,
      items: filteredItems.map(item => ({
        id: item.id,
        name: item.name,
        display_name: item.display_name,
        description: item.description,
        type: {
          name: item.type_name,
          category: item.type_category
        },
        level_requirement: item.level_requirement,
        base_stats: item.base_stats,
        icon: item.icon
      })),
      total: filteredItems.length
    });
  } catch (error) {
    console.error('❌ Error fetching items by rarity:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/items/popularity
 * Récupère les statistiques de popularité des objets
 */
router.get('/popularity', injectDataService, async (req, res) => {
  try {
    const popularity = await req.dataService.getItemsPopularity();
    
    res.json({
      success: true,
      popularity: popularity.map(stat => ({
        type: stat.type_name,
        rarity: stat.rarity_name,
        count: parseInt(stat.count),
        average_owned: parseFloat(stat.avg_owned)
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching items popularity:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/items/filters/options
 * Récupère les options de filtres disponibles
 */
router.get('/filters/options', injectDataService, async (req, res) => {
  try {
    // Récupérer les types d'objets
    const types = await req.dataService.cache.getStaticData('item_types');
    
    // Récupérer les raretés
    const rarities = await req.dataService.cache.getStaticData('rarities');
    
    // Récupérer les niveaux min/max
    const levelStats = await req.dataService.pool.query(`
      SELECT MIN(level_requirement) as min_level, MAX(level_requirement) as max_level
      FROM items
    `);
    
    res.json({
      success: true,
      filters: {
        types: types ? types.map(type => ({
          name: type.name,
          display_name: type.display_name,
          category: type.category
        })) : [],
        rarities: rarities ? rarities.map(rarity => ({
          name: rarity.name,
          display_name: rarity.display_name,
          color: rarity.color
        })) : [],
        levels: {
          min: levelStats.rows[0].min_level || 1,
          max: levelStats.rows[0].max_level || 100
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching filter options:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/items/random
 * Récupère des objets aléatoires
 */
router.get('/random', injectDataService, async (req, res) => {
  try {
    const { count = 5, rarity, type } = req.query;
    
    let query = `
      SELECT * FROM items_with_stats
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (rarity) {
      paramCount++;
      query += ` AND rarity_name = $${paramCount}`;
      params.push(rarity);
    }
    
    if (type) {
      paramCount++;
      query += ` AND type_name = $${paramCount}`;
      params.push(type);
    }
    
    query += ` ORDER BY RANDOM() LIMIT $${paramCount + 1}`;
    params.push(parseInt(count));
    
    const items = await req.dataService.pool.query(query, params);
    
    res.json({
      success: true,
      items: items.rows.map(item => ({
        id: item.id,
        name: item.name,
        display_name: item.display_name,
        description: item.description,
        type: {
          name: item.type_name,
          category: item.type_category
        },
        rarity: {
          name: item.rarity_name,
          color: item.rarity_color
        },
        level_requirement: item.level_requirement,
        base_stats: item.base_stats,
        icon: item.icon
      })),
      count: items.rows.length
    });
  } catch (error) {
    console.error('❌ Error fetching random items:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;

