/**
 * Système d'inventaire de départ
 * Gère la création d'inventaires de départ selon la classe du personnage
 */

const characterClasses = [];


class StartingInventoryManager {
  constructor() {
    this.startingItems = this.initializeStartingItems();
  }

  /**
   * Initialise les objets de départ de base
   */
  initializeStartingItems() {
    return {
      // Objets de base pour tous
      basic: [
        {
          id: 'health_potion_small',
          name: 'Potion de Vie Mineure',
          description: 'Restaure 50 points de vie',
          type: 'consumable',
          rarity: 'common',
          level: 1,
          quantity: 3,
          effect: 'Restaure 50 PV',
          stats: {
            health_restore: 50,
            weight: 0.5
          }
        },
        {
          id: 'mana_potion_small',
          name: 'Potion de Mana Mineure',
          description: 'Restaure 30 points de mana',
          type: 'consumable',
          rarity: 'common',
          level: 1,
          quantity: 2,
          effect: 'Restaure 30 PM',
          stats: {
            mana_restore: 30,
            weight: 0.5
          }
        },
        {
          id: 'bread',
          name: 'Pain',
          description: 'Pain simple qui restaure un peu de vie',
          type: 'consumable',
          rarity: 'common',
          level: 1,
          quantity: 5,
          effect: 'Restaure 20 PV',
          stats: {
            health_restore: 20,
            weight: 0.2
          }
        },
        {
          id: 'water_bottle',
          name: 'Bouteille d\'Eau',
          description: 'Eau pure qui restaure un peu de mana',
          type: 'consumable',
          rarity: 'common',
          level: 1,
          quantity: 3,
          effect: 'Restaure 15 PM',
          stats: {
            mana_restore: 15,
            weight: 0.3
          }
        }
      ],
      
      // Objets spécifiques par classe
      class_specific: {
        warrior: [
          {
            id: 'bandage',
            name: 'Bandage',
            description: 'Bandage médical pour soigner les blessures',
            type: 'consumable',
            rarity: 'common',
            level: 1,
            quantity: 2,
            effect: 'Restaure 40 PV',
            stats: {
              health_restore: 40,
              weight: 0.1
            }
          }
        ],
        mage: [
          {
            id: 'magic_scroll_minor',
            name: 'Parchemin Magique Mineur',
            description: 'Parchemin contenant un sort mineur',
            type: 'consumable',
            rarity: 'common',
            level: 1,
            quantity: 2,
            effect: 'Restaure 25 PM',
            stats: {
              mana_restore: 25,
              weight: 0.1
            }
          }
        ],
        archer: [
          {
            id: 'arrow_bundle',
            name: 'Faisceau de Flèches',
            description: 'Paquet de 20 flèches',
            type: 'consumable',
            rarity: 'common',
            level: 1,
            quantity: 1,
            effect: '20 flèches',
            stats: {
              arrows: 20,
              weight: 1.0
            }
          }
        ],
        rogue: [
          {
            id: 'lockpick',
            name: 'Crochet de Serrure',
            description: 'Outil pour crocheter les serrures',
            type: 'tool',
            rarity: 'common',
            level: 1,
            quantity: 3,
            effect: 'Outil de crochetage',
            stats: {
              lockpicking: 1,
              weight: 0.1
            }
          }
        ],
        paladin: [
          {
            id: 'holy_water',
            name: 'Eau Bénite',
            description: 'Eau bénite pour repousser les morts-vivants',
            type: 'consumable',
            rarity: 'uncommon',
            level: 1,
            quantity: 1,
            effect: 'Restaure 60 PV et 30 PM',
            stats: {
              health_restore: 60,
              mana_restore: 30,
              weight: 0.5
            }
          }
        ],
        necromancer: [
          {
            id: 'bone_fragment',
            name: 'Fragment d\'Os',
            description: 'Fragment d\'os pour les rituels nécromantiques',
            type: 'material',
            rarity: 'common',
            level: 1,
            quantity: 5,
            effect: 'Matériau de rituel',
            stats: {
              necromancy_power: 1,
              weight: 0.2
            }
          }
        ],
        dragon_knight: [
          {
            id: 'dragon_scale',
            name: 'Écaille de Dragon',
            description: 'Écaille de dragon pour la protection',
            type: 'material',
            rarity: 'epic',
            level: 1,
            quantity: 1,
            effect: 'Résistance au feu +10',
            stats: {
              fire_resistance: 10,
              weight: 0.5
            }
          }
        ],
        eterna: [
          {
            id: 'eterna_essence',
            name: 'Essence d\'Eterna',
            description: 'Essence mystérieuse d\'une puissance incommensurable',
            type: 'material',
            rarity: 'mythic',
            level: 1,
            quantity: 1,
            effect: 'Toutes les stats +5',
            stats: {
              all_stats: 5,
              weight: 0.1
            }
          }
        ]
      }
    };
  }

  /**
   * Trouve un équipement par son ID
   */
  findEquipment(equipmentId) { return null; }

  /**
   * Récupère les IDs des objets de base depuis la base de données
   */
  async getBasicItemIds(client) {
    try {
      const result = await client.query(`
        SELECT id, name FROM items 
        WHERE name IN ('copper_coin', 'health_potion_small', 'mana_potion_small')
        ORDER BY name
      `);
      const itemIds = {};
      result.rows.forEach(row => {
        itemIds[row.name] = row.id;
      });
      return itemIds;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des IDs des objets:', error);
      return {};
    }
  }

  /**
   * Récupère les IDs des équipements de départ pour une classe
   */
  async getStartingEquipmentIds(client, equipmentNames) {
    try {
      if (!equipmentNames || equipmentNames.length === 0) {
        return [];
      }

      // Récupérer les IDs des équipements
      const placeholders = equipmentNames.map((_, index) => `$${index + 1}`).join(',');
      const result = await client.query(`
        SELECT i.id, i.name, i.display_name, it.equip_slot 
        FROM items i
        JOIN item_types it ON i.type_id = it.id
        WHERE i.display_name IN (${placeholders}) OR i.name IN (${placeholders})
        ORDER BY i.name
      `, [...equipmentNames, ...equipmentNames]);
      
      const equipmentIds = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        quantity: 1,
        equipped: true,
        slot: row.equip_slot || null
      }));
      
      console.log('🔍 IDs des équipements de départ trouvés:', equipmentIds);
      return equipmentIds;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des IDs des équipements:', error);
      return [];
    }
  }

  /**
   * Détermine le slot d'équipement basé sur le nom de l'équipement
   */
  getEquipmentSlotFromName(equipmentName) {
    // Mapping basé sur les noms d'équipements
    if (equipmentName.includes('sword') || equipmentName.includes('staff') || equipmentName.includes('bow')) {
      return 'weapon';
    }
    if (equipmentName.includes('armor') || equipmentName.includes('robe')) {
      return 'chest';
    }
    if (equipmentName.includes('boots')) {
      return 'boots';
    }
    if (equipmentName.includes('helmet') || equipmentName.includes('hat')) {
      return 'head';
    }
    if (equipmentName.includes('gloves')) {
      return 'gloves';
    }
    if (equipmentName.includes('shield')) {
      return 'shield';
    }
    if (equipmentName.includes('ring')) {
      return 'ring';
    }
    if (equipmentName.includes('necklace') || equipmentName.includes('amulet')) {
      return 'necklace';
    }
    return 'inventory';
  }

  /**
   * Crée l'inventaire de départ pour un personnage
   */
  async createStartingInventory(characterClass, client) {
    const inventory = [];
    
    // Trouver la classe du personnage
    const classData = characterClasses.find(cls => cls.name === characterClass);
    if (!classData) {
      throw new Error(`Classe de personnage inconnue: ${characterClass}`);
    }

    // Récupérer les IDs des objets de base
    const itemIds = await this.getBasicItemIds(client);

    // Ajouter les objets de base pour toutes les classes
    const basicItems = [];
    if (itemIds.copper_coin) basicItems.push({ id: itemIds.copper_coin, quantity: 10, equipped: false, slot: null });
    if (itemIds.health_potion_small) basicItems.push({ id: itemIds.health_potion_small, quantity: 3, equipped: false, slot: null });
    if (itemIds.mana_potion_small) basicItems.push({ id: itemIds.mana_potion_small, quantity: 3, equipped: false, slot: null });
    inventory.push(...basicItems);

    // Ajouter les équipements de départ spécifiques à la classe
    if (classData.starting_equipment && classData.starting_equipment.length > 0) {
      const startingEquipment = await this.getStartingEquipmentIds(client, classData.starting_equipment);
      inventory.push(...startingEquipment);
      console.log(`   ⚔️ ${startingEquipment.length} équipements de départ ajoutés pour la classe ${characterClass}`);
    }

    

    return inventory;
  }

  /**
   * Détermine le slot d'équipement selon le type
   */
  getEquipmentSlot(equipmentType) {
    const slotMap = {
      'weapon': 'weapon',
      'armor': 'armor',
      'helmet': 'helmet',
      'gloves': 'gloves',
      'boots': 'boots',
      'shield': 'shield',
      'ring': 'ring',
      'necklace': 'necklace',
      'accessory': 'accessory'
    };
    
    return slotMap[equipmentType] || 'inventory';
  }

  /**
   * Applique les bonus des équipements de départ aux stats du personnage
   */
  applyStartingEquipmentStats(character, inventory) {
    const equippedItems = inventory.filter(item => item.equipped);
    
    equippedItems.forEach(item => {
      if (item.stats) {
        Object.keys(item.stats).forEach(stat => {
          if (stat === 'health_restore' || stat === 'mana_restore' || stat === 'weight') {
            return; // Ignorer les stats de consommation
          }
          
          if (character[stat] !== undefined) {
            character[stat] += item.stats[stat];
          }
        });
      }
    });

    return character;
  }

  /**
   * Calcule le poids total de l'inventaire
   */
  calculateInventoryWeight(inventory) {
    return inventory.reduce((total, item) => {
      const weight = item.stats?.weight || 0;
      const quantity = item.quantity || 1;
      return total + (weight * quantity);
    }, 0);
  }

  /**
   * Vérifie si l'inventaire peut contenir un nouvel objet
   */
  canAddItem(inventory, newItem, maxWeight = 100) {
    const currentWeight = this.calculateInventoryWeight(inventory);
    const itemWeight = (newItem.stats?.weight || 0) * (newItem.quantity || 1);
    
    return (currentWeight + itemWeight) <= maxWeight;
  }
}

module.exports = new StartingInventoryManager();
