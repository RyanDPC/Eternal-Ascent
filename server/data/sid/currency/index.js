/**
 * CURRENCY SID - Toutes les monnaies du jeu
 * Pièces, gemmes, etc.
 */

module.exports = [
  {
    name: 'copper_coin',
    display_name: 'Pièce de Cuivre',
    description: 'Monnaie de base',
    type: 'currency',
    rarity: 'common',
    level_requirement: 1,
    base_stats: {
      value: 1
    },
    stat_ranges: {
      value: [1, 1]
    },
    effects: [],
    icon: '🪙'
  },
  {
    name: 'silver_coin',
    display_name: 'Pièce d\'Argent',
    description: 'Monnaie de valeur moyenne',
    type: 'currency',
    rarity: 'uncommon',
    level_requirement: 1,
    base_stats: {
      value: 10
    },
    stat_ranges: {
      value: [10, 10]
    },
    effects: [],
    icon: '🪙'
  },
  {
    name: 'gold_coin',
    display_name: 'Pièce d\'Or',
    description: 'Monnaie de grande valeur',
    type: 'currency',
    rarity: 'rare',
    level_requirement: 1,
    base_stats: {
      value: 100
    },
    stat_ranges: {
      value: [100, 100]
    },
    effects: [],
    icon: '🪙'
  },
  {
    name: 'platinum_coin',
    display_name: 'Pièce de Platine',
    description: 'Monnaie de très grande valeur',
    type: 'currency',
    rarity: 'epic',
    level_requirement: 1,
    base_stats: {
      value: 1000
    },
    stat_ranges: {
      value: [1000, 1000]
    },
    effects: [],
    icon: '🪙'
  },
  {
    name: 'diamond_coin',
    display_name: 'Pièce de Diamant',
    description: 'Monnaie légendaire',
    type: 'currency',
    rarity: 'legendary',
    level_requirement: 1,
    base_stats: {
      value: 10000
    },
    stat_ranges: {
      value: [10000, 10000]
    },
    effects: [],
    icon: '💎'
  },
  {
    name: 'eternal_coin',
    display_name: 'Pièce Éternelle',
    description: 'Monnaie mythique qui transcende le temps',
    type: 'currency',
    rarity: 'mythic',
    level_requirement: 1,
    base_stats: {
      value: 100000
    },
    stat_ranges: {
      value: [100000, 100000]
    },
    effects: [],
    icon: '⏰'
  }
];



