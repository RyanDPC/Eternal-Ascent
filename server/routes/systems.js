// Routes pour les systèmes avancés de l'API RPG Dungeon

const express = require('express');
const router = express.Router();

// Middleware d'authentification
const authenticateToken = require('../middleware/auth');
const { trackEconomyChange } = require('../middleware/antiCheat');

// Middleware de validation
const { validateParams } = require('../middleware/validation');

// Middleware de rate limiting
const rateLimit = require('express-rate-limit');

// Configuration du rate limiting pour les systèmes
const systemsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: { error: 'Trop de requêtes pour les systèmes' }
});

// Appliquer le rate limiting à toutes les routes
router.use(systemsLimiter);

// Middleware pour injecter les systèmes
const injectSystems = (req, res, next) => {
  req.systems = req.app.locals.systems;
  next();
};

router.use(injectSystems);

// ===== ROUTES WEBSOCKET =====
router.get('/websocket/status', (req, res) => {
  try {
    const websocketManager = req.systems.get('websocket');
    const status = websocketManager ? websocketManager.getStatus() : null;
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du statut WebSocket'
    });
  }
});

// ===== ROUTES ACHIEVEMENTS =====
router.get('/achievements', authenticateToken, (req, res) => {
  try {
    const achievementSystem = req.systems.get('achievements');
    const achievements = achievementSystem.getAchievements();
    
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des succès'
    });
  }
});

router.get('/achievements/character/:characterId', authenticateToken, (req, res) => {
  try {
    const { characterId } = req.params;
    const achievementSystem = req.systems.get('achievements');
    
    achievementSystem.getCharacterAchievements(characterId)
      .then(achievements => {
        res.json({
          success: true,
          data: achievements
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des succès du personnage'
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des succès du personnage'
    });
  }
});

router.post('/achievements/unlock', authenticateToken, validateParams(['characterId', 'achievementId']), (req, res) => {
  try {
    const { characterId, achievementId } = req.body;
    const achievementSystem = req.systems.get('achievements');
    
    achievementSystem.unlockAchievement(characterId, achievementId)
      .then(result => {
        res.json({
          success: true,
          data: result
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du déblocage du succès'
    });
  }
});

// ===== ROUTES TRADING =====
router.get('/trading/offers', authenticateToken, (req, res) => {
  try {
    const tradingSystem = req.systems.get('trading');
    const offers = tradingSystem.getActiveOffers();
    
    res.json({
      success: true,
      data: offers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des offres de trading'
    });
  }
});

router.post('/trading/create-offer', authenticateToken, validateParams(['characterId', 'offeredItems', 'requestedItems']), (req, res) => {
  try {
    const { characterId, offeredItems, requestedItems, duration = 24 } = req.body;
    const tradingSystem = req.systems.get('trading');
    
    tradingSystem.createOffer(characterId, offeredItems, requestedItems, duration)
      .then(offer => {
        res.json({
          success: true,
          data: offer
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'offre de trading'
    });
  }
});

router.post('/trading/accept-offer', authenticateToken, validateParams(['offerId', 'characterId']), (req, res) => {
  try {
    const { offerId, characterId } = req.body;
    const tradingSystem = req.systems.get('trading');
    
    tradingSystem.acceptOffer(offerId, characterId)
      .then(result => {
        res.json({
          success: true,
          data: result
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'acceptation de l\'offre de trading'
    });
  }
});

// ===== ROUTES PVP =====
router.get('/pvp/arenas', authenticateToken, (req, res) => {
  try {
    const pvpSystem = req.systems.get('pvp');
    const arenas = pvpSystem.getArenas();
    
    res.json({
      success: true,
      data: arenas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des arènes'
    });
  }
});

router.post('/pvp/queue', authenticateToken, validateParams(['characterId', 'arenaId']), (req, res) => {
  try {
    const { characterId, arenaId } = req.body;
    const pvpSystem = req.systems.get('pvp');
    
    pvpSystem.joinQueue(characterId, arenaId)
      .then(result => {
        res.json({
          success: true,
          data: result
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout à la file d\'attente PvP'
    });
  }
});

router.get('/pvp/leaderboard', authenticateToken, (req, res) => {
  try {
    const pvpSystem = req.systems.get('pvp');
    const leaderboard = pvpSystem.getLeaderboard();
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du classement PvP'
    });
  }
});

// ===== ROUTES EVENTS =====
router.get('/events/active', authenticateToken, (req, res) => {
  try {
    const eventSystem = req.systems.get('events');
    const events = eventSystem.getActiveEvents();
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des événements actifs'
    });
  }
});

router.post('/events/participate', authenticateToken, validateParams(['characterId', 'eventId']), (req, res) => {
  try {
    const { characterId, eventId } = req.body;
    const eventSystem = req.systems.get('events');
    
    eventSystem.participateInEvent(characterId, eventId)
      .then(result => {
        res.json({
          success: true,
          data: result
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la participation à l\'événement'
    });
  }
});

// ===== ROUTES CRAFTING =====
router.get('/crafting/recipes', authenticateToken, (req, res) => {
  try {
    const craftingSystem = req.systems.get('crafting');
    const recipes = craftingSystem.getRecipes();
    
    res.json({
      success: true,
      data: recipes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des recettes de craft'
    });
  }
});

router.get('/crafting/recipes/character/:characterId', authenticateToken, (req, res) => {
  try {
    const { characterId } = req.params;
    const craftingSystem = req.systems.get('crafting');
    
    craftingSystem.getAvailableRecipes(characterId)
      .then(recipes => {
        res.json({
          success: true,
          data: recipes
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des recettes disponibles'
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des recettes disponibles'
    });
  }
});

router.post('/crafting/start', authenticateToken, validateParams(['characterId', 'recipeId']), (req, res) => {
  try {
    const { characterId, recipeId, itemId } = req.body;
    const craftingSystem = req.systems.get('crafting');
    
    craftingSystem.startCrafting(characterId, recipeId, itemId)
      .then(result => {
        res.json({
          success: true,
          data: result
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du démarrage du craft'
    });
  }
});

router.get('/crafting/queue/character/:characterId', authenticateToken, (req, res) => {
  try {
    const { characterId } = req.params;
    const craftingSystem = req.systems.get('crafting');
    
    craftingSystem.getCraftingQueue(characterId)
      .then(queue => {
        res.json({
          success: true,
          data: queue
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération de la queue de craft'
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la queue de craft'
    });
  }
});

// ===== ROUTES PETS =====
router.get('/pets/types', authenticateToken, (req, res) => {
  try {
    const petSystem = req.systems.get('pets');
    const petTypes = petSystem.getPetTypes();
    
    res.json({
      success: true,
      data: petTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des types de familiers'
    });
  }
});

router.get('/pets/character/:characterId', authenticateToken, (req, res) => {
  try {
    const { characterId } = req.params;
    const petSystem = req.systems.get('pets');
    
    petSystem.getPets(characterId)
      .then(pets => {
        res.json({
          success: true,
          data: pets
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des familiers du personnage'
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des familiers du personnage'
    });
  }
});

router.post('/pets/adopt', authenticateToken, validateParams(['characterId', 'petTypeId']), (req, res) => {
  try {
    const { characterId, petTypeId, name } = req.body;
    const petSystem = req.systems.get('pets');
    
    petSystem.adoptPet(characterId, petTypeId, name)
      .then(pet => {
        res.json({
          success: true,
          data: pet
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'adoption du familier'
    });
  }
});

router.post('/pets/feed', authenticateToken, validateParams(['characterId', 'petId']), (req, res) => {
  try {
    const { characterId, petId, foodType = 'basic' } = req.body;
    const petSystem = req.systems.get('pets');
    
    petSystem.feedPet(characterId, petId, foodType)
      .then(result => {
        res.json({
          success: true,
          data: result
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du nourrissage du familier'
    });
  }
});

// ===== ROUTES GUILD WARS =====
router.get('/guild-wars/territories', authenticateToken, (req, res) => {
  try {
    const guildWarSystem = req.systems.get('guild_wars');
    const territories = guildWarSystem.getTerritories();
    
    res.json({
      success: true,
      data: territories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des territoires'
    });
  }
});

router.get('/guild-wars/territories/guild/:guildId', authenticateToken, (req, res) => {
  try {
    const { guildId } = req.params;
    const guildWarSystem = req.systems.get('guild_wars');
    
    guildWarSystem.getGuildTerritories(guildId)
      .then(territories => {
        res.json({
          success: true,
          data: territories
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des territoires de la guilde'
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des territoires de la guilde'
    });
  }
});

router.post('/guild-wars/claim-territory', authenticateToken, validateParams(['guildId', 'territoryId']), (req, res) => {
  try {
    const { guildId, territoryId } = req.body;
    const guildWarSystem = req.systems.get('guild_wars');
    
    guildWarSystem.claimTerritory(guildId, territoryId)
      .then(result => {
        res.json({
          success: true,
          data: result
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la revendication du territoire'
    });
  }
});

// ===== ROUTES QUESTS =====
router.get('/quests/available/character/:characterId', authenticateToken, (req, res) => {
  try {
    const { characterId } = req.params;
    const questSystem = req.systems.get('quests');
    
    questSystem.getAvailableQuests(characterId)
      .then(quests => {
        res.json({
          success: true,
          data: quests
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des quêtes disponibles'
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des quêtes disponibles'
    });
  }
});

// Rotation quotidienne de quêtes (max 10 avec quotas 2/2/2)
router.get('/quests/rotation/character/:characterId', authenticateToken, async (req, res) => {
  try {
    const { characterId } = req.params;
    const rotationService = req.systems.get('rotations');
    const quests = await rotationService.getDailyQuestRotation(characterId);
    res.json({ success: true, data: quests });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur rotation quêtes' });
  }
});

// Endpoint de notification loot → websocket
router.post('/loot/notify', authenticateToken, validateParams(['characterId', 'items']), (req, res) => {
  try {
    const { characterId, items } = req.body;
    const ws = req.systems.get('websocket');
    if (ws) {
      ws.sendNotification(req.user.userId, {
        title: 'Loot reçu',
        body: `Vous avez reçu ${items.length} objet(s)`
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur notification loot' });
  }
});

// Endpoint de notification guilde → websocket
router.post('/guilds/:guildId/notify', authenticateToken, (req, res) => {
  try {
    const { guildId } = req.params;
    const { message } = req.body || {};
    const ws = req.systems.get('websocket');
    if (ws) {
      ws.broadcastNotification({
        title: 'Guilde',
        body: message || `Nouvelle notification pour la guilde ${guildId}`
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur notification guilde' });
  }
});

router.post('/quests/start', authenticateToken, validateParams(['characterId', 'questId']), trackEconomyChange({ xp: 100, gold: 0 }), (req, res) => {
  try {
    const { characterId, questId } = req.body;
    const questSystem = req.systems.get('quests');
    
    questSystem.startQuest(characterId, questId)
      .then(result => {
        res.json({
          success: true,
          data: result
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du démarrage de la quête'
    });
  }
});

router.get('/quests/active/character/:characterId', authenticateToken, (req, res) => {
  try {
    const { characterId } = req.params;
    const questSystem = req.systems.get('quests');
    
    questSystem.getActiveQuests(characterId)
      .then(quests => {
        res.json({
          success: true,
          data: quests
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des quêtes actives'
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des quêtes actives'
    });
  }
});

// ===== ROUTES LEADERBOARDS =====
router.get('/leaderboards/:type', authenticateToken, (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const leaderboardSystem = req.systems.get('leaderboards');
    
    leaderboardSystem.getLeaderboard(type, parseInt(limit), parseInt(offset))
      .then(leaderboard => {
        res.json({
          success: true,
          data: leaderboard
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération du classement'
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du classement'
    });
  }
});

router.get('/leaderboards/character/:characterId/:type', authenticateToken, (req, res) => {
  try {
    const { characterId, type } = req.params;
    const leaderboardSystem = req.systems.get('leaderboards');
    
    leaderboardSystem.getCharacterRank(characterId, type)
      .then(rank => {
        res.json({
          success: true,
          data: rank
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération du rang du personnage'
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du rang du personnage'
    });
  }
});

// ===== ROUTES ANALYTICS =====
router.get('/analytics/metrics/:metricId', authenticateToken, (req, res) => {
  try {
    const { metricId } = req.params;
    const { startDate, endDate } = req.query;
    const analyticsSystem = req.systems.get('analytics');
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Dates de début et de fin requises'
      });
    }
    
    analyticsSystem.getCustomReport(metricId, new Date(startDate), new Date(endDate))
      .then(data => {
        res.json({
          success: true,
          data: data
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des métriques'
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des métriques'
    });
  }
});

router.get('/analytics/export/:metricId', authenticateToken, (req, res) => {
  try {
    const { metricId } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;
    const analyticsSystem = req.systems.get('analytics');
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Dates de début et de fin requises'
      });
    }
    
    analyticsSystem.exportData(metricId, new Date(startDate), new Date(endDate), format)
      .then(data => {
        res.json({
          success: true,
          data: data
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de l\'export des données'
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export des données'
    });
  }
});

// ===== ROUTES CACHE =====
router.get('/cache/status', authenticateToken, (req, res) => {
  try {
    const cacheSystem = req.systems.get('cache');
    const status = cacheSystem ? cacheSystem.getStatus() : null;
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du statut du cache'
    });
  }
});

router.post('/cache/clear', authenticateToken, (req, res) => {
  try {
    const cacheSystem = req.systems.get('cache');
    
    if (cacheSystem) {
      cacheSystem.clear()
        .then(() => {
          res.json({
            success: true,
            message: 'Cache vidé avec succès'
          });
        })
        .catch(error => {
          res.status(500).json({
            success: false,
            error: 'Erreur lors du vidage du cache'
          });
        });
    } else {
      res.status(500).json({
        success: false,
        error: 'Système de cache non disponible'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du vidage du cache'
    });
  }
});

module.exports = router;

