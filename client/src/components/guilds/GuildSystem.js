import React from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, Shield, Trophy, Plus, Search } from 'lucide-react';
import './GuildSystem.css';

const GuildSystem = () => {
  const guilds = [
    {
      id: 1,
      name: 'Shadow Hunters',
      level: 5,
      members: 12,
      maxMembers: 20,
      description: 'A guild focused on hunting powerful monsters and completing difficult quests.',
      status: 'member',
      leader: 'Jin-Woo',
      achievements: ['First Blood', 'Monster Slayer', 'Quest Master'],
      weeklyRank: 3
    },
    {
      id: 2,
      name: 'Dragon Slayers',
      level: 8,
      members: 25,
      maxMembers: 30,
      description: 'Elite guild specializing in dragon hunting and legendary encounters.',
      status: 'available',
      leader: 'DragonMaster',
      achievements: ['Dragon Slayer', 'Legendary Hunter', 'Guild Champion'],
      weeklyRank: 1
    },
    {
      id: 3,
      name: 'Crystal Guardians',
      level: 6,
      members: 18,
      maxMembers: 25,
      description: 'Defensive guild focused on protecting territories and supporting allies.',
      status: 'available',
      leader: 'Guardian',
      achievements: ['Territory Defender', 'Support Master', 'Alliance Builder'],
      weeklyRank: 5
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'member': return '#4ecdc4';
      case 'available': return '#667eea';
      case 'invited': return '#fdcb6e';
      default: return '#b8c5d6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'member': return '👥';
      case 'available': return '➕';
      case 'invited': return '📨';
      default: return '❓';
    }
  };

  return (
    <div className="guilds-page">
      <motion.div
        className="guilds-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>👥 Guildes</h1>
        <p>Rejoignez des guildes pour collaborer avec d'autres joueurs et accomplir des objectifs communs dans Eternal Ascent</p>
      </motion.div>

      <div className="guilds-content">
        {/* Guild Stats */}
        <motion.div
          className="guild-stats"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="stat-item">
            <Users size={24} />
            <div className="stat-info">
              <div className="stat-value">{guilds.length}</div>
              <div className="stat-label">Guildes</div>
            </div>
          </div>
          <div className="stat-item">
            <Crown size={24} />
            <div className="stat-info">
              <div className="stat-value">{guilds.filter(g => g.status === 'member').length}</div>
              <div className="stat-label">Membre</div>
            </div>
          </div>
          <div className="stat-item">
            <Trophy size={24} />
            <div className="stat-info">
              <div className="stat-value">#{guilds.find(g => g.status === 'member')?.weeklyRank || 'N/A'}</div>
              <div className="stat-label">Classement</div>
            </div>
          </div>
        </motion.div>

        {/* Guild Controls */}
        <motion.div
          className="guild-controls"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="search-bar">
            <Search size={20} />
            <input type="text" placeholder="Rechercher une guilde..." />
          </div>
          <button className="create-guild-btn">
            <Plus size={20} />
            Créer une Guilde
          </button>
        </motion.div>

        {/* Guilds Grid */}
        <motion.div
          className="guilds-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {guilds.map((guild, index) => (
            <motion.div
              key={guild.id}
              className={`guild-card ${guild.status}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="guild-header">
                <div className="guild-icon">
                  <Users size={32} />
                </div>
                <div className="guild-info">
                  <h3>{guild.name}</h3>
                  <div className="guild-meta">
                    <span className="guild-level">Niveau {guild.level}</span>
                    <span className="guild-rank">#{guild.weeklyRank}</span>
                  </div>
                </div>
                <div className="guild-status">
                  <span className="status-badge">
                    {getStatusIcon(guild.status)} {guild.status}
                  </span>
                </div>
              </div>
              
              <p className="guild-description">{guild.description}</p>
              
              <div className="guild-details">
                <div className="detail-row">
                  <span className="detail-label">👑 Leader:</span>
                  <span className="detail-value">{guild.leader}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">👥 Membres:</span>
                  <span className="detail-value">{guild.members}/{guild.maxMembers}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🏆 Classement:</span>
                  <span className="detail-value">#{guild.weeklyRank}</span>
                </div>
              </div>
              
              <div className="guild-achievements">
                <h4>🏅 Réalisations</h4>
                <div className="achievements-list">
                  {guild.achievements.slice(0, 3).map((achievement, idx) => (
                    <span key={idx} className="achievement-tag">{achievement}</span>
                  ))}
                </div>
              </div>
              
              <div className="guild-actions">
                {guild.status === 'member' ? (
                  <button className="guild-btn primary">
                    <Shield size={16} />
                    Accéder
                  </button>
                ) : guild.status === 'available' ? (
                  <button className="guild-btn secondary">
                    <Plus size={16} />
                    Rejoindre
                  </button>
                ) : (
                  <button className="guild-btn info">
                    <Search size={16} />
                    Détails
                  </button>
                )}
                <button className="guild-btn info">
                  <Search size={16} />
                  Voir Profil
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Development Notice */}
        <motion.div
          className="development-notice"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3>🚧 En cours de développement</h3>
          <p>Le système de guildes sera bientôt complètement fonctionnel avec des événements de guilde, des raids coopératifs et des récompenses exclusives!</p>
        </motion.div>
      </div>
    </div>
  );
};

export default GuildSystem;
