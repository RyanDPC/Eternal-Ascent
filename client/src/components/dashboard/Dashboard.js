import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, TrendingUp, Trophy, Users, Sword, Shield, Heart, Zap, Target, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import databaseService from '../../services/databaseService';
// import AutoSaveIndicator from '../common/AutoSaveIndicator';

import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [characterId, setCharacterId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finalStats, setFinalStats] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [forceReflow, setForceReflow] = useState(false);


  useEffect(() => {
    const loadCharacterData = async () => {
      // Éviter les appels multiples
      if (hasLoaded || !user) {
        return;
      }
      
      try {
        setLoading(true);
        setHasLoaded(true);
        
        // Récupérer les données du personnage et du profil
        const [characterData, profileData] = await Promise.all([
          databaseService.getCurrentCharacterData(),
          databaseService.getUserProfile()
        ]);
        
        // Normaliser les données du personnage
        const character = characterData.character || characterData;
        
        // Stocker l'ID du personnage pour les appels futurs
        setCharacterId(character.id);
        
        // Récupérer les stats finales avec équipement
        try {
          const statsResponse = await fetch(`${databaseService.baseURL}/characters/${character.id}/stats`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            const calculated = statsData.stats?.calculated || null;
            const characterWithFinalStats = {
              ...character,
              ...statsData.final_stats,
              equipped_items: statsData.equipped_items
            };
            setCharacter(characterWithFinalStats);
            setFinalStats(calculated);
          } else {
            console.warn('Stats API non disponible, utilisation des stats de base');
            setCharacter(character);
          }
        } catch (statsError) {
          console.warn('Erreur stats API, utilisation des stats de base:', statsError);
          setCharacter(character);
        }
        
        setUserProfile(profileData);
        
        // Forcer le rechargement des styles après le chargement des données
        setTimeout(() => {
          setForceReflow(true);
          // Forcer le recalcul de la grille
          const grids = document.querySelectorAll('.stats-grid');
          grids.forEach(grid => {
            grid.style.display = 'none';
            grid.offsetHeight; // Force reflow
            grid.style.display = 'grid';
          });
          setTimeout(() => setForceReflow(false), 100);
        }, 50);
      } catch (err) {
        console.error('Erreur lors du chargement du personnage:', err);
        setError('Impossible de charger les données du personnage');
      } finally {
        setLoading(false);
      }
    };

    loadCharacterData();
  }, [user, hasLoaded]);

  // Fonction pour recharger les stats après équipement/déséquipement
  const reloadStats = async () => {
    try {
      if (characterId) {
        const statsResponse = await fetch(`${databaseService.baseURL}/characters/${characterId}/stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const calculated = statsData.stats?.calculated || null;
          setFinalStats(calculated);
          // Mettre à jour le personnage avec les nouvelles stats
          setCharacter(prevCharacter => ({
            ...prevCharacter,
            stats: {
              ...prevCharacter?.stats,
              calculated: calculated || prevCharacter?.stats?.calculated
            }
          }));
          
          // Forcer le rechargement des styles
          setForceReflow(true);
          setTimeout(() => setForceReflow(false), 100);
        }
      }
    } catch (err) {
      console.error('Erreur lors du rechargement des stats:', err);
    }
  };

  // Forcer le rechargement des styles quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setForceReflow(true);
        // Forcer le recalcul de la grille
        const grids = document.querySelectorAll('.stats-grid');
        grids.forEach(grid => {
          grid.style.display = 'none';
          grid.offsetHeight; // Force reflow
          grid.style.display = 'grid';
        });
        setTimeout(() => setForceReflow(false), 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Forcer le recalcul de la grille quand les données changent
  useEffect(() => {
    if (character) {
      // Petit délai pour laisser le DOM se mettre à jour
      setTimeout(() => {
        const grids = document.querySelectorAll('.stats-grid');
        grids.forEach(grid => {
          // Force le recalcul de la grille
          grid.style.gridTemplateColumns = grid.style.gridTemplateColumns;
        });
      }, 100);
    }
  }, [character, finalStats]);

  // Calculer les statistiques dynamiques
  const getStats = () => {
    if (!character) return [];
    
    // Calculer les stats en temps réel - DONNÉES BRUTES SANS FALLBACK
    const calculateRealTimeStats = () => {
      console.log('🔍 Données brutes du personnage:', character);
      console.log('🔍 calculated_stats:', character.calculated_stats);
      console.log('🔍 stats.calculated:', character.stats?.calculated);
      console.log('🔍 stats.base:', character.stats?.base);
      console.log('🔍 stats.secondary:', character.stats?.secondary);
      
      // Utiliser les données brutes sans fallback - CORRECTION: utiliser stats.calculated
      const calculatedStats = character.stats?.calculated;
      const baseStats = character.stats?.base;
      const secondaryStats = character.stats?.secondary;
      
      // Valeurs brutes - pas de fallback
      const currentHealth = calculatedStats?.health;
      const currentMana = calculatedStats?.mana;
      const maxHealth = calculatedStats?.max_health;
      const maxMana = calculatedStats?.max_mana;
      
      console.log('🔍 Valeurs brutes - Santé:', { currentHealth, maxHealth });
      console.log('🔍 Valeurs brutes - Mana:', { currentMana, maxMana });
      
      return { 
        maxHealth, 
        maxMana,
        currentHealth,
        currentMana
      };
    };
    
    const { maxHealth, maxMana, currentHealth, currentMana } = calculateRealTimeStats();
    
    return [
      { 
        icon: <TrendingUp size={24} />, 
        label: 'Niveau', 
        value: character.level, 
        color: '#4ecdc4' 
      },
      { 
        icon: <Trophy size={24} />, 
        label: 'EXP', 
        value: `${character.experience}/${character.experience_to_next}`, 
        color: '#fdcb6e' 
      },
      { 
        icon: <Heart size={24} />, 
        label: 'Santé', 
        value: (currentHealth !== undefined && maxHealth !== undefined) ? `${currentHealth}/${maxHealth}` : 'NO_DATA', 
        color: '#ff6b6b'
      },
      { 
        icon: <Zap size={24} />, 
        label: 'Mana', 
        value: (currentMana !== undefined && maxMana !== undefined) ? `${currentMana}/${maxMana}` : 'NO_DATA', 
        color: '#667eea'
      }
    ];
  };

  // Calculer les statistiques de combat - DONNÉES BRUTES SANS FALLBACK
  const getCombatStats = () => {
    if (!character) return [];
    
    console.log('🔍 Stats de combat brutes - finalStats:', finalStats);
    console.log('🔍 Stats de combat brutes - calculated_stats:', character.calculated_stats);
    console.log('🔍 Stats de combat brutes - stats.calculated:', character.stats?.calculated);
    console.log('🔍 Stats de combat brutes - stats.base:', character.stats?.base);
    
    // Utiliser les données brutes sans fallback - CORRECTION: utiliser stats.calculated en priorité
    const stats = finalStats || character.stats?.calculated || character.stats?.base || character;
    
    console.log('🔍 Stats de combat finales:', stats);
    
    return [
      { 
        icon: <Sword size={24} />, 
        label: 'Attaque', 
        value: stats.attack !== undefined ? stats.attack : 'NO_DATA', 
        color: '#e74c3c' 
      },
      { 
        icon: <Shield size={24} />, 
        label: 'Défense', 
        value: stats.defense !== undefined ? stats.defense : 'NO_DATA', 
        color: '#3498db' 
      },
      { 
        icon: <Zap size={24} />, 
        label: 'Magie', 
        value: stats.magic_attack !== undefined ? stats.magic_attack : 'NO_DATA', 
        color: '#9b59b6' 
      },
      { 
        icon: <TrendingUp size={24} />, 
        label: 'Critique', 
        value: stats.critical_rate !== undefined ? `${parseFloat(stats.critical_rate).toFixed(1)}%` : 'NO_DATA', 
        color: '#f39c12' 
      }
    ];
  };

  // Calculer les stats principales - DONNÉES BRUTES SANS FALLBACK
  const getMainStats = () => {
    if (!character) return [];
    
    console.log('🔍 Stats principales brutes - character.stats:', character.stats);
    console.log('🔍 Stats principales brutes - stats.secondary:', character.stats?.secondary);
    console.log('🔍 Stats principales brutes - calculated_stats:', character.calculated_stats);
    
    // Utiliser les données brutes sans fallback - CORRECTION: utiliser stats.calculated
    const secondaryStats = character.stats?.secondary;
    const calculatedStats = character.stats?.calculated;
    const baseStats = character.stats?.base;
    
    console.log('🔍 Stats secondaires brutes:', secondaryStats);
    
    // Calculer les bonus en temps réel - SANS FALLBACK
    const calculateRealTimeBonuses = () => {
      if (!secondaryStats) {
        console.log('❌ Pas de stats secondaires disponibles');
        return {
          health_bonus: 'NO_DATA',
          mana_bonus: 'NO_DATA',
          attack_bonus: 'NO_DATA',
          defense_bonus: 'NO_DATA',
          magic_attack_bonus: 'NO_DATA',
          magic_defense_bonus: 'NO_DATA',
          critical_rate_bonus: 'NO_DATA',
          critical_damage_bonus: 'NO_DATA',
          physical_power_bonus: 'NO_DATA',
          spell_power_bonus: 'NO_DATA'
        };
      }
      
      return {
        health_bonus: (secondaryStats.vitality !== undefined && secondaryStats.vitality !== null) ? Math.round(secondaryStats.vitality * 2) : 'NO_VITALITY',
        mana_bonus: (secondaryStats.wisdom !== undefined && secondaryStats.wisdom !== null) ? Math.round(secondaryStats.wisdom * 1.5) : 'NO_WISDOM',
        attack_bonus: (secondaryStats.strength !== undefined && secondaryStats.strength !== null) ? Math.round(secondaryStats.strength * 1.2) : 'NO_STRENGTH',
        defense_bonus: (secondaryStats.endurance !== undefined && secondaryStats.endurance !== null) ? Math.round(secondaryStats.endurance * 0.8) : 'NO_ENDURANCE',
        magic_attack_bonus: (secondaryStats.intelligence !== undefined && secondaryStats.intelligence !== null) ? Math.round(secondaryStats.intelligence * 1.0) : 'NO_INTELLIGENCE',
        magic_defense_bonus: (secondaryStats.resistance !== undefined && secondaryStats.resistance !== null) ? Math.round(secondaryStats.resistance * 0.6) : 'NO_RESISTANCE',
        critical_rate_bonus: (secondaryStats.precision !== undefined && secondaryStats.precision !== null) ? Math.round(secondaryStats.precision * 0.3 * 100) / 100 : 'NO_PRECISION',
        critical_damage_bonus: (secondaryStats.strength !== undefined && secondaryStats.strength !== null) ? Math.round(secondaryStats.strength * 0.5 * 100) / 100 : 'NO_STRENGTH',
        physical_power_bonus: (secondaryStats.strength !== undefined && secondaryStats.strength !== null) ? Math.round(secondaryStats.strength * 2.0) : 'NO_STRENGTH',
        spell_power_bonus: (secondaryStats.intelligence !== undefined && secondaryStats.intelligence !== null) ? Math.round(secondaryStats.intelligence * 1.8) : 'NO_INTELLIGENCE'
      };
    };

    const secondaryBonuses = calculateRealTimeBonuses();
    console.log('🔍 Bonus calculés:', secondaryBonuses);
    
    return [
      { 
        icon: <Heart size={20} />, 
        label: 'Vitalité', 
        value: secondaryBonuses.health_bonus !== 'NO_DATA' ? `+${secondaryBonuses.health_bonus} PV` : 'NO_DATA',
        color: '#ff6b6b',
        rank: secondaryStats?.vitality_rank || null,
        description: 'Vie et régénération'
      },
      { 
        icon: <Sword size={20} />, 
        label: 'Force', 
        value: secondaryBonuses.attack_bonus !== 'NO_DATA' ? `+${secondaryBonuses.attack_bonus} ATQ` : 'NO_DATA',
        color: '#e74c3c',
        rank: secondaryStats?.strength_rank || null,
        description: 'Attaque physique'
      },
      { 
        icon: <Zap size={20} />, 
        label: 'Intelligence', 
        value: secondaryBonuses.magic_attack_bonus !== 'NO_DATA' ? `+${secondaryBonuses.magic_attack_bonus} MATQ` : 'NO_DATA',
        color: '#9b59b6',
        rank: secondaryStats?.intelligence_rank || null,
        description: 'Magie et mana'
      },
      { 
        icon: <TrendingUp size={20} />, 
        label: 'Agilité', 
        value: secondaryStats?.agility ? `+${(secondaryStats.agility * 0.3).toFixed(1)}% Esquive` : 'NO_DATA',
        color: '#2ecc71',
        rank: secondaryStats?.agility_rank || null,
        description: 'Vitesse et esquive'
      },
      { 
        icon: <Shield size={20} />, 
        label: 'Résistance', 
        value: secondaryBonuses.magic_defense_bonus !== 'NO_DATA' ? `+${secondaryBonuses.magic_defense_bonus} MDEF` : 'NO_DATA',
        color: '#3498db',
        rank: secondaryStats?.resistance_rank || null,
        description: 'Défense magique'
      },
      { 
        icon: <Target size={20} />, 
        label: 'Précision', 
        value: secondaryStats?.precision ? `+${(secondaryStats.precision * 0.3).toFixed(1)}% Critique` : 'NO_DATA',
        color: '#f39c12',
        rank: secondaryStats?.precision_rank || null,
        description: 'Taux de critique'
      },
      { 
        icon: <Shield size={20} />, 
        label: 'Endurance', 
        value: secondaryBonuses.defense_bonus !== 'NO_DATA' ? `+${secondaryBonuses.defense_bonus} DEF` : 'NO_DATA',
        color: '#8e44ad',
        rank: secondaryStats?.endurance_rank || null,
        description: 'Défense physique'
      },
      { 
        icon: <Brain size={20} />, 
        label: 'Sagesse', 
        value: secondaryStats?.wisdom ? `+${(secondaryStats.wisdom * 0.15).toFixed(1)}/s Mana` : 'NO_DATA',
        color: '#1abc9c',
        rank: secondaryStats?.wisdom_rank || null,
        description: 'Régénération mana'
      },
      { 
        icon: <Shield size={20} />, 
        label: 'Constitution', 
        value: secondaryStats?.constitution ? `+${(secondaryStats.constitution * 0.2).toFixed(1)}% Blocage` : 'NO_DATA',
        color: '#e67e22',
        rank: secondaryStats?.constitution_rank || null,
        description: 'Résistance effets'
      },
      { 
        icon: <Target size={20} />, 
        label: 'Dextérité', 
        value: secondaryStats?.dexterity ? `+${(secondaryStats.dexterity * 0.2).toFixed(1)}% Esquive` : 'NO_DATA',
        color: '#27ae60',
        rank: secondaryStats?.dexterity_rank || null,
        description: 'Précision avancée'
      }
    ];
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="loading-spinner"
        >
          ⚔️
        </motion.div>
        <p>Chargement de votre personnage...</p>
        {/* Skeleton pour maintenir la structure */}
        <div className="skeleton-grid">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>❌ Erreur</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="dashboard-no-character">
        <h2>🎭 Aucun personnage trouvé</h2>
        <p>Créez votre premier personnage pour commencer l'aventure !</p>
      </div>
    );
  }

  return (
    <div className={`dashboard ${forceReflow ? 'force-reflow' : ''}`}>
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>🏠 Tableau de Bord</h1>
        <p>Bienvenue, {character.name} ! Niveau {character.level}</p>
        <div className="character-class">
          <span className="class-badge">{character.class_display_name || character.class_name || 'Classe'}</span>
        </div>
      </motion.div>

      <div className="dashboard-content">
        {/* Stats Principales */}
        <div className="stats-section">
          <h2>📊 Statistiques Principales</h2>
          <div className="stats-grid">
            {getStats().map((stat, index) => (
              <motion.div
                key={stat.label}
                className="stat-card"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="stat-icon" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats de Combat */}
        <div className="stats-section">
          <h2>⚔️ Statistiques de Combat {finalStats && <span className="equipped-indicator">(avec équipement)</span>}</h2>
          <div className="stats-grid">
            {getCombatStats().map((stat, index) => (
              <motion.div
                key={stat.label}
                className="stat-card combat"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="stat-icon" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats Principales (10 stats cohérentes) */}
        <div className="stats-section">
          <h2>⭐ Statistiques Principales {finalStats && <span className="equipped-indicator">(avec équipement)</span>}</h2>
          <div className="stats-grid main-stats">
            {getMainStats().map((stat, index) => (
              <motion.div
                key={stat.label}
                className="stat-card main"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                title={stat.description}
              >
                <div className="stat-icon" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                  {stat.rank && (
                    <div className="stat-rank" style={{ color: stat.color }}>
                      RANG {stat.rank}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Barre de Progression */}
        <motion.div
          className="progress-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2>📈 Progression</h2>
          <div className="progress-bar">
            <div className="progress-label">
              <span>Niveau {character.level}</span>
              <span>{character.experience} / {character.experience_to_next} EXP</span>
            </div>
            <div className="progress-track">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min((character.experience / character.experience_to_next) * 100, 100)}%` 
                }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="quick-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2>⚡ Actions Rapides</h2>
          <div className="actions-grid">
            <motion.button
              className="action-btn primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/dungeons'}
            >
              🎮 Entrer dans un Donjon
            </motion.button>
            <motion.button
              className="action-btn secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/quests'}
            >
              📜 Voir les Quêtes
            </motion.button>
            <motion.button
              className="action-btn secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/character'}
            >
              🎒 Gérer l'Inventaire
            </motion.button>
            <motion.button
              className="action-btn secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/guilds'}
            >
              👥 Rejoindre une Guilde
            </motion.button>
            <motion.button
              className="action-btn tertiary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={reloadStats}
            >
              🔄 Actualiser les Stats
            </motion.button>
          </div>
        </motion.div>

        {/* Informations du Personnage */}
        <motion.div
          className="character-info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2>🎭 Informations du Personnage</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Nom:</strong> {character.name || 'NO_DATA'}
            </div>
            <div className="info-item">
              <strong>Classe:</strong> {character.class_display_name || character.class?.display_name || character.class_name || 'NO_DATA'}
            </div>
            <div className="info-item">
              <strong>Niveau:</strong> {character.level || 'NO_DATA'}
            </div>
            <div className="info-item">
              <strong>Expérience:</strong> {character.experience !== undefined ? `${character.experience} / ${character.experience_to_next}` : 'NO_DATA'}
            </div>
            <div className="info-item">
              <strong>Créé le:</strong> {(() => {
                try {
                  if (character.created_at) {
                    const date = new Date(character.created_at);
                    return isNaN(date.getTime()) ? 'INVALID_DATE' : date.toLocaleDateString('fr-FR');
                  }
                  return 'NO_DATA';
                } catch (e) {
                  return 'INVALID_DATE';
                }
              })()}
            </div>
            <div className="info-item">
              <strong>Dernière connexion:</strong> {(() => {
                try {
                  if (userProfile?.last_login) {
                    const date = new Date(userProfile.last_login);
                    return isNaN(date.getTime()) ? 'INVALID_DATE' : date.toLocaleDateString('fr-FR');
                  }
                  return 'NO_DATA';
                } catch (e) {
                  return 'INVALID_DATE';
                }
              })()}
            </div>
            <div className="info-item">
              <strong>Titre:</strong> {character.title || 'NO_DATA'}
            </div>
          </div>
        </motion.div>
      </div>
      
              {/* Indicateur de sauvegarde automatique */}
        {/* <AutoSaveIndicator 
          characterData={character}
          onSaveComplete={() => {
            console.log('Données du personnage sauvegardées avec succès');
          }}
        /> */}


    </div>
  );
};

export default Dashboard;
