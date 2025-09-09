const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { trackEconomyChange } = require('../middleware/antiCheat');

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
 * GET /api/characters/:id
 * Récupère un personnage complet avec cache optimisé
 */
router.get('/:id', authenticateToken, validateCharacterId, injectDataService, async (req, res) => {
  try {
    const character = await req.dataService.getCharacter(req.characterId);
    
    if (!character) {
      return res.status(404).json({ error: 'Personnage non trouvé' });
    }

    res.json({
      success: true,
      character: {
        id: character.id,
        name: character.name,
        class: {
          id: character.class_id,
          name: character.class_name,
          display_name: character.class_display_name,
          rarity: {
            name: character.class_rarity_name,
            color: character.class_rarity_color
          }
        },
        level: character.level,
        experience: character.experience,
        experience_to_next: character.experience_to_next,
        stats: {
          base: {
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
          },
          secondary: {
            vitality: character.vitality,
            strength: character.strength,
            intelligence: character.intelligence,
            agility: character.agility,
            resistance: character.resistance,
            precision: character.precision,
            endurance: character.endurance,
            wisdom: character.wisdom,
            constitution: character.constitution,
            dexterity: character.dexterity
          },
          derived: {
            health_regen: character.health_regen,
            mana_regen: character.mana_regen,
            attack_speed: character.attack_speed,
            movement_speed: character.movement_speed,
            dodge_chance: character.dodge_chance,
            block_chance: character.block_chance,
            parry_chance: character.parry_chance,
            spell_power: character.spell_power,
            physical_power: character.physical_power
          },
          calculated: character.calculated_stats
        },
        inventory: character.inventory.map(item => ({
          id: item.id,
          item_id: item.item_id,
          name: item.item_name,
          display_name: item.item_display_name,
          description: item.item_description,
          type: {
            name: item.item_type,
            display_name: item.item_type_display_name,
            category: item.item_category,
            equip_slot: item.item_equip_slot
          },
          rarity: {
            name: item.rarity_name,
            display_name: item.rarity_display_name,
            color: item.rarity_color
          },
          level_requirement: item.level_requirement,
          base_stats: item.item_base_stats,
          effects: item.item_effects,
          quantity: item.quantity,
          equipped: item.equipped,
          equipped_slot: item.equipped_slot,
          icon: item.item_icon,
          image: item.item_image
        })),
        user: {
          username: character.username,
          email: character.email,
          last_login: character.last_login
        },
        created_at: character.created_at,
        updated_at: character.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error fetching character:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/characters/:id/stats
 * Récupère les stats calculées d'un personnage
 */
router.get('/:id/stats', authenticateToken, validateCharacterId, injectDataService, async (req, res) => {
  try {
    const character = await req.dataService.getCharacter(req.characterId);
    
    if (!character) {
      return res.status(404).json({ error: 'Personnage non trouvé' });
    }

    res.json({
      success: true,
      stats: {
        calculated: character.calculated_stats,
        base: {
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
        },
        secondary: {
          vitality: character.vitality,
          strength: character.strength,
          intelligence: character.intelligence,
          agility: character.agility,
          resistance: character.resistance,
          precision: character.precision,
          endurance: character.endurance,
          wisdom: character.wisdom,
          constitution: character.constitution,
          dexterity: character.dexterity
        },
        derived: {
          health_regen: character.health_regen,
          mana_regen: character.mana_regen,
          attack_speed: character.attack_speed,
          movement_speed: character.movement_speed,
          dodge_chance: character.dodge_chance,
          block_chance: character.block_chance,
          parry_chance: character.parry_chance,
          spell_power: character.spell_power,
          physical_power: character.physical_power
        }
      },
      level: character.level,
      experience: character.experience,
      experience_to_next: character.experience_to_next
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
router.get('/:id/inventory', authenticateToken, validateCharacterId, injectDataService, async (req, res) => {
  try {
    const inventory = await req.dataService.getCharacterInventory(req.characterId);
    
    res.json({
      success: true,
      inventory: inventory.map(item => ({
        id: item.id,
        item_id: item.item_id,
        name: item.item_name,
        display_name: item.item_display_name,
        description: item.item_description,
        type: {
          name: item.item_type,
          display_name: item.item_type_display_name,
          category: item.item_category,
          equip_slot: item.item_equip_slot,
          max_stack: item.item_max_stack
        },
        rarity: {
          name: item.rarity_name,
          display_name: item.rarity_display_name,
          color: item.rarity_color,
          probability: item.rarity_probability,
          stat_multiplier: item.rarity_stat_multiplier
        },
        level_requirement: item.level_requirement,
        base_stats: item.item_base_stats,
        stat_ranges: item.item_stat_ranges,
        effects: item.item_effects,
        quantity: item.quantity,
        equipped: item.equipped,
        equipped_slot: item.equipped_slot,
        icon: item.item_icon,
        image: item.item_image,
        created_at: item.created_at,
        updated_at: item.updated_at
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching character inventory:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/characters/:id/equipped
 * Récupère les objets équipés d'un personnage
 */
router.get('/:id/equipped', authenticateToken, validateCharacterId, injectDataService, async (req, res) => {
  try {
    const equippedItems = await req.dataService.getCharacterEquippedItems(req.characterId);
    
    res.json({
      success: true,
      equipped_items: equippedItems.map(item => ({
        id: item.id,
        item_id: item.item_id,
        name: item.item_name,
        display_name: item.item_display_name,
        type: {
          name: item.item_type,
          category: item.item_category,
          equip_slot: item.item_equip_slot
        },
        rarity: {
          name: item.rarity_name,
          color: item.rarity_color
        },
        base_stats: item.item_base_stats,
        effects: item.item_effects,
        equipped_slot: item.equipped_slot,
        icon: item.item_icon
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching equipped items:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * PUT /api/characters/:id/equip
 * Équipe un objet
 */
router.put('/:id/equip', authenticateToken, validateCharacterId, injectDataService, trackEconomyChange({ gold: 0, xp: 0 }), async (req, res) => {
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
router.put('/:id/unequip', authenticateToken, validateCharacterId, injectDataService, async (req, res) => {
  try {
    const { item_id } = req.body;
    
    if (!item_id) {
      return res.status(400).json({ error: 'item_id requis' });
    }

    const client = await req.dataService.pool.connect();
    try {
      const result = await client.query(
        'UPDATE character_inventory SET equipped = false, equipped_slot = NULL WHERE character_id = $1 AND item_id = $2 RETURNING *',
        [req.characterId, item_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Objet non trouvé ou non équipé' });
      }
      
      // Invalider le cache
      await req.dataService.cache.invalidateCharacterCache(req.characterId);
      
      res.json({
        success: true,
        message: 'Objet déséquipé avec succès',
        unequipped_item: {
          id: result.rows[0].id,
          item_id: result.rows[0].item_id,
          equipped: result.rows[0].equipped,
          equipped_slot: result.rows[0].equipped_slot
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error unequipping item:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * POST /api/characters/:id/level-up
 * Monte de niveau un personnage
 */
router.post('/:id/level-up', authenticateToken, validateCharacterId, injectDataService, trackEconomyChange({ xp: 1000 }), async (req, res) => {
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
router.get('/:id/dungeons', authenticateToken, validateCharacterId, injectDataService, async (req, res) => {
  try {
    const rotationService = req.app.locals.systems?.get('rotations');
    let dungeons;
    if (rotationService) {
      // Use character to derive level segment and get daily rotation
      const character = await req.dataService.getCharacter(req.characterId, true);
      const daily = await rotationService.getDailyDungeonRotation(character);
      dungeons = daily.map(d => ({
        dungeon_id: d.id,
        dungeon_name: d.name,
        dungeon_display_name: d.display_name,
        level_requirement: d.level_requirement,
        difficulty_name: d.difficulty_name,
        status: 'available',
        best_time: null,
        completion_count: null,
        last_completed: null
      }));
    } else {
      dungeons = await req.dataService.executePrepared('get_character_dungeons', [req.characterId]);
    }
    
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

