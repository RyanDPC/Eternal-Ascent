class DungeonManager {
  constructor() {
    this.dungeons = this.generateDungeons();
  }

  generateDungeons() {
    const dungeons = [];
    
    // Fonction helper pour générer les stats des donjons
    const generateDungeonStats = (level, difficulty) => {
      const baseExp = {
        'easy': level * 8,
        'normal': level * 12,
        'hard': level * 18,
        'nightmare': level * 25,
        'hell': level * 35,
        'legendary': level * 50,
        'mythic': level * 75,
        'divine': level * 100
      };
      
      const baseGold = {
        'easy': level * 3,
        'normal': level * 5,
        'hard': level * 8,
        'nightmare': level * 12,
        'hell': level * 18,
        'legendary': level * 25,
        'mythic': level * 35,
        'divine': level * 50
      };
      
      return {
        monster_count: 3, // Par défaut 3 monstres
        exp_reward: baseExp[difficulty] + Math.floor(Math.random() * (level * 4)),
        gold_reward: baseGold[difficulty] + Math.floor(Math.random() * (level * 2)),
        time_limit: 3 + Math.floor(Math.random() * 3)
      };
    };

    // Donjons de niveau 1-5 (Easy) - 3-5 minutes
    const easyDungeons = [
      { name: 'goblin_cave', display_name: 'Grotte des Gobelins', description: 'Une grotte sombre peuplée de gobelins agressifs', theme: 'cave', enemies: ['goblin_warrior', 'goblin_archer', 'goblin_shaman'] },
      { name: 'spider_den', display_name: 'Tanière d\'Araignées', description: 'Un repaire d\'araignées géantes dans les profondeurs', theme: 'cave', enemies: ['giant_spider', 'poison_spider', 'spider_queen'] },
      { name: 'rat_tunnel', display_name: 'Tunnel des Rats', description: 'Des tunnels infestés de rats géants', theme: 'cave', enemies: ['giant_rat', 'plague_rat', 'rat_king'] },
      { name: 'bandit_camp', display_name: 'Camp de Bandits', description: 'Un camp de bandits dans la forêt', theme: 'forest', enemies: ['bandit', 'bandit_archer', 'bandit_leader'] },
      { name: 'wolf_pack', display_name: 'Meute de Loups', description: 'Une meute de loups sauvages', theme: 'forest', enemies: ['wild_wolf', 'alpha_wolf', 'dire_wolf'] },
      { name: 'bear_cave', display_name: 'Caverne de l\'Ours', description: 'La tanière d\'un ours géant', theme: 'cave', enemies: ['brown_bear', 'grizzly_bear', 'cave_bear'] },
      { name: 'skeleton_graveyard', display_name: 'Cimetière de Squelettes', description: 'Un cimetière hanté par des squelettes', theme: 'undead', enemies: ['skeleton', 'skeleton_warrior', 'skeleton_mage'] },
      { name: 'orc_outpost', display_name: 'Avant-poste Orc', description: 'Un petit avant-poste orc', theme: 'fortress', enemies: ['orc_warrior', 'orc_shaman', 'orc_chief'] },
      { name: 'troll_bridge', display_name: 'Pont du Troll', description: 'Un pont gardé par un troll', theme: 'bridge', enemies: ['bridge_troll', 'cave_troll', 'mountain_troll'] },
      { name: 'kobold_mines', display_name: 'Mines Kobold', description: 'Des mines abandonnées occupées par des kobolds', theme: 'mine', enemies: ['kobold', 'kobold_trapper', 'kobold_chief'] },
      { name: 'slime_pit', display_name: 'Fosse de Slime', description: 'Une fosse remplie de slimes visqueux', theme: 'cave', enemies: ['green_slime', 'blue_slime', 'slime_king'] },
      { name: 'bat_cavern', display_name: 'Caverne des Chauves-souris', description: 'Une caverne infestée de chauves-souris géantes', theme: 'cave', enemies: ['giant_bat', 'vampire_bat', 'bat_swarm'] },
      { name: 'snake_pit', display_name: 'Fosse aux Serpents', description: 'Une fosse remplie de serpents venimeux', theme: 'cave', enemies: ['poison_snake', 'giant_snake', 'snake_king'] },
      { name: 'boar_forest', display_name: 'Forêt des Sangliers', description: 'Une forêt peuplée de sangliers sauvages', theme: 'forest', enemies: ['wild_boar', 'giant_boar', 'boar_king'] },
      { name: 'bee_hive', display_name: 'Ruche Géante', description: 'Une ruche géante d\'abeilles agressives', theme: 'forest', enemies: ['giant_bee', 'killer_bee', 'queen_bee'] }
    ];

    // Donjons de niveau 3-8 (Normal) - 4-7 minutes
    const normalDungeons = [
      { name: 'dark_forest', display_name: 'Forêt Sombre', description: 'Une forêt maudite où rôdent des créatures maléfiques', theme: 'forest', enemies: ['dark_wolf', 'shadow_stalker', 'forest_witch'] },
      { name: 'haunted_mansion', display_name: 'Manoir Hanté', description: 'Un manoir abandonné hanté par des esprits', theme: 'mansion', enemies: ['ghost', 'wraith', 'specter'] },
      { name: 'goblin_fortress', display_name: 'Forteresse Gobeline', description: 'Une forteresse gobeline bien défendue', theme: 'fortress', enemies: ['goblin_guard', 'goblin_shaman', 'goblin_warlord'] },
      { name: 'swamp_bog', display_name: 'Marais Nauséabond', description: 'Un marais infesté de créatures toxiques', theme: 'swamp', enemies: ['swamp_creature', 'bog_monster', 'swamp_witch'] },
      { name: 'mountain_pass', display_name: 'Col de Montagne', description: 'Un passage de montagne gardé par des créatures', theme: 'mountain', enemies: ['mountain_goat', 'stone_golem', 'mountain_giant'] },
      { name: 'desert_oasis', display_name: 'Oasis du Désert', description: 'Une oasis dans le désert, refuge de créatures', theme: 'desert', enemies: ['desert_scorpion', 'sand_worm', 'desert_nomad'] },
      { name: 'ruined_temple', display_name: 'Temple en Ruines', description: 'Un ancien temple en ruines', theme: 'temple', enemies: ['temple_guardian', 'fallen_priest', 'ancient_spirit'] },
      { name: 'crystal_caverns', display_name: 'Caverne de Cristal', description: 'Des cavernes remplies de cristaux magiques', theme: 'crystal', enemies: ['crystal_golem', 'crystal_spider', 'crystal_dragon'] },
      { name: 'undead_catacombs', display_name: 'Catacombes des Morts-Vivants', description: 'Des catacombes peuplées de morts-vivants', theme: 'undead', enemies: ['zombie', 'ghoul', 'lich'] },
      { name: 'elemental_ruins', display_name: 'Ruines Élémentaires', description: 'Des ruines où les éléments se déchaînent', theme: 'elemental', enemies: ['fire_elemental', 'water_elemental', 'earth_elemental'] },
      { name: 'orc_stronghold', display_name: 'Bastion Orc', description: 'Un bastion orc fortement défendu', theme: 'fortress', enemies: ['orc_berserker', 'orc_shaman', 'orc_warlord'] },
      { name: 'troll_cave', display_name: 'Caverne des Trolls', description: 'Une caverne habitée par une famille de trolls', theme: 'cave', enemies: ['cave_troll', 'mountain_troll', 'troll_chief'] },
      { name: 'ghost_ship', display_name: 'Vaisseau Fantôme', description: 'Un vaisseau fantôme errant sur les mers', theme: 'ship', enemies: ['ghost_sailor', 'phantom_captain', 'spectral_crew'] },
      { name: 'wizard_tower', display_name: 'Tour du Mage', description: 'La tour d\'un mage fou', theme: 'tower', enemies: ['magic_construct', 'arcane_guardian', 'mad_wizard'] },
      { name: 'druid_grove', display_name: 'Bosquet des Druides', description: 'Un bosquet sacré protégé par des druides', theme: 'forest', enemies: ['nature_guardian', 'druid_warrior', 'grove_keeper'] }
    ];

    // Donjons de niveau 5-12 (Hard) - 5-9 minutes
    const hardDungeons = [
      { name: 'ice_caverns', display_name: 'Caverne de Glace', description: 'Des cavernes gelées gardées par des élémentaires de glace', theme: 'ice', enemies: ['ice_elemental', 'frost_giant', 'ice_dragon'] },
      { name: 'fire_mountain', display_name: 'Montagne de Feu', description: 'Une montagne volcanique active', theme: 'volcano', enemies: ['lava_elemental', 'fire_giant', 'volcano_dragon'] },
      { name: 'thunder_peak', display_name: 'Pic du Tonnerre', description: 'Un pic où la foudre frappe constamment', theme: 'storm', enemies: ['storm_elemental', 'thunder_bird', 'lightning_dragon'] },
      { name: 'shadow_realm', display_name: 'Royaume des Ombres', description: 'Un donjon dans une dimension parallèle sombre', theme: 'shadow', enemies: ['shadow_lord', 'void_walker', 'dark_archon'] },
      { name: 'demon_fortress', display_name: 'Forteresse Démoniaque', description: 'Une forteresse contrôlée par des démons', theme: 'hell', enemies: ['lesser_demon', 'greater_demon', 'demon_lord'] },
      { name: 'dragon_lair', display_name: 'Antre du Dragon', description: 'Le repaire d\'un dragon ancien', theme: 'dragon', enemies: ['dragon_whelp', 'young_dragon', 'ancient_dragon'] },
      { name: 'necromancer_tower', display_name: 'Tour du Nécromancien', description: 'La tour d\'un puissant nécromancien', theme: 'tower', enemies: ['skeleton_mage', 'death_knight', 'necromancer'] },
      { name: 'abyssal_depths', display_name: 'Profondeurs Abyssales', description: 'Les profondeurs les plus sombres de l\'abysse', theme: 'abyss', enemies: ['abyssal_horror', 'void_spawn', 'abyssal_lord'] },
      { name: 'cursed_city', display_name: 'Cité Maudite', description: 'Une cité entièrement maudite', theme: 'city', enemies: ['cursed_guardian', 'fallen_paladin', 'city_lord'] },
      { name: 'time_rift', display_name: 'Faille Temporelle', description: 'Une faille dans le continuum spatio-temporel', theme: 'time', enemies: ['time_wraith', 'temporal_guardian', 'time_lord'] },
      { name: 'elemental_chaos', display_name: 'Chaos Élémentaire', description: 'Un lieu où tous les éléments se mélangent', theme: 'chaos', enemies: ['chaos_elemental', 'primal_force', 'chaos_lord'] },
      { name: 'void_prison_hard', display_name: 'Prison du Vide (Hard)', description: 'Une prison dans le néant absolu - Version difficile', theme: 'void', enemies: ['void_guardian', 'void_prisoner', 'void_warden'] },
      { name: 'nightmare_realm_hard', display_name: 'Royaume des Cauchemars (Hard)', description: 'Le royaume où les cauchemars prennent vie - Version difficile', theme: 'nightmare', enemies: ['nightmare_hound', 'dream_eater', 'nightmare_king'] },
      { name: 'soul_forge_hard', display_name: 'Forge des Âmes (Hard)', description: 'Une forge où les âmes sont transformées - Version difficile', theme: 'forge', enemies: ['soul_forger', 'soul_reaper', 'soul_master'] },
      { name: 'eternal_battlefield_hard', display_name: 'Champ de Bataille Éternel (Hard)', description: 'Un champ de bataille où la guerre ne s\'arrête jamais - Version difficile', theme: 'battlefield', enemies: ['eternal_warrior', 'battle_ghost', 'war_god'] }
    ];

    // Donjons de niveau 10-18 (Nightmare) - 6-9 minutes
    const nightmareDungeons = [
      { name: 'volcanic_chamber', display_name: 'Chambre Volcanique', description: 'Le cœur d\'un volcan actif, domaine du Dragon de Feu', theme: 'volcano', enemies: ['lava_elemental', 'fire_demon', 'fire_dragon'] },
      { name: 'frozen_hell', display_name: 'Enfer Gelé', description: 'Un enfer de glace éternelle', theme: 'ice', enemies: ['ice_demon', 'frost_lich', 'ice_archdevil'] },
      { name: 'chaos_dimension', display_name: 'Dimension du Chaos', description: 'Une dimension où règne le chaos pur', theme: 'chaos', enemies: ['chaos_spawn', 'chaos_lord', 'chaos_god'] },
      { name: 'void_prison_nightmare', display_name: 'Prison du Vide', description: 'Une prison dans le néant absolu', theme: 'void', enemies: ['void_guardian', 'void_prisoner', 'void_warden'] },
      { name: 'nightmare_realm_nightmare', display_name: 'Royaume des Cauchemars', description: 'Le royaume où les cauchemars prennent vie', theme: 'nightmare', enemies: ['nightmare_hound', 'dream_eater', 'nightmare_king'] },
      { name: 'soul_forge_nightmare', display_name: 'Forge des Âmes', description: 'Une forge où les âmes sont transformées', theme: 'forge', enemies: ['soul_forger', 'soul_reaper', 'soul_master'] },
      { name: 'eternal_battlefield_nightmare', display_name: 'Champ de Bataille Éternel', description: 'Un champ de bataille où la guerre ne s\'arrête jamais', theme: 'battlefield', enemies: ['eternal_warrior', 'battle_ghost', 'war_god'] },
      { name: 'corrupted_sanctuary', display_name: 'Sanctuaire Corrompu', description: 'Un sanctuaire autrefois pur, maintenant corrompu', theme: 'corrupted', enemies: ['corrupted_angel', 'fallen_seraph', 'corruption_lord'] },
      { name: 'dimensional_maze', display_name: 'Labyrinthe Dimensionnel', description: 'Un labyrinthe qui change constamment de dimension', theme: 'maze', enemies: ['dimensional_guardian', 'maze_master', 'dimensional_lord'] },
      { name: 'apocalypse_grounds', display_name: 'Terres de l\'Apocalypse', description: 'Les terres où l\'apocalypse a commencé', theme: 'apocalypse', enemies: ['apocalypse_horseman', 'end_time_guardian', 'apocalypse_king'] },
      { name: 'infernal_citadel', display_name: 'Citadelle Infernal', description: 'La citadelle des démons les plus puissants', theme: 'hell', enemies: ['infernal_demon', 'hell_lord', 'infernal_archdevil'] },
      { name: 'pandemonium', display_name: 'Pandémonium', description: 'Le chaos absolu des enfers', theme: 'chaos', enemies: ['chaos_demon', 'pandemonium_lord', 'chaos_archdevil'] },
      { name: 'tartarus', display_name: 'Tartare', description: 'La prison des titans dans les enfers', theme: 'prison', enemies: ['titan_prisoner', 'tartarus_guardian', 'titan_lord'] },
      { name: 'gehenna', display_name: 'Géhenne', description: 'La vallée de feu éternel', theme: 'fire', enemies: ['gehenna_demon', 'fire_archdevil', 'gehenna_lord'] },
      { name: 'abaddon', display_name: 'Abaddon', description: 'Le lieu de destruction totale', theme: 'destruction', enemies: ['destruction_demon', 'abaddon_guardian', 'destruction_lord'] }
    ];

    // Donjons de niveau 15-25 (Hell) - 7-9 minutes
    const hellDungeons = [
      { name: 'sheol', display_name: 'Shéol', description: 'Le royaume des morts', theme: 'death', enemies: ['death_demon', 'sheol_guardian', 'death_lord'] },
      { name: 'hades', display_name: 'Hadès', description: 'Le royaume des morts grec', theme: 'underworld', enemies: ['hades_guardian', 'underworld_lord', 'hades_god'] },
      { name: 'niflheim', display_name: 'Niflheim', description: 'Le monde de glace et de brume', theme: 'ice', enemies: ['niflheim_giant', 'frost_jotun', 'niflheim_lord'] },
      { name: 'muspelheim', display_name: 'Muspelheim', description: 'Le monde de feu et de lave', theme: 'fire', enemies: ['muspelheim_giant', 'fire_jotun', 'muspelheim_lord'] },
      { name: 'helheim', display_name: 'Helheim', description: 'Le royaume de la déesse Hel', theme: 'death', enemies: ['hel_guardian', 'death_jotun', 'hel_goddess'] },
      { name: 'asgard', display_name: 'Asgard', description: 'Le royaume des dieux nordiques', theme: 'divine', enemies: ['asgard_guardian', 'valkyrie', 'odin_warrior'] },
      { name: 'midgard', display_name: 'Midgard', description: 'Le monde des mortels', theme: 'earth', enemies: ['midgard_giant', 'earth_titan', 'midgard_lord'] },
      { name: 'alfheim', display_name: 'Alfheim', description: 'Le royaume des elfes lumineux', theme: 'light', enemies: ['light_elf', 'elf_guardian', 'alfheim_lord'] },
      { name: 'svartalfheim', display_name: 'Svartalfheim', description: 'Le royaume des elfes sombres', theme: 'dark', enemies: ['dark_elf', 'shadow_guardian', 'svartalfheim_lord'] },
      { name: 'vanaheim', display_name: 'Vanaheim', description: 'Le royaume des dieux vanes', theme: 'nature', enemies: ['vane_guardian', 'nature_titan', 'vanaheim_lord'] }
    ];

    // Donjons de niveau 20-30 (Divine) - 10-19 minutes
    const divineDungeons = [
      { name: 'celestial_tower', display_name: 'Tour Céleste', description: 'Une tour qui s\'élève vers les cieux, gardée par des anges', theme: 'celestial', enemies: ['celestial_guardian', 'archangel', 'divine_seraph'] },
      { name: 'heavenly_garden', display_name: 'Jardin Céleste', description: 'Le jardin d\'Eden, paradis perdu', theme: 'paradise', enemies: ['cherubim', 'seraphim', 'garden_guardian'] },
      { name: 'throne_room', display_name: 'Salle du Trône', description: 'La salle du trône divin', theme: 'throne', enemies: ['throne_guardian', 'divine_archangel', 'god_emperor'] },
      { name: 'crystal_palace', display_name: 'Palais de Cristal', description: 'Un palais fait entièrement de cristal divin', theme: 'crystal', enemies: ['crystal_angel', 'divine_crystal', 'palace_guardian'] },
      { name: 'star_cathedral', display_name: 'Cathédrale des Étoiles', description: 'Une cathédrale construite dans les étoiles', theme: 'stars', enemies: ['star_guardian', 'constellation_spirit', 'star_lord'] },
      { name: 'cosmic_temple', display_name: 'Temple Cosmique', description: 'Un temple au cœur de l\'univers', theme: 'cosmic', enemies: ['cosmic_guardian', 'universe_spirit', 'cosmic_lord'] },
      { name: 'divine_arena', display_name: 'Arène Divine', description: 'L\'arène où les dieux s\'affrontent', theme: 'arena', enemies: ['divine_gladiator', 'god_warrior', 'arena_champion'] },
      { name: 'eternal_sanctuary', display_name: 'Sanctuaire Éternel', description: 'Le sanctuaire le plus sacré de l\'univers', theme: 'sanctuary', enemies: ['eternal_guardian', 'divine_protector', 'sanctuary_lord'] },
      { name: 'infinity_hall', display_name: 'Salle de l\'Infini', description: 'Une salle qui s\'étend à l\'infini', theme: 'infinity', enemies: ['infinity_guardian', 'eternal_spirit', 'infinity_lord'] },
      { name: 'omnipotence_chamber', display_name: 'Chambre de l\'Omnipotence', description: 'La chambre du pouvoir absolu', theme: 'omnipotence', enemies: ['omnipotence_guardian', 'absolute_being', 'omnipotence_lord'] }
    ];

    // Génération des donjons Easy (niveau 1-5) - 3-5 minutes
    easyDungeons.forEach((dungeon, index) => {
      const level = 1 + (index % 5); // Niveau 1-5
      const stats = generateDungeonStats(level, 'easy');
      dungeons.push({
        name: dungeon.name,
        display_name: dungeon.display_name,
        description: dungeon.description,
        level_requirement: level,
        difficulty: 'easy',
        estimated_duration: 3 + Math.floor(Math.random() * 3), // 3-5 minutes
        requirements: { level: level },
        enemies: dungeon.enemies,
        icon: `${dungeon.theme}_icon`,
        theme: dungeon.theme,
        ...stats,
        monster_count: dungeon.enemies.length
      });
    });

    // Génération des donjons Normal (niveau 3-8) - 4-7 minutes
    normalDungeons.forEach((dungeon, index) => {
      const level = 3 + (index % 6); // Niveau 3-8
      const stats = generateDungeonStats(level, 'normal');
      dungeons.push({
        name: dungeon.name,
        display_name: dungeon.display_name,
        description: dungeon.description,
        level_requirement: level,
        difficulty: 'normal',
        estimated_duration: 4 + Math.floor(Math.random() * 4), // 4-7 minutes
        requirements: { level: level },
        enemies: dungeon.enemies,
        icon: `${dungeon.theme}_icon`,
        theme: dungeon.theme,
        ...stats,
        monster_count: dungeon.enemies.length
      });
    });

    // Génération des donjons Hard (niveau 5-12) - 5-9 minutes
    hardDungeons.forEach((dungeon, index) => {
      const level = 5 + (index % 8); // Niveau 5-12
      const stats = generateDungeonStats(level, 'hard');
      dungeons.push({
        name: dungeon.name,
        display_name: dungeon.display_name,
        description: dungeon.description,
        level_requirement: level,
        difficulty: 'hard',
        estimated_duration: 5 + Math.floor(Math.random() * 5), // 5-9 minutes
        requirements: { level: level },
        enemies: dungeon.enemies,
        icon: `${dungeon.theme}_icon`,
        theme: dungeon.theme,
        ...stats,
        monster_count: dungeon.enemies.length
      });
    });

    // Génération des donjons Nightmare (niveau 10-18) - 6-9 minutes
    nightmareDungeons.forEach((dungeon, index) => {
      const level = 10 + (index % 9); // Niveau 10-18
      const stats = generateDungeonStats(level, 'nightmare');
      dungeons.push({
        name: dungeon.name,
        display_name: dungeon.display_name,
        description: dungeon.description,
        level_requirement: level,
        difficulty: 'nightmare',
        estimated_duration: 6 + Math.floor(Math.random() * 4), // 6-9 minutes
        requirements: { level: level },
        enemies: dungeon.enemies,
        icon: `${dungeon.theme}_icon`,
        theme: dungeon.theme,
        ...stats,
        monster_count: dungeon.enemies.length
      });
    });

    // Génération des donjons Hell
    hellDungeons.forEach((dungeon, index) => {
      const level = 15 + (index % 10); // Niveau 15-24
      const stats = generateDungeonStats(level, 'hell');
      dungeons.push({
        name: dungeon.name,
        display_name: dungeon.display_name,
        description: dungeon.description,
        level_requirement: level,
        difficulty: 'hell',
        estimated_duration: 7 + Math.floor(Math.random() * 3),
        requirements: { level: level },
        enemies: dungeon.enemies,
        icon: `${dungeon.theme}_icon`,
        theme: dungeon.theme,
        ...stats,
        monster_count: dungeon.enemies.length
      });
    });

    // Génération des donjons Divine
    divineDungeons.forEach((dungeon, index) => {
      const level = 25 + (index % 15); // Niveau 25-39
      const stats = generateDungeonStats(level, 'divine');
      dungeons.push({
        name: dungeon.name,
        display_name: dungeon.display_name,
        description: dungeon.description,
        level_requirement: level,
        difficulty: 'divine',
        estimated_duration: 10 + Math.floor(Math.random() * 3),
        requirements: { level: level },
        enemies: dungeon.enemies,
        icon: `${dungeon.theme}_icon`,
        theme: dungeon.theme,
        ...stats,
        monster_count: dungeon.enemies.length
      });
    });

    // Ajouter des donjons bonus pour atteindre plus de 100
    const bonusThemes = ['ancient', 'mystical', 'cursed', 'blessed', 'eternal', 'forgotten', 'legendary', 'mythical', 'primal', 'arcane'];
    const bonusEnemies = ['ancient_guardian', 'mystical_creature', 'cursed_spirit', 'blessed_angel', 'eternal_watcher', 'forgotten_hero', 'legendary_beast', 'mythical_dragon', 'primal_force', 'arcane_construct'];

    for (let i = 0; i < 30; i++) {
      const theme = bonusThemes[i % bonusThemes.length];
      // Générer des niveaux cohérents avec la difficulté
      let level, difficulty;
      if (i < 10) {
        difficulty = 'easy';
        level = 1 + Math.floor(Math.random() * 3); // Niveau 1-3
      } else if (i < 20) {
        difficulty = 'normal';
        level = 3 + Math.floor(Math.random() * 3); // Niveau 3-5
      } else if (i < 25) {
        difficulty = 'hard';
        level = 5 + Math.floor(Math.random() * 3); // Niveau 5-7
      } else {
        difficulty = 'nightmare';
        level = 8 + Math.floor(Math.random() * 3); // Niveau 8-10
      }
      const duration = difficulty === 'divine' ? 10 + Math.floor(Math.random() * 10) : 
                      difficulty === 'hell' ? 7 + Math.floor(Math.random() * 3) :
                      difficulty === 'nightmare' ? 6 + Math.floor(Math.random() * 4) :
                      difficulty === 'hard' ? 5 + Math.floor(Math.random() * 5) :
                      difficulty === 'normal' ? 4 + Math.floor(Math.random() * 4) :
                      3 + Math.floor(Math.random() * 3);

      dungeons.push({
        name: `${theme}_realm_${i + 1}`,
        display_name: `Royaume ${theme.charAt(0).toUpperCase() + theme.slice(1)} ${i + 1}`,
        description: `Un royaume ${theme} perdu dans les temps anciens`,
        level_requirement: level,
        difficulty: difficulty,
        estimated_duration: duration,
        requirements: { level: level },
        enemies: [bonusEnemies[i % bonusEnemies.length], `${theme}_guardian`, `${theme}_lord`],
        icon: `${theme}_icon`,
        theme: theme
      });
    }

    return dungeons;
  }

  // Récupérer tous les donjons
  getDungeons() {
    return this.dungeons;
  }

  // Récupérer un donjon par ID
  getDungeonById(dungeonId) {
    return this.dungeons.find(dungeon => dungeon.name === dungeonId);
  }

  // Calculer les multiplicateurs de difficulté
  getDifficultyMultiplier(difficulty) {
    const multipliers = {
      'easy': 1.0,
      'normal': 1.5,
      'hard': 2.0,
      'nightmare': 3.0,
      'hell': 4.0,
      'divine': 5.0
    };
    return multipliers[difficulty] || 1.0;
  }

  // Calculer la rareté de base selon la difficulté
  getDifficultyRarity(difficulty) {
    const rarityMap = {
      'easy': 'common',
      'normal': 'common',
      'hard': 'uncommon',
      'nightmare': 'rare',
      'hell': 'epic',
      'divine': 'legendary'
    };
    return rarityMap[difficulty] || 'common';
  }

  // Calculer les récompenses XP
  calculateXPReward(dungeon, characterLevel) {
    const level = dungeon.level_requirement;
    
    // Plages d'XP basées sur la difficulté (cohérentes avec l'affichage frontend)
    const xpRanges = {
      'easy': { min: Math.floor(level * 8), max: Math.floor(level * 15) },
      'normal': { min: Math.floor(level * 12), max: Math.floor(level * 20) },
      'hard': { min: Math.floor(level * 15), max: Math.floor(level * 25) },
      'nightmare': { min: Math.floor(level * 20), max: Math.floor(level * 35) },
      'hell': { min: Math.floor(level * 25), max: Math.floor(level * 45) },
      'divine': { min: Math.floor(level * 30), max: Math.floor(level * 60) }
    };
    
    const range = xpRanges[dungeon.difficulty] || xpRanges['easy'];
    
    // Tirage aléatoire dans la plage
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  // Calculer le montant de base de la monnaie
  calculateBaseCurrencyAmount(difficulty) {
    const baseAmounts = {
      'easy': 10,
      'normal': 25,
      'hard': 50,
      'nightmare': 100,
      'hell': 200,
      'divine': 500
    };
    return baseAmounts[difficulty] || 10;
  }

  // Calculer les chances de drop de rareté supérieure
  getHigherRarityDropChance(difficulty, rarityTier) {
    const baseChances = {
      'easy': [0.1, 0.05, 0.02, 0.01, 0.005],
      'normal': [0.15, 0.08, 0.04, 0.02, 0.01],
      'hard': [0.2, 0.12, 0.06, 0.03, 0.015],
      'nightmare': [0.25, 0.15, 0.08, 0.04, 0.02],
      'hell': [0.3, 0.18, 0.1, 0.05, 0.025],
      'divine': [0.4, 0.25, 0.15, 0.08, 0.04]
    };
    
    const chances = baseChances[difficulty] || baseChances['easy'];
    return chances[Math.min(rarityTier - 1, chances.length - 1)] || 0;
  }

  // Calculer le montant pour les raretés supérieures
  calculateHigherRarityAmount(rarity, difficulty) {
    const multipliers = {
      'uncommon': 2,
      'rare': 5,
      'epic': 10,
      'legendary': 25,
      'mythic': 50
    };
    
    const baseAmount = this.calculateBaseCurrencyAmount(difficulty);
    const multiplier = multipliers[rarity] || 1;
    
    return Math.floor(baseAmount * multiplier * (0.8 + Math.random() * 0.4));
  }

  // Générer les stats d'un ennemi basées sur son type et niveau
  generateEnemyStats(enemyType, level) {
    // Définir les plages de stats par type d'ennemi
    const enemyStatsRanges = {
      // Gobelins
      'goblin_warrior': { hp: [8, 12], atk: [2, 4], def: [0, 2], spd: [1, 3] },
      'goblin_archer': { hp: [6, 10], atk: [3, 5], def: [0, 1], spd: [2, 4] },
      'goblin_shaman': { hp: [7, 11], atk: [1, 3], def: [1, 3], spd: [1, 2] },
      'goblin': { hp: [8, 12], atk: [2, 4], def: [0, 2], spd: [1, 3] },
      
      // Araignées
      'giant_spider': { hp: [10, 15], atk: [3, 6], def: [1, 3], spd: [3, 5] },
      'poison_spider': { hp: [8, 13], atk: [2, 5], def: [0, 2], spd: [2, 4] },
      'spider_queen': { hp: [15, 25], atk: [5, 8], def: [2, 4], spd: [1, 3] },
      
      // Rats
      'giant_rat': { hp: [5, 9], atk: [1, 3], def: [0, 1], spd: [2, 4] },
      'plague_rat': { hp: [6, 10], atk: [2, 4], def: [0, 1], spd: [3, 5] },
      'rat_king': { hp: [12, 18], atk: [4, 7], def: [1, 3], spd: [1, 3] },
      
      // Bandits
      'bandit': { hp: [12, 18], atk: [4, 7], def: [1, 3], spd: [2, 4] },
      'bandit_archer': { hp: [10, 16], atk: [5, 8], def: [0, 2], spd: [3, 5] },
      'bandit_leader': { hp: [18, 25], atk: [6, 10], def: [2, 4], spd: [2, 4] },
      
      // Loups
      'wild_wolf': { hp: [15, 22], atk: [5, 8], def: [1, 3], spd: [4, 6] },
      'alpha_wolf': { hp: [20, 28], atk: [7, 11], def: [2, 4], spd: [3, 5] },
      'dire_wolf': { hp: [25, 35], atk: [9, 14], def: [3, 5], spd: [2, 4] },
      
      // Par défaut pour les ennemis non définis
      'default': { hp: [8, 12], atk: [2, 4], def: [0, 2], spd: [1, 3] }
    };
    
    const statsRange = enemyStatsRanges[enemyType] || enemyStatsRanges['default'];
    
    // Appliquer le multiplicateur de niveau
    const levelMultiplier = 1 + (level - 1) * 0.3; // +30% par niveau
    
    return {
      hp: Math.floor((Math.random() * (statsRange.hp[1] - statsRange.hp[0] + 1) + statsRange.hp[0]) * levelMultiplier),
      atk: Math.floor((Math.random() * (statsRange.atk[1] - statsRange.atk[0] + 1) + statsRange.atk[0]) * levelMultiplier),
      def: Math.floor((Math.random() * (statsRange.def[1] - statsRange.def[0] + 1) + statsRange.def[0]) * levelMultiplier),
      spd: Math.floor((Math.random() * (statsRange.spd[1] - statsRange.spd[0] + 1) + statsRange.spd[0]) * levelMultiplier)
    };
  }

  // Calculer les récompenses en or avec système probabiliste
  calculateGoldReward(dungeon) {
    const level = dungeon.level_requirement;
    const difficulty = dungeon.difficulty;
    
    let goldReward = {};
    
    // Définir les récompenses par difficulté
    const currencyRewards = {
      'easy': {
        'copper_coin': { min: 10, max: 15, chance: 1.0 }, // 100% chance
        'silver_coin': { min: 3, max: 5, chance: 0.4 },   // 40% chance
        'gold_coin': { min: 0, max: 0, chance: 0.0 }      // 0% chance
      },
      'normal': {
        'copper_coin': { min: 15, max: 25, chance: 1.0 },
        'silver_coin': { min: 5, max: 8, chance: 0.5 },
        'gold_coin': { min: 1, max: 2, chance: 0.1 }
      },
      'hard': {
        'silver_coin': { min: 15, max: 20, chance: 1.0 }, // 100% chance
        'copper_coin': { min: 30, max: 35, chance: 0.6 }, // 60% chance
        'gold_coin': { min: 1, max: 6, chance: 0.3 }      // 30% chance
      },
      'nightmare': {
        'silver_coin': { min: 20, max: 30, chance: 1.0 },
        'gold_coin': { min: 5, max: 10, chance: 0.7 },
        'platinum_coin': { min: 1, max: 3, chance: 0.2 }
      },
      'hell': {
        'gold_coin': { min: 15, max: 25, chance: 1.0 },
        'platinum_coin': { min: 3, max: 8, chance: 0.6 },
        'diamond_coin': { min: 1, max: 2, chance: 0.3 }
      },
      'divine': {
        'platinum_coin': { min: 20, max: 35, chance: 1.0 },
        'diamond_coin': { min: 5, max: 12, chance: 0.8 },
        'eternal_coin': { min: 1, max: 3, chance: 0.4 }
      }
    };
    
    const rewards = currencyRewards[difficulty] || currencyRewards['easy'];
    
    // Tester chaque monnaie selon sa probabilité
    for (const [currency, config] of Object.entries(rewards)) {
      if (Math.random() < config.chance) {
        const amount = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
        if (amount > 0) {
          goldReward[currency] = amount;
        }
      }
    }
    
    return goldReward;
  }

  // Compléter un donjon
  async completeDungeon(dungeonId, characterId, client) {
    const dungeon = this.getDungeonById(dungeonId);
    if (!dungeon) {
      throw new Error('Donjon non trouvé');
    }

    // Récupérer le personnage
    const characterResult = await client.query(
      'SELECT * FROM characters WHERE id = $1',
      [characterId]
    );

    if (characterResult.rows.length === 0) {
      throw new Error('Personnage non trouvé');
    }

    const character = characterResult.rows[0];

    // Calculer les récompenses
    const xpGained = this.calculateXPReward(dungeon, character.level);
    const goldGained = this.calculateGoldReward(dungeon);

    // Mettre à jour le personnage - SEULEMENT l'EXP et le niveau
    let newXP = character.experience + xpGained;
    let newLevel = character.level;
    let newXPToNext = character.experience_to_next;
    let levelUp = false;

    // Gestion des montées de niveau
    while (newXP >= newXPToNext) {
      newXP -= newXPToNext;
      newLevel++;
      newXPToNext = Math.floor(newXPToNext * (1.3 + (newLevel * 0.05))); // 30% + 5% par niveau
      levelUp = true;
    }

    // Si level up, calculer et appliquer les nouvelles stats
    if (levelUp) {
      // Utiliser la même logique de level up que dans le serveur
      const levelsGained = newLevel - character.level;
      let newHealth = character.health;
      let newMaxHealth = character.max_health;
      let newMana = character.mana;
      let newMaxMana = character.max_mana;
      let newAttack = character.attack;
      let newDefense = character.defense;
      let newMagicAttack = character.magic_attack;
      let newMagicDefense = character.magic_defense;

      // Augmenter les stats de base pour chaque niveau gagné
      for (let i = 0; i < levelsGained; i++) {
        const currentLevel = character.level + i + 1;
        const healthIncrease = Math.floor(10 + (currentLevel * 2));
        const manaIncrease = Math.floor(5 + currentLevel);
        const attackIncrease = Math.floor(3 + currentLevel);
        const defenseIncrease = Math.floor(2 + Math.floor(currentLevel / 2));
        const magicAttackIncrease = Math.floor(2 + Math.floor(currentLevel / 2));
        const magicDefenseIncrease = Math.floor(1 + Math.floor(currentLevel / 3));

        newMaxHealth += healthIncrease;
        newMaxMana += manaIncrease;
        newAttack += attackIncrease;
        newDefense += defenseIncrease;
        newMagicAttack += magicAttackIncrease;
        newMagicDefense += magicDefenseIncrease;
      }

      // Restaurer la vie et le mana à 100% lors de la montée de niveau
      newHealth = newMaxHealth;
      newMana = newMaxMana;

      // Validation : s'assurer que health ne dépasse jamais max_health
      newHealth = Math.min(newHealth, newMaxHealth);
      newMana = Math.min(newMana, newMaxMana);

      // Mettre à jour le personnage avec les nouvelles stats
      await client.query(`
        UPDATE characters 
        SET 
          level = $1, 
          experience = $2, 
          experience_to_next = $3,
          health = $4,
          max_health = $5,
          mana = $6,
          max_mana = $7,
          attack = $8,
          defense = $9,
          magic_attack = $10,
          magic_defense = $11,
          updated_at = NOW()
        WHERE id = $12
      `, [
        newLevel, newXP, newXPToNext,
        newHealth, newMaxHealth, newMana, newMaxMana,
        newAttack, newDefense, newMagicAttack, newMagicDefense,
        characterId
      ]);
    } else {
      // Mettre à jour SEULEMENT l'EXP et le niveau en base (pas les stats)
      await client.query(`
        UPDATE characters 
        SET level = $1, experience = $2, experience_to_next = $3, updated_at = NOW()
        WHERE id = $4
      `, [newLevel, newXP, newXPToNext, characterId]);
    }

    // Ajouter l'or à l'inventaire
    await this.addGoldToInventory(characterId, goldGained, client);

    return {
      success: true,
      xp_gained: xpGained,
      gold_gained: goldGained,
      level_up: levelUp,
      new_level: newLevel,
      new_xp: newXP,
      new_xp_to_next: newXPToNext
    };
  }

  // Ajouter l'or à l'inventaire
  async addGoldToInventory(characterId, goldReward, client) {
    for (const [currencyName, amount] of Object.entries(goldReward)) {
      if (amount > 0) {
        // Récupérer l'ID de la monnaie
        const currencyQuery = 'SELECT id FROM items WHERE name = $1';
        const currencyResult = await client.query(currencyQuery, [currencyName]);
        
        if (currencyResult.rows.length > 0) {
          const currencyId = currencyResult.rows[0].id;
          
          // Vérifier si le personnage a déjà cette monnaie
          const existingQuery = 'SELECT id, quantity FROM character_inventory WHERE character_id = $1 AND item_id = $2';
          const existingResult = await client.query(existingQuery, [characterId, currencyId]);
          
          if (existingResult.rows.length > 0) {
            // Mettre à jour la quantité existante
            const newQuantity = existingResult.rows[0].quantity + amount;
            const updateQuery = 'UPDATE character_inventory SET quantity = $1 WHERE character_id = $2 AND item_id = $3';
            await client.query(updateQuery, [newQuantity, characterId, currencyId]);
          } else {
            // Créer une nouvelle entrée
            const insertQuery = `
              INSERT INTO character_inventory (character_id, item_id, quantity, equipped, created_at, updated_at) 
              VALUES ($1, $2, $3, false, NOW(), NOW())
            `;
            await client.query(insertQuery, [characterId, currencyId, amount]);
          }
        }
      }
    }
  }
}

module.exports = new DungeonManager();
