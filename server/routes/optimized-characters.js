const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eterna_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token invalide' });
  }
};

// Middleware de validation des paramètres
const validateCharacterId = (req, res, next) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'ID de personnage invalide' });
  }
  req.characterId = parseInt(id);
  next();
};

// Middleware pour injecter le service de données
const injectDataService = (req, res, next) => {
  req.dataService = req.app.locals.dataService;
  next();
};

/**
 * GET /api/characters/current
 * Récupère le personnage du user courant (via JWT)
 */
router.get('/current', authenticateToken, injectDataService, async (req, res) => {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Récupérer l'id personnage puis retourner le JSON propre
    const rows = await req.dataService.executePrepared('get_character_by_user', [userId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Aucun personnage associé à cet utilisateur' });
    }
    const characterId = rows[0].id;
    const out = await req.dataService.executePrepared('get_character_public', [characterId]);
    const payload = out[0] && out[0].character;
    if (!payload) return res.status(404).json({ error: 'Personnage non trouvé' });
    return res.json({ success: true, character: payload });
  } catch (error) {
    console.error('❌ Error fetching current character:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/characters/:id
 * Récupère un personnage complet avec cache optimisé
 */
router.get('/:id', validateCharacterId, injectDataService, async (req, res) => {
  try {
    const out = await req.dataService.executePrepared('get_character_public', [req.characterId]);
    const payload = out[0] && out[0].character;
    if (!payload) return res.status(404).json({ error: 'Personnage non trouvé' });
    res.json({ success: true, character: payload });
  } catch (error) {
    console.error('❌ Error fetching character:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/characters/:id/stats
 * Récupère les stats calculées d'un personnage
 */
router.get('/:id/stats', validateCharacterId, injectDataService, async (req, res) => {
  try {
    const out = await req.dataService.executePrepared('get_character_public', [req.characterId]);
    const payload = out[0] && out[0].character;
    if (!payload) return res.status(404).json({ error: 'Personnage non trouvé' });

    res.json({
      success: true,
      final_stats: payload.stats?.calculated || null,
      equipped_items: payload.equipped_items || [],
      stats: payload.stats || {},
      level: payload.level,
      experience: payload.experience,
      experience_to_next: payload.experience_to_next
    });
  } catch (error) {
    console.error('❌ Error fetching character stats:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/characters/:id/inventory
 * Récupère l'inventaire d'un personnage
 */
router.get('/:id/inventory', validateCharacterId, injectDataService, async (req, res) => {
  try {
    const out = await req.dataService.executePrepared('get_character_public', [req.characterId]);
    const payload = out[0] && out[0].character;
    if (!payload) return res.status(404).json({ error: 'Personnage non trouvé' });
    res.json({ success: true, inventory: payload.inventory || [] });
  } catch (error) {
    console.error('❌ Error fetching character inventory:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/characters/:id/equipped
 * Récupère les objets équipés d'un personnage
 */
router.get('/:id/equipped', validateCharacterId, injectDataService, async (req, res) => {
  try {
    const out = await req.dataService.executePrepared('get_character_public', [req.characterId]);
    const payload = out[0] && out[0].character;
    if (!payload) return res.status(404).json({ error: 'Personnage non trouvé' });
    res.json({ success: true, equipped_items: payload.equipped_items || [] });
  } catch (error) {
    console.error('❌ Error fetching equipped items:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * PUT /api/characters/:id/equip
 * Équipe un objet
 */
router.put('/:id/equip', validateCharacterId, injectDataService, async (req, res) => {
  try {
    const { item_id, slot } = req.body;
    
    if (!item_id || !slot) {
      return res.status(400).json({ error: 'item_id et slot requis' });
    }

    // Vérifier que l'objet appartient au personnage
    const inventory = await req.dataService.getCharacterInventory(req.characterId, false);
    const item = inventory.find(i => i.item_id === item_id);
    
    if (!item) {
      return res.status(404).json({ error: 'Objet non trouvé dans l\'inventaire' });
    }

    // Équiper l'objet
    const equippedItem = await req.dataService.equipItem(req.characterId, item_id, slot);
    
    res.json({
      success: true,
      message: 'Objet équipé avec succès',
      equipped_item: {
        id: equippedItem.id,
        item_id: equippedItem.item_id,
        equipped: equippedItem.equipped,
        equipped_slot: equippedItem.equipped_slot
      }
    });
  } catch (error) {
    console.error('❌ Error equipping item:', error);
    
    if (error.message.includes('Contraintes d\'équipement')) {
      res.status(400).json({ error: error.message });
    } else if (error.message.includes('non trouvé')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }
});

/**
 * PUT /api/characters/:id/unequip
 * Déséquipe un objet
 */
router.put('/:id/unequip', validateCharacterId, injectDataService, async (req, res) => {
  try {
    const { item_id } = req.body;
    
    if (!item_id) {
      return res.status(400).json({ error: 'item_id requis' });
    }
    const result = await req.dataService.unequipItem(req.characterId, item_id);
    if (!result) return res.status(404).json({ error: 'Objet non trouvé ou non équipé' });
    res.json({
      success: true,
      message: 'Objet déséquipé avec succès',
      unequipped_item: {
        id: result.id,
        item_id: result.item_id,
        equipped: result.equipped,
        equipped_slot: result.equipped_slot
      }
    });
  } catch (error) {
    console.error('❌ Error unequipping item:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * POST /api/characters/:id/level-up
 * Monte de niveau un personnage
 */
router.post('/:id/level-up', validateCharacterId, injectDataService, async (req, res) => {
  try {
    const { experience } = req.body;
    
    if (!experience || experience <= 0) {
      return res.status(400).json({ error: 'Expérience invalide' });
    }

    const character = await req.dataService.getCharacter(req.characterId, false);
    if (!character) {
      return res.status(404).json({ error: 'Personnage non trouvé' });
    }

    // Calculer les nouvelles valeurs
    let newXP = character.experience + experience;
    let newLevel = character.level;
    let newXPToNext = character.experience_to_next;
    let levelUp = false;
    let levelsGained = 0;

    // Gestion des montées de niveau
    while (newXP >= newXPToNext) {
      newXP -= newXPToNext;
      newLevel++;
      levelsGained++;
      newXPToNext = Math.floor(newXPToNext * (1.3 + (newLevel * 0.05)));
      levelUp = true;
    }

    // Calculer les nouvelles stats
    const statsMultiplier = 1 + (levelsGained * 0.1); // 10% par niveau
    const newHealth = Math.floor(character.max_health * statsMultiplier);
    const newMana = Math.floor(character.max_mana * statsMultiplier);
    const newAttack = Math.floor(character.attack * statsMultiplier);
    const newDefense = Math.floor(character.defense * statsMultiplier);
    const newMagicAttack = Math.floor(character.magic_attack * statsMultiplier);
    const newMagicDefense = Math.floor(character.magic_defense * statsMultiplier);

    // Mettre à jour le personnage
    const updatedCharacter = await req.dataService.executePrepared('update_character_stats', [
      newLevel, newXP, newXPToNext,
      newHealth, newHealth, newMana, newMana,
      newAttack, newDefense, newMagicAttack, newMagicDefense,
      req.characterId
    ]);

    res.json({
      success: true,
      level_up: levelUp,
      levels_gained: levelsGained,
      new_level: newLevel,
      new_xp: newXP,
      new_xp_to_next: newXPToNext,
      new_stats: {
        health: newHealth,
        max_health: newHealth,
        mana: newMana,
        max_mana: newMana,
        attack: newAttack,
        defense: newDefense,
        magic_attack: newMagicAttack,
        magic_defense: newMagicDefense
      }
    });
  } catch (error) {
    console.error('❌ Error leveling up character:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/characters/:id/dungeons
 * Récupère les donjons du personnage
 */
router.get('/:id/dungeons', validateCharacterId, injectDataService, async (req, res) => {
  try {
    const dungeons = await req.dataService.executePrepared('get_character_dungeons', [req.characterId]);
    
    res.json({
      success: true,
      dungeons: dungeons.map(dungeon => ({
        id: dungeon.dungeon_id,
        name: dungeon.dungeon_name,
        display_name: dungeon.dungeon_display_name,
        level_requirement: dungeon.level_requirement,
        difficulty: dungeon.difficulty_name,
        status: dungeon.status,
        best_time: dungeon.best_time,
        completion_count: dungeon.completion_count,
        last_completed: dungeon.last_completed
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching character dungeons:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;

