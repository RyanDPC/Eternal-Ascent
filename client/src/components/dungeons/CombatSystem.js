import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Zap, Heart, Droplets, Target, RotateCcw, Play, Pause } from 'lucide-react';
import './CombatSystem.css';
import databaseService from '../../services/databaseService';

const CombatSystem = ({ dungeon, onCombatEnd, characterData }) => {
  const [combatState, setCombatState] = useState({
    isActive: false,
    isPaused: false,
    turn: 'player',
    round: 1
  });

  const [character, setCharacter] = useState({
    id: characterData?.id || null,
    name: characterData?.name || 'Héros',
    level: characterData?.level || 15,
    maxHealth: characterData?.max_health || 100,
    currentHealth: characterData?.health || characterData?.max_health || 100,
    maxMana: characterData?.max_mana || 80,
    currentMana: characterData?.mana || characterData?.max_mana || 80,
    attack: characterData?.attack || 85,
    defense: characterData?.defense || 45,
    criticalChance: (characterData?.critical_rate || 5) / 100,
    dodgeChance: 0.10
  });

  const [monster, setMonster] = useState({
    name: 'Gobelin',
    level: 12,
    maxHealth: 75,
    currentHealth: 75,
    attack: 45,
    defense: 25,
    criticalChance: 0.10,
    dodgeChance: 0.05
  });

  const [battleLog, setBattleLog] = useState([
    { id: 1, type: 'info', message: 'Prêt pour le combat !', timestamp: Date.now() }
  ]);

  const [animations, setAnimations] = useState({
    characterAttack: false,
    monsterAttack: false,
    characterHit: false,
    monsterHit: false
  });

  // Initialiser le système de combat
  useEffect(() => {
    // Le système est maintenant basé sur une zone vide
    // Plus besoin d'initialiser un canvas
  }, []);

  // Fonction pour générer un ennemi aléatoire basé sur le donjon
  const generateRandomEnemy = () => {
    if (!dungeon?.enemies || dungeon.enemies.length === 0) {
      // Fallback si pas d'ennemis définis
      return {
        name: 'Gobelin',
        level: dungeon?.level_requirement || 12,
        maxHealth: 75,
        currentHealth: 75,
        attack: 45,
        defense: 25,
        criticalChance: 0.10,
        dodgeChance: 0.05
      };
    }

    // Choisir un ennemi aléatoire parmi ceux du donjon
    const randomEnemyType = dungeon.enemies[Math.floor(Math.random() * dungeon.enemies.length)];
    const enemyLevel = dungeon.level_requirement || 12;
    
    // Générer les stats basées sur le type d'ennemi et le niveau
    const enemyStats = generateEnemyStats(randomEnemyType, enemyLevel);
    
    return {
      name: getEnemyDisplayName(randomEnemyType),
      level: enemyLevel,
      maxHealth: enemyStats.hp,
      currentHealth: enemyStats.hp,
      attack: enemyStats.atk,
      defense: enemyStats.def,
      criticalChance: 0.10,
      dodgeChance: 0.05
    };
  };

  // Fonction pour générer les stats d'un ennemi
  const generateEnemyStats = (enemyType, level) => {
    // Plages de stats par type d'ennemi (basées sur les données du serveur)
    const enemyStatsRanges = {
      // Gobelins
      'goblin_warrior': { hp: [8, 12], atk: [2, 4], def: [0, 2], spd: [1, 3] },
      'goblin_archer': { hp: [6, 10], atk: [3, 5], def: [0, 1], spd: [2, 4] },
      'goblin_shaman': { hp: [7, 11], atk: [1, 3], def: [1, 3], spd: [1, 2] },
      
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
      
      // Par défaut
      'default': { hp: [8, 12], atk: [2, 4], def: [0, 2], spd: [1, 3] }
    };
    
    const statsRange = enemyStatsRanges[enemyType] || enemyStatsRanges['default'];
    const levelMultiplier = 1 + (level - 1) * 0.3; // +30% par niveau
    
    return {
      hp: Math.floor((Math.random() * (statsRange.hp[1] - statsRange.hp[0] + 1) + statsRange.hp[0]) * levelMultiplier),
      atk: Math.floor((Math.random() * (statsRange.atk[1] - statsRange.atk[0] + 1) + statsRange.atk[0]) * levelMultiplier),
      def: Math.floor((Math.random() * (statsRange.def[1] - statsRange.def[0] + 1) + statsRange.def[0]) * levelMultiplier),
      spd: Math.floor((Math.random() * (statsRange.spd[1] - statsRange.spd[0] + 1) + statsRange.spd[0]) * levelMultiplier)
    };
  };

  // Fonction pour obtenir le nom d'affichage de l'ennemi
  const getEnemyDisplayName = (enemyType) => {
    const displayNames = {
      'goblin_warrior': 'Gobelin Guerrier',
      'goblin_archer': 'Gobelin Archer',
      'goblin_shaman': 'Gobelin Shaman',
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
      'dire_wolf': 'Loup Terrible'
    };
    
    return displayNames[enemyType] || enemyType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Fonction pour sauvegarder les stats du personnage en DB
  const saveCharacterStats = async (updatedCharacter) => {
    try {
      if (character.id) {
        await databaseService.saveCharacterData({
          id: character.id,
          health: updatedCharacter.currentHealth,
          mana: updatedCharacter.currentMana,
          max_health: updatedCharacter.maxHealth,
          max_mana: updatedCharacter.maxMana
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des stats:', error);
    }
  };

  const addLogEntry = (type, message) => {
    const newEntry = {
      id: Date.now(),
      type,
      message,
      timestamp: Date.now()
    };
    setBattleLog(prev => [...prev, newEntry]);
  };

  const startCombat = () => {
    if (combatState.isActive) return;
    
    // Générer un ennemi aléatoire basé sur le donjon
    const randomEnemy = generateRandomEnemy();
    setMonster(randomEnemy);
    
    setCombatState(prev => ({ ...prev, isActive: true, turn: 'player' }));
    addLogEntry('info', `⚔️ Le combat commence ! Un ${randomEnemy.name} de niveau ${randomEnemy.level} apparaît !`);
    
    // Premier tour automatique
    setTimeout(() => {
      playerAttack();
    }, 1000);
  };

  const pauseCombat = () => {
    setCombatState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const resetCombat = async () => {
    // Restaurer les stats actuelles du personnage depuis la DB
    if (character.id) {
      try {
        const characterData = await databaseService.getCharacterData(character.id);
        setCharacter(prev => ({ 
          ...prev, 
          currentHealth: characterData.health,
          currentMana: characterData.mana,
          maxHealth: characterData.max_health,
          maxMana: characterData.max_mana
        }));
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        // Fallback sur les stats max si erreur
        setCharacter(prev => ({ ...prev, currentHealth: prev.maxHealth, currentMana: prev.maxMana }));
      }
    } else {
      setCharacter(prev => ({ ...prev, currentHealth: prev.maxHealth, currentMana: prev.maxMana }));
    }
    
    // Générer un nouvel ennemi aléatoire
    const randomEnemy = generateRandomEnemy();
    setMonster(randomEnemy);
    
    setCombatState({ isActive: false, isPaused: false, turn: 'player', round: 1 });
    setBattleLog([{ id: Date.now(), type: 'info', message: 'Prêt pour le combat !', timestamp: Date.now() }]);
    setAnimations({ characterAttack: false, monsterAttack: false, characterHit: false, monsterHit: false });
  };

  const playerAttack = () => {
    if (combatState.isPaused) return;
    
    setAnimations(prev => ({ ...prev, characterAttack: true }));
    
    setTimeout(async () => {
      // Calcul des dégâts
      const baseDamage = character.attack - monster.defense;
      const critical = Math.random() < character.criticalChance;
      const dodge = Math.random() < monster.dodgeChance;
      
      let damage = Math.max(1, baseDamage + Math.floor(Math.random() * 20));
      if (critical) damage = Math.floor(damage * 1.5);
      
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
          monsterAttack();
        }
      }, 1000);
    }, 500);
  };

  const monsterAttack = () => {
    if (combatState.isPaused) return;
    
    setAnimations(prev => ({ ...prev, monsterAttack: true }));
    
    setTimeout(async () => {
      // Calcul des dégâts
      const baseDamage = monster.attack - character.defense;
      const critical = Math.random() < monster.criticalChance;
      const dodge = Math.random() < character.dodgeChance;
      
      let damage = Math.max(1, baseDamage + Math.floor(Math.random() * 15));
      if (critical) damage = Math.floor(damage * 1.5);
      
      if (dodge) {
        addLogEntry('info', '🛡️ Vous avez esquivé l\'attaque !');
      } else {
        const newCharacterHealth = Math.max(0, character.currentHealth - damage);
        const updatedCharacter = { ...character, currentHealth: newCharacterHealth };
        setCharacter(updatedCharacter);
        
        // Sauvegarder les HP en DB
        await saveCharacterStats(updatedCharacter);
        
        const message = critical 
          ? `💥 Attaque critique du monstre ! ${damage} dégâts reçus !`
          : `⚔️ ${damage} dégâts reçus du monstre !`;
        
        addLogEntry('damage', message);
        
        if (newCharacterHealth <= 0) {
          characterDeath();
          return;
        }
      }
      
      setAnimations(prev => ({ ...prev, monsterAttack: false }));
      
      // Fin du tour
      setTimeout(() => {
        if (combatState.isActive && !combatState.isPaused) {
          setCombatState(prev => ({ 
            ...prev, 
            round: prev.round + 1,
            turn: 'player'
          }));
          addLogEntry('info', `🔄 Tour ${combatState.round + 1} - Votre tour !`);
        }
      }, 1000);
    }, 500);
  };

  // Fonction pour utiliser une compétence (consomme de la mana)
  const useSkill = async (skillName, manaCost, damage) => {
    if (combatState.isPaused || !combatState.isActive) return;
    
    if (character.currentMana < manaCost) {
      addLogEntry('info', '❌ Mana insuffisante pour utiliser cette compétence !');
      return;
    }
    
    setAnimations(prev => ({ ...prev, characterAttack: true }));
    
    setTimeout(async () => {
      // Consommer la mana
      const newMana = Math.max(0, character.currentMana - manaCost);
      let updatedCharacter = { ...character, currentMana: newMana };
      
      // Gestion spéciale pour les soins
      if (skillName === 'Soins') {
        const healAmount = Math.floor(character.maxHealth * 0.3); // Soigne 30% des HP max
        const newHealth = Math.min(character.maxHealth, character.currentHealth + healAmount);
        updatedCharacter = { ...updatedCharacter, currentHealth: newHealth };
        addLogEntry('info', `✨ ${skillName} utilisé ! +${healAmount} HP, -${manaCost} Mana`);
      } else {
        addLogEntry('info', `✨ ${skillName} utilisé ! -${manaCost} Mana`);
        
        // Calcul des dégâts de la compétence
        const baseDamage = damage || character.attack;
        const critical = Math.random() < character.criticalChance;
        const dodge = Math.random() < monster.dodgeChance;
        
        let skillDamage = Math.max(1, baseDamage + Math.floor(Math.random() * 20));
        if (critical) skillDamage = Math.floor(skillDamage * 1.5);
        
        if (dodge) {
          addLogEntry('info', '🛡️ Le monstre a esquivé la compétence !');
        } else {
          const newMonsterHealth = Math.max(0, monster.currentHealth - skillDamage);
          setMonster(prev => ({ ...prev, currentHealth: newMonsterHealth }));
          
          const message = critical 
            ? `💥 Compétence critique ! ${skillDamage} dégâts infligés !`
            : `⚔️ ${skillDamage} dégâts infligés avec ${skillName} !`;
          
          addLogEntry('damage', message);
          
          if (newMonsterHealth <= 0) {
            monsterDeath();
            return;
          }
        }
      }
      
      setCharacter(updatedCharacter);
      
      // Sauvegarder les stats en DB
      await saveCharacterStats(updatedCharacter);
      
      setAnimations(prev => ({ ...prev, characterAttack: false }));
      
      // Tour du monstre
      setTimeout(() => {
        if (combatState.isActive && !combatState.isPaused) {
          monsterAttack();
        }
      }, 1000);
    }, 500);
  };

  const monsterDeath = () => {
    addLogEntry('victory', '🎉 Le monstre a été vaincu !');
    
    setCombatState(prev => ({ ...prev, isActive: false }));
    
    if (onCombatEnd) {
      onCombatEnd({ victory: true, exp: 0, gold: 0 });
    }
  };

  const characterDeath = () => {
    addLogEntry('defeat', '💀 Votre personnage a été vaincu !');
    addLogEntry('info', '🔄 Le combat se termine en défaite...');
    
    setCombatState(prev => ({ ...prev, isActive: false }));
    
    if (onCombatEnd) {
      onCombatEnd({ victory: false, exp: 0, gold: 0 });
    }
  };

  const getHealthPercentage = (current, max) => {
    return Math.max(0, Math.min(100, (current / max) * 100));
  };

  const getManaPercentage = (current, max) => {
    return Math.max(0, Math.min(100, (current / max) * 100));
  };

  return (
    <div className="combat-system">
      <div className="combat-header">
        <h2>⚔️ Combat en cours</h2>
        <div className="combat-controls">
          {!combatState.isActive ? (
            <motion.button
              className="combat-btn start"
              onClick={startCombat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={20} />
              Lancer le Combat
            </motion.button>
          ) : (
            <>
              <motion.button
                className="combat-btn pause"
                onClick={pauseCombat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {combatState.isPaused ? <Play size={20} /> : <Pause size={20} />}
                {combatState.isPaused ? 'Reprendre' : 'Pause'}
              </motion.button>
              <motion.button
                className="combat-btn reset"
                onClick={resetCombat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={20} />
                Reset
              </motion.button>
            </>
          )}
        </div>
      </div>

      <div className="combat-main">
        {/* Zone de combat 3D */}
        <div className="combat-3d-zone">
          <div className="character-preview-container">
            {/* Zone vide pour le personnage */}
          </div>
          <div className="combat-overlay">
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
        </div>

        {/* Panneau de combat */}
        <div className="combat-panel">
          {/* Stats du personnage */}
          <div className="character-stats">
            <h3>👤 {character.name}</h3>
            <div className="stat-grid">
              <div className="stat-item">
                <span className="stat-label">Niveau:</span>
                <span className="stat-value">{character.level}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Attaque:</span>
                <span className="stat-value">{character.attack}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Défense:</span>
                <span className="stat-value">{character.defense}</span>
              </div>
            </div>
            
            <div className="health-section">
              <div className="stat-row">
                <span className="stat-label">
                  <Heart size={16} />
                  PV:
                </span>
                <span className="stat-value">{character.currentHealth}/{character.maxHealth}</span>
              </div>
              <div className="health-bar">
                <motion.div
                  className="health-fill"
                  initial={{ width: '100%' }}
                  animate={{ width: `${getHealthPercentage(character.currentHealth, character.maxHealth)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            
            <div className="mana-section">
              <div className="stat-row">
                <span className="stat-label">
                  <Droplets size={16} />
                  Mana:
                </span>
                <span className="stat-value">{character.currentMana}/{character.maxMana}</span>
              </div>
              <div className="mana-bar">
                <motion.div
                  className="mana-fill"
                  initial={{ width: '100%' }}
                  animate={{ width: `${getManaPercentage(character.currentMana, character.maxMana)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Stats du monstre */}
          <div className="monster-stats">
            <h3>👹 {monster.name}</h3>
            <div className="stat-grid">
              <div className="stat-item">
                <span className="stat-label">Niveau:</span>
                <span className="stat-value">{monster.level}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Attaque:</span>
                <span className="stat-value">{monster.attack}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Défense:</span>
                <span className="stat-value">{monster.defense}</span>
              </div>
            </div>
            
            <div className="health-section">
              <div className="stat-row">
                <span className="stat-label">
                  <Heart size={16} />
                  PV:
                </span>
                <span className="stat-value">{monster.currentHealth}/{monster.maxHealth}</span>
              </div>
              <div className="health-bar">
                <motion.div
                  className="health-fill monster"
                  initial={{ width: '100%' }}
                  animate={{ width: `${getHealthPercentage(monster.currentHealth, monster.maxHealth)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Actions de combat */}
          {combatState.isActive && combatState.turn === 'player' && !combatState.isPaused && (
            <div className="combat-actions">
              <motion.button
                className="action-btn attack"
                onClick={playerAttack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sword size={20} />
                Attaquer
              </motion.button>
              
              <motion.button
                className="action-btn skill"
                onClick={() => useSkill('Boule de Feu', 15, character.attack * 1.5)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={character.currentMana < 15}
              >
                <Zap size={20} />
                Boule de Feu (15 MP)
              </motion.button>
              
              <motion.button
                className="action-btn skill"
                onClick={() => useSkill('Soins', 20, 0)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={character.currentMana < 20}
              >
                <Heart size={20} />
                Soins (20 MP)
              </motion.button>
            </div>
          )}

          {/* Journal de combat */}
          <div className="battle-log">
            <h4>📜 Journal de Combat</h4>
            <div className="log-content">
              <AnimatePresence>
                {battleLog.slice(-8).map((entry) => (
                  <motion.div
                    key={entry.id}
                    className={`log-entry ${entry.type}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {entry.message}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombatSystem;
