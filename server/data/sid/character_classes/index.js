module.exports = [
  {
    name: 'warrior',
    display_name: 'Guerrier',
    description: 'Un combattant robuste spécialisé dans le combat au corps à corps',
    rarity: 'common',
    probability: 0.3000, // 30%
    base_stats: {
      health: 150,
      mana: 50,
      attack: 25,
      defense: 20,
      magic_attack: 8,
      magic_defense: 10
    },
    stat_ranges: {
      health: [140, 160],
      mana: [45, 55],
      attack: [23, 27],
      defense: [18, 22],
      magic_attack: [6, 10],
      magic_defense: [8, 12]
    },
    starting_equipment: ['Épée de Fer', 'Armure de Cuir', 'Bottes de Cuir'],
    icon: 'warrior_icon'
  },
  {
    name: 'mage',
    display_name: 'Mage',
    description: 'Un magicien puissant maîtrisant les arts arcanes',
    rarity: 'common',
    probability: 0.2500, // 25%
    base_stats: {
      health: 100,
      mana: 120,
      attack: 12,
      defense: 15,
      magic_attack: 28,
      magic_defense: 22
    },
    stat_ranges: {
      health: [90, 110],
      mana: [110, 130],
      attack: [10, 14],
      defense: [13, 17],
      magic_attack: [26, 30],
      magic_defense: [20, 24]
    },
    starting_equipment: ['Bâton en Bois', 'Robe de Tissu', 'Chaussures de Tissu'],
    icon: 'mage_icon'
  },
  {
    name: 'archer',
    display_name: 'Archer',
    description: 'Un tireur d\'élite expert en combat à distance',
    rarity: 'common',
    probability: 0.2500, // 25%
    base_stats: {
      health: 120,
      mana: 80,
      attack: 22,
      defense: 16,
      magic_attack: 15,
      magic_defense: 18
    },
    stat_ranges: {
      health: [110, 130],
      mana: [75, 85],
      attack: [20, 24],
      defense: [14, 18],
      magic_attack: [13, 17],
      magic_defense: [16, 20]
    },
    starting_equipment: ['bow_wooden', 'armor_leather', 'boots_leather'],
    icon: 'archer_icon'
  },
  {
    name: 'rogue',
    display_name: 'Voleur',
    description: 'Un assassin agile spécialisé dans la discrétion',
    rarity: 'common',
    probability: 0.1500, // 15%
    base_stats: {
      health: 110,
      mana: 90,
      attack: 24,
      defense: 14,
      magic_attack: 12,
      magic_defense: 20
    },
    stat_ranges: {
      health: [100, 120],
      mana: [85, 95],
      attack: [22, 26],
      defense: [12, 16],
      magic_attack: [10, 14],
      magic_defense: [18, 22]
    },
    starting_equipment: ['dagger_iron', 'armor_leather', 'boots_leather'],
    icon: 'rogue_icon'
  },
  {
    name: 'paladin',
    display_name: 'Paladin',
    description: 'Un chevalier sacré alliant force et magie divine',
    rarity: 'uncommon',
    probability: 0.0400, // 4%
    base_stats: {
      health: 140,
      mana: 100,
      attack: 23,
      defense: 24,
      magic_attack: 18,
      magic_defense: 20
    },
    stat_ranges: {
      health: [130, 150],
      mana: [95, 105],
      attack: [21, 25],
      defense: [22, 26],
      magic_attack: [16, 20],
      magic_defense: [18, 22]
    },
    starting_equipment: ['iron_sword', 'chainmail_armor', 'chainmail_boots'],
    icon: 'paladin_icon'
  },
  {
    name: 'necromancer',
    display_name: 'Nécromancien',
    description: 'Un mage sombre maîtrisant la magie de la mort',
    rarity: 'rare',
    probability: 0.0080, // 0.8%
    base_stats: {
      health: 130,
      mana: 150,
      attack: 15,
      defense: 18,
      magic_attack: 32,
      magic_defense: 28
    },
    stat_ranges: {
      health: [120, 140],
      mana: [145, 155],
      attack: [13, 17],
      defense: [16, 20],
      magic_attack: [30, 34],
      magic_defense: [26, 30]
    },
    starting_equipment: ['bone_staff', 'dark_robe', 'dark_boots'],
    icon: 'necromancer_icon'
  },
  {
    name: 'dragon_knight',
    display_name: 'Chevalier Dragon',
    description: 'Un guerrier légendaire lié aux dragons',
    rarity: 'epic',
    probability: 0.0015, // 0.15%
    base_stats: {
      health: 180,
      mana: 120,
      attack: 30,
      defense: 28,
      magic_attack: 22,
      magic_defense: 24
    },
    stat_ranges: {
      health: [170, 190],
      mana: [115, 125],
      attack: [28, 32],
      defense: [26, 30],
      magic_attack: [20, 24],
      magic_defense: [22, 26]
    },
    starting_equipment: ['dragon_sword', 'dragon_armor', 'dragon_boots'],
    icon: 'dragon_knight_icon'
  },
  {
    name: 'eterna',
    display_name: 'Eterna',
    description: 'Une classe mystérieuse d\'une puissance incommensurable',
    rarity: 'mythic',
    probability: 0.0001, // 0.01%
    base_stats: {
      health: 250,
      mana: 200,
      attack: 40,
      defense: 35,
      magic_attack: 40,
      magic_defense: 35
    },
    stat_ranges: {
      health: [240, 260],
      mana: [195, 205],
      attack: [38, 42],
      defense: [33, 37],
      magic_attack: [38, 42],
      magic_defense: [33, 37]
    },
    starting_equipment: ['eterna_sword', 'eterna_armor', 'eterna_boots'],
    icon: 'eterna_icon'
  }
];
