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
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finalStats, setFinalStats] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);


  useEffect(() => {
    const loadCharacterData = async () => {
      // Éviter les appels multiples
      if (hasLoaded || !user || !user.id) {
        return;
      }
      
      try {
        setLoading(true);
        setHasLoaded(true);
        
        const [characterData, profileData] = await Promise.all([
          databaseService.getCharacterData(user.id),
          databaseService.getUserProfile()
        ]);
        
        // Récupérer les stats finales avec équipement
        try {
          const statsResponse = await fetch(`/api/characters/${user.id}/stats`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            const calculated = statsData.stats?.calculated || null;
            const characterWithFinalStats = {
              ...characterData,
              stats: {
                ...characterData.stats,
                calculated: calculated || characterData.stats?.calculated
              }
            };
            setCharacter(characterWithFinalStats);
            setFinalStats(calculated);
          } else {
            console.warn('Stats API non disponible, utilisation des stats de base');
            setCharacter(characterData);
          }
        } catch (statsError) {
          console.warn('Erreur stats API, utilisation des stats de base:', statsError);
          setCharacter(characterData);
        }
        
        setUserProfile(profileData);
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
      if (user && user.id) {
        const statsResponse = await fetch(`/api/characters/${user.id}/stats`, {
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
        }
      }
    } catch (err) {
      console.error('Erreur lors du rechargement des stats:', err);
    }
  };

  // Calculer les statistiques dynamiques
  const getStats = () => {
    if (!character) return [];
    
    // Calculer les stats en temps réel
    const calculateRealTimeStats = () => {
      const baseStatsDisplay = character.stats?.base_stats_display || {};
      const secondaryStats = character.stats?.secondary_stats || {};
      
      const maxHealth = (baseStatsDisplay.health || 100) + Math.round(secondaryStats.vitality * 2);
      const maxMana = (baseStatsDisplay.mana || 50) + Math.round(secondaryStats.wisdom * 1.5);
      
      return { maxHealth, maxMana };
    };
    
    const { maxHealth, maxMana } = calculateRealTimeStats();
    
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
        value: `${Math.min(character.health, maxHealth)}/${maxHealth}`, 
        color: '#ff6b6b'
      },
      { 
        icon: <Zap size={24} />, 
        label: 'Mana', 
        value: `${Math.min(character.mana, maxMana)}/${maxMana}`, 
        color: '#667eea'
      }
    ];
  };

  // Calculer les statistiques de combat
  const getCombatStats = () => {
    if (!character) return [];
    
    // Utiliser les stats finales si disponibles, sinon les stats de base
    const stats = finalStats || character;
    
    return [
      { 
        icon: <Sword size={24} />, 
        label: 'Attaque', 
        value: stats.attack, 
        color: '#e74c3c' 
      },
      { 
        icon: <Shield size={24} />, 
        label: 'Défense', 
        value: stats.defense, 
        color: '#3498db' 
      },
      { 
        icon: <Zap size={24} />, 
        label: 'Magie', 
        value: stats.magic_attack, 
        color: '#9b59b6' 
      },
      { 
        icon: <TrendingUp size={24} />, 
        label: 'Critique', 
        value: `${parseFloat(stats.critical_rate).toFixed(1)}%`, 
        color: '#f39c12' 
      }
    ];
  };

  // Calculer les stats principales (10 stats cohérentes)
  const getMainStats = () => {
    if (!character) return [];
    
    // Calculer les bonus en temps réel
    const calculateRealTimeBonuses = () => {
      const secondaryStats = character.stats?.secondary_stats || {};
      return {
        health_bonus: Math.round(secondaryStats.vitality * 2),
        mana_bonus: Math.round(secondaryStats.wisdom * 1.5),
        attack_bonus: Math.round(secondaryStats.strength * 1.2),
        defense_bonus: Math.round(secondaryStats.endurance * 0.8),
        magic_attack_bonus: Math.round(secondaryStats.intelligence * 1.0),
        magic_defense_bonus: Math.round(secondaryStats.resistance * 0.6),
        critical_rate_bonus: Math.round(secondaryStats.precision * 0.3 * 100) / 100,
        critical_damage_bonus: Math.round(secondaryStats.strength * 0.5 * 100) / 100,
        physical_power_bonus: Math.round(secondaryStats.strength * 2.0),
        spell_power_bonus: Math.round(secondaryStats.intelligence * 1.8)
      };
    };

    const secondaryBonuses = calculateRealTimeBonuses();
    const secondaryStatsWithRanks = character.stats?.secondary_stats_with_ranks || {};
    
    return [
      { 
        icon: <Heart size={20} />, 
        label: 'Vitalité', 
        value: `+${secondaryBonuses.health_bonus} PV, +${((secondaryStatsWithRanks.vitality?.value || 10) * 0.1).toFixed(1)}/s`,
        color: secondaryStatsWithRanks.vitality?.color || '#ff6b6b',
        rank: secondaryStatsWithRanks.vitality?.rank || 'F',
        description: 'Vie et régénération'
      },
      { 
        icon: <Sword size={20} />, 
        label: 'Force', 
        value: `+${secondaryBonuses.attack_bonus} ATQ, +${secondaryBonuses.physical_power_bonus} PWR`,
        color: secondaryStatsWithRanks.strength?.color || '#e74c3c',
        rank: secondaryStatsWithRanks.strength?.rank || 'F',
        description: 'Attaque physique'
      },
      { 
        icon: <Zap size={20} />, 
        label: 'Intelligence', 
        value: `+${secondaryBonuses.magic_attack_bonus} MATQ, +${secondaryBonuses.spell_power_bonus} PWR`,
        color: secondaryStatsWithRanks.intelligence?.color || '#9b59b6',
        rank: secondaryStatsWithRanks.intelligence?.rank || 'F',
        description: 'Magie et mana'
      },
      { 
        icon: <TrendingUp size={20} />, 
        label: 'Agilité', 
        value: `+${((secondaryStatsWithRanks.agility?.value || 10) * 0.3).toFixed(1)}% Esquive, +${((secondaryStatsWithRanks.agility?.value || 10) * 0.5).toFixed(1)}% Vitesse`,
        color: secondaryStatsWithRanks.agility?.color || '#2ecc71',
        rank: secondaryStatsWithRanks.agility?.rank || 'F',
        description: 'Vitesse et esquive'
      },
      { 
        icon: <Shield size={20} />, 
        label: 'Résistance', 
        value: `+${secondaryBonuses.magic_defense_bonus} MDEF`,
        color: secondaryStatsWithRanks.resistance?.color || '#3498db',
        rank: secondaryStatsWithRanks.resistance?.rank || 'F',
        description: 'Défense magique'
      },
      { 
        icon: <Target size={20} />, 
        label: 'Précision', 
        value: `+${((secondaryStatsWithRanks.precision?.value || 10) * 0.3).toFixed(1)}% Critique`,
        color: secondaryStatsWithRanks.precision?.color || '#f39c12',
        rank: secondaryStatsWithRanks.precision?.rank || 'F',
        description: 'Taux de critique'
      },
      { 
        icon: <Shield size={20} />, 
        label: 'Endurance', 
        value: `+${secondaryBonuses.defense_bonus} DEF`,
        color: secondaryStatsWithRanks.endurance?.color || '#8e44ad',
        rank: secondaryStatsWithRanks.endurance?.rank || 'F',
        description: 'Défense physique'
      },
      { 
        icon: <Brain size={20} />, 
        label: 'Sagesse', 
        value: `+${((secondaryStatsWithRanks.wisdom?.value || 10) * 0.15).toFixed(1)}/s Mana`,
        color: secondaryStatsWithRanks.wisdom?.color || '#1abc9c',
        rank: secondaryStatsWithRanks.wisdom?.rank || 'F',
        description: 'Régénération mana'
      },
      { 
        icon: <Shield size={20} />, 
        label: 'Constitution', 
        value: `+${((secondaryStatsWithRanks.constitution?.value || 10) * 0.2).toFixed(1)}% Blocage`,
        color: secondaryStatsWithRanks.constitution?.color || '#e67e22',
        rank: secondaryStatsWithRanks.constitution?.rank || 'F',
        description: 'Résistance effets'
      },
      { 
        icon: <Target size={20} />, 
        label: 'Dextérité', 
        value: `+${((secondaryStatsWithRanks.dexterity?.value || 10) * 0.2).toFixed(1)}% Esquive, +${((secondaryStatsWithRanks.dexterity?.value || 10) * 0.15).toFixed(1)}% Parade`,
        color: secondaryStatsWithRanks.dexterity?.color || '#27ae60',
        rank: secondaryStatsWithRanks.dexterity?.rank || 'F',
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
    <div className="dashboard">
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>🏠 Tableau de Bord</h1>
        <p>Bienvenue, {character.name} ! Niveau {character.level}</p>
        <div className="character-class">
          <span className="class-badge">{character.class_name}</span>
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
              <strong>Nom:</strong> {character.name}
            </div>
            <div className="info-item">
              <strong>Classe:</strong> {character.class_display_name}
            </div>
            <div className="info-item">
              <strong>Niveau:</strong> {character.level}
            </div>
            <div className="info-item">
              <strong>Expérience:</strong> {character.experience} / {character.experience_to_next}
            </div>
            <div className="info-item">
              <strong>Créé le:</strong> {new Date(character.created_at).toLocaleDateString('fr-FR')}
            </div>
            <div className="info-item">
              <strong>Dernière connexion:</strong> {userProfile ? new Date(userProfile.last_login).toLocaleDateString('fr-FR') : 'N/A'}
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
