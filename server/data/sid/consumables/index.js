/**
 * CONSUMABLES SID - Tous les consommables du jeu
 * Potions, élixirs, nourriture, etc.
 */

module.exports = [
  // === POTIONS DE SOIN ===
  {
    name: 'health_potion_small',
    display_name: 'Potion de Soin Mineure',
    description: 'Restaure 50 points de vie',
    type: 'potion',
    rarity: 'common',
    level_requirement: 1,
    base_stats: {
      healing: 50
    },
    stat_ranges: {
      healing: [40, 60]
    },
    effects: ['heal'],
    icon: '🧪'
  },
  {
    name: 'health_potion',
    display_name: 'Potion de Soin',
    description: 'Restaure 100 points de vie',
    type: 'potion',
    rarity: 'common',
    level_requirement: 1,
    base_stats: {
      healing: 100
    },
    stat_ranges: {
      healing: [80, 120]
    },
    effects: ['heal'],
    icon: '🧪'
  },
  {
    name: 'health_potion_greater',
    display_name: 'Grande Potion de Soin',
    description: 'Restaure 200 points de vie',
    type: 'potion',
    rarity: 'uncommon',
    level_requirement: 5,
    base_stats: {
      healing: 200
    },
    stat_ranges: {
      healing: [180, 220]
    },
    effects: ['heal'],
    icon: '🧪'
  },
  {
    name: 'health_potion_superior',
    display_name: 'Potion de Soin Supérieure',
    description: 'Restaure 400 points de vie',
    type: 'potion',
    rarity: 'rare',
    level_requirement: 10,
    base_stats: {
      healing: 400
    },
    stat_ranges: {
      healing: [350, 450]
    },
    effects: ['heal'],
    icon: '🧪'
  },

  // === POTIONS DE MANA ===
  {
    name: 'mana_potion_small',
    display_name: 'Potion de Mana Mineure',
    description: 'Restaure 30 points de mana',
    type: 'potion',
    rarity: 'common',
    level_requirement: 1,
    base_stats: {
      mana_restore: 30
    },
    stat_ranges: {
      mana_restore: [25, 35]
    },
    effects: ['mana_restore'],
    icon: '🔮'
  },
  {
    name: 'mana_potion',
    display_name: 'Potion de Mana',
    description: 'Restaure 60 points de mana',
    type: 'potion',
    rarity: 'common',
    level_requirement: 1,
    base_stats: {
      mana_restore: 60
    },
    stat_ranges: {
      mana_restore: [50, 70]
    },
    effects: ['mana_restore'],
    icon: '🔮'
  },
  {
    name: 'mana_potion_greater',
    display_name: 'Grande Potion de Mana',
    description: 'Restaure 120 points de mana',
    type: 'potion',
    rarity: 'uncommon',
    level_requirement: 5,
    base_stats: {
      mana_restore: 120
    },
    stat_ranges: {
      mana_restore: [100, 140]
    },
    effects: ['mana_restore'],
    icon: '🔮'
  },

  // === ÉLIXIRS ===
  {
    name: 'elixir_strength',
    display_name: 'Élixir de Force',
    description: 'Augmente la force de +10 pendant 10 minutes',
    type: 'elixir',
    rarity: 'uncommon',
    level_requirement: 3,
    base_stats: {
      strength: 10
    },
    stat_ranges: {
      strength: [8, 12]
    },
    effects: ['buff_strength'],
    icon: '⚡'
  },
  {
    name: 'elixir_agility',
    display_name: 'Élixir d\'Agilité',
    description: 'Augmente l\'agilité de +8 pendant 10 minutes',
    type: 'elixir',
    rarity: 'uncommon',
    level_requirement: 3,
    base_stats: {
      agility: 8
    },
    stat_ranges: {
      agility: [6, 10]
    },
    effects: ['buff_agility'],
    icon: '💨'
  },
  {
    name: 'elixir_intelligence',
    display_name: 'Élixir d\'Intelligence',
    description: 'Augmente l\'intelligence de +10 pendant 10 minutes',
    type: 'elixir',
    rarity: 'uncommon',
    level_requirement: 3,
    base_stats: {
      intelligence: 10
    },
    stat_ranges: {
      intelligence: [8, 12]
    },
    effects: ['buff_intelligence'],
    icon: '🧠'
  },

  // === NOURRITURE ===
  {
    name: 'bread',
    display_name: 'Pain',
    description: 'Restaure 25 points de vie',
    type: 'food',
    rarity: 'common',
    level_requirement: 1,
    base_stats: {
      healing: 25
    },
    stat_ranges: {
      healing: [20, 30]
    },
    effects: ['heal'],
    icon: '🍞'
  },
  {
    name: 'cheese',
    display_name: 'Fromage',
    description: 'Restaure 35 points de vie',
    type: 'food',
    rarity: 'common',
    level_requirement: 1,
    base_stats: {
      healing: 35
    },
    stat_ranges: {
      healing: [30, 40]
    },
    effects: ['heal'],
    icon: '🧀'
  },
  {
    name: 'apple',
    display_name: 'Pomme',
    description: 'Restaure 20 points de vie et 10 points de mana',
    type: 'food',
    rarity: 'common',
    level_requirement: 1,
    base_stats: {
      healing: 20,
      mana_restore: 10
    },
    stat_ranges: {
      healing: [15, 25],
      mana_restore: [8, 12]
    },
    effects: ['heal', 'mana_restore'],
    icon: '🍎'
  },
  {
    name: 'roasted_meat',
    display_name: 'Viande Rôtie',
    description: 'Restaure 60 points de vie',
    type: 'food',
    rarity: 'uncommon',
    level_requirement: 3,
    base_stats: {
      healing: 60
    },
    stat_ranges: {
      healing: [50, 70]
    },
    effects: ['heal'],
    icon: '🥩'
  },

  // === POTIONS SPÉCIALES ===
  {
    name: 'potion_regeneration',
    display_name: 'Potion de Régénération',
    description: 'Régénère 5 points de vie par seconde pendant 30 secondes',
    type: 'potion',
    rarity: 'rare',
    level_requirement: 8,
    base_stats: {
      regeneration: 5
    },
    stat_ranges: {
      regeneration: [4, 6]
    },
    effects: ['regeneration'],
    icon: '💚'
  },
  {
    name: 'potion_antidote',
    display_name: 'Antidote',
    description: 'Guérit tous les poisons',
    type: 'potion',
    rarity: 'uncommon',
    level_requirement: 2,
    base_stats: {},
    stat_ranges: {},
    effects: ['cure_poison'],
    icon: '🩹'
  },
  {
    name: 'potion_healing_elixir',
    display_name: 'Élixir de Guérison',
    description: 'Restaure 300 points de vie et 150 points de mana',
    type: 'elixir',
    rarity: 'rare',
    level_requirement: 12,
    base_stats: {
      healing: 300,
      mana_restore: 150
    },
    stat_ranges: {
      healing: [250, 350],
      mana_restore: [120, 180]
    },
    effects: ['heal', 'mana_restore'],
    icon: '✨'
  }
];



