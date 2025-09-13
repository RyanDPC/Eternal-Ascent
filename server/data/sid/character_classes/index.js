module.exports = [
  {
    name: 'warrior',
    display_name: 'Guerrier',
    description: 'Un combattant robuste spécialisé dans le combat au corps à corps',
    rarity: 'common',
    probability: 0.3000, // 30%
    stat_ranges: {
      health: [140, 160],
      mana: [45, 55],
      attack: [23, 27],
      defense: [18, 22],
      magic_attack: [6, 10],
      magic_defense: [8, 12]
    },
    unique_perk: {
      name: 'Volonté Inébranlable',
      code: 'unbreakable_will',
      description: 'Augmente la robustesse et réduit légèrement les dégâts subis.'
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
    stat_ranges: {
      health: [90, 110],
      mana: [110, 130],
      attack: [10, 14],
      defense: [13, 17],
      magic_attack: [26, 30],
      magic_defense: [20, 24]
    },
    unique_perk: {
      name: 'Surcharge Arcanique',
      code: 'arcane_overload',
      description: 'Augmente la puissance magique et réduit le coût en mana des sorts.'
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
    stat_ranges: {
      health: [110, 130],
      mana: [75, 85],
      attack: [20, 24],
      defense: [14, 18],
      magic_attack: [13, 17],
      magic_defense: [16, 20]
    },
    unique_perk: {
      name: 'Précision Mortelle',
      code: 'deadly_precision',
      description: 'Augmente les chances de coup critique et les dégâts à distance.'
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
    stat_ranges: {
      health: [100, 120],
      mana: [85, 95],
      attack: [22, 26],
      defense: [12, 16],
      magic_attack: [10, 14],
      magic_defense: [18, 22]
    },
    unique_perk: {
      name: 'Ombre Furtive',
      code: 'shadowstep',
      description: 'Augmente l’esquive et les dégâts après une esquive réussie.'
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
    stat_ranges: {
      health: [130, 150],
      mana: [95, 105],
      attack: [21, 25],
      defense: [22, 26],
      magic_attack: [16, 20],
      magic_defense: [18, 22]
    },
    unique_perk: {
      name: 'Bénédiction Sacrée',
      code: 'holy_aegis',
      description: 'Applique un léger bouclier en début de combat et renforce la résistance.'
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
    stat_ranges: {
      health: [120, 140],
      mana: [145, 155],
      attack: [13, 17],
      defense: [16, 20],
      magic_attack: [30, 34],
      magic_defense: [26, 30]
    },
    unique_perk: {
      name: 'Pacte Nécrotique',
      code: 'necrotic_pact',
      description: 'Vol de vie mineur sur les sorts et résistances accrues aux ténèbres.'
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
    stat_ranges: {
      health: [170, 190],
      mana: [115, 125],
      attack: [28, 32],
      defense: [26, 30],
      magic_attack: [20, 24],
      magic_defense: [22, 26]
    },
    unique_perk: {
      name: 'Sang de Dragon',
      code: 'dragon_blood',
      description: 'Augmente la résistance au feu et confère une régénération légère.'
    },
    starting_equipment: ['dragon_sword', 'dragon_armor', 'dragon_boots'],
    icon: 'dragon_knight_icon'
  },
  {
    name: 'phoenix_guardian',
    display_name: 'Gardien Phénix',
    description: 'Un chevalier légendaire investi de la flamme du phénix',
    rarity: 'legendary',
    probability: 0.0010, // 0.1%
    stat_ranges: {
      health: [200, 230],
      mana: [120, 140],
      attack: [32, 38],
      defense: [28, 34],
      magic_attack: [22, 28],
      magic_defense: [24, 30]
    },
    unique_perk: {
      name: 'Renaissance',
      code: 'phoenix_rebirth',
      description: 'Se ranime avec une partie de ses PV une fois par combat.'
    },
    starting_equipment: ['iron_sword', 'chainmail_armor', 'chainmail_boots'],
    icon: 'phoenix_guardian_icon'
  },
  {
    name: 'templar',
    display_name: 'Templier Divin',
    description: 'Un champion béni, protecteur inflexible de la lumière',
    rarity: 'divine',
    probability: 0.0003, // 0.03%
    stat_ranges: {
      health: [210, 240],
      mana: [130, 150],
      attack: [30, 36],
      defense: [32, 38],
      magic_attack: [24, 30],
      magic_defense: [28, 34]
    },
    unique_perk: {
      name: 'Égide Divine',
      code: 'divine_aegis',
      description: 'Bouclier sacré périodique qui absorbe des dégâts.'
    },
    starting_equipment: ['iron_sword', 'chainmail_armor', 'chainmail_boots'],
    icon: 'templar_icon'
  },
  {
    name: 'archangel',
    display_name: 'Archange',
    description: 'Être éternel, messager et guerrier des cieux',
    rarity: 'eternal',
    probability: 0.0001, // 0.01%
    stat_ranges: {
      health: [230, 260],
      mana: [160, 190],
      attack: [34, 40],
      defense: [30, 36],
      magic_attack: [36, 42],
      magic_defense: [34, 40]
    },
    unique_perk: {
      name: 'Lumière Inaltérable',
      code: 'immutable_light',
      description: 'Réduit les altérations et renforce les soins reçus.'
    },
    starting_equipment: ['Bâton en Bois', 'Robe de Tissu', 'Chaussures de Tissu'],
    icon: 'archangel_icon'
  },
  {
    name: 'chronomancer',
    display_name: 'Chronomancien',
    description: 'Maître transcendant du temps et des flux magiques',
    rarity: 'transcendent',
    probability: 0.0001, // 0.01% (min 4 décimales > 0)
    stat_ranges: {
      health: [200, 220],
      mana: [200, 230],
      attack: [24, 30],
      defense: [24, 30],
      magic_attack: [42, 50],
      magic_defense: [40, 48]
    },
    unique_perk: {
      name: 'Fracture Temporelle',
      code: 'time_fracture',
      description: 'Raccourcit légèrement les délais de récupération.'
    },
    starting_equipment: ['Bâton en Bois', 'Robe de Tissu', 'Chaussures de Tissu'],
    icon: 'chronomancer_icon'
  },
  {
    name: 'overlord',
    display_name: 'Souverain Omnipotent',
    description: 'Incarnation ultime de la domination et de la puissance',
    rarity: 'omnipotent',
    probability: 0.0001, // 0.01% (min 4 décimales > 0)
    stat_ranges: {
      health: [260, 300],
      mana: [220, 260],
      attack: [45, 55],
      defense: [40, 50],
      magic_attack: [45, 55],
      magic_defense: [40, 50]
    },
    unique_perk: {
      name: 'Domination Absolue',
      code: 'absolute_domination',
      description: 'Augmente fortement toutes les stats au début du combat.'
    },
    starting_equipment: ['dagger_iron', 'armor_leather', 'boots_leather'],
    icon: 'overlord_icon'
  },
  {
    name: 'eterna',
    display_name: 'Eterna',
    description: 'Une classe mystérieuse d\'une puissance incommensurable',
    rarity: 'mythic',
    probability: 0.0001, // 0.01%
    stat_ranges: {
      health: [240, 260],
      mana: [195, 205],
      attack: [38, 42],
      defense: [33, 37],
      magic_attack: [38, 42],
      magic_defense: [33, 37]
    },
    unique_perk: {
      name: 'Ascendance Éternelle',
      code: 'eternal_ascendance',
      description: 'Bonus polyvalent mineur à toutes les statistiques et à la vitesse.'
    },
    starting_equipment: ['eterna_sword', 'eterna_armor', 'eterna_boots'],
    icon: 'eterna_icon'
  }
];
