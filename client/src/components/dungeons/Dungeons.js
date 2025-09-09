import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Sword, Shield, Trophy, Lock, Unlock, Play, X, RefreshCw, AlertCircle, Package } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import databaseService from '../../services/databaseService';
import './Dungeons.css';

const Dungeons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dungeons, setDungeons] = useState([]);
  const [character, setCharacter] = useState(null);
  const [difficulties, setDifficulties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [combatResults, setCombatResults] = useState(null);
  const { user } = useAuth();

  // Charger les données des donjons et du personnage
  useEffect(() => {
    const loadDungeonData = async () => {
      try {
        setLoading(true);
        if (user && user.id) {
          // Charger le personnage courant
          const characterData = await databaseService.getCurrentCharacterData();
          const characterNormalized = characterData.character || characterData;
          setCharacter(characterNormalized);

          // Charger les donjons disponibles
          const availableDungeons = await databaseService.getAvailableDungeons();
          setDungeons(Array.isArray(availableDungeons) ? availableDungeons : []);

          // Charger les difficultés
          const difficultiesData = await databaseService.getDifficulties();
          setDifficulties(Array.isArray(difficultiesData) ? difficultiesData : []);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des donjons:', err);
        setError('Impossible de charger les données des donjons');
      } finally {
        setLoading(false);
      }
    };

    loadDungeonData();
  }, [user]);

  // Vérifier si un donjon est accessible
  const isDungeonAccessible = (dungeon) => {
    if (!character) return false;
    
    // Vérifier le niveau requis
    if (character.level < dungeon.min_level) return false;
    
    // Vérifier les prérequis (quêtes, objets, etc.)
    if (dungeon.prerequisites && dungeon.prerequisites.length > 0) {
      // Logique pour vérifier les prérequis
      return true; // Simplifié pour l'instant
    }
    
    return true;
  };

  const getDifficultyData = (difficultyName) => {
    const difficulty = difficulties.find(d => d.name === difficultyName);
    return difficulty || {
      color: '#b8c5d6',
      icon: '⚪',
      display_name: 'Inconnu'
    };
  };

  const getDifficultyColor = (difficultyName) => {
    return getDifficultyData(difficultyName).color;
  };

  const getDifficultyIcon = (difficultyName) => {
    return getDifficultyData(difficultyName).icon;
  };

  const getDifficultyText = (difficultyName) => {
    return getDifficultyData(difficultyName).display_name;
  };

  const startCombat = async (dungeon) => {
    if (!isDungeonAccessible(dungeon)) {
      alert('Ce donjon n\'est pas encore accessible !');
      return;
    }

    try {
      // Rediriger vers la page de jeu avec les données du donjon et du personnage
      navigate('/game', {
        state: {
          dungeon: dungeon,
          character: character
        }
      });
    } catch (error) {
      console.error('Erreur lors du démarrage du combat:', error);
      alert('Impossible de démarrer le combat');
    }
  };

  // Gérer le retour de la page de jeu
  useEffect(() => {
    const handleCombatResults = async (results) => {
      if (results) {
        try {
          setCombatResults(results);
          if (results.victory) {
            console.log(`Victoire ! +${results.exp} EXP, +${results.gold} Or`);
            // Mettre à jour les données du personnage
            const updatedCharacterData = await databaseService.getCurrentCharacterData();
            const updatedCharacter = updatedCharacterData.character || updatedCharacterData;
            setCharacter(updatedCharacter);
          } else {
            console.log('Défaite...');
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour:', error);
        }
      }
    };

    // Vérifier s'il y a des résultats de combat dans l'état de navigation
    if (location.state?.victory !== undefined) {
      handleCombatResults(location.state);
      // Nettoyer l'état de navigation pour éviter les re-traitements
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, user.id, navigate, location.pathname]);

  const refreshDungeons = async () => {
    try {
      setLoading(true);
      const availableDungeons = await databaseService.getAvailableDungeons(user.id);
      setDungeons(availableDungeons);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dungeons-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="loading-spinner"
        >
          ⚔️
        </motion.div>
        <p>Chargement des donjons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dungeons-error">
        <h2>❌ Erreur</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="dungeons-no-character">
        <h2>🎭 Aucun personnage trouvé</h2>
        <p>Créez votre premier personnage pour accéder aux donjons !</p>
      </div>
    );
  }

  return (
    <div className="dungeons-page">
      <motion.div className="dungeons-header" 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>🗺️ Donjons</h1>
        <p>Explorez les donjons et affrontez des monstres pour gagner de l'expérience et des trésors</p>
        <div className="character-info-banner">
          <span>Niveau {character.level}</span>
          <span>•</span>
          <span>{character.experience} / {character.experience_to_next} EXP</span>
          <span>•</span>
          <span>Classe: {character.class_name}</span>
        </div>
      </motion.div>

      {/* Bouton de rafraîchissement */}
      <motion.div
        className="refresh-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <button 
          className="refresh-btn"
          onClick={refreshDungeons}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          Rafraîchir les donjons
        </button>
      </motion.div>

      {/* Grille des donjons */}
      <div className="dungeons-grid">
        {dungeons.map((dungeon, index) => {
          const isAccessible = isDungeonAccessible(dungeon);
          
          return (
            <motion.div
              key={dungeon.id || `dungeon-${index}`}
              className={`dungeon-card ${isAccessible ? 'accessible' : 'locked'}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: isAccessible ? 1.05 : 1 }}
            >
              <div className="dungeon-header">
                <div className="dungeon-icon">
                  {dungeon.icon || '🗺️'}
                </div>
                <div className="dungeon-info">
                  <h3>{dungeon.name}</h3>
                  <div className="dungeon-meta">
                    <span className="difficulty-badge" style={{ backgroundColor: getDifficultyColor(dungeon.difficulty) }}>
                      {getDifficultyIcon(dungeon.difficulty)} {getDifficultyText(dungeon.difficulty)}
                    </span>
                    <span className="level-requirement">
                      Niveau {dungeon.min_level || 1}+
                    </span>
                  </div>
                </div>
              </div>

              <div className="dungeon-description">
                <p>{dungeon.description}</p>
              </div>

              <div className="dungeon-details">
                <div className="detail-item">
                  <Sword size={16} />
                  <span>{dungeon.monster_count || 0} monstres</span>
                </div>
                <div className="detail-item">
                  <Trophy size={16} />
                  <span>{dungeon.exp_reward || 0} EXP</span>
                </div>
                <div className="detail-item">
                  <Shield size={16} />
                  <span>{dungeon.gold_reward || 0} Or</span>
                </div>
                <div className="detail-item">
                  <Map size={16} />
                  <span>{dungeon.time_limit || '30'} min</span>
                </div>
              </div>

              <div className="dungeon-actions">
                {isAccessible ? (
                  <button
                    className="enter-dungeon-btn"
                    onClick={() => startCombat(dungeon)}
                  >
                    <Play size={16} />
                    Entrer
                  </button>
                ) : (
                  <div className="locked-info">
                    <Lock size={16} />
                    <span>Niveau {dungeon.min_level || 1} requis</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Résultats du combat */}
      {combatResults && (
        <motion.div
          className="combat-results"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="results-header">
            <h3>{combatResults.victory ? '🎉 Victoire !' : '💀 Défaite...'}</h3>
            <button className="close-results-btn" onClick={() => setCombatResults(null)}>
              <X size={20} />
            </button>
          </div>
          
          {combatResults.victory && (
            <div className="rewards">
              <div className="reward-item">
                <Trophy size={20} />
                <span>+{combatResults.exp} EXP</span>
              </div>
              <div className="reward-item">
                <Shield size={20} />
                <span>+{combatResults.gold} Or</span>
              </div>
              {combatResults.items && combatResults.items.length > 0 && (
                <div className="reward-item">
                  <Package size={20} />
                  <span>{combatResults.items.length} objet(s) trouvé(s)</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Dungeons;
