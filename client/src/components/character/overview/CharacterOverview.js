import React from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Sword, Zap, Heart, TrendingUp, Crown, Target, Brain, Package, Star, BookOpen } from 'lucide-react';
import './CharacterOverview.css';

const CharacterOverview = ({ 
  character, 
  userProfile, 
  finalStats, 
  loading, 
  error, 
  selectedSection, 
  setSelectedSection 
}) => {
  // Calculer les statistiques dynamiques
  const getCombatStats = () => {
    // Utiliser les stats finales si disponibles, sinon les stats de base
    const stats = finalStats || character;
    
    return [
      { key: 'attack', label: 'Attaque', value: stats.attack, icon: <Sword size={24} />, color: '#e74c3c' },
      { key: 'defense', label: 'Défense', value: stats.defense, icon: <Shield size={24} />, color: '#3498db' },
      { key: 'magic_attack', label: 'Attaque Magique', value: stats.magic_attack, icon: <Zap size={24} />, color: '#9b59b6' },
      { key: 'magic_defense', label: 'Défense Magique', value: stats.magic_defense, icon: <Shield size={24} />, color: '#e67e22' },
      { key: 'critical_rate', label: 'Chance Critique', value: `${parseFloat(stats.critical_rate).toFixed(1)}%`, icon: <TrendingUp size={24} />, color: '#f39c12' },
      { key: 'critical_damage', label: 'Dégâts Critiques', value: `${parseFloat(stats.critical_damage).toFixed(1)}%`, icon: <Zap size={24} />, color: '#e74c3c' }
    ];
  };

  // Calculer les statistiques de base
  const getBaseStats = () => {
    if (!character) return [];
    
    // Calculer les stats principales en temps réel avec le système équilibré
    const calculateRealTimeStats = () => {
      const baseStatsDisplay = character.stats?.base_stats_display || {};
      const secondaryStats = character.stats?.secondary_stats || {};
      
      const baseHealth = baseStatsDisplay.health || 100;
      const baseMana = baseStatsDisplay.mana || 50;
      
      // Utiliser le même système que le dashboard (système équilibré)
      const healthBonus = Math.round(secondaryStats.vitality * 2);
      const manaBonus = Math.round(secondaryStats.wisdom * 1.5);
      
      const maxHealth = baseHealth + healthBonus;
      const maxMana = baseMana + manaBonus;
      
      return {
        maxHealth,
        maxMana,
        healthBonus,
        manaBonus,
        baseHealth,
        baseMana
      };
    };
    
    const realTimeStats = calculateRealTimeStats();
    
    return [
      { 
        key: 'health', 
        label: 'Santé', 
        value: `${Math.min(character.health || 100, realTimeStats.maxHealth)}/${realTimeStats.maxHealth}`, 
        icon: <Heart size={24} />, 
        color: '#ff6b6b'
      },
      { 
        key: 'mana', 
        label: 'Mana', 
        value: `${Math.min(character.mana || 80, realTimeStats.maxMana)}/${realTimeStats.maxMana}`, 
        icon: <Zap size={24} />, 
        color: '#667eea'
      },
      { 
        key: 'stamina', 
        label: 'Endurance', 
        value: `${character.stamina || 100}/${character.max_stamina || 100}`, 
        icon: <Heart size={24} />, 
        color: '#fdcb6e' 
      }
    ];
  };

  // Calculer les stats principales (10 stats cohérentes)
  const getMainStats = () => {
    if (!character) {
      console.log('CharacterOverview: No character data');
      return [];
    }
    
    const stats = character;
    const secondaryStatsWithRanks = character.stats?.secondary_stats_with_ranks || {};
    const baseStatsDisplay = character.stats?.base_stats_display || {};
    
    
    // Calculer les bonus en temps réel à partir des stats secondaires (système équilibré)
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
        critical_damage_bonus: Math.round(secondaryStats.precision * 0.5 * 100) / 100,
        physical_power_bonus: Math.round(secondaryStats.strength * 2.0),
        spell_power_bonus: Math.round(secondaryStats.intelligence * 1.8)
      };
    };
    
    const secondaryBonuses = calculateRealTimeBonuses();
    
    const result = [
      { 
        key: 'vitality', 
        label: 'Vitalité', 
        value: `+${secondaryBonuses.health_bonus} PV, +${((secondaryStatsWithRanks.vitality?.value || 10) * 0.1).toFixed(1)}/s`, 
        icon: <Heart size={24} />, 
        color: secondaryStatsWithRanks.vitality?.color || '#ff6b6b', 
        rank: secondaryStatsWithRanks.vitality?.rank || 'F',
        description: 'Vie maximale + Régénération de vie'
      },
      { 
        key: 'strength', 
        label: 'Force', 
        value: `+${secondaryBonuses.attack_bonus} ATQ, +${secondaryBonuses.physical_power_bonus} PWR`, 
        icon: <Sword size={24} />, 
        color: secondaryStatsWithRanks.strength?.color || '#e74c3c', 
        rank: secondaryStatsWithRanks.strength?.rank || 'F',
        description: 'Attaque physique + Puissance physique'
      },
      { 
        key: 'intelligence', 
        label: 'Intelligence', 
        value: `+${secondaryBonuses.magic_attack_bonus} MATQ, +${secondaryBonuses.spell_power_bonus} PWR`, 
        icon: <Brain size={24} />, 
        color: secondaryStatsWithRanks.intelligence?.color || '#9b59b6', 
        rank: secondaryStatsWithRanks.intelligence?.rank || 'F',
        description: 'Attaque magique + Mana + Puissance des sorts'
      },
      { 
        key: 'agility', 
        label: 'Agilité', 
        value: `+${((secondaryStatsWithRanks.agility?.value || 10) * 0.3).toFixed(1)}% Esquive, +${((secondaryStatsWithRanks.agility?.value || 10) * 0.5).toFixed(1)}% Vitesse`, 
        icon: <Zap size={24} />, 
        color: secondaryStatsWithRanks.agility?.color || '#2ecc71', 
        rank: secondaryStatsWithRanks.agility?.rank || 'F',
        description: 'Esquive + Vitesse d\'attaque + Mouvement'
      },
      { 
        key: 'resistance', 
        label: 'Résistance', 
        value: `+${secondaryBonuses.magic_defense_bonus} MDEF`, 
        icon: <Shield size={24} />, 
        color: secondaryStatsWithRanks.resistance?.color || '#3498db', 
        rank: secondaryStatsWithRanks.resistance?.rank || 'F',
        description: 'Défense magique + Résistance aux effets'
      },
      { 
        key: 'precision', 
        label: 'Précision', 
        value: `+${((secondaryStatsWithRanks.precision?.value || 10) * 0.3).toFixed(1)}% Critique`, 
        icon: <Target size={24} />, 
        color: secondaryStatsWithRanks.precision?.color || '#f39c12', 
        rank: secondaryStatsWithRanks.precision?.rank || 'F',
        description: 'Taux de critique + Précision des attaques'
      },
      { 
        key: 'endurance', 
        label: 'Endurance', 
        value: `+${secondaryBonuses.defense_bonus} DEF`, 
        icon: <Heart size={24} />, 
        color: secondaryStatsWithRanks.endurance?.color || '#8e44ad', 
        rank: secondaryStatsWithRanks.endurance?.rank || 'F',
        description: 'Défense physique + Résistance aux dégâts'
      },
      { 
        key: 'wisdom', 
        label: 'Sagesse', 
        value: `+${((secondaryStatsWithRanks.wisdom?.value || 10) * 0.15).toFixed(1)}/s Mana`, 
        icon: <Brain size={24} />, 
        color: secondaryStatsWithRanks.wisdom?.color || '#1abc9c', 
        rank: secondaryStatsWithRanks.wisdom?.rank || 'F',
        description: 'Régénération de mana + Efficacité magique'
      },
      { 
        key: 'constitution', 
        label: 'Constitution', 
        value: `+${((secondaryStatsWithRanks.constitution?.value || 10) * 0.28).toFixed(1)}% Blocage`, 
        icon: <Shield size={24} />, 
        color: secondaryStatsWithRanks.constitution?.color || '#e67e22', 
        rank: secondaryStatsWithRanks.constitution?.rank || 'F',
        description: 'Résistance aux effets + Chance de blocage'
      },
      { 
        key: 'dexterity', 
        label: 'Dextérité', 
        value: `+${((secondaryStatsWithRanks.dexterity?.value || 10) * 0.2).toFixed(1)}% Esquive, +${((secondaryStatsWithRanks.dexterity?.value || 10) * 0.15).toFixed(1)}% Parade`, 
        icon: <Target size={24} />, 
        color: secondaryStatsWithRanks.dexterity?.color || '#27ae60', 
        rank: secondaryStatsWithRanks.dexterity?.rank || 'F',
        description: 'Précision avancée + Esquive + Parade'
      }
    ];
    
    return result;
  };

  // Gestion des états de chargement et d'erreur
  if (loading) {
    return (
      <div className="character-page">
        <div className="character-loading">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="loading-spinner"
          >
            ⚔️
          </motion.div>
          <p>Chargement de votre personnage...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="character-page">
        <div className="character-error">
          <h2>❌ Erreur</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="character-page">
        <div className="character-no-data">
          <h2>🎭 Aucun personnage trouvé</h2>
          <p>Créez votre premier personnage pour commencer l'aventure !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="character-overview-container">
      <div className="character-overview">
        {/* Colonne principale - Stats de base et combat */}
        <div className="character-main-section">
          {/* Character Info */}
          <motion.div
            className="overview-character-info"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="overview-character-avatar">
              <div className="overview-avatar-icon">
                {character.class_name === 'warrior' ? '⚔️' : 
                 character.class_name === 'mage' ? '🔮' : 
                 character.class_name === 'archer' ? '🏹' : 
                 character.class_name === 'rogue' ? '🗡️' : 
                 character.class_name === 'tank' ? '🛡️' : 
                 character.class_name === 'healer' ? '💚' : '👤'}
              </div>
              <div className="overview-level-badge">
                <Crown size={16} />
                <span>{character.level}</span>
              </div>
            </div>
            <div className="overview-character-details">
              <h2>{character.name}</h2>
              <p className="overview-character-class">{character.class_name}</p>
              <div className="overview-character-level">
                <span>Niveau {character.level}</span>
                <div className="overview-exp-bar">
                  <div 
                    className="overview-exp-fill" 
                    style={{ 
                      width: `${Math.min((character.experience / character.experience_to_next) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <span>{character.experience} / {character.experience_to_next} EXP</span>
                {character.experience > character.experience_to_next && (
                  <button 
                    className="overview-fix-exp-button"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/characters/${character.id}/fix-experience`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                          }
                        });
                        
                        if (response.ok) {
                          const result = await response.json();
                          if (result.level_up) {
                            alert(`🎉 Montée de niveau ! Vous êtes maintenant niveau ${result.new_level} !`);
                            window.location.reload(); // Recharger pour voir les nouvelles stats
                          } else {
                            alert('✅ Données d\'expérience corrigées !');
                            window.location.reload();
                          }
                        }
                      } catch (error) {
                        console.error('Erreur lors de la correction:', error);
                        alert('Erreur lors de la correction de l\'expérience');
                      }
                    }}
                  >
                    🔧 Corriger l'EXP
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats de Base */}
          <motion.div
            className="overview-stats-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3>💪 Statistiques de Base</h3>
            <div className="overview-stats-grid">
              {getBaseStats().map((stat, index) => (
                <motion.div
                  key={stat.key}
                  className="overview-stat-card overview-base"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="overview-stat-icon" style={{ color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="overview-stat-info">
                    <div className="overview-stat-value">{stat.value}</div>
                    <div className="overview-stat-label">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats de Combat */}
          <motion.div
            className="overview-stats-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3>⚔️ Statistiques de Combat</h3>
            <div className="overview-stats-grid">
              {getCombatStats().map((stat, index) => (
                <motion.div
                  key={stat.key}
                  className="overview-stat-card overview-combat"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="overview-stat-icon" style={{ color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="overview-stat-info">
                    <div className="overview-stat-value">{stat.value}</div>
                    <div className="overview-stat-label">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Informations Supplémentaires */}
          <motion.div
            className="overview-character-additional-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h3>📋 Informations</h3>
            <div className="overview-info-grid">
              <div className="overview-info-item">
                <strong>Créé le:</strong> {userProfile && new Date(userProfile.created_at).toLocaleDateString('fr-FR')}
              </div>
              <div className="overview-info-item">
                <strong>Dernière connexion:</strong> {userProfile && userProfile.last_login && new Date(userProfile.last_login).toLocaleDateString('fr-FR')}
              </div>
              <div className="overview-info-item">
                <strong>Titre:</strong> {character.title || 'Aucun Titre'}
              </div>
              <div className="overview-info-item">
                <strong>Classe:</strong> {character.class_display_name}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Colonne secondaire - Stats principales */}
        <div className="character-side-section">
          {/* Stats Principales (10 stats cohérentes) */}
          <motion.div
            className="overview-stats-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <h3>⭐ Statistiques Principales</h3>
            <div className="overview-stats-grid overview-main-stats">
              {getMainStats().map((stat, index) => (
                <motion.div
                  key={stat.key}
                  className="overview-stat-card overview-main"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  title={stat.description}
                >
                  <div className="overview-stat-icon" style={{ color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="overview-stat-info">
                    <div className="overview-stat-value">{stat.value}</div>
                    <div className="overview-stat-label">{stat.label}</div>
                    {stat.rank && (
                      <div className="overview-stat-rank" style={{ color: stat.color }}>
                        RANG {stat.rank}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CharacterOverview;
