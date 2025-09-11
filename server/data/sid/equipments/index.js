class EquipmentManager {
  constructor() {
    this.equipmentSets = this.generateEquipmentSets();
    this.enchantments = this.generateEnchantments();
  }

  // =====================================================
  // GESTION DE L'ÉQUIPEMENT
  // =====================================================

  // Obtenir tous les sets d'équipement
  getAllEquipmentSets() {
    return this.equipmentSets;
  }

  // Obtenir un set par nom
  getEquipmentSet(setName) {
    return this.equipmentSets.find(set => set.name === setName);
  }

  // Calculer les stats d'un équipement
  calculateEquipmentStats(item, level = 1, rarity = 'common') {
    const baseStats = item.base_stats || {};
    const statRanges = item.stat_ranges || {};
    
    const rarityMultipliers = {
      'common': 1.0,
      'uncommon': 1.2,
      'rare': 1.5,
      'epic': 2.0,
      'legendary': 3.0,
      'mythic': 4.0
    };

    const levelMultiplier = 1 + (level - 1) * 0.1; // +10% par niveau
    const rarityMultiplier = rarityMultipliers[rarity] || 1.0;
    const finalMultiplier = levelMultiplier * rarityMultiplier;

    const calculatedStats = {};
    
    // Calculer chaque stat
    Object.entries(baseStats).forEach(([stat, baseValue]) => {
      if (statRanges[stat]) {
        const [min, max] = statRanges[stat];
        const randomValue = min + Math.random() * (max - min);
        calculatedStats[stat] = Math.floor(randomValue * finalMultiplier);
      } else {
        calculatedStats[stat] = Math.floor(baseValue * finalMultiplier);
      }
    });

    return calculatedStats;
  }

  // Calculer les bonus de set
  calculateSetBonuses(equippedItems) {
    const setCounts = {};
    const bonuses = {};

    // Compter les pièces de chaque set
    equippedItems.forEach(item => {
      if (item.set_name) {
        setCounts[item.set_name] = (setCounts[item.set_name] || 0) + 1;
      }
    });

    // Appliquer les bonus de set
    Object.entries(setCounts).forEach(([setName, count]) => {
      const set = this.getEquipmentSet(setName);
      if (set && set.set_bonuses) {
        set.set_bonuses.forEach(bonus => {
          if (count >= bonus.pieces_required) {
            Object.entries(bonus.stats).forEach(([stat, value]) => {
              bonuses[stat] = (bonuses[stat] || 0) + value;
            });
          }
        });
      }
    });

    return bonuses;
  }

  // Calculer les stats totales d'équipement
  calculateTotalEquipmentStats(equippedItems) {
    let totalStats = {};
    let setBonuses = {};

    // Stats individuelles
    equippedItems.forEach(item => {
      const itemStats = this.calculateEquipmentStats(item, item.level, item.rarity);
      Object.entries(itemStats).forEach(([stat, value]) => {
        totalStats[stat] = (totalStats[stat] || 0) + value;
      });
    });

    // Bonus de set
    setBonuses = this.calculateSetBonuses(equippedItems);
    Object.entries(setBonuses).forEach(([stat, value]) => {
      totalStats[stat] = (totalStats[stat] || 0) + value;
    });

    return {
      individual_stats: totalStats,
      set_bonuses: setBonuses,
      total_stats: totalStats
    };
  }

  // Améliorer un équipement
  async upgradeEquipment(characterId, itemId, materials, client) {
    // Récupérer l'objet
    const itemResult = await client.query(`
      SELECT ci.*, i.*, it.equip_slot
      FROM character_inventory ci
      JOIN items i ON ci.item_id = i.id
      JOIN item_types it ON i.type_id = it.id
      WHERE ci.character_id = $1 AND ci.item_id = $2
    `, [characterId, itemId]);

    if (itemResult.rows.length === 0) {
      throw new Error('Objet non trouvé dans l\'inventaire');
    }

    const item = itemResult.rows[0];
    const currentLevel = item.level || 1;
    const maxLevel = item.max_level || 20;

    if (currentLevel >= maxLevel) {
      throw new Error('Objet déjà au niveau maximum');
    }

    // Vérifier les matériaux requis
    const upgradeCost = this.calculateUpgradeCost(item, currentLevel);
    const hasMaterials = await this.checkMaterials(characterId, upgradeCost, client);

    if (!hasMaterials) {
      throw new Error('Matériaux insuffisants pour l\'amélioration');
    }

    // Consommer les matériaux
    await this.consumeMaterials(characterId, upgradeCost, client);

    // Améliorer l'objet
    const newLevel = currentLevel + 1;
    const newStats = this.calculateEquipmentStats(item, newLevel, item.rarity);

    await client.query(`
      UPDATE character_inventory 
      SET level = $1, stats = $2, updated_at = NOW()
      WHERE character_id = $3 AND item_id = $4
    `, [newLevel, JSON.stringify(newStats), characterId, itemId]);

    return {
      success: true,
      new_level: newLevel,
      new_stats: newStats,
      materials_used: upgradeCost
    };
  }

  // Calculer le coût d'amélioration
  calculateUpgradeCost(item, currentLevel) {
    const baseCost = {
      'common': { gold: 100, materials: 1 },
      'uncommon': { gold: 200, materials: 2 },
      'rare': { gold: 400, materials: 4 },
      'epic': { gold: 800, materials: 8 },
      'legendary': { gold: 1600, materials: 16 },
      'mythic': { gold: 3200, materials: 32 }
    };

    const rarityCost = baseCost[item.rarity] || baseCost['common'];
    const levelMultiplier = Math.pow(1.5, currentLevel - 1);

    return {
      gold: Math.floor(rarityCost.gold * levelMultiplier),
      materials: Math.floor(rarityCost.materials * levelMultiplier)
    };
  }

  // Vérifier les matériaux
  async checkMaterials(characterId, cost, client) {
    const materialsResult = await client.query(`
      SELECT ci.quantity, i.name
      FROM character_inventory ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.character_id = $1 AND i.name IN ('gold_coin', 'upgrade_material')
    `, [characterId]);

    const materials = {};
    materialsResult.rows.forEach(row => {
      materials[row.name] = row.quantity;
    });

    return (materials.gold_coin || 0) >= cost.gold && 
           (materials.upgrade_material || 0) >= cost.materials;
  }

  // Consommer les matériaux
  async consumeMaterials(characterId, cost, client) {
    // Consommer l'or
    await client.query(`
      UPDATE character_inventory 
      SET quantity = quantity - $1
      WHERE character_id = $2 AND item_id = (
        SELECT id FROM items WHERE name = 'gold_coin'
      )
    `, [cost.gold, characterId]);

    // Consommer les matériaux d'amélioration
    await client.query(`
      UPDATE character_inventory 
      SET quantity = quantity - $1
      WHERE character_id = $2 AND item_id = (
        SELECT id FROM items WHERE name = 'upgrade_material'
      )
    `, [cost.materials, characterId]);
  }

  // =====================================================
  // GÉNÉRATION DES SETS D'ÉQUIPEMENT
  // =====================================================

  generateEquipmentSets() {
    return [
      {
        name: 'armure_du_guerrier',
        display_name: 'Armure du Guerrier',
        description: 'Set d\'armure pour les combattants au corps à corps',
        pieces: ['helmet', 'chest', 'legs', 'boots', 'gloves'],
        set_bonuses: [
          {
            pieces_required: 2,
            stats: { attack: 10, defense: 15 }
          },
          {
            pieces_required: 4,
            stats: { attack: 20, defense: 30, health: 50 }
          },
          {
            pieces_required: 5,
            stats: { attack: 35, defense: 50, health: 100, critical_rate: 5 }
          }
        ]
      },
      {
        name: 'robes_du_mage',
        display_name: 'Robes du Mage',
        description: 'Set de robes pour les maîtres de la magie',
        pieces: ['helmet', 'chest', 'legs', 'boots', 'gloves'],
        set_bonuses: [
          {
            pieces_required: 2,
            stats: { magic_attack: 15, magic_defense: 10 }
          },
          {
            pieces_required: 4,
            stats: { magic_attack: 30, magic_defense: 20, mana: 50 }
          },
          {
            pieces_required: 5,
            stats: { magic_attack: 50, magic_defense: 35, mana: 100, critical_rate: 8 }
          }
        ]
      },
      {
        name: 'armure_de_l_archer',
        display_name: 'Armure de l\'Archer',
        description: 'Set d\'armure légère pour les archers',
        pieces: ['helmet', 'chest', 'legs', 'boots', 'gloves'],
        set_bonuses: [
          {
            pieces_required: 2,
            stats: { attack: 12, dodge_chance: 10 }
          },
          {
            pieces_required: 4,
            stats: { attack: 25, dodge_chance: 20, speed: 15 }
          },
          {
            pieces_required: 5,
            stats: { attack: 40, dodge_chance: 30, speed: 25, critical_rate: 10 }
          }
        ]
      },
      {
        name: 'armure_du_voleur',
        display_name: 'Armure du Voleur',
        description: 'Set d\'armure furtive pour les voleurs',
        pieces: ['helmet', 'chest', 'legs', 'boots', 'gloves'],
        set_bonuses: [
          {
            pieces_required: 2,
            stats: { attack: 8, dodge_chance: 15 }
          },
          {
            pieces_required: 4,
            stats: { attack: 18, dodge_chance: 30, critical_rate: 10 }
          },
          {
            pieces_required: 5,
            stats: { attack: 30, dodge_chance: 45, critical_rate: 20, critical_damage: 15 }
          }
        ]
      },
      {
        name: 'robes_du_prêtre',
        display_name: 'Robes du Prêtre',
        description: 'Set de robes sacrées pour les prêtres',
        pieces: ['helmet', 'chest', 'legs', 'boots', 'gloves'],
        set_bonuses: [
          {
            pieces_required: 2,
            stats: { magic_attack: 12, magic_defense: 15 }
          },
          {
            pieces_required: 4,
            stats: { magic_attack: 25, magic_defense: 30, health: 40, mana: 60 }
          },
          {
            pieces_required: 5,
            stats: { magic_attack: 40, magic_defense: 50, health: 80, mana: 120, critical_rate: 5 }
          }
        ]
      }
    ];
  }

  // =====================================================
  // GÉNÉRATION DES ENCHANTEMENTS
  // =====================================================

  generateEnchantments() {
    return [
      {
        name: 'enchantement_de_feu',
        display_name: 'Enchantement de Feu',
        description: 'Ajoute des dégâts de feu à l\'équipement',
        type: 'weapon',
        effects: {
          fire_damage: 10,
          burn_chance: 5
        },
        cost: { gold: 500, materials: 2 }
      },
      {
        name: 'enchantement_de_glace',
        display_name: 'Enchantement de Glace',
        description: 'Ajoute des dégâts de glace à l\'équipement',
        type: 'weapon',
        effects: {
          ice_damage: 10,
          freeze_chance: 5
        },
        cost: { gold: 500, materials: 2 }
      },
      {
        name: 'enchantement_de_foudre',
        display_name: 'Enchantement de Foudre',
        description: 'Ajoute des dégâts de foudre à l\'équipement',
        type: 'weapon',
        effects: {
          lightning_damage: 10,
          stun_chance: 5
        },
        cost: { gold: 500, materials: 2 }
      },
      {
        name: 'enchantement_de_protection',
        display_name: 'Enchantement de Protection',
        description: 'Augmente la défense de l\'armure',
        type: 'armor',
        effects: {
          defense: 15,
          magic_defense: 10
        },
        cost: { gold: 400, materials: 2 }
      },
      {
        name: 'enchantement_de_vitalité',
        display_name: 'Enchantement de Vitalité',
        description: 'Augmente les points de vie',
        type: 'armor',
        effects: {
          health: 50,
          health_regeneration: 5
        },
        cost: { gold: 400, materials: 2 }
      },
      {
        name: 'enchantement_de_mana',
        display_name: 'Enchantement de Mana',
        description: 'Augmente les points de mana',
        type: 'armor',
        effects: {
          mana: 40,
          mana_regeneration: 5
        },
        cost: { gold: 400, materials: 2 }
      }
    ];
  }

  // Enchanter un équipement
  async enchantEquipment(characterId, itemId, enchantmentName, client) {
    const enchantment = this.enchantments.find(e => e.name === enchantmentName);
    if (!enchantment) {
      throw new Error('Enchantement non trouvé');
    }

    // Récupérer l'objet
    const itemResult = await client.query(`
      SELECT ci.*, i.*, it.equip_slot
      FROM character_inventory ci
      JOIN items i ON ci.item_id = i.id
      JOIN item_types it ON i.type_id = it.id
      WHERE ci.character_id = $1 AND ci.item_id = $2
    `, [characterId, itemId]);

    if (itemResult.rows.length === 0) {
      throw new Error('Objet non trouvé dans l\'inventaire');
    }

    const item = itemResult.rows[0];

    // Vérifier le type d'équipement
    if (enchantment.type === 'weapon' && !['weapon'].includes(item.equip_slot)) {
      throw new Error('Cet enchantement ne peut être appliqué qu\'aux armes');
    }
    if (enchantment.type === 'armor' && !['helmet', 'chest', 'legs', 'boots', 'gloves'].includes(item.equip_slot)) {
      throw new Error('Cet enchantement ne peut être appliqué qu\'à l\'armure');
    }

    // Vérifier les matériaux
    const hasMaterials = await this.checkMaterials(characterId, enchantment.cost, client);
    if (!hasMaterials) {
      throw new Error('Matériaux insuffisants pour l\'enchantement');
    }

    // Consommer les matériaux
    await this.consumeMaterials(characterId, enchantment.cost, client);

    // Appliquer l'enchantement
    const currentEnchantments = item.enchantments || [];
    const newEnchantments = [...currentEnchantments, enchantment];

    await client.query(`
      UPDATE character_inventory 
      SET enchantments = $1, updated_at = NOW()
      WHERE character_id = $2 AND item_id = $3
    `, [JSON.stringify(newEnchantments), characterId, itemId]);

    return {
      success: true,
      enchantment: enchantment,
      new_enchantments: newEnchantments
    };
  }
}

module.exports = new EquipmentManager();

