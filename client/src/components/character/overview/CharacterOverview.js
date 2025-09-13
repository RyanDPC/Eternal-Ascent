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
  // Statistiques de combat (issues directement des données calculées/DB)
  const getCombatStats = () => {
    const stats = finalStats || character?.stats || character || {};
    return [
      { key: 'attack', label: 'Attaque', value: Number(stats.attack ?? 0), icon: <Sword size={24} />, color: '#e74c3c' },
      { key: 'defense', label: 'Défense', value: Number(stats.defense ?? 0), icon: <Shield size={24} />, color: '#3498db' },
      { key: 'magic_attack', label: 'Attaque Magique', value: Number(stats.magic_attack ?? 0), icon: <Zap size={24} />, color: '#9b59b6' },
      { key: 'magic_defense', label: 'Défense Magique', value: Number(stats.magic_defense ?? 0), icon: <Shield size={24} />, color: '#e67e22' },
      { key: 'attack_speed', label: 'Vitesse d\'attaque', value: Number(stats.attack_speed ?? 0).toFixed(1), icon: <Zap size={24} />, color: '#16a085' },
      { key: 'movement_speed', label: 'Vitesse de déplacement', value: Number(stats.movement_speed ?? 0).toFixed(1), icon: <Zap size={24} />, color: '#1abc9c' },
      { key: 'critical_rate', label: 'Chance Critique', value: `${Number(stats.critical_rate ?? 0).toFixed(1)}%`, icon: <TrendingUp size={24} />, color: '#f39c12' },
      { key: 'critical_damage', label: 'Dégâts Critiques', value: `${Number(stats.critical_damage ?? 150).toFixed(1)}%`, icon: <Zap size={24} />, color: '#e74c3c' }
    ];
  };

  // Statistiques de base (issues de la DB/util côté serveur)
  const getBaseStats = () => {
    const stats = finalStats || character?.stats || character || {};
    const health = Number(stats.health ?? character?.health ?? 0);
    const maxHealth = Number(stats.max_health ?? character?.max_health ?? health);
    const mana = Number(stats.mana ?? character?.mana ?? 0);
    const maxMana = Number(stats.max_mana ?? character?.max_mana ?? mana);
    return [
      { key: 'health', label: 'Santé', value: `${Math.min(health, maxHealth)}/${maxHealth}`, icon: <Heart size={24} />, color: '#ff6b6b' },
      { key: 'mana', label: 'Mana', value: `${Math.min(mana, maxMana)}/${maxMana}`, icon: <Zap size={24} />, color: '#667eea' }
    ];
  };

  // Stats principales: afficher les valeurs réelles de la DB (10 stats)
  const getMainStats = () => {
    const s = finalStats || character?.stats || character || {};
    const rows = [
      { key: 'vitality', label: 'Vitalité', icon: <Heart size={24} />, color: '#ff6b6b' },
      { key: 'strength', label: 'Force', icon: <Sword size={24} />, color: '#e74c3c' },
      { key: 'intelligence', label: 'Intelligence', icon: <Brain size={24} />, color: '#9b59b6' },
      { key: 'agility', label: 'Agilité', icon: <Zap size={24} />, color: '#2ecc71' },
      { key: 'resistance', label: 'Résistance', icon: <Shield size={24} />, color: '#3498db' },
      { key: 'precision', label: 'Précision', icon: <Target size={24} />, color: '#f39c12' },
      { key: 'endurance', label: 'Endurance', icon: <Heart size={24} />, color: '#8e44ad' },
      { key: 'wisdom', label: 'Sagesse', icon: <Brain size={24} />, color: '#1abc9c' },
      { key: 'constitution', label: 'Constitution', icon: <Shield size={24} />, color: '#e67e22' },
      { key: 'dexterity', label: 'Dextérité', icon: <Target size={24} />, color: '#27ae60' }
    ];
    return rows.map(r => ({
      ...r,
      value: Number(s[r.key] ?? 0)
    }));
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
                      width: `${Math.min(((Number(character.experience) || 0) / (Number(character.experience_to_next) || 1)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <span>{Number(character.experience) || 0} / {Number(character.experience_to_next) || 0} EXP</span>
                {Number(character.experience) > Number(character.experience_to_next) && (
                  <button 
                    className="overview-fix-exp-button"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/characters/${character.id}/fix-experience`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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
