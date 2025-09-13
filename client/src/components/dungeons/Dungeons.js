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
  const [openJson, setOpenJson] = useState({});
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
          console.log('Dungeons fetched:', availableDungeons);
          setDungeons(Array.isArray(availableDungeons) ? availableDungeons : []);

          // Charger les difficultés
          const difficultiesData = await databaseService.getDifficulties();
          console.log('Difficulties fetched:', difficultiesData);
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

  const getDifficultyData = (difficultyRef) => {
    let difficulty = null;
    if (typeof difficultyRef === 'number') {
      difficulty = difficulties.find(d => d.id === difficultyRef);
    } else if (typeof difficultyRef === 'string') {
      difficulty = difficulties.find(d => d.name === difficultyRef || d.display_name === difficultyRef);
    }
    return difficulty || {
      color: '#b8c5d6',
      icon: '⚪',
      display_name: 'Inconnu'
    };
  };

  const getDifficultyColor = (difficultyRef) => {
    return getDifficultyData(difficultyRef).color;
  };

  const getDifficultyIcon = (difficultyRef) => {
    return getDifficultyData(difficultyRef).icon;
  };

  const getDifficultyText = (difficultyRef) => {
    return getDifficultyData(difficultyRef).display_name;
  };

  const resolveDifficultyRef = (dungeon) => dungeon.difficulty ?? dungeon.difficulty_name ?? dungeon.difficulty_id ?? null;

  const getEnemiesCount = (dungeon) => {
    if (Array.isArray(dungeon.enemies)) return dungeon.enemies.length;
    if (typeof dungeon.monster_count === 'number') return dungeon.monster_count;
    return 0;
  };

  const getExpReward = (dungeon) => {
    const r = dungeon.rewards;
    if (!r) return dungeon.exp_reward || 0;
    if (Array.isArray(r)) {
      // try to find an object with experience/exp field
      const obj = r.find(x => typeof x === 'object' && (x.experience || x.exp));
      return (obj && (obj.experience || obj.exp)) || 0;
    }
    if (typeof r === 'object') return r.experience || r.exp || dungeon.exp_reward || 0;
    return dungeon.exp_reward || 0;
  };

  const getGoldReward = (dungeon) => {
    const r = dungeon.rewards;
    if (!r) return dungeon.gold_reward || 0;
    if (Array.isArray(r)) {
      const obj = r.find(x => typeof x === 'object' && (x.gold || x.coins));
      return (obj && (obj.gold || obj.coins)) || 0;
    }
    if (typeof r === 'object') return r.gold || r.coins || dungeon.gold_reward || 0;
    return dungeon.gold_reward || 0;
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
                  <h3>{dungeon.display_name || dungeon.name}</h3>
                  <div className="dungeon-meta">
                    <span className="difficulty-badge" style={{ backgroundColor: getDifficultyColor(resolveDifficultyRef(dungeon)) }}>
                      {getDifficultyIcon(resolveDifficultyRef(dungeon))} {getDifficultyText(resolveDifficultyRef(dungeon))}
                    </span>
                    <span className="level-requirement">
                      Niveau {dungeon.level_requirement || dungeon.min_level || 1}+
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
                  <span>{getEnemiesCount(dungeon)} monstres</span>
                </div>
                <div className="detail-item">
                  <Trophy size={16} />
                  <span>{getExpReward(dungeon)} EXP</span>
                </div>
                <div className="detail-item">
                  <Shield size={16} />
                  <span>{getGoldReward(dungeon)} Or</span>
                </div>
                <div className="detail-item">
                  <Map size={16} />
                  <span>{dungeon.estimated_duration || dungeon.time_limit || '30'} min</span>
                </div>
              </div>

              <div className="dungeon-actions" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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

                <button
                  className="refresh-btn"
                  onClick={() => setOpenJson(prev => ({ ...prev, [dungeon.id || dungeon.name || index]: !prev[dungeon.id || dungeon.name || index] }))}
                >
                  Voir JSON
                </button>
              </div>

              {openJson[dungeon.id || dungeon.name || index] && (
                <div className="dungeon-json" style={{ marginTop: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, overflowX: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.35 }}>{JSON.stringify(dungeon, null, 2)}</pre>
                </div>
              )}
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
