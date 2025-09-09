import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, Shield, Zap, Heart, Droplets, Target, RotateCcw, Play, Pause,
  Star, Flame, Snowflake, Eye, Skull, Sparkles, Shield as ShieldIcon,
  Bot, User, X, ArrowLeft, Settings
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import databaseService from '../../services/databaseService';
import DungeonSystem from './DungeonSystem';
import './GamePage.css';

const EnhancedGamePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dungeon, character } = location.state || {};
  const dungeonSystem = new DungeonSystem();

  const [combatState, setCombatState] = useState({
    isActive: false,
    isPaused: false,
    turn: 'player',
    round: 1,
    selectedSkill: null,
    autoPlay: false
  });

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

  // Système de donjon complet
  const [dungeonState, setDungeonState] = useState({
    enemies: [],
    totalEnemies: 0,
    currentEnemyIndex: 0,
    defeatedEnemies: 0,
    isCompleted: false,
    currentEnemy: null
  });

  const [monster, setMonster] = useState({
    name: 'Chargement...',
    level: 1,
    maxHealth: 100,
    currentHealth: 100,
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

  // Charger les stats du personnage
  useEffect(() => {
    const loadCharacterStats = async () => {
      if (character?.id) {
        try {
          const stats = await databaseService.getCharacterStats(character.id);
          if (stats) {
            setPlayer(prev => ({
              ...prev,
              ...stats,
              currentHealth: stats.health,
              currentMana: stats.mana,
              max_health: stats.max_health,
              max_mana: stats.max_mana
            }));
          }
        } catch (error) {
          console.error('Erreur lors du chargement des stats:', error);
        }
      }
    };

    loadCharacterStats();
  }, [character?.id]);

  // Charger le donjon
  useEffect(() => {
    if (dungeon) {
      loadDungeon();
    }
  }, [dungeon]);

  // Charger tous les ennemis du donjon
  const loadDungeon = async () => {
    try {
      const dungeonData = await dungeonSystem.loadDungeonEnemies(dungeon, databaseService);
      setDungeonState(dungeonData);
      setMonster(dungeonData.enemies[0]);
      
      addLogEntry('info', `🏰 Donjon "${dungeon.display_name}" chargé`);
      addLogEntry('info', `⚔️ ${dungeonData.totalEnemies} ennemi(s) à vaincre`);
      addLogEntry('info', `🎯 Premier ennemi : ${dungeonData.enemies[0].display_name} (Niveau ${dungeonData.enemies[0].level})`);
    } catch (error) {
      console.error('Erreur lors du chargement du donjon:', error);
      addLogEntry('error', 'Erreur lors du chargement du donjon');
    }
  };

  // Ajouter une entrée au journal de combat
  const addLogEntry = (type, message) => {
    const newEntry = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setBattleLog(prev => [...prev, newEntry]);
  };

  // Démarrer le combat
  const startCombat = () => {
    setCombatState(prev => ({ ...prev, isActive: true, turn: 'player' }));
    addLogEntry('combat', '⚔️ Le combat commence !');
  };

  // Attaque basique
  const basicAttack = async () => {
    if (combatState.turn !== 'player' || !combatState.isActive) return;

    setCombatState(prev => ({ ...prev, turn: 'monster' }));
    
    // Animation d'attaque
    setAnimations(prev => ({ ...prev, characterAttack: true }));
    setTimeout(() => setAnimations(prev => ({ ...prev, characterAttack: false })), 500);

    // Calcul des dégâts
    const baseDamage = player.attack;
    const isCritical = Math.random() < (player.critical_rate / 100);
    const damage = isCritical ? Math.floor(baseDamage * (player.critical_damage / 100)) : baseDamage;
    const finalDamage = Math.max(1, damage - monster.defense);

    // Appliquer les dégâts
    const newMonsterHealth = Math.max(0, monster.currentHealth - finalDamage);
    setMonster(prev => ({ ...prev, currentHealth: newMonsterHealth }));

    // Animation de dégâts
    setAnimations(prev => ({ ...prev, monsterHit: true }));
    setTimeout(() => setAnimations(prev => ({ ...prev, monsterHit: false })), 300);

    // Log de l'attaque
    const attackMessage = isCritical 
      ? `💥 Coup critique ! ${finalDamage} dégâts à ${monster.display_name}`
      : `⚔️ ${finalDamage} dégâts à ${monster.display_name}`;
    addLogEntry('attack', attackMessage);

    if (newMonsterHealth <= 0) {
      // Ennemi vaincu
      await monsterDeath();
    } else {
      // Tour du monstre
      setTimeout(() => monsterAttack(), 1000);
    }
  };

  // Attaque du monstre
  const monsterAttack = () => {
    if (combatState.turn !== 'monster' || !combatState.isActive) return;

    // Animation d'attaque du monstre
    setAnimations(prev => ({ ...prev, monsterAttack: true }));
    setTimeout(() => setAnimations(prev => ({ ...prev, monsterAttack: false })), 500);

    // Calcul des dégâts
    const baseDamage = monster.attack;
    const isCritical = Math.random() < (monster.critical_rate / 100);
    const damage = isCritical ? Math.floor(baseDamage * (monster.critical_damage / 100)) : baseDamage;
    const finalDamage = Math.max(1, damage - player.defense);

    // Appliquer les dégâts
    const newPlayerHealth = Math.max(0, player.currentHealth - finalDamage);
    setPlayer(prev => ({ ...prev, currentHealth: newPlayerHealth }));

    // Animation de dégâts
    setAnimations(prev => ({ ...prev, characterHit: true }));
    setTimeout(() => setAnimations(prev => ({ ...prev, characterHit: false })), 300);

    // Log de l'attaque
    const attackMessage = isCritical 
      ? `💥 ${monster.display_name} fait un coup critique ! ${finalDamage} dégâts`
      : `⚔️ ${monster.display_name} attaque pour ${finalDamage} dégâts`;
    addLogEntry('monster_attack', attackMessage);

    if (newPlayerHealth <= 0) {
      // Joueur vaincu
      addLogEntry('defeat', '💀 Vous avez été vaincu !');
      setCombatState(prev => ({ ...prev, isActive: false }));
    } else {
      // Tour du joueur
      setCombatState(prev => ({ ...prev, turn: 'player' }));
    }
  };

  // Ennemi vaincu
  const monsterDeath = async () => {
    addLogEntry('victory', '🎉 Ennemi vaincu !');
    
    // Mettre à jour le progrès du donjon
    const newDungeonState = dungeonSystem.defeatEnemy(dungeonState);
    setDungeonState(newDungeonState);

    // Ajouter l'expérience et l'or
    const expGained = monster.experience_reward || Math.floor(monster.level * 10 + Math.random() * 20);
    const goldGained = monster.gold_reward || Math.floor(monster.level * 5 + Math.random() * 15);

    addLogEntry('reward', `✨ +${expGained} EXP, +${goldGained} Or`);

    // Mettre à jour le personnage via l'API
    try {
      const response = await fetch(`/api/characters/${player.id}/add-experience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          experience: expGained,
          gold: goldGained
        })
      });

      if (response.ok) {
        const result = await response.json();
        setPlayer(prev => ({
          ...prev,
          level: result.new_level || prev.level,
          experience: result.new_xp || (prev.experience + expGained),
          experience_to_next: result.new_xp_to_next || prev.experience_to_next,
          currentHealth: result.new_health || prev.currentHealth,
          max_health: result.new_max_health || prev.max_health,
          currentMana: result.new_mana || prev.currentMana,
          max_mana: result.new_max_mana || prev.max_mana,
          attack: result.new_attack || prev.attack,
          defense: result.new_defense || prev.defense,
          magic_attack: result.new_magic_attack || prev.magic_attack,
          magic_defense: result.new_magic_defense || prev.magic_defense
        }));

        if (result.level_up) {
          addLogEntry('level_up', `🎉 Niveau ${result.new_level} atteint !`);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'expérience:', error);
    }

    // Vérifier si le donjon est terminé
    if (newDungeonState.isCompleted) {
      addLogEntry('dungeon_complete', '🏆 Donjon terminé ! Tous les ennemis ont été vaincus !');
      setCombatState(prev => ({ ...prev, isActive: false }));
      
      // Retourner à la liste des donjons après 3 secondes
      setTimeout(() => {
        navigate('/dungeons', {
          state: {
            victory: true,
            dungeon: dungeon,
            exp: expGained,
            gold: goldGained
          }
        });
      }, 3000);
    } else {
      // Passer à l'ennemi suivant
      const nextState = dungeonSystem.nextEnemy(newDungeonState);
      setDungeonState(nextState);
      setMonster(nextState.currentEnemy);
      
      addLogEntry('next_enemy', `🎯 Ennemi suivant : ${nextState.currentEnemy.display_name} (Niveau ${nextState.currentEnemy.level})`);
      
      // Redémarrer le combat
      setTimeout(() => {
        setCombatState(prev => ({ ...prev, turn: 'player' }));
      }, 2000);
    }
  };

  // Obtenir le progrès du donjon
  const getDungeonProgress = () => {
    return dungeonSystem.getProgress(dungeonState);
  };

  const progress = getDungeonProgress();

  return (
    <div className="game-page">
      {/* Header */}
      <div className="game-header">
        <button 
          className="back-button"
          onClick={() => navigate('/dungeons')}
        >
          <ArrowLeft size={20} />
          Retour
        </button>
        
        <div className="dungeon-info">
          <h2>🏰 {dungeon?.display_name || 'Donjon'}</h2>
          <p>Niveau {dungeon?.level_requirement || 1} • {dungeon?.difficulty || 'easy'}</p>
        </div>

        <div className="dungeon-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <span>{progress.current}/{progress.total} ennemis vaincus</span>
        </div>
      </div>

      {/* Zone de combat */}
      <div className="combat-area">
        <div className="character-card">
          <div className="character-avatar">
            <User size={60} />
          </div>
          <h3>{player.name || 'Joueur'}</h3>
          <div className="character-level">Niveau {player.level}</div>
          <div className="health-bar">
            <Heart size={16} />
            <span>{player.currentHealth}/{player.max_health}</span>
            <div className="bar">
              <div 
                className="fill" 
                style={{ width: `${(player.currentHealth / player.max_health) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="mana-bar">
            <Zap size={16} />
            <span>{player.currentMana}/{player.max_mana}</span>
            <div className="bar">
              <div 
                className="fill" 
                style={{ width: `${(player.currentMana / player.max_mana) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="vs-section">
          <div className="vs-text">VS</div>
          {combatState.isActive && (
            <div className="turn-indicator">
              {combatState.turn === 'player' ? 'Votre tour' : 'Tour de l\'ennemi'}
            </div>
          )}
        </div>

        <div className="monster-card">
          <div className="monster-avatar">
            <Bot size={60} />
          </div>
          <h3>{monster.display_name}</h3>
          <div className="monster-level">Niveau {monster.level}</div>
          <div className="monster-rarity">{monster.rarity_name || 'common'}</div>
          <div className="health-bar">
            <Heart size={16} />
            <span>{monster.currentHealth}/{monster.maxHealth}</span>
            <div className="bar">
              <div 
                className="fill" 
                style={{ width: `${(monster.currentHealth / monster.maxHealth) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-panel">
        <h3>Actions</h3>
        <div className="turn-info">
          Tour: {combatState.turn === 'player' ? 'Joueur' : 'Ennemi'}
        </div>
        
        {!combatState.isActive ? (
          <button 
            className="start-combat-btn"
            onClick={startCombat}
          >
            <Play size={20} />
            Commencer le Combat
          </button>
        ) : (
          <div className="combat-actions">
            <button 
              className="action-btn attack-btn"
              onClick={basicAttack}
              disabled={combatState.turn !== 'player'}
            >
              <Sword size={20} />
              Attaque
            </button>
          </div>
        )}
      </div>

      {/* Journal de combat */}
      <div className="combat-log">
        <h3>Journal de Combat</h3>
        <div className="log-entries">
          {battleLog.slice(-10).map(entry => (
            <div key={entry.id} className={`log-entry ${entry.type}`}>
              <span className="timestamp">{entry.timestamp}</span>
              <span className="message">{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedGamePage;

