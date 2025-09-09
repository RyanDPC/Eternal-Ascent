/**
 * Système de donjon complet - Tous les ennemis doivent être vaincus
 */

export class DungeonSystem {
  constructor() {
    this.enemyMapping = {
      'goblin_warrior': 'Gobelin Guerrier',
      'goblin_shaman': 'Gobelin Chaman', 
      'goblin_archer': 'Gobelin Archer',
      'giant_spider': 'Araignée Géante',
      'poison_spider': 'Araignée Venimeuse',
      'spider_queen': 'Reine Araignée',
      'giant_rat': 'Rat Géant',
      'plague_rat': 'Rat de Peste',
      'rat_king': 'Roi des Rats',
      'bandit': 'Bandit',
      'bandit_archer': 'Bandit Archer',
      'bandit_leader': 'Chef Bandit',
      'wild_wolf': 'Loup Sauvage',
      'alpha_wolf': 'Loup Alpha',
      'dire_wolf': 'Loup Terrible',
      'brown_bear': 'Ours Brun',
      'grizzly_bear': 'Grizzly',
      'cave_bear': 'Ours des Cavernes',
      'skeleton': 'Squelette',
      'skeleton_warrior': 'Squelette Guerrier',
      'skeleton_mage': 'Squelette Mage',
      'orc_warrior': 'Orc Guerrier',
      'orc_shaman': 'Orc Chaman',
      'orc_chief': 'Chef Orc',
      'bridge_troll': 'Troll de Pont',
      'cave_troll': 'Troll de Caverne',
      'mountain_troll': 'Troll de Montagne',
      'troll_chief': 'Chef Troll',
      'kobold': 'Kobold',
      'kobold_trapper': 'Kobold Piégeur',
      'kobold_chief': 'Chef Kobold',
      'green_slime': 'Slime Vert',
      'blue_slime': 'Slime Bleu',
      'slime_king': 'Roi Slime',
      'giant_bat': 'Chauve-souris Géante',
      'vampire_bat': 'Chauve-souris Vampire',
      'bat_swarm': 'Nuée de Chauves-souris',
      'poison_snake': 'Serpent Venimeux',
      'giant_snake': 'Serpent Géant',
      'snake_king': 'Roi Serpent',
      'wild_boar': 'Sanglier Sauvage',
      'giant_boar': 'Sanglier Géant',
      'boar_king': 'Roi Sanglier',
      'giant_bee': 'Abeille Géante',
      'killer_bee': 'Abeille Tueuse',
      'queen_bee': 'Reine Abeille'
    };
  }

  // Charger tous les ennemis d'un donjon
  async loadDungeonEnemies(dungeon, databaseService) {
    try {
      const dungeonEnemyTypes = dungeon?.enemies || ['goblin_warrior'];
      const enemies = await databaseService.getEnemies();
      const loadedEnemies = [];
      
      // Charger chaque ennemi du donjon
      for (const enemyType of dungeonEnemyTypes) {
        const enemyName = this.enemyMapping[enemyType] || enemyType;
        
        const enemyData = enemies.find(enemy => 
          enemy.name === enemyName || 
          enemy.display_name === enemyName ||
          enemy.name.toLowerCase().includes(enemyName.toLowerCase()) ||
          enemy.display_name.toLowerCase().includes(enemyName.toLowerCase())
        );
        
        if (enemyData) {
          loadedEnemies.push(this.createEnemyFromData(enemyData));
        } else {
          // Fallback si l'ennemi n'est pas trouvé
          console.warn(`Ennemi ${enemyType} non trouvé, création d'un ennemi par défaut`);
          loadedEnemies.push(this.createDefaultEnemy(enemyType, dungeon));
        }
      }
      
      return {
        enemies: loadedEnemies,
        totalEnemies: loadedEnemies.length,
        currentEnemyIndex: 0,
        defeatedEnemies: 0,
        isCompleted: false
      };
      
    } catch (error) {
      console.error('Erreur lors du chargement des ennemis du donjon:', error);
      throw error;
    }
  }

  // Créer un ennemi à partir des données de la base
  createEnemyFromData(enemyData) {
    return {
      id: enemyData.id,
      name: enemyData.name,
      display_name: enemyData.display_name,
      level: enemyData.level,
      maxHealth: enemyData.health,
      currentHealth: enemyData.health,
      attack: enemyData.attack,
      defense: enemyData.defense,
      magic_attack: enemyData.magic_attack,
      magic_defense: enemyData.magic_defense,
      speed: enemyData.speed,
      critical_rate: 10,
      critical_damage: 150,
      dodge_chance: 5,
      experience_reward: enemyData.experience_reward,
      gold_reward: enemyData.gold_reward,
      abilities: enemyData.abilities || [],
      weaknesses: enemyData.weaknesses || [],
      resistances: enemyData.resistances || [],
      loot_table: enemyData.loot_table || [],
      rarity_name: enemyData.rarity_name,
      rarity_color: enemyData.rarity_color,
      icon: enemyData.icon,
      status_effects: []
    };
  }

  // Créer un ennemi par défaut
  createDefaultEnemy(enemyType, dungeon) {
    const level = dungeon?.level_requirement || 1;
    return {
      id: `default_${enemyType}`,
      name: enemyType,
      display_name: enemyType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      level: level,
      maxHealth: 100 + level * 20,
      currentHealth: 100 + level * 20,
      attack: 25 + level * 5,
      defense: 15 + level * 3,
      magic_attack: 10 + level * 2,
      magic_defense: 8 + level * 2,
      speed: 100,
      critical_rate: 10,
      critical_damage: 150,
      dodge_chance: 5,
      experience_reward: 10 + level * 5,
      gold_reward: 5 + level * 2,
      abilities: [],
      weaknesses: [],
      resistances: [],
      loot_table: [],
      rarity_name: 'common',
      rarity_color: '#ffffff',
      icon: '👹',
      status_effects: []
    };
  }

  // Passer à l'ennemi suivant
  nextEnemy(dungeonState) {
    const nextIndex = dungeonState.currentEnemyIndex + 1;
    
    if (nextIndex >= dungeonState.enemies.length) {
      // Donjon terminé
      return {
        ...dungeonState,
        isCompleted: true
      };
    }
    
    return {
      ...dungeonState,
      currentEnemyIndex: nextIndex,
      defeatedEnemies: dungeonState.defeatedEnemies + 1,
      currentEnemy: dungeonState.enemies[nextIndex]
    };
  }

  // Marquer un ennemi comme vaincu
  defeatEnemy(dungeonState) {
    const newDefeatedCount = dungeonState.defeatedEnemies + 1;
    const isCompleted = newDefeatedCount >= dungeonState.totalEnemies;
    
    return {
      ...dungeonState,
      defeatedEnemies: newDefeatedCount,
      isCompleted: isCompleted
    };
  }

  // Obtenir le progrès du donjon
  getProgress(dungeonState) {
    return {
      current: dungeonState.defeatedEnemies,
      total: dungeonState.totalEnemies,
      percentage: Math.round((dungeonState.defeatedEnemies / dungeonState.totalEnemies) * 100),
      isCompleted: dungeonState.isCompleted
    };
  }
}

export default DungeonSystem;

