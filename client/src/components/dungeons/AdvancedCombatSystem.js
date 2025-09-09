import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, Shield, Zap, Heart, Droplets, Target, RotateCcw, Play, Pause,
  Star, Flame, Snowflake, Eye, Skull, Sparkles, Shield as ShieldIcon,
  Bot, User, X
} from 'lucide-react';
import databaseService from '../../services/databaseService';
import './CombatSystem.css';

const AdvancedCombatSystem = ({ dungeon, character, onCombatEnd, onClose }) => {
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
    status_effects: [],
    cooldowns: {}
  });

  const [monster, setMonster] = useState({
    name: dungeon?.monsters?.[0] || 'Gobelin',
    level: dungeon?.level || 12,
    maxHealth: 75,
    currentHealth: 75,
    attack: 45,
    defense: 25,
    magic_attack: 20,
    magic_defense: 15,
    critical_rate: 10,
    critical_damage: 150,
    dodge_chance: 5,
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

  // Compétences disponibles (récupérées depuis l'API)
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
    }
  }, [character]);

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
      id: Date.now(),
      type,
      message,
      timestamp: Date.now()
    };
    setBattleLog(prev => [...prev, newEntry]);
  };

  const startCombat = () => {
    if (combatState.isActive) return;
    
    setCombatState(prev => ({ ...prev, isActive: true, turn: 'player' }));
    addLogEntry('info', '⚔️ Le combat commence !');
    
    // Premier tour automatique
    setTimeout(() => {
      // Le joueur peut choisir une action
    }, 1000);
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
      currentHealth: prev.max_health, 
      currentMana: prev.max_mana,
      status_effects: [],
      cooldowns: {}
    }));
    setMonster(prev => ({ 
      ...prev, 
      currentHealth: prev.maxHealth,
      status_effects: []
    }));
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
      let effects = [];
      
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
        
        const newPlayerHealth = Math.min(player.max_health, player.currentHealth + healing);
        setPlayer(prev => ({ ...prev, currentHealth: newPlayerHealth }));
        
        addLogEntry('healing', `✨ ${skill.display_name} ! ${healing} PV restaurés !`);
      }
      
      // Appliquer les effets de statut
      if (skill.debuffs) {
        Object.entries(skill.debuffs).forEach(([stat, value]) => {
          setMonster(prev => ({
            ...prev,
            status_effects: [...prev.status_effects, {
              type: 'debuff',
              stat: stat,
              value: value,
              duration: 3,
              id: Date.now()
            }]
          }));
          addLogEntry('debuff', `📉 ${stat} du monstre réduit de ${Math.abs(value)} !`);
        });
      }
      
      if (skill.buffs) {
        Object.entries(skill.buffs).forEach(([stat, value]) => {
          setPlayer(prev => ({
            ...prev,
            status_effects: [...prev.status_effects, {
              type: 'buff',
              stat: stat,
              value: value,
              duration: 3,
              id: Date.now()
            }]
          }));
          addLogEntry('buff', `📈 ${stat} augmenté de ${value} !`);
        });
      }
      
      // Effets spéciaux
      if (skill.effects && skill.effects.includes('burn')) {
        setMonster(prev => ({
          ...prev,
          status_effects: [...prev.status_effects, {
            type: 'burn',
            duration: 3,
            id: Date.now()
          }]
        }));
        addLogEntry('effect', '🔥 Le monstre brûle !');
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
      // Traiter les effets de statut du monstre
      processStatusEffects(monster, setMonster, addLogEntry);
      
      // Attaque du monstre
      const baseDamage = monster.attack - player.defense;
      const critical = Math.random() < (monster.critical_rate / 100);
      const dodge = Math.random() < (player.dodge_chance / 100);
      
      let damage = Math.max(1, baseDamage + Math.floor(Math.random() * 15));
      if (critical) damage = Math.floor(damage * (monster.critical_damage / 100));
      
      if (dodge) {
        addLogEntry('info', '💨 Vous avez esquivé l\'attaque !');
      } else {
        const newPlayerHealth = Math.max(0, player.currentHealth - damage);
        setPlayer(prev => ({ ...prev, currentHealth: newPlayerHealth }));
        
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
      
      // Traiter les effets de statut du joueur
      processStatusEffects(player, setPlayer, addLogEntry);
      
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

  // Traiter les effets de statut
  const processStatusEffects = (entity, setEntity, addLog) => {
    if (!entity.status_effects || entity.status_effects.length === 0) return;
    
    entity.status_effects = entity.status_effects.filter(effect => {
      effect.duration--;
      
      // Effets de dégâts sur la durée
      if (effect.type === 'burn' || effect.type === 'poison') {
        const damage = Math.floor(entity.maxHealth * 0.05);
        const newHealth = Math.max(0, entity.currentHealth - damage);
        setEntity(prev => ({ ...prev, currentHealth: newHealth }));
        addLog('damage', `🔥 ${damage} dégâts de ${effect.type} !`);
      }
      
      // Effets de soin sur la durée
      if (effect.type === 'regeneration') {
        const healing = Math.floor(entity.maxHealth * 0.03);
        const newHealth = Math.min(entity.maxHealth, entity.currentHealth + healing);
        setEntity(prev => ({ ...prev, currentHealth: newHealth }));
        addLog('healing', `✨ ${healing} PV de régénération !`);
      }
      
      return effect.duration > 0;
    });
  };

  const monsterDeath = () => {
    addLogEntry('victory', '🎉 Monstre vaincu !');
    setCombatState(prev => ({ ...prev, isActive: false }));
    
    if (onCombatEnd) {
      onCombatEnd({
        victory: true,
        exp: 0,
        gold: 0,
        items: []
      });
    }
  };

  const playerDeath = () => {
    addLogEntry('defeat', '💀 Défaite...');
    setCombatState(prev => ({ ...prev, isActive: false }));
    
    if (onCombatEnd) {
      onCombatEnd({
        victory: false,
        exp: 0,
        gold: 0,
        items: []
      });
    }
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

  return (
    <div className="combat-system">
      {/* Header du combat */}
      <div className="combat-header">
        <h2>⚔️ Combat Avancé</h2>
        <div className="combat-controls">
          {!combatState.isActive ? (
            <button className="combat-btn start" onClick={startCombat}>
              <Play size={16} />
              Commencer
            </button>
          ) : (
            <>
              <button 
                className={`combat-btn auto-play ${combatState.autoPlay ? 'active' : ''}`}
                onClick={toggleAutoPlay}
                title={combatState.autoPlay ? 'Désactiver l\'auto-play' : 'Activer l\'auto-play'}
              >
                {combatState.autoPlay ? <User size={16} /> : <Bot size={16} />}
                {combatState.autoPlay ? 'Manuel' : 'Auto'}
              </button>
              <button className="combat-btn pause" onClick={pauseCombat}>
                {combatState.isPaused ? <Play size={16} /> : <Pause size={16} />}
                {combatState.isPaused ? 'Reprendre' : 'Pause'}
              </button>
              <button className="combat-btn reset" onClick={resetCombat}>
                <RotateCcw size={16} />
                Reset
              </button>
            </>
          )}
          {onClose && (
            <button className="combat-btn close" onClick={onClose}>
              <X size={16} />
              Fermer
            </button>
          )}
        </div>
      </div>

      {/* Zone principale du combat */}
      <div className="combat-main">
        {/* Zone de combat 3D */}
        <div className="combat-3d-zone">
          <div className="combat-arena">
            {/* Personnage */}
            <div className={`combat-character ${animations.characterAttack ? 'attacking' : ''} ${animations.skillCast ? 'casting' : ''}`}>
              <div className="character-avatar">
                <div className="character-icon">🧙‍♂️</div>
                <div className="character-name">{player.name}</div>
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

            {/* Monstre */}
            <div className={`combat-monster ${animations.monsterAttack ? 'attacking' : ''}`}>
              <div className="monster-avatar">
                <div className="monster-icon">👹</div>
                <div className="monster-name">{monster.name}</div>
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

export default AdvancedCombatSystem;
