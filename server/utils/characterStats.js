// =====================================================
// CALCULATEUR DE STATS DE PERSONNAGE
// =====================================================

const equipmentManager = require('../data/sid/equipments');

class CharacterStatsCalculator {
  constructor() {
    this.equipmentManager = equipmentManager;
  }

  /**
   * Calcule les stats finales d'un personnage avec équipement
   * @param {Object} character - Le personnage de base
   * @param {Array} equippedItems - Les objets équipés
   * @returns {Object} - Les stats finales calculées
   */
  calculateFinalStats(character, equippedItems = []) {
    // Stats de base du personnage
    const baseStats = {
      health: character.health || 100,
      max_health: character.max_health || 100,
      mana: character.mana || 50,
      max_mana: character.max_mana || 50,
      attack: character.attack || 10,
      defense: character.defense || 8,
      magic_attack: character.magic_attack || 5,
      magic_defense: character.magic_defense || 6,
      critical_rate: character.critical_rate || 5.0,
      critical_damage: character.critical_damage || 150.0,
      dodge_chance: character.dodge_chance || 8.0,
      // Stats principales (10 stats cohérentes)
      vitality: character.vitality || 10,        // Vie et régénération
      strength: character.strength || 10,        // Attaque physique
      intelligence: character.intelligence || 10, // Attaque magique et mana
      agility: character.agility || 10,          // Esquive et vitesse
      resistance: character.resistance || 10,    // Défense magique
      precision: character.precision || 10,      // Taux de critique
      endurance: character.endurance || 10,      // Défense physique
      wisdom: character.wisdom || 10,            // Régénération mana
      constitution: character.constitution || 10, // Résistance aux effets
      dexterity: character.dexterity || 10,      // Précision et esquive
      // Stats dérivées
      health_regen: character.health_regen || 1.0,
      mana_regen: character.mana_regen || 0.5,
      attack_speed: character.attack_speed || 100.0,
      movement_speed: character.movement_speed || 100.0,
      block_chance: character.block_chance || 5.0,
      parry_chance: character.parry_chance || 3.0,
      spell_power: character.spell_power || 100.0,
      physical_power: character.physical_power || 100.0
    };

    // Calculer les bonus d'équipement
    const equipmentBonuses = this.calculateEquipmentBonuses(equippedItems);
    
    // Appliquer les bonus d'équipement
    const finalStats = { ...baseStats };
    
    Object.entries(equipmentBonuses).forEach(([stat, bonus]) => {
      if (finalStats[stat] !== undefined) {
        finalStats[stat] += bonus;
      }
    });

    // Calculer les stats dérivées basées sur les stats principales
    this.calculateDerivedStats(finalStats);

    // S'assurer que les valeurs sont positives
    Object.keys(finalStats).forEach(stat => {
      if (typeof finalStats[stat] === 'number') {
        finalStats[stat] = Math.max(0, finalStats[stat]);
      }
    });

    // CAPPING FINAL - S'assurer que health et mana ne dépassent jamais leurs maximums
    finalStats.health = Math.min(finalStats.health, finalStats.max_health);
    finalStats.mana = Math.min(finalStats.mana, finalStats.max_mana);

    return {
      ...finalStats,
      equipment_bonuses: equipmentBonuses,
      base_stats: baseStats
    };
  }

  /**
   * Calcule les stats dérivées basées sur les stats principales
   * @param {Object} stats - Les stats du personnage
   */
  calculateDerivedStats(stats) {
    // 1. VITALITY - Vie et régénération
    stats.max_health = Math.floor(stats.max_health + (stats.vitality * 2));
    stats.health_regen = stats.health_regen + (stats.vitality * 0.1);

    // 2. STRENGTH - Attaque physique et puissance
    stats.attack = Math.floor(stats.attack + (stats.strength * 1.5));
    stats.physical_power = stats.physical_power + (stats.strength * 2);

    // 3. INTELLIGENCE - Attaque magique, mana et puissance des sorts
    stats.magic_attack = Math.floor(stats.magic_attack + (stats.intelligence * 1.2));
    stats.max_mana = Math.floor(stats.max_mana + (stats.intelligence * 1.5));
    stats.spell_power = stats.spell_power + (stats.intelligence * 1.8);

    // 4. AGILITY - Esquive, vitesse d'attaque et mouvement
    stats.dodge_chance = stats.dodge_chance + (stats.agility * 0.3);
    stats.attack_speed = stats.attack_speed + (stats.agility * 0.5);
    stats.movement_speed = stats.movement_speed + (stats.agility * 0.3);

    // 5. RESISTANCE - Défense magique et résistance aux effets
    stats.magic_defense = Math.floor(stats.magic_defense + (stats.resistance * 1.3));

    // 6. PRECISION - Taux de critique et précision
    stats.critical_rate = stats.critical_rate + (stats.precision * 0.2);

    // 7. ENDURANCE - Défense physique et résistance
    stats.defense = Math.floor(stats.defense + (stats.endurance * 1.2));

    // 8. WISDOM - Régénération de mana et efficacité magique
    stats.mana_regen = stats.mana_regen + (stats.wisdom * 0.15);

    // 9. CONSTITUTION - Résistance aux effets et stabilité
    stats.block_chance = stats.block_chance + (stats.constitution * 0.2);
    stats.parry_chance = stats.parry_chance + (stats.constitution * 0.1);

    // 10. DEXTERITY - Précision et esquive avancée
    stats.precision = stats.precision + (stats.dexterity * 0.1);
    stats.dodge_chance = stats.dodge_chance + (stats.dexterity * 0.2);
    stats.parry_chance = stats.parry_chance + (stats.dexterity * 0.15);

    // CAPPING FINAL - S'assurer que health et mana ne dépassent jamais leurs maximums
    stats.health = Math.min(stats.health, stats.max_health);
    stats.mana = Math.min(stats.mana, stats.max_mana);
  }

  /**
   * Calcule les bonus d'équipement
   * @param {Array} equippedItems - Les objets équipés
   * @returns {Object} - Les bonus d'équipement
   */
  calculateEquipmentBonuses(equippedItems) {
    let bonuses = {
      // Stats de base
      health: 0,
      max_health: 0,
      mana: 0,
      max_mana: 0,
      attack: 0,
      defense: 0,
      magic_attack: 0,
      magic_defense: 0,
      critical_rate: 0,
      critical_damage: 0,
      dodge_chance: 0,
      // Stats principales (10 stats)
      vitality: 0,
      strength: 0,
      intelligence: 0,
      agility: 0,
      resistance: 0,
      precision: 0,
      endurance: 0,
      wisdom: 0,
      constitution: 0,
      dexterity: 0,
      // Stats dérivées
      health_regen: 0,
      mana_regen: 0,
      attack_speed: 0,
      movement_speed: 0,
      block_chance: 0,
      parry_chance: 0,
      spell_power: 0,
      physical_power: 0
    };

    equippedItems.forEach(item => {
      // Calculer les stats de l'objet avec multiplicateurs
      const itemStats = this.calculateItemStats(item, item.level || 1, item.rarity_name || 'common');
      
      Object.entries(itemStats).forEach(([stat, value]) => {
        if (bonuses[stat] !== undefined) {
          bonuses[stat] += value;
        }
      });
    });

    return bonuses;
  }

  /**
   * Calcule les stats d'un objet d'équipement
   * @param {Object} item - L'objet d'équipement
   * @param {number} level - Le niveau du personnage
   * @param {string} rarity - La rareté de l'objet
   * @returns {Object} - Les stats calculées de l'objet
   */
  calculateItemStats(item, level = 1, rarity = 'common') {
    const rarityMultipliers = {
      'common': 1.0,
      'uncommon': 1.2,
      'rare': 1.5,
      'epic': 2.0,
      'legendary': 3.0,
      'mythic': 4.0,
      'divine': 5.0,
      'eternal': 6.0,
      'transcendent': 8.0,
      'omnipotent': 10.0
    };

    const levelMultiplier = 1 + (level - 1) * 0.1; // +10% par niveau
    const rarityMultiplier = rarityMultipliers[rarity] || 1.0;
    const finalMultiplier = levelMultiplier * rarityMultiplier;

    const calculatedStats = {};
    
    if (item.base_stats) {
      Object.entries(item.base_stats).forEach(([stat, baseValue]) => {
        calculatedStats[stat] = Math.floor(baseValue * finalMultiplier);
      });
    }

    return calculatedStats;
  }

  /**
   * Met à jour les stats d'un personnage dans la base de données
   * @param {Object} client - Client de base de données
   * @param {number} characterId - ID du personnage
   * @param {Object} finalStats - Les stats finales calculées
   */
  async updateCharacterStats(client, characterId, finalStats) {
    await client.query(`
      UPDATE characters 
      SET 
        health = $1,
        max_health = $2,
        mana = $3,
        max_mana = $4,
        attack = $5,
        defense = $6,
        magic_attack = $7,
        magic_defense = $8,
        critical_rate = $9,
        critical_damage = $10,
        dodge_chance = $11,
        vitality = $12,
        strength = $13,
        intelligence = $14,
        agility = $15,
        resistance = $16,
        precision = $17,
        endurance = $18,
        wisdom = $19,
        constitution = $20,
        dexterity = $21,
        health_regen = $22,
        mana_regen = $23,
        attack_speed = $24,
        movement_speed = $25,
        block_chance = $26,
        parry_chance = $27,
        spell_power = $28,
        physical_power = $29,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $30
    `, [
      finalStats.health,
      finalStats.max_health,
      finalStats.mana,
      finalStats.max_mana,
      finalStats.attack,
      finalStats.defense,
      finalStats.magic_attack,
      finalStats.magic_defense,
      finalStats.critical_rate,
      finalStats.critical_damage,
      finalStats.dodge_chance,
      finalStats.vitality,
      finalStats.strength,
      finalStats.intelligence,
      finalStats.agility,
      finalStats.resistance,
      finalStats.precision,
      finalStats.endurance,
      finalStats.wisdom,
      finalStats.constitution,
      finalStats.dexterity,
      finalStats.health_regen,
      finalStats.mana_regen,
      finalStats.attack_speed,
      finalStats.movement_speed,
      finalStats.block_chance,
      finalStats.parry_chance,
      finalStats.spell_power,
      finalStats.physical_power,
      characterId
    ]);
  }
}

module.exports = new CharacterStatsCalculator();
