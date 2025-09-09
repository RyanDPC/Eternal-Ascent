module.exports = [
  {
    title: 'Premiers Pas',
    description: 'Tuez 5 gobelins pour prouver votre valeur',
    type: 'kill',
    level_requirement: 1,
    rewards: { experience: 100, gold: 50, items: ['health_potion'] },
    requirements: { level: 1 },
    objectives: { kill_goblins: 5 },
    icon: 'first_steps_icon'
  },
  {
    title: 'Le Trésor Perdu',
    description: 'Trouvez le trésor caché dans la forêt sombre',
    type: 'exploration',
    level_requirement: 3,
    rewards: { experience: 200, gold: 100, items: ['magic_ring'] },
    requirements: { level: 3, completed_quests: ['Premiers Pas'] },
    objectives: { find_treasure: 1 },
    icon: 'treasure_icon'
  },
  {
    title: 'Maître des Éléments',
    description: 'Maîtrisez les 4 éléments de base',
    type: 'mastery',
    level_requirement: 5,
    rewards: { experience: 500, gold: 250, items: ['elemental_staff'] },
    requirements: { level: 5, skills: ['fireball', 'heal', 'shield'] },
    objectives: { master_fire: 1, master_water: 1, master_earth: 1, master_air: 1 },
    icon: 'elements_icon'
  },
  {
    title: 'Le Dragon Ancestral',
    description: 'Affrontez le dragon légendaire dans son antre',
    type: 'boss',
    level_requirement: 10,
    rewards: { experience: 1000, gold: 500, items: ['dragon_scale_armor'] },
    requirements: { level: 10, completed_quests: ['Maître des Éléments'] },
    objectives: { defeat_dragon: 1 },
    icon: 'dragon_icon'
  },
  {
    title: 'L\'Invasion des Ombres',
    description: 'Repoussez l\'invasion des créatures des ténèbres',
    type: 'defense',
    level_requirement: 15,
    rewards: { experience: 2000, gold: 1000, items: ['shadow_amulet'] },
    requirements: { level: 15, completed_quests: ['Le Dragon Ancestral'] },
    objectives: { defend_village: 1, kill_shadows: 20 },
    icon: 'shadow_invasion_icon'
  },
  {
    title: 'L\'Ascension Divine',
    description: 'Montez vers les cieux et affrontez les gardiens célestes',
    type: 'ascension',
    level_requirement: 20,
    rewards: { experience: 5000, gold: 2500, items: ['divine_crown'] },
    requirements: { level: 20, completed_quests: ['L\'Invasion des Ombres'] },
    objectives: { reach_heaven: 1, defeat_guardians: 5 },
    icon: 'divine_ascension_icon'
  },
  {
    title: 'Le Mystère d\'Eterna',
    description: 'Découvrez les secrets de la classe légendaire Eterna',
    type: 'mystery',
    level_requirement: 25,
    rewards: { experience: 10000, gold: 5000, items: ['eterna_essence'] },
    requirements: { level: 25, class: 'eterna' },
    objectives: { discover_secrets: 1, master_eterna: 1 },
    icon: 'eterna_mystery_icon'
  }
];



