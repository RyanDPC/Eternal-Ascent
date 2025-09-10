import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, Trophy, Clock, CheckCircle, AlertCircle, Star, MapPin, X, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import databaseService from '../../services/databaseService';
import './Quests.css';

const Quests = () => {
  const [quests, setQuests] = useState([]);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [showQuestDetails, setShowQuestDetails] = useState(false);
  const { user } = useAuth();

  // Charger les données des quêtes et du personnage
  useEffect(() => {
    const loadQuestData = async () => {
      try {
        setLoading(true);
        if (user && user.id) {
          // Charger le personnage courant
          const characterData = await databaseService.getCurrentCharacterData();
          const characterNormalized = characterData.character || characterData;
          setCharacter(characterNormalized);

          // Charger les quêtes disponibles
          const availableQuests = await databaseService.getAvailableQuests();
          setQuests(Array.isArray(availableQuests) ? availableQuests : []);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des quêtes:', err);
        setError('Impossible de charger les données des quêtes');
      } finally {
        setLoading(false);
      }
    };

    loadQuestData();
  }, [user]);

  // Obtenir l'icône de type de quête
  const getQuestTypeIcon = (type) => {
    switch (type) {
      case 'kill': return '⚔️';
      case 'collect': return '📦';
      case 'explore': return '🗺️';
      case 'deliver': return '📮';
      case 'craft': return '🔨';
      case 'social': return '👥';
      default: return '📋';
    }
  };

  // Obtenir la couleur de rareté
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#95a5a6';
      case 'uncommon': return '#27ae60';
      case 'rare': return '#3498db';
      case 'epic': return '#9b59b6';
      case 'legendary': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  // Obtenir le texte de rareté
  const getRarityText = (rarity) => {
    switch (rarity) {
      case 'common': return 'Commune';
      case 'uncommon': return 'Peu commune';
      case 'rare': return 'Rare';
      case 'epic': return 'Épique';
      case 'legendary': return 'Légendaire';
      default: return 'Commune';
    }
  };

  // Obtenir le statut de la quête
  const getQuestStatus = (quest) => {
    if (quest.completed) return 'completed';
    if (quest.in_progress) return 'in_progress';
    if (quest.available) return 'available';
    return 'locked';
  };

  // Obtenir l'icône de statut
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'in_progress': return <Clock size={16} />;
      case 'available': return <Target size={16} />;
      case 'locked': return <AlertCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  // Obtenir la couleur de statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'in_progress': return '#f39c12';
      case 'available': return '#3498db';
      case 'locked': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  // Démarrer une quête
  const startQuest = async (quest) => {
    try {
      // Mettre à jour le statut de la quête
      await databaseService.updateQuestProgress({
        quest_id: quest.id,
        user_id: character?.id,
        status: 'in_progress',
        start_time: new Date().toISOString()
      });

      // Recharger les quêtes
      const availableQuests = await databaseService.getAvailableQuests();
      setQuests(availableQuests);
    } catch (error) {
      console.error('Erreur lors du démarrage de la quête:', error);
      alert('Impossible de démarrer la quête');
    }
  };

  // Abandonner une quête
  const abandonQuest = async (quest) => {
    if (!confirm('Êtes-vous sûr de vouloir abandonner cette quête ?')) return;

    try {
      // Mettre à jour le statut de la quête
      await databaseService.updateQuestProgress({
        quest_id: quest.id,
        user_id: character?.id,
        status: 'abandoned',
        end_time: new Date().toISOString()
      });

      // Recharger les quêtes
      const availableQuests = await databaseService.getAvailableQuests();
      setQuests(availableQuests);
    } catch (error) {
      console.error('Erreur lors de l\'abandon de la quête:', error);
      alert('Impossible d\'abandonner la quête');
    }
  };

  // Afficher les détails d'une quête
  const showQuestDetail = (quest) => {
    setSelectedQuest(quest);
    setShowQuestDetails(true);
  };

  // Fermer les détails de la quête
  const closeQuestDetails = () => {
    setShowQuestDetails(false);
    setSelectedQuest(null);
  };

  // Rafraîchir les quêtes
  const refreshQuests = async () => {
    try {
      setLoading(true);
      const availableQuests = await databaseService.getAvailableQuests(character?.id || user.id);
      setQuests(availableQuests);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="quests-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="loading-spinner"
        >
          📋
        </motion.div>
        <p>Chargement des quêtes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quests-error">
        <h2>❌ Erreur</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="quests-no-character">
        <h2>🎭 Aucun personnage trouvé</h2>
        <p>Créez votre premier personnage pour accéder aux quêtes !</p>
      </div>
    );
  }

  return (
    <div className="quests-page">
      <motion.div className="quests-header" 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>📋 Quêtes</h1>
        <p>Acceptez des missions et accomplissez des objectifs pour gagner des récompenses</p>
        <div className="character-info-banner">
          <span>Niveau {character.level}</span>
          <span>•</span>
          <span>{character.experience} / {character.experience_to_next} EXP</span>
          <span>•</span>
          {(() => {
            const classLabel = (
              character.class_display_name ||
              character.class_name ||
              (typeof character.class === 'string' ? character.class : (character.class && (character.class.display_name || character.class.name))) ||
              'Inconnue'
            );
            return <span>Classe: {classLabel}</span>;
          })()}
        </div>
      </motion.div>

      {/* Statistiques des quêtes */}
      <motion.div
        className="quests-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="stat-item">
          <BookOpen size={24} />
          <div className="stat-info">
            <div className="stat-value">{quests.length}</div>
            <div className="stat-label">Quêtes</div>
          </div>
        </div>
        
        <div className="stat-item">
          <Clock size={24} />
          <div className="stat-info">
            <div className="stat-value">
              {Array.isArray(quests) ? quests.filter(q => getQuestStatus(q) === 'in_progress').length : 0}
            </div>
            <div className="stat-label">En cours</div>
          </div>
        </div>
        
        <div className="stat-item">
          <CheckCircle size={24} />
          <div className="stat-info">
            <div className="stat-value">
              {Array.isArray(quests) ? quests.filter(q => getQuestStatus(q) === 'completed').length : 0}
            </div>
            <div className="stat-label">Terminées</div>
          </div>
        </div>
        
        <div className="stat-item">
          <Star size={24} />
          <div className="stat-info">
            <div className="stat-value">
              {Array.isArray(quests) ? quests.filter(q => q.rarity === 'legendary').length : 0}
            </div>
            <div className="stat-label">Légendaires</div>
          </div>
        </div>
      </motion.div>

      {/* Bouton de rafraîchissement */}
      <motion.div
        className="refresh-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <button 
          className="refresh-btn"
          onClick={refreshQuests}
          disabled={loading}
        >
          <BookOpen size={16} />
          Rafraîchir les quêtes
        </button>
      </motion.div>

      {/* Grille des quêtes */}
      <div className="quests-grid">
        {(Array.isArray(quests) ? quests : []).map((quest, index) => {
          const status = getQuestStatus(quest);
          
          return (
            <motion.div
              key={quest.id}
              className={`quest-card ${status}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="quest-header">
                <div className="quest-icon">
                  {getQuestTypeIcon(quest.type)}
                </div>
                <div className="quest-info">
                  <h3>{quest.title}</h3>
                  <div className="quest-meta">
                    <span 
                      className="rarity-badge" 
                      style={{ backgroundColor: getRarityColor(quest.rarity) }}
                    >
                      {getRarityText(quest.rarity)}
                    </span>
                    <span className="level-requirement">
                      Niveau {quest.min_level || 1}+
                    </span>
                  </div>
                </div>
                <div 
                  className="status-indicator"
                  style={{ color: getStatusColor(status) }}
                >
                  {getStatusIcon(status)}
                </div>
              </div>

              <div className="quest-description">
                <p>{quest.description}</p>
              </div>

              <div className="quest-details">
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{quest.location || 'Partout'}</span>
                </div>
                <div className="detail-item">
                  <Target size={16} />
                  <span>{quest.objective || 'Objectif non défini'}</span>
                </div>
                <div className="detail-item">
                  <Trophy size={16} />
                  <span>{quest.exp_reward || 0} EXP</span>
                </div>
                <div className="detail-item">
                  <Star size={16} />
                  <span>{quest.gold_reward || 0} Or</span>
                </div>
              </div>

              <div className="quest-actions">
                {status === 'available' && (
                  <button
                    className="start-quest-btn"
                    onClick={() => startQuest(quest)}
                  >
                    <Target size={16} />
                    Accepter
                  </button>
                )}
                
                {status === 'in_progress' && (
                  <div className="in-progress-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => showQuestDetail(quest)}
                    >
                      <BookOpen size={16} />
                      Détails
                    </button>
                    <button
                      className="abandon-quest-btn"
                      onClick={() => abandonQuest(quest)}
                    >
                      <AlertCircle size={16} />
                      Abandonner
                    </button>
                  </div>
                )}
                
                {status === 'completed' && (
                  <div className="completed-info">
                    <CheckCircle size={16} />
                    <span>Terminée</span>
                  </div>
                )}
                
                {status === 'locked' && (
                  <div className="locked-info">
                    <AlertCircle size={16} />
                    <span>Niveau {quest.min_level || 1} requis</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal de détails de quête */}
      {showQuestDetails && selectedQuest && (
        <motion.div
          className="quest-details-modal"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedQuest.title}</h3>
              <button className="close-modal-btn" onClick={closeQuestDetails}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="quest-full-info">
                <div className="quest-type">
                  <span className="type-icon">{getQuestTypeIcon(selectedQuest.type)}</span>
                  <span className="type-text">Type: {selectedQuest.type}</span>
                </div>
                
                <div className="quest-description-full">
                  <h4>Description</h4>
                  <p>{selectedQuest.description}</p>
                </div>
                
                <div className="quest-objectives">
                  <h4>Objectifs</h4>
                  <p>{selectedQuest.objective}</p>
                </div>
                
                <div className="quest-location">
                  <h4>Localisation</h4>
                  <p>{selectedQuest.location || 'Partout'}</p>
                </div>
                
                <div className="quest-rewards">
                  <h4>Récompenses</h4>
                  <div className="rewards-list">
                    <div className="reward-item">
                      <Trophy size={20} />
                      <span>{selectedQuest.exp_reward || 0} EXP</span>
                    </div>
                    <div className="reward-item">
                      <Star size={20} />
                      <span>{selectedQuest.gold_reward || 0} Or</span>
                    </div>
                    {selectedQuest.item_rewards && selectedQuest.item_rewards.length > 0 && (
                      <div className="reward-item">
                        <Package size={20} />
                        <span>{selectedQuest.item_rewards.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="quest-requirements">
                  <h4>Prérequis</h4>
                  <p>Niveau {selectedQuest.min_level || 1}+</p>
                  {selectedQuest.prerequisites && (
                    <ul>
                      {selectedQuest.prerequisites.map((prereq, idx) => (
                        <li key={idx}>{prereq}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Quests;
