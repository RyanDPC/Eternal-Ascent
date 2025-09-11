import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, Shield, Zap, Heart, Droplets, Target, RotateCcw, Play, Pause,
  Star, Flame, Snowflake, Eye, Skull, Sparkles, Shield as ShieldIcon,
  Bot, User, X, ArrowLeft, Settings
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import databaseService from '../../services/databaseService';
import './GamePage.css';

const GamePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dungeon, character } = location.state || {};
  
  // Debug: vérifier les données reçues
  console.log('GamePage - Dungeon data:', dungeon);
  console.log('GamePage - Character data:', character);

  const [combatState, setCombatState] = useState({
    isActive: false,
    isPaused: false,
    turn: 'player',
    round: 1,
    selectedSkill: null,
    autoPlay: false
  });

  // Debug: voir les stats du personnage reçues (désactivé)
  // console.log('🔍 Stats du personnage reçues:', character);
  
  const [player, setPlayer] = useState({
    ...character,
    currentHealth: Number(character?.health) || Number(character?.max_health) || 100,
    currentMana: Number(character?.mana) || Number(character?.max_mana) || 50,
    max_health: Number(character?.max_health) || 100,
    max_mana: Number(character?.max_mana) || 50,
    attack: Number(character?.attack) || 30,
    defense: Number(character?.defense) || 20,
    magic_attack: Number(character?.magic_attack) || 25,
    magic_defense: Number(character?.magic_defense) || 15,
    critical_rate: Number(character?.critical_rate) || 15,
    critical_damage: Number(character?.critical_damage) || 150,
    dodge_chance: Number(character?.dodge_chance) || 8,
    status_effects: [],
    cooldowns: {}
  });

  // Charger les stats calculées avec équipement
  useEffect(() => {
    const loadCharacterStats = async () => {
      if (character?.id) {
        try {
          const statsData = await databaseService.getCharacterStats(character.id);
          const finalStats = statsData.final_stats;
          
          setPlayer(prev => ({
            ...prev,
            max_health: finalStats.max_health,
            max_mana: finalStats.max_mana,
            attack: finalStats.attack,
            defense: finalStats.defense,
            magic_attack: finalStats.magic_attack,
            magic_defense: finalStats.magic_defense,
            critical_rate: finalStats.critical_rate,
            critical_damage: finalStats.critical_damage,
            dodge_chance: finalStats.dodge_chance,
            // Garder les PV et mana actuels
            currentHealth: prev.currentHealth || finalStats.max_health,
            currentMana: prev.currentMana || finalStats.max_mana
          }));
        } catch (error) {
          console.error('Erreur lors du chargement des stats calculées:', error);
        }
      }
    };

    loadCharacterStats();
  }, [character?.id]);

  // Système de donjon complet
  const [dungeonEnemies, setDungeonEnemies] = useState([]); // Tous les ennemis du donjon
  const [currentEnemyIndex, setCurrentEnemyIndex] = useState(0); // Index de l'ennemi actuel
  const [dungeonProgress, setDungeonProgress] = useState({
    totalEnemies: 0,
    defeatedEnemies: 0,
    isCompleted: false
  });

  const [monster, setMonster] = useState({
    name: dungeon?.monsters?.[0] || 'Gobelin',
    level: dungeon?.level || 12,
    maxHealth: 75,
    currentHealth: 75,
    attack: 20,
    defense: 10,
    magic_attack: 15,
    magic_defense: 8,
    critical_rate: 5,
    critical_damage: 150,
    dodge_chance: 3,
    status_effects: []
  });

  const [battleLog, setBattleLog] = useState([
    { id: 1, type: 'info', message: 'Prêt pour le combat !', timestamp: Date.now() }
  ]);

  const [animations, setAnimations] = useState({
    characterAttack: false,
    monsterAttack: false,
    characterHit: false,
    monsterHit: false,
    skillCast: false
  });

  const [availableSkills, setAvailableSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  // Initialiser le système de combat
  useEffect(() => {
    if (character) {
      setPlayer({
        ...character,
        status_effects: [],
        cooldowns: {}
      });
      
      // Charger les compétences disponibles pour la classe du personnage
      loadSkills();
      
      // Charger tous les ennemis du donjon
      loadDungeonEnemies();
    }
  }, [character]);

  // Charger tous les ennemis du donjon
  const loadDungeonEnemies = async () => {
    try {
      // Récupérer la liste des ennemis du donjon
      const dungeonEnemyTypes = dungeon?.enemies || ['goblin_warrior'];
      
      // Récupérer tous les ennemis depuis la base de données
      const enemies = await databaseService.getEnemies();
      
      // Mapping entre les IDs des donjons et les noms en base de données
      const enemyMapping = {
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
      
      const loadedEnemies = [];
      
      // Charger chaque ennemi du donjon
      for (const enemyType of dungeonEnemyTypes) {
        const enemyName = enemyMapping[enemyType] || enemyType;
        
        const enemyData = enemies.find(enemy => 
          enemy.name === enemyName || 
          enemy.display_name === enemyName ||
          enemy.name.toLowerCase().includes(enemyName.toLowerCase()) ||
          enemy.display_name.toLowerCase().includes(enemyName.toLowerCase())
        );
        
        if (enemyData) {
          loadedEnemies.push({
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
          });
        } else {
          // Fallback si l'ennemi n'est pas trouvé
          console.warn(`Ennemi ${enemyType} non trouvé, création d'un ennemi par défaut`);
          
          loadedEnemies.push({
            id: `default_${enemyType}`,
            name: enemyType,
            display_name: enemyType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            level: dungeon?.level_requirement || 1,
            maxHealth: 100 + (dungeon?.level_requirement || 1) * 20,
            currentHealth: 100 + (dungeon?.level_requirement || 1) * 20,
            attack: 25 + (dungeon?.level_requirement || 1) * 5,
            defense: 15 + (dungeon?.level_requirement || 1) * 3,
            magic_attack: 10 + (dungeon?.level_requirement || 1) * 2,
            magic_defense: 8 + (dungeon?.level_requirement || 1) * 2,
            speed: 100,
            critical_rate: 10,
            critical_damage: 150,
            dodge_chance: 5,
            experience_reward: 10 + (dungeon?.level_requirement || 1) * 5,
            gold_reward: 5 + (dungeon?.level_requirement || 1) * 2,
            abilities: [],
            weaknesses: [],
            resistances: [],
            loot_table: [],
            rarity_name: 'common',
            rarity_color: '#ffffff',
            icon: '👹',
            status_effects: []
          });
        }
      }
      
      setDungeonEnemies(loadedEnemies);
      setDungeonProgress({
        totalEnemies: loadedEnemies.length,
        defeatedEnemies: 0,
        isCompleted: false
      });
      setCurrentEnemyIndex(0);
      
      // Charger le premier ennemi
      if (loadedEnemies.length > 0) {
        setMonster(loadedEnemies[0]);
        addLogEntry('info', `🏰 Donjon chargé : ${loadedEnemies.length} ennemi(s) à vaincre`);
        addLogEntry('info', `⚔️ Premier ennemi : ${loadedEnemies[0].display_name} (Niveau ${loadedEnemies[0].level})`);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des ennemis du donjon:', error);
      addLogEntry('error', 'Erreur lors du chargement du donjon');
    }
  };

  // Charger un ennemi spécifique du donjon depuis la base de données (ancienne fonction)
  const loadDungeonEnemy = async () => {
    try {
      // Récupérer la liste des ennemis du donjon
      const dungeonEnemies = dungeon?.enemies || ['goblin_warrior'];
      
      // Choisir un ennemi aléatoire parmi ceux du donjon
      const randomEnemyType = dungeonEnemies[Math.floor(Math.random() * dungeonEnemies.length)];
      
      // Récupérer les données de cet ennemi depuis la base de données
      const enemies = await databaseService.getEnemies();
      
      // Mapping entre les IDs des donjons et les noms en base de données
      const enemyMapping = {
        'goblin_warrior': 'Gobelin Guerrier',
        'goblin_shaman': 'Gobelin Chaman', 
        'goblin_archer': 'Gobelin Archer',
        'giant_bat': 'Chauve-souris Géante',
        'giant_rat': 'Rat Géant',
        'wild_boar': 'Sanglier Sauvage',
        'skeleton_warrior': 'Guerrier Squelette',
        'cave_spider': 'Araignée de Caverne',
        'bandit': 'Brigand',
        'wolf': 'Loup Sauvage',
        'slime': 'Gelée Verte',
        'kobold': 'Kobold',
        'cave_bear': 'Ours des Cavernes',
        'skeleton_archer': 'Archer Squelette',
        'giant_ant': 'Fourmi Géante',
        'wild_dog': 'Chien Sauvage',
        'mud_slime': 'Gelée de Boue',
        'forest_sprite': 'Esprit de la Forêt',
        'cave_crawler': 'Rampant des Cavernes',
        'stone_golem': 'Golem de Pierre',
        'shadow_imp': 'Diablotin d\'Ombre'
      };
      
      // Chercher l'ennemi en utilisant le mapping ou directement par nom
      const enemyName = enemyMapping[randomEnemyType] || randomEnemyType;
      
      const enemyData = enemies.find(enemy => 
        enemy.name === enemyName || 
        enemy.display_name === enemyName ||
        enemy.name.toLowerCase().includes(enemyName.toLowerCase()) ||
        enemy.display_name.toLowerCase().includes(enemyName.toLowerCase())
      );
      
      if (enemyData) {
        setMonster({
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
        });
        
        addLogEntry('info', `🎯 Ennemi du donjon chargé : ${enemyData.display_name} (Niveau ${enemyData.level})`);
      } else {
        // Fallback si l'ennemi n'est pas trouvé dans la DB
        console.warn(`Ennemi ${randomEnemyType} non trouvé, utilisation d'un ennemi par défaut`);
        
        // Créer un ennemi par défaut basé sur le niveau du donjon
        const defaultEnemy = {
          id: 'default_enemy',
          name: 'Monstre Inconnu',
          display_name: 'Monstre Inconnu',
          level: dungeon?.level || 12,
          health: 200 + (dungeon?.level || 12) * 20,
          attack: 30 + (dungeon?.level || 12) * 5,
          defense: 20 + (dungeon?.level || 12) * 3,
          magic_attack: 0,
          magic_defense: 0,
          speed: 100,
          experience_reward: 50 + (dungeon?.level || 12) * 10,
          gold_reward: 25 + (dungeon?.level || 12) * 5,
          abilities: [],
          weaknesses: [],
          resistances: [],
          loot_table: [],
          rarity_name: 'Commun',
          rarity_color: '#ffffff',
          icon: '👹',
          status_effects: []
        };
        
        setMonster({
          id: defaultEnemy.id,
          name: defaultEnemy.name,
          display_name: defaultEnemy.display_name,
          level: defaultEnemy.level,
          maxHealth: defaultEnemy.health,
          currentHealth: defaultEnemy.health,
          attack: defaultEnemy.attack,
          defense: defaultEnemy.defense,
          magic_attack: defaultEnemy.magic_attack,
          magic_defense: defaultEnemy.magic_defense,
          speed: defaultEnemy.speed,
          critical_rate: 10,
          critical_damage: 150,
          dodge_chance: 5,
          experience_reward: defaultEnemy.experience_reward,
          gold_reward: defaultEnemy.gold_reward,
          abilities: defaultEnemy.abilities,
          weaknesses: defaultEnemy.weaknesses,
          resistances: defaultEnemy.resistances,
          loot_table: defaultEnemy.loot_table,
          rarity_name: defaultEnemy.rarity_name,
          rarity_color: defaultEnemy.rarity_color,
          icon: defaultEnemy.icon,
          status_effects: defaultEnemy.status_effects
        });
        
        addLogEntry('info', `🎯 Ennemi par défaut chargé : ${defaultEnemy.display_name} (Niveau ${defaultEnemy.level})`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'ennemi du donjon:', error);
      // Fallback vers un ennemi par défaut
      setMonster(prev => ({
        ...prev,
        name: 'Gobelin',
        level: 12,
        maxHealth: 75,
        currentHealth: 75,
        attack: 45,
        defense: 25
      }));
      addLogEntry('error', '⚠️ Erreur de chargement de l\'ennemi, utilisation d\'un ennemi par défaut');
    }
  };

  // Charger les compétences depuis l'API
  const loadSkills = async () => {
    try {
      setLoadingSkills(true);
      const skills = await databaseService.getSkillsByClass(character.class);
      setAvailableSkills(skills);
    } catch (error) {
      console.error('Erreur lors du chargement des compétences:', error);
      // Fallback vers des compétences par défaut
      setAvailableSkills([
        {
          id: 1,
          name: 'basic_attack',
          display_name: 'Attaque de Base',
          description: 'Une attaque basique',
          type: 'offensive',
          mana_cost: 0,
          cooldown: 0,
          damage: { min: 15, max: 25 },
          icon: '⚔️',
          level_requirement: 1
        }
      ]);
    } finally {
      setLoadingSkills(false);
    }
  };

  const addLogEntry = (type, message) => {
    const newEntry = {
      id: Date.now() + Math.random(), // Ajouter un nombre aléatoire pour garantir l'unicité
      type,
      message,
      timestamp: Date.now()
    };
    setBattleLog(prev => [...prev, newEntry]);
  };

  // Sauvegarder les stats du joueur en base de données
  const savePlayerStats = async (updatedPlayer) => {
    try {
      if (updatedPlayer.id) {
        // Vérifier si le serveur est disponible
        const response = await fetch('/api/health', { 
          method: 'GET',
          timeout: 1000 
        }).catch(() => null);
        
        if (!response || !response.ok) {
          console.log('⚠️ Serveur non disponible, sauvegarde ignorée');
          return;
        }
        
        // Debug: voir les valeurs avant conversion (désactivé)
        // console.log('🔍 Valeurs du joueur avant sauvegarde:', {...});
        
        // S'assurer que les valeurs ne sont pas null, undefined ou NaN
        const health = Number(updatedPlayer.currentHealth) || Number(updatedPlayer.max_health) || 100;
        const mana = Number(updatedPlayer.currentMana) || Number(updatedPlayer.max_mana) || 50;
        const maxHealth = Number(updatedPlayer.max_health) || 100;
        const maxMana = Number(updatedPlayer.max_mana) || 50;
        const level = Number(updatedPlayer.level) || 1;
        const experience = Number(updatedPlayer.experience) || 0;
        
        // Validation finale - s'assurer qu'aucune valeur n'est null/undefined
        if (isNaN(health) || isNaN(mana) || isNaN(maxHealth) || isNaN(maxMana)) {
          console.error('❌ Valeurs invalides pour la sauvegarde:', { health, mana, maxHealth, maxMana });
          return;
        }
        
        await databaseService.saveCharacterData({
          id: updatedPlayer.id,
          health: health,
          mana: mana,
          max_health: maxHealth,
          max_mana: maxMana,
          level: level,
          experience: experience
        });
        console.log('✅ Stats du joueur sauvegardées');
      }
    } catch (error) {
      console.log('⚠️ Serveur non disponible, sauvegarde ignorée:', error.message);
    }
  };

  const startCombat = () => {
    if (combatState.isActive) return;
    
    setCombatState(prev => ({ ...prev, isActive: true, turn: 'player' }));
    addLogEntry('info', '⚔️ Le combat commence !');
  };

  const pauseCombat = () => {
    setCombatState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const toggleAutoPlay = () => {
    setCombatState(prev => ({ ...prev, autoPlay: !prev.autoPlay }));
    addLogEntry('info', `🤖 Auto-play ${!combatState.autoPlay ? 'activé' : 'désactivé'} !`);
  };

  const resetCombat = () => {
    setPlayer(prev => ({ 
      ...prev, 
      currentHealth: Number(prev.max_health) || 100, 
      currentMana: Number(prev.max_mana) || 50,
      status_effects: [],
      cooldowns: {}
    }));
    
    // Recharger un nouvel ennemi du donjon
    loadDungeonEnemy();
    
    setCombatState({ 
      isActive: false, 
      isPaused: false, 
      turn: 'player', 
      round: 1,
      selectedSkill: null,
      autoPlay: false
    });
    setBattleLog([{ id: Date.now(), type: 'info', message: 'Prêt pour le combat !', timestamp: Date.now() }]);
    setAnimations({ 
      characterAttack: false, 
      monsterAttack: false, 
      characterHit: false, 
      monsterHit: false,
      skillCast: false
    });
  };

  // Attaque de base
  const basicAttack = () => {
    if (combatState.isPaused || combatState.turn !== 'player') return;
    
    setAnimations(prev => ({ ...prev, characterAttack: true }));
    
    setTimeout(() => {
      const baseDamage = player.attack - monster.defense;
      const critical = Math.random() < (player.critical_rate / 100);
      const dodge = Math.random() < (monster.dodge_chance / 100);
      
      let damage = Math.max(1, baseDamage + Math.floor(Math.random() * 20));
      if (critical) damage = Math.floor(damage * (player.critical_damage / 100));
      
      if (dodge) {
        addLogEntry('info', '🛡️ Le monstre a esquivé l\'attaque !');
      } else {
        const newMonsterHealth = Math.max(0, monster.currentHealth - damage);
        setMonster(prev => ({ ...prev, currentHealth: newMonsterHealth }));
        
        const message = critical 
          ? `💥 Attaque critique ! ${damage} dégâts infligés !`
          : `⚔️ ${damage} dégâts infligés au monstre !`;
        
        addLogEntry('damage', message);
        
        if (newMonsterHealth <= 0) {
          monsterDeath();
          return;
        }
      }
      
      setAnimations(prev => ({ ...prev, characterAttack: false }));
      
      // Tour du monstre
      setTimeout(() => {
        if (combatState.isActive && !combatState.isPaused) {
          monsterTurn();
        }
      }, 1000);
    }, 500);
  };

  // Utiliser une compétence
  const useSkill = (skill) => {
    if (combatState.isPaused || combatState.turn !== 'player') return;
    
    // Vérifier le mana
    if (player.currentMana < skill.mana_cost) {
      addLogEntry('error', '❌ Mana insuffisant !');
      return;
    }
    
    // Vérifier le cooldown
    if (player.cooldowns[skill.id] > 0) {
      addLogEntry('error', '❌ Compétence en cooldown !');
      return;
    }
    
    setAnimations(prev => ({ ...prev, skillCast: true }));
    
    // Consommer le mana
    setPlayer(prev => ({
      ...prev,
      currentMana: prev.currentMana - skill.mana_cost
    }));
    
    // Ajouter le cooldown
    setPlayer(prev => ({
      ...prev,
      cooldowns: {
        ...prev.cooldowns,
        [skill.id]: skill.cooldown
      }
    }));
    
    setTimeout(() => {
      let damage = 0;
      let healing = 0;
      
      // Calculer les dégâts
      if (skill.damage) {
        damage = skill.damage.min + Math.floor(Math.random() * (skill.damage.max - skill.damage.min + 1));
        damage += Math.floor(player.attack * 0.3);
        damage = Math.max(1, damage - Math.floor(monster.defense * 0.2));
        
        const newMonsterHealth = Math.max(0, monster.currentHealth - damage);
        setMonster(prev => ({ ...prev, currentHealth: newMonsterHealth }));
        
        addLogEntry('damage', `✨ ${skill.display_name} ! ${damage} dégâts infligés !`);
        
        if (newMonsterHealth <= 0) {
          monsterDeath();
          return;
        }
      }
      
      // Calculer les soins
      if (skill.healing) {
        healing = skill.healing.min + Math.floor(Math.random() * (skill.healing.max - skill.healing.min + 1));
        healing += Math.floor(player.magic_attack * 0.2);
        
        const maxHealth = Number(player.max_health) || 100;
        const currentHealth = Number(player.currentHealth) || maxHealth;
        const newPlayerHealth = Math.min(maxHealth, currentHealth + healing);
        setPlayer(prev => {
          const updatedPlayer = { ...prev, currentHealth: newPlayerHealth };
          // Sauvegarder les stats après les soins
          savePlayerStats(updatedPlayer);
          return updatedPlayer;
        });
        
        addLogEntry('healing', `✨ ${skill.display_name} ! ${healing} PV restaurés !`);
      }
      
      setAnimations(prev => ({ ...prev, skillCast: false }));
      
      // Tour du monstre
      setTimeout(() => {
        if (combatState.isActive && !combatState.isPaused) {
          monsterTurn();
        }
      }, 1000);
    }, 500);
  };

  // Tour du monstre
  const monsterTurn = () => {
    if (combatState.isPaused) return;
    
    setAnimations(prev => ({ ...prev, monsterAttack: true }));
    
    setTimeout(() => {
      // Attaque du monstre
      const baseDamage = monster.attack - player.defense;
      const critical = Math.random() < (monster.critical_rate / 100);
      const dodge = Math.random() < (player.dodge_chance / 100);
      
      let damage = Math.max(1, baseDamage + Math.floor(Math.random() * 15));
      if (critical) damage = Math.floor(damage * (monster.critical_damage / 100));
      
      if (dodge) {
        addLogEntry('info', '💨 Vous avez esquivé l\'attaque !');
      } else {
        const currentHealth = Number(player.currentHealth) || Number(player.max_health) || 100;
        const newPlayerHealth = Math.max(0, currentHealth - damage);
        setPlayer(prev => {
          const updatedPlayer = { ...prev, currentHealth: newPlayerHealth };
          // Sauvegarder les stats après avoir reçu des dégâts
          savePlayerStats(updatedPlayer);
          return updatedPlayer;
        });
        
        const message = critical 
          ? `💥 Attaque critique du monstre ! ${damage} dégâts reçus !`
          : `⚔️ ${damage} dégâts reçus du monstre !`;
        
        addLogEntry('damage', message);
        
        if (newPlayerHealth <= 0) {
          playerDeath();
          return;
        }
      }
      
      setAnimations(prev => ({ ...prev, monsterAttack: false }));
      
      // Réduire les cooldowns
      setPlayer(prev => {
        const newCooldowns = {};
        Object.entries(prev.cooldowns).forEach(([skillId, cooldown]) => {
          if (cooldown > 0) {
            newCooldowns[skillId] = cooldown - 1;
          }
        });
        return { ...prev, cooldowns: newCooldowns };
      });
      
      // Tour du joueur
      setCombatState(prev => ({ ...prev, turn: 'player' }));
      
      // Auto-play si activé
      if (combatState.autoPlay && !combatState.isPaused) {
        setTimeout(() => {
          autoPlayAction();
        }, 1000);
      }
    }, 500);
  };

  // Action automatique pour l'auto-play
  const autoPlayAction = () => {
    if (combatState.turn !== 'player' || combatState.isPaused) return;
    
    // Logique d'IA simple pour choisir l'action
    const usableSkills = availableSkills.filter(skill => canUseSkill(skill));
    
    // Priorité: Soin si PV < 30%, puis compétences offensives, puis attaque de base
    if (player.currentHealth < player.max_health * 0.3) {
      const healSkill = usableSkills.find(skill => skill.type === 'healing');
      if (healSkill) {
        useSkill(healSkill);
        return;
      }
    }
    
    // Utiliser une compétence offensive si disponible
    const offensiveSkill = usableSkills.find(skill => skill.type === 'offensive');
    if (offensiveSkill) {
      useSkill(offensiveSkill);
      return;
    }
    
    // Sinon, attaque de base
    basicAttack();
  };

  const monsterDeath = async () => {
    addLogEntry('victory', '🎉 Ennemi vaincu !');
    
    // Mettre à jour le progrès du donjon
    const newDefeatedCount = dungeonProgress.defeatedEnemies + 1;
    const isDungeonCompleted = newDefeatedCount >= dungeonProgress.totalEnemies;
    
    setDungeonProgress(prev => ({
      ...prev,
      defeatedEnemies: newDefeatedCount,
      isCompleted: isDungeonCompleted
    }));
    
    // Si le donjon est terminé, gérer les récompenses
    if (isDungeonCompleted) {
      await handleDungeonComplete();
    } else {
      // Si ce n'est pas le dernier monstre, juste passer au suivant
      setTimeout(() => {
        spawnNextMonster();
      }, 2000);
    }
  };

  const handleDungeonComplete = async () => {
    addLogEntry('victory', '🏆 Donjon terminé !');
    
    if (!dungeon || !dungeon.name) {
      console.error('Donjon manquant:', dungeon);
      addLogEntry('error', '❌ Erreur : Donjon non trouvé');
      return;
    }
    
    console.log('Completing dungeon:', dungeon.name);
    
    try {
      // Compléter le donjon via l'API du serveur
      const response = await fetch(`/api/dungeons/${dungeon.name}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Afficher les récompenses
        addLogEntry('reward', `✨ +${result.xp_gained} EXP, +${result.gold_gained} Or`);
        
        if (result.level_up) {
          addLogEntry('victory', `🎉 Niveau ${result.new_level} atteint !`);
        }
        
        // Mettre à jour les stats du joueur avec les nouvelles valeurs
        setPlayer(prev => {
          const updatedPlayer = {
            ...prev,
            level: result.new_level || prev.level,
            experience: result.new_xp || prev.experience,
            experience_to_next: result.new_xp_to_next || prev.experience_to_next
          };
          
          // Seulement mettre à jour les stats de base si montée de niveau
          if (result.level_up) {
            updatedPlayer.currentHealth = result.new_health || prev.currentHealth;
            updatedPlayer.max_health = result.new_max_health || prev.max_health;
            updatedPlayer.currentMana = result.new_mana || prev.currentMana;
            updatedPlayer.max_mana = result.new_max_mana || prev.max_mana;
            updatedPlayer.attack = result.new_attack || prev.attack;
            updatedPlayer.defense = result.new_defense || prev.defense;
            updatedPlayer.magic_attack = result.new_magic_attack || prev.magic_attack;
            updatedPlayer.magic_defense = result.new_magic_defense || prev.magic_defense;
          }
          
          return updatedPlayer;
        });
        
        // Terminer le combat et retourner aux donjons
        setCombatState(prev => ({ ...prev, isActive: false }));
        
        // Retourner aux donjons après 3 secondes
        setTimeout(() => {
          navigate('/dungeons', { 
            state: { 
              character: player,
              showRewards: true,
              rewards: {
                xp_gained: result.xp_gained,
                gold_gained: result.gold_gained,
                level_up: result.level_up || false,
                new_level: result.new_level || player.level
              }
            }
          });
        }, 3000);
      } else {
        console.error('Erreur lors de la completion du donjon');
        addLogEntry('error', '❌ Erreur lors de la completion du donjon');
      }
    } catch (error) {
      console.error('Erreur lors de la completion du donjon:', error);
      addLogEntry('error', '❌ Erreur lors de la completion du donjon');
    }
  };

  const spawnNextMonster = () => {
    const nextEnemyIndex = currentEnemyIndex + 1;
    setCurrentEnemyIndex(nextEnemyIndex);
    
    if (nextEnemyIndex < dungeonEnemies.length) {
      const nextEnemy = dungeonEnemies[nextEnemyIndex];
      setMonster(nextEnemy);
      addLogEntry('next_enemy', `🎯 Ennemi suivant : ${nextEnemy.display_name} (Niveau ${nextEnemy.level})`);
      
      // Redémarrer le combat après 2 secondes
      setTimeout(() => {
        setCombatState(prev => ({ ...prev, turn: 'player' }));
      }, 2000);
    }
  };

  const playerDeath = () => {
    addLogEntry('defeat', '💀 Défaite...');
    setCombatState(prev => ({ ...prev, isActive: false }));
    
    // Retourner aux donjons après 3 secondes
    setTimeout(() => {
      navigate('/dungeons', { 
        state: { 
          victory: false, 
          exp: 0, 
          gold: 0 
        } 
      });
    }, 3000);
  };

  // Obtenir l'icône d'une compétence
  const getSkillIcon = (skill) => {
    const iconMap = {
      '⚔️': Sword,
      '🔥': Flame,
      '✨': Sparkles,
      '🛡️': ShieldIcon,
      '❄️': Snowflake,
      '☠️': Skull,
      '👁️': Eye
    };
    return iconMap[skill.icon] || Star;
  };

  // Vérifier si une compétence peut être utilisée
  const canUseSkill = (skill) => {
    return player.currentMana >= skill.mana_cost && 
           (player.cooldowns[skill.id] || 0) === 0 &&
           player.level >= skill.level_requirement;
  };

  // Obtenir l'icône du personnage selon sa classe
  const getCharacterIcon = (characterClass) => {
    const classIcons = {
      'warrior': '⚔️',
      'mage': '🧙‍♂️',
      'archer': '🏹',
      'rogue': '🗡️',
      'priest': '⛑️',
      'paladin': '🛡️'
    };
    return classIcons[characterClass] || '👤';
  };

  // Obtenir l'icône du monstre selon son type
  const getMonsterIcon = (monsterName) => {
    const monsterIcons = {
      'Gobelin': '👹',
      'Orc': '👹',
      'Dragon': '🐉',
      'Squelette': '💀',
      'Loup': '🐺',
      'Araignée': '🕷️',
      'Troll': '👹',
      'Démon': '👹'
    };
    return monsterIcons[monsterName] || '👹';
  };

  if (!dungeon || !character) {
    return (
      <div className="game-page-error">
        <h2>❌ Erreur</h2>
        <p>Aucune donnée de donjon ou de personnage trouvée.</p>
        <button onClick={() => navigate('/dungeons')}>
          Retour aux donjons
        </button>
      </div>
    );
  }

  return (
    <div className="game-page">
      {/* Header du jeu */}
      <div className="game-header">
        <div className="game-header-left">
          <button 
            className="back-btn"
            onClick={() => navigate('/dungeons')}
          >
            <ArrowLeft size={20} />
            Retour
          </button>
          <div className="dungeon-info">
            <h1>🗺️ {dungeon.display_name || dungeon.name}</h1>
            <p>Niveau {dungeon.level_requirement || dungeon.level || 12} • {dungeon.difficulty || 'Moyen'}</p>
            {dungeonProgress.totalEnemies > 0 && (
              <div className="dungeon-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(dungeonProgress.defeatedEnemies / dungeonProgress.totalEnemies) * 100}%` }}
                  ></div>
                </div>
                <span>{dungeonProgress.defeatedEnemies}/{dungeonProgress.totalEnemies} ennemis vaincus</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="game-controls">
          {!combatState.isActive ? (
            <button className="game-btn start" onClick={startCombat}>
              <Play size={16} />
              Commencer le Combat
            </button>
          ) : (
            <>
              <button 
                className={`game-btn auto-play ${combatState.autoPlay ? 'active' : ''}`}
                onClick={toggleAutoPlay}
                title={combatState.autoPlay ? 'Désactiver l\'auto-play' : 'Activer l\'auto-play'}
              >
                {combatState.autoPlay ? <User size={16} /> : <Bot size={16} />}
                {combatState.autoPlay ? 'Manuel' : 'Auto'}
              </button>
              <button className="game-btn pause" onClick={pauseCombat}>
                {combatState.isPaused ? <Play size={16} /> : <Pause size={16} />}
                {combatState.isPaused ? 'Reprendre' : 'Pause'}
              </button>
              <button className="game-btn reset" onClick={resetCombat}>
                <RotateCcw size={16} />
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Zone de jeu principale */}
      <div className="game-main">
        {/* Arène de combat */}
        <div className="combat-arena">
          {/* Personnage */}
          <div className={`combat-character ${animations.characterAttack ? 'attacking' : ''} ${animations.skillCast ? 'casting' : ''}`}>
            <div className="character-avatar">
              <div className="character-icon">
                {getCharacterIcon(character.class)}
              </div>
              <div className="character-name">{player.name}</div>
              <div className="character-level">Niveau {player.level}</div>
            </div>
            
            {/* Barres de vie et mana */}
            <div className="character-bars">
              <div className="health-bar">
                <div className="bar-label">
                  <Heart size={14} />
                  <span>{player.currentHealth}/{player.max_health}</span>
                </div>
                <div className="bar-fill" style={{ width: `${(player.currentHealth / player.max_health) * 100}%` }}></div>
              </div>
              <div className="mana-bar">
                <div className="bar-label">
                  <Droplets size={14} />
                  <span>{player.currentMana}/{player.max_mana}</span>
                </div>
                <div className="bar-fill" style={{ width: `${(player.currentMana / player.max_mana) * 100}%` }}></div>
              </div>
            </div>
            
            {/* Effets de statut */}
            {player.status_effects && player.status_effects.length > 0 && (
              <div className="status-effects">
                {player.status_effects.map(effect => (
                  <div key={effect.id} className={`status-effect ${effect.type}`}>
                    {effect.type === 'buff' ? '📈' : '📉'}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VS */}
          <div className="vs-indicator">
            <div className="vs-text">VS</div>
            <div className="turn-indicator">
              {combatState.isActive && (
                <motion.div
                  className={`turn-badge ${combatState.turn}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {combatState.turn === 'player' ? '👤 Votre tour' : '👹 Tour du monstre'}
                </motion.div>
              )}
            </div>
          </div>

          {/* Monstre */}
          <div className={`combat-monster ${animations.monsterAttack ? 'attacking' : ''}`}>
            <div className="monster-avatar">
              <div className="monster-icon">
                {getMonsterIcon(monster.name)}
              </div>
              <div className="monster-name" style={{ color: monster.rarity_color || '#ff6b6b' }}>
                {monster.display_name || monster.name}
              </div>
              <div className="monster-level">Niveau {monster.level}</div>
              {monster.rarity_name && (
                <div className="monster-rarity" style={{ color: monster.rarity_color || '#ff6b6b' }}>
                  {monster.rarity_name}
                </div>
              )}
            </div>
            
            {/* Barre de vie du monstre */}
            <div className="monster-bars">
              <div className="health-bar">
                <div className="bar-label">
                  <Heart size={14} />
                  <span>{monster.currentHealth}/{monster.maxHealth}</span>
                </div>
                <div className="bar-fill" style={{ width: `${(monster.currentHealth / monster.maxHealth) * 100}%` }}></div>
              </div>
            </div>
            
            {/* Effets de statut du monstre */}
            {monster.status_effects && monster.status_effects.length > 0 && (
              <div className="status-effects">
                {monster.status_effects.map(effect => (
                  <div key={effect.id} className={`status-effect ${effect.type}`}>
                    {effect.type === 'burn' ? '🔥' : effect.type === 'poison' ? '☠️' : '📉'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panneau d'actions */}
        <div className="combat-actions">
          <div className="actions-header">
            <h3>Actions</h3>
            <div className="turn-indicator">
              Tour: {combatState.turn === 'player' ? 'Joueur' : 'Monstre'}
            </div>
          </div>
          
          {combatState.isActive && combatState.turn === 'player' && !combatState.autoPlay && (
            <div className="action-buttons">
              {loadingSkills ? (
                <div className="loading-skills">
                  <div className="loading-spinner">⚔️</div>
                  <span>Chargement des compétences...</span>
                </div>
              ) : (
                <>
                  {/* Attaque de base */}
                  <button 
                    className="action-btn basic-attack"
                    onClick={basicAttack}
                    disabled={combatState.isPaused}
                  >
                    <Sword size={20} />
                    <span>Attaque</span>
                  </button>
                  
                  {/* Compétences */}
                  <div className="skills-grid">
                    {availableSkills.map(skill => {
                      const IconComponent = getSkillIcon(skill);
                      const canUse = canUseSkill(skill);
                      const cooldown = player.cooldowns[skill.id] || 0;
                      
                      return (
                        <button
                          key={skill.id}
                          className={`skill-btn ${!canUse ? 'disabled' : ''}`}
                          onClick={() => useSkill(skill)}
                          disabled={!canUse || combatState.isPaused}
                          title={skill.description}
                        >
                          <IconComponent size={20} />
                          <span>{skill.display_name}</span>
                          <div className="skill-cost">
                            <Droplets size={12} />
                            <span>{skill.mana_cost}</span>
                          </div>
                          {cooldown > 0 && (
                            <div className="cooldown-overlay">
                              <span>{cooldown}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
          
          {combatState.isActive && combatState.turn === 'player' && combatState.autoPlay && (
            <div className="auto-play-indicator">
              <Bot size={20} />
              <span>L'IA joue automatiquement...</span>
            </div>
          )}
        </div>
      </div>

      {/* Journal de combat */}
      <div className="combat-log">
        <h3>Journal de Combat</h3>
        <div className="log-entries">
          <AnimatePresence>
            {battleLog.slice(-10).map(entry => (
              <motion.div
                key={entry.id}
                className={`log-entry ${entry.type}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <span className="log-time">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span className="log-message">{entry.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GamePage;

