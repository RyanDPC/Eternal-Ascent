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
    // Aligner avec le Dashboard: utiliser stats.calculated, puis base
    const stats = finalStats || character?.stats?.calculated || character?.stats?.base || {};
    
    return [
      { key: 'attack', label: 'Attaque', value: (stats.attack !== undefined ? stats.attack : 'NO_DATA'), icon: <Sword size={24} />, color: '#e74c3c' },
      { key: 'defense', label: 'Défense', value: (stats.defense !== undefined ? stats.defense : 'NO_DATA'), icon: <Shield size={24} />, color: '#3498db' },
      { key: 'magic_attack', label: 'Attaque Magique', value: (stats.magic_attack !== undefined ? stats.magic_attack : 'NO_DATA'), icon: <Zap size={24} />, color: '#9b59b6' },
      { key: 'magic_defense', label: 'Défense Magique', value: (stats.magic_defense !== undefined ? stats.magic_defense : 'NO_DATA'), icon: <Shield size={24} />, color: '#e67e22' },
      { key: 'critical_rate', label: 'Chance Critique', value: (stats.critical_rate !== undefined ? `${parseFloat(stats.critical_rate).toFixed(1)}%` : 'NO_DATA'), icon: <TrendingUp size={24} />, color: '#f39c12' },
      { key: 'critical_damage', label: 'Dégâts Critiques', value: (stats.critical_damage !== undefined ? `${parseFloat(stats.critical_damage).toFixed(1)}%` : 'NO_DATA'), icon: <Zap size={24} />, color: '#e74c3c' }
    ];
  };

  // Calculer les statistiques de base
  const getBaseStats = () => {
    if (!character) return [];
    
    // Aligner avec le Dashboard: utiliser les données brutes sans fallback
    const calculated = character.stats?.calculated;
    const currentHealth = calculated?.health;
    const currentMana = calculated?.mana;
    const maxHealth = calculated?.max_health;
    const maxMana = calculated?.max_mana;
    
    const endurance = character.stats?.secondary?.endurance;
    const computedMaxStamina = (endurance !== undefined && endurance !== null)
      ? Math.round(100 + endurance * 5)
      : undefined;
    const currentStamina = (computedMaxStamina !== undefined)
      ? Math.min(character.stamina ?? computedMaxStamina, computedMaxStamina)
      : undefined;
    
    return [
      { 
        key: 'health', 
        label: 'Santé', 
        value: (currentHealth !== undefined && maxHealth !== undefined) ? `${currentHealth}/${maxHealth}` : 'NO_DATA', 
        icon: <Heart size={24} />, 
        color: '#ff6b6b'
      },
      { 
        key: 'mana', 
        label: 'Mana', 
        value: (currentMana !== undefined && maxMana !== undefined) ? `${currentMana}/${maxMana}` : 'NO_DATA', 
        icon: <Zap size={24} />, 
        color: '#667eea'
      },
      { 
        key: 'stamina', 
        label: 'Endurance', 
        value: (currentStamina !== undefined && computedMaxStamina !== undefined) ? `${currentStamina}/${computedMaxStamina}` : 'NO_DATA', 
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
    
    const secondaryStats = character.stats?.secondary || {};
    
    const n = (v) => (v !== undefined && v !== null);
    
    const result = [
      { 
        key: 'vitality', 
        label: 'Vitalité', 
        value: n(secondaryStats.vitality) ? `+${Math.round(secondaryStats.vitality * 2)} PV` : 'NO_DATA', 
        icon: <Heart size={24} />, 
        color: '#ff6b6b', 
        rank: secondaryStats.vitality_rank || null,
        description: 'Vie maximale + Régénération de vie'
      },
      { 
        key: 'strength', 
        label: 'Force', 
        value: n(secondaryStats.strength) ? `+${Math.round(secondaryStats.strength * 1.2)} ATQ` : 'NO_DATA', 
        icon: <Sword size={24} />, 
        color: '#e74c3c', 
        rank: secondaryStats.strength_rank || null,
        description: 'Attaque physique + Puissance physique'
      },
      { 
        key: 'intelligence', 
        label: 'Intelligence', 
        value: n(secondaryStats.intelligence) ? `+${Math.round(secondaryStats.intelligence * 1.0)} MATQ` : 'NO_DATA', 
        icon: <Brain size={24} />, 
        color: '#9b59b6', 
        rank: secondaryStats.intelligence_rank || null,
        description: 'Attaque magique + Mana + Puissance des sorts'
      },
      { 
        key: 'agility', 
        label: 'Agilité', 
        value: n(secondaryStats.agility) ? `+${(secondaryStats.agility * 0.3).toFixed(1)}% Esquive` : 'NO_DATA', 
        icon: <Zap size={24} />, 
        color: '#2ecc71', 
        rank: secondaryStats.agility_rank || null,
        description: 'Esquive + Vitesse d\'attaque + Mouvement'
      },
      { 
        key: 'resistance', 
        label: 'Résistance', 
        value: n(secondaryStats.resistance) ? `+${Math.round(secondaryStats.resistance * 0.6)} MDEF` : 'NO_DATA', 
        icon: <Shield size={24} />, 
        color: '#3498db', 
        rank: secondaryStats.resistance_rank || null,
        description: 'Défense magique + Résistance aux effets'
      },
      { 
        key: 'precision', 
        label: 'Précision', 
        value: n(secondaryStats.precision) ? `+${(secondaryStats.precision * 0.3).toFixed(1)}% Critique` : 'NO_DATA', 
        icon: <Target size={24} />, 
        color: '#f39c12', 
        rank: secondaryStats.precision_rank || null,
        description: 'Taux de critique + Précision des attaques'
      },
      { 
        key: 'endurance', 
        label: 'Endurance', 
        value: n(secondaryStats.endurance) ? `+${Math.round(secondaryStats.endurance * 0.8)} DEF` : 'NO_DATA', 
        icon: <Heart size={24} />, 
        color: '#8e44ad', 
        rank: secondaryStats.endurance_rank || null,
        description: 'Défense physique + Résistance aux dégâts'
      },
      { 
        key: 'wisdom', 
        label: 'Sagesse', 
        value: n(secondaryStats.wisdom) ? `+${(secondaryStats.wisdom * 0.15).toFixed(1)}/s Mana` : 'NO_DATA', 
        icon: <Brain size={24} />, 
        color: '#1abc9c', 
        rank: secondaryStats.wisdom_rank || null,
        description: 'Régénération de mana + Efficacité magique'
      },
      { 
        key: 'constitution', 
        label: 'Constitution', 
        value: n(secondaryStats.constitution) ? `+${(secondaryStats.constitution * 0.28).toFixed(1)}% Blocage` : 'NO_DATA', 
        icon: <Shield size={24} />, 
        color: '#e67e22', 
        rank: secondaryStats.constitution_rank || null,
        description: 'Résistance aux effets + Chance de blocage'
      },
      { 
        key: 'dexterity', 
        label: 'Dextérité', 
        value: n(secondaryStats.dexterity) ? `+${(secondaryStats.dexterity * 0.2).toFixed(1)}% Esquive, +${(secondaryStats.dexterity * 0.15).toFixed(1)}% Parade` : 'NO_DATA', 
        icon: <Target size={24} />, 
        color: '#27ae60', 
        rank: secondaryStats.dexterity_rank || null,
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
              <p className="overview-character-class">{character.class_display_name || character.class_name}</p>
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

          {/* Informations Supplémentaires - déplacées ici et rendues en cartes horizontales */}
          <motion.div
            className="overview-stats-section overview-additional-as-cards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <h3>📋 Informations</h3>
            <div className="overview-stats-grid overview-main-stats">
              <div className="overview-stat-card overview-main">
                <div className="overview-stat-icon">📅</div>
                <div className="overview-stat-info">
                  <div className="overview-stat-value">
                    {userProfile && new Date(userProfile.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="overview-stat-label">Créé le</div>
                </div>
              </div>
              <div className="overview-stat-card overview-main">
                <div className="overview-stat-icon">🕒</div>
                <div className="overview-stat-info">
                  <div className="overview-stat-value">
                    {userProfile && userProfile.last_login && new Date(userProfile.last_login).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="overview-stat-label">Dernière connexion</div>
                </div>
              </div>
              <div className="overview-stat-card overview-main">
                <div className="overview-stat-icon">🎖️</div>
                <div className="overview-stat-info">
                  <div className="overview-stat-value">{character.title || 'Aucun Titre'}</div>
                  <div className="overview-stat-label">Titre</div>
                </div>
              </div>
              <div className="overview-stat-card overview-main">
                <div className="overview-stat-icon">🏹</div>
                <div className="overview-stat-info">
                  <div className="overview-stat-value">{character.class_display_name}</div>
                  <div className="overview-stat-label">Classe</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CharacterOverview;
