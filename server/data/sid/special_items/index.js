/**
 * SPECIAL ITEMS SID - Objets spéciaux et uniques
 * Clés, parchemins, artefacts, etc.
 */

module.exports = [
  // === CLÉS ===
  {
    name: 'dungeon_key_bronze',
    display_name: 'Clé de Donjon Bronze',
    description: 'Ouvre les portes des donjons de niveau 1-5',
    type: 'key',
    rarity: 'common',
    level_requirement: 1,
    base_stats: {},
    stat_ranges: {},
    effects: ['unlock_dungeon_bronze'],
    icon: '🗝️'
  },
  {
    name: 'dungeon_key_silver',
    display_name: 'Clé de Donjon Argent',
    description: 'Ouvre les portes des donjons de niveau 6-15',
    type: 'key',
    rarity: 'uncommon',
    level_requirement: 6,
    base_stats: {},
    stat_ranges: {},
    effects: ['unlock_dungeon_silver'],
    icon: '🗝️'
  },
  {
    name: 'dungeon_key_gold',
    display_name: 'Clé de Donjon Or',
    description: 'Ouvre les portes des donjons de niveau 16-25',
    type: 'key',
    rarity: 'rare',
    level_requirement: 16,
    base_stats: {},
    stat_ranges: {},
    effects: ['unlock_dungeon_gold'],
    icon: '🗝️'
  },
  {
    name: 'dungeon_key_platinum',
    display_name: 'Clé de Donjon Platine',
    description: 'Ouvre les portes des donjons de niveau 26-35',
    type: 'key',
    rarity: 'epic',
    level_requirement: 26,
    base_stats: {},
    stat_ranges: {},
    effects: ['unlock_dungeon_platinum'],
    icon: '🗝️'
  },
  {
    name: 'master_key',
    display_name: 'Clé Maîtresse',
    description: 'Ouvre toutes les portes de donjons',
    type: 'key',
    rarity: 'legendary',
    level_requirement: 30,
    base_stats: {},
    stat_ranges: {},
    effects: ['unlock_all_dungeons'],
    icon: '🗝️'
  },

  // === PARCHEMINS ===
  {
    name: 'scroll_teleport_town',
    display_name: 'Parchemin de Téléportation - Ville',
    description: 'Téléporte vers la ville la plus proche',
    type: 'scroll',
    rarity: 'uncommon',
    level_requirement: 5,
    base_stats: {},
    stat_ranges: {},
    effects: ['teleport_town'],
    icon: '📜'
  },
  {
    name: 'scroll_teleport_dungeon',
    display_name: 'Parchemin de Téléportation - Donjon',
    description: 'Téléporte vers l\'entrée du donjon',
    type: 'scroll',
    rarity: 'rare',
    level_requirement: 10,
    base_stats: {},
    stat_ranges: {},
    effects: ['teleport_dungeon'],
    icon: '📜'
  },
  {
    name: 'scroll_identify',
    display_name: 'Parchemin d\'Identification',
    description: 'Identifie les propriétés d\'un objet',
    type: 'scroll',
    rarity: 'common',
    level_requirement: 1,
    base_stats: {},
    stat_ranges: {},
    effects: ['identify_item'],
    icon: '📜'
  },
  {
    name: 'scroll_enchant',
    display_name: 'Parchemin d\'Enchantement',
    description: 'Enchante un objet avec des propriétés magiques',
    type: 'scroll',
    rarity: 'rare',
    level_requirement: 15,
    base_stats: {},
    stat_ranges: {},
    effects: ['enchant_item'],
    icon: '📜'
  },
  {
    name: 'scroll_resurrection',
    display_name: 'Parchemin de Résurrection',
    description: 'Ressuscite un personnage mort',
    type: 'scroll',
    rarity: 'epic',
    level_requirement: 20,
    base_stats: {},
    stat_ranges: {},
    effects: ['resurrect'],
    icon: '📜'
  },

  // === ARTEFACTS ===
  {
    name: 'ancient_relic',
    display_name: 'Relique Ancienne',
    description: 'Artefact mystérieux d\'une civilisation perdue',
    type: 'artifact',
    rarity: 'epic',
    level_requirement: 25,
    base_stats: {
      experience_bonus: 50
    },
    stat_ranges: {
      experience_bonus: [40, 60]
    },
    effects: ['experience_bonus'],
    icon: '🏺'
  },
  {
    name: 'crystal_orb',
    display_name: 'Orbe de Cristal',
    description: 'Orbe magique qui révèle les secrets',
    type: 'artifact',
    rarity: 'rare',
    level_requirement: 12,
    base_stats: {
      mana_bonus: 100
    },
    stat_ranges: {
      mana_bonus: [80, 120]
    },
    effects: ['mana_bonus'],
    icon: '🔮'
  },
  {
    name: 'dragon_heart',
    display_name: 'Cœur de Dragon',
    description: 'Cœur d\'un dragon légendaire',
    type: 'artifact',
    rarity: 'legendary',
    level_requirement: 30,
    base_stats: {
      fire_resistance: 100,
      strength: 50
    },
    stat_ranges: {
      fire_resistance: [90, 110],
      strength: [40, 60]
    },
    effects: ['fire_resistance', 'strength_bonus'],
    icon: '❤️'
  },
  {
    name: 'phoenix_ash',
    display_name: 'Cendres de Phénix',
    description: 'Cendres d\'un phénix mythique',
    type: 'artifact',
    rarity: 'legendary',
    level_requirement: 28,
    base_stats: {
      resurrection: 1,
      fire_immunity: 100
    },
    stat_ranges: {
      resurrection: [1, 1],
      fire_immunity: [100, 100]
    },
    effects: ['resurrection', 'fire_immunity'],
    icon: '🔥'
  },

  // === OBJETS SPÉCIAUX ===
  {
    name: 'lucky_charm',
    display_name: 'Charme de Chance',
    description: 'Augmente la chance de trouver des objets rares',
    type: 'special',
    rarity: 'uncommon',
    level_requirement: 5,
    base_stats: {
      luck: 25
    },
    stat_ranges: {
      luck: [20, 30]
    },
    effects: ['luck_bonus'],
    icon: '🍀'
  },
  {
    name: 'treasure_map',
    display_name: 'Carte au Trésor',
    description: 'Révèle l\'emplacement d\'un trésor caché',
    type: 'special',
    rarity: 'rare',
    level_requirement: 10,
    base_stats: {},
    stat_ranges: {},
    effects: ['reveal_treasure'],
    icon: '🗺️'
  },
  {
    name: 'time_crystal',
    display_name: 'Cristal Temporel',
    description: 'Manipule le flux du temps',
    type: 'special',
    rarity: 'epic',
    level_requirement: 25,
    base_stats: {
      cooldown_reduction: 50
    },
    stat_ranges: {
      cooldown_reduction: [40, 60]
    },
    effects: ['cooldown_reduction'],
    icon: '⏰'
  },
  {
    name: 'void_shard',
    display_name: 'Éclat du Néant',
    description: 'Fragment de réalité déchirée',
    type: 'special',
    rarity: 'mythic',
    level_requirement: 35,
    base_stats: {
      dimensional_power: 100
    },
    stat_ranges: {
      dimensional_power: [90, 110]
    },
    effects: ['dimensional_power'],
    icon: '🌌'
  }
];



