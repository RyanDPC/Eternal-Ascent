import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './DungeonPage.css';
import databaseService from '../../services/databaseService';
import CombatSystem from './CombatSystem';

const DungeonPage = () => {
  const [dungeons, setDungeons] = useState([]);
  const [selectedDungeon, setSelectedDungeon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDungeonDetails, setShowDungeonDetails] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [rewards, setRewards] = useState(null);
  const [completingDungeon, setCompletingDungeon] = useState(false);
  const [characterData, setCharacterData] = useState(null);
  const [showCombat, setShowCombat] = useState(false);
  const [enemyStats, setEnemyStats] = useState({});

  useEffect(() => {
    loadDungeons();
    loadCharacterData();
  }, []);

  const loadCharacterData = async () => {
    try {
      const userData = databaseService.getStoredUserData();
      if (userData) {
        const current = await databaseService.getCurrentCharacterData();
        const character = current.character || current;
        setCharacterData(character);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du personnage:', error);
    }
  };

  const loadDungeons = async () => {
    try {
      setLoading(true);
      const dungeonsData = await databaseService.getDungeons();
      setDungeons(dungeonsData);
    } catch (error) {
      console.error('Erreur lors du chargement des donjons:', error);
      setError('Erreur lors du chargement des donjons');
    } finally {
      setLoading(false);
    }
  };

  const handleDungeonSelect = async (dungeon) => {
    try {
      setSelectedDungeon(dungeon);
      setShowDungeonDetails(true);
      
      // Charger les stats des ennemis de manière asynchrone
      if (dungeon.enemies && dungeon.enemies.length > 0) {
        const stats = {};
        for (const enemy of dungeon.enemies) {
          try {
            const enemyStats = await generateEnemyStats(enemy, dungeon.level_requirement);
            stats[enemy] = enemyStats;
          } catch (error) {
            console.error(`Erreur lors du chargement des stats pour ${enemy}:`, error);
            // Utiliser des stats par défaut
            const levelMultiplier = 1 + (dungeon.level_requirement - 1) * 0.3;
            stats[enemy] = {
              hp: Math.floor(10 * levelMultiplier),
              atk: Math.floor(3 * levelMultiplier),
              def: Math.floor(1 * levelMultiplier),
              spd: Math.floor(2 * levelMultiplier)
            };
          }
        }
        setEnemyStats(stats);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du donjon:', error);
      setError('Erreur lors de la sélection du donjon');
    }
  };

  const handleStartDungeon = () => {
    if (!selectedDungeon || !characterData) return;
    
    setShowCombat(true);
    setShowDungeonDetails(false);
  };

  const handleCombatEnd = async (victory) => {
    setShowCombat(false);
    
    if (victory) {
      try {
        setCompletingDungeon(true);
        const result = await databaseService.completeDungeon(selectedDungeon.name);
        
        if (result.success) {
          setRewards({
            xp_gained: result.xp_gained,
            gold_gained: result.gold_gained,
            level_up: result.level_up,
            new_level: result.new_level
          });
          setShowRewards(true);
          // Recharger les données du personnage après la victoire
          await loadCharacterData();
        } else {
          setError('Erreur lors de la completion du donjon');
        }
      } catch (error) {
        console.error('Erreur lors de la completion du donjon:', error);
        setError('Erreur lors de la completion du donjon');
      } finally {
        setCompletingDungeon(false);
      }
    } else {
      // En cas de défaite, recharger les données du personnage
      await loadCharacterData();
    }
  };

  const closeDungeonDetails = () => {
    setShowDungeonDetails(false);
    setSelectedDungeon(null);
  };

  const closeRewards = () => {
    setShowRewards(false);
    setRewards(null);
    setSelectedDungeon(null);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'easy': '#4ade80',
      'normal': '#fbbf24',
      'hard': '#f97316',
      'nightmare': '#dc2626',
      'hell': '#7c2d12',
      'divine': '#7c3aed'
    };
    return colors[difficulty] || '#6b7280';
  };

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      'easy': 'Facile',
      'normal': 'Normal',
      'hard': 'Difficile',
      'nightmare': 'Cauchemar',
      'hell': 'Enfer',
      'divine': 'Divin'
    };
    return labels[difficulty] || difficulty;
  };

  const getRarityColor = (rarity) => {
    const colors = {
      'common': '#9ca3af',
      'rare': '#3b82f6',
      'epic': '#8b5cf6',
      'legendary': '#f59e0b'
    };
    return colors[rarity] || '#9ca3af';
  };

  const getCurrencyInfo = (currencyName) => {
    const currencyMap = {
      'copper_coin': { name: 'Cuivre', icon: '🪙', color: '#cd7f32' },
      'silver_coin': { name: 'Argent', icon: '🪙', color: '#c0c0c0' },
      'gold_coin': { name: 'Or', icon: '🪙', color: '#ffd700' },
      'platinum_coin': { name: 'Platine', icon: '🪙', color: '#e5e4e2' },
      'diamond_coin': { name: 'Diamant', icon: '💎', color: '#b9f2ff' },
      'eternal_coin': { name: 'Éternelle', icon: '⏰', color: '#ff6b6b' }
    };
    return currencyMap[currencyName] || { name: currencyName, icon: '🪙', color: '#9ca3af' };
  };

  // Générer les stats d'un ennemi en utilisant les données de la base de données
  const generateEnemyStats = async (enemyType, level) => {
    try {
      // Récupérer les données de l'ennemi depuis la base de données
      const enemies = await databaseService.getEnemies();
      const enemy = enemies.find(e => e.name === enemyType || e.display_name === enemyType);
      
      if (enemy) {
        // Utiliser les stats de base de l'ennemi et les ajuster selon le niveau
        const levelMultiplier = 1 + (level - 1) * 0.3;
        
        return {
          hp: Math.floor(enemy.health * levelMultiplier),
          atk: Math.floor(enemy.attack * levelMultiplier),
          def: Math.floor(enemy.defense * levelMultiplier),
          spd: Math.floor(enemy.speed * levelMultiplier)
        };
      } else {
        // Fallback si l'ennemi n'est pas trouvé
        const levelMultiplier = 1 + (level - 1) * 0.3;
        return {
          hp: Math.floor(10 * levelMultiplier),
          atk: Math.floor(3 * levelMultiplier),
          def: Math.floor(1 * levelMultiplier),
          spd: Math.floor(2 * levelMultiplier)
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des stats d\'ennemi:', error);
      // Fallback en cas d'erreur
      const levelMultiplier = 1 + (level - 1) * 0.3;
      return {
        hp: Math.floor(10 * levelMultiplier),
        atk: Math.floor(3 * levelMultiplier),
        def: Math.floor(1 * levelMultiplier),
        spd: Math.floor(2 * levelMultiplier)
      };
    }
  };

  if (loading) {
    return (
      <div className="dungeon-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des donjons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dungeon-page">
        <div className="error-container">
          <h2>Erreur</h2>
          <p>{error}</p>
          <button onClick={loadDungeons} className="retry-btn">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dungeon-page">
      <div className="dungeon-header">
        <h1>🏰 Donjons</h1>
        <p>Explorez les donjons et affrontez de puissants ennemis pour gagner des récompenses !</p>
        <button onClick={loadDungeons} className="refresh-btn">
          🔄 Rafraîchir les donjons
        </button>
      </div>

      <div className="dungeons-grid">
        {dungeons.map((dungeon) => (
          <motion.div
            key={dungeon.name}
            className="dungeon-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDungeonSelect(dungeon)}
          >
            <div className="dungeon-icon">
              {dungeon.icon || '🏰'}
            </div>
            <div className="dungeon-info">
              <h3 className="dungeon-name">{dungeon.display_name}</h3>
              <p className="dungeon-description">{dungeon.description}</p>
              <div className="dungeon-stats">
                <div className="stat-item">
                  <span className="stat-label">Monstres:</span>
                  <span className="stat-value">{dungeon.enemies ? dungeon.enemies.length : 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">EXP:</span>
                  <span className="stat-value">{Math.floor(dungeon.level_requirement * 8)}-{Math.floor(dungeon.level_requirement * 15)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Or:</span>
                  <span className="stat-value">{Math.floor(dungeon.level_requirement * 3)}-{Math.floor(dungeon.level_requirement * 8)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Durée:</span>
                  <span className="stat-value">{dungeon.estimated_duration} min</span>
                </div>
              </div>
              <div className="dungeon-meta">
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(dungeon.difficulty) }}
                >
                  {getDifficultyLabel(dungeon.difficulty)}
                </span>
                <span className="level-requirement">
                  Niveau {dungeon.level_requirement}
                </span>
              </div>
            </div>
            <button className="enter-btn">
              ▷ Entrer
            </button>
          </motion.div>
        ))}
      </div>

      {/* Modal de détails du donjon */}
      <AnimatePresence>
        {showDungeonDetails && selectedDungeon && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDungeonDetails}
          >
            <motion.div
              className="dungeon-details-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-btn" onClick={closeDungeonDetails}>×</button>
              
              <div className="dungeon-details-header">
                <div className="dungeon-icon-large">
                  {selectedDungeon.icon || '🏰'}
                </div>
                <div className="dungeon-details-info">
                  <h2>{selectedDungeon.display_name}</h2>
                  <p className="dungeon-description-full">{selectedDungeon.description}</p>
                  <div className="dungeon-details-meta">
                    <span 
                      className="difficulty-badge-large"
                      style={{ backgroundColor: getDifficultyColor(selectedDungeon.difficulty) }}
                    >
                      {getDifficultyLabel(selectedDungeon.difficulty)}
                    </span>
                    <span className="level-requirement-large">
                      Niveau requis: {selectedDungeon.level_requirement}
                    </span>
                    <span className="duration-large">
                      Durée estimée: {selectedDungeon.estimated_duration} minutes
                    </span>
                  </div>
                </div>
              </div>

              <div className="dungeon-details-content">
                <div className="enemies-section">
                  <h3>👹 Ennemis ({selectedDungeon.enemies ? selectedDungeon.enemies.length : 0})</h3>
                  <div className="enemies-list">
                    {selectedDungeon.enemies && selectedDungeon.enemies.length > 0 ? (
                      selectedDungeon.enemies.map((enemy, index) => {
                        const enemyStats = enemyStats[enemy] || {
                          hp: 0, atk: 0, def: 0, spd: 0
                        };
                        return (
                          <div key={index} className="enemy-item">
                            <span className="enemy-icon">👹</span>
                            <div className="enemy-info">
                              <span className="enemy-name">{enemy}</span>
                              <span className="enemy-level">Niveau {selectedDungeon.level_requirement}</span>
                            </div>
                            <div className="enemy-stats">
                              <span className="enemy-hp">❤️ {enemyStats.hp}</span>
                              <span className="enemy-attack">⚔️ {enemyStats.atk}</span>
                              <span className="enemy-defense">🛡️ {enemyStats.def}</span>
                              <span className="enemy-speed">💨 {enemyStats.spd}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p>Aucun ennemi trouvé pour ce donjon.</p>
                    )}
                  </div>
                </div>

                <div className="rewards-preview">
                  <h3>💰 Récompenses estimées</h3>
                  <div className="rewards-grid">
                    <div className="reward-item">
                      <span className="reward-icon">⭐</span>
                      <span className="reward-label">EXP:</span>
                      <span className="reward-value">{Math.floor(selectedDungeon.level_requirement * 8)}-{Math.floor(selectedDungeon.level_requirement * 15)}</span>
                    </div>
                    <div className="reward-item">
                      <span className="reward-icon">🪙</span>
                      <span className="reward-label">Or:</span>
                      <span className="reward-value">{Math.floor(selectedDungeon.level_requirement * 3)}-{Math.floor(selectedDungeon.level_requirement * 8)}</span>
                    </div>
                    <div className="reward-item">
                      <span className="reward-icon">📦</span>
                      <span className="reward-label">Items:</span>
                      <span className="reward-value">1-2</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dungeon-actions">
                <button 
                  className="start-dungeon-btn"
                  onClick={handleStartDungeon}
                  disabled={completingDungeon}
                >
                  {completingDungeon ? '⏳ En cours...' : '🚀 Lancer le donjon'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal des récompenses */}
      <AnimatePresence>
        {showRewards && rewards && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeRewards}
          >
            <motion.div
              className="rewards-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-btn" onClick={closeRewards}>×</button>
              
              <div className="rewards-header">
                <h2>🎉 Donjon terminé !</h2>
                {rewards.level_up && (
                  <div className="level-up-notification">
                    <h3>🎊 NIVEAU SUPÉRIEUR ! 🎊</h3>
                    <p>Vous êtes maintenant niveau {rewards.new_level} !</p>
                  </div>
                )}
                <p>Voici vos récompenses :</p>
              </div>

              <div className="rewards-content">
                <div className="reward-section">
                  <h3>⭐ Expérience gagnée</h3>
                  <div className="xp-reward">
                    <span className="xp-icon">⭐</span>
                    <span className="xp-amount">+{rewards.xp_gained} EXP</span>
                  </div>
                </div>

                <div className="reward-section">
                  <h3>🪙 Monnaie gagnée</h3>
                  <div className="gold-rewards">
                    {Object.entries(rewards.gold_gained).map(([currency, amount]) => {
                      if (amount > 0) {
                        const currencyInfo = getCurrencyInfo(currency);
                        return (
                          <div key={currency} className="gold-item" style={{ color: currencyInfo.color }}>
                            <span className="gold-icon">{currencyInfo.icon}</span>
                            <span className="gold-amount">+{amount} {currencyInfo.name}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>

                {rewards.items_gained && rewards.items_gained.length > 0 && (
                  <div className="reward-section">
                    <h3>📦 Items obtenus</h3>
                    <div className="items-rewards">
                      {rewards.items_gained.map((item, index) => (
                        <div key={index} className="item-reward">
                          <span className="item-icon">📦</span>
                          <div className="item-info">
                            <span className="item-name">{item.name}</span>
                            <span 
                              className="item-rarity"
                              style={{ color: getRarityColor(item.rarity) }}
                            >
                              {item.rarity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rewards-actions">
                <button className="continue-btn" onClick={closeRewards}>
                  Continuer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Système de combat */}
        {showCombat && characterData && selectedDungeon && (
          <motion.div
            className="combat-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CombatSystem
              dungeon={selectedDungeon}
              characterData={characterData}
              onCombatEnd={handleCombatEnd}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DungeonPage;
