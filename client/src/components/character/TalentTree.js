import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Lock, Check, Zap, Shield, Sword, Heart, Droplets,
  Crown, Award, Target, Flame, Snowflake, Eye, Skull
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import databaseService from '../../services/databaseService';
import './TalentTree.css';

const TalentTree = ({ character: characterProp, tree }) => {
  const { user } = useAuth();
  const [character, setCharacter] = useState(characterProp || null);
  const [talentTrees, setTalentTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(tree || null);
  const [learnedTalents, setLearnedTalents] = useState([]);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données
  useEffect(() => {
    // If props provide everything, use them directly
    if (characterProp && tree) {
      setCharacter(characterProp);
      setSelectedTree(tree);
      const learned = characterProp.learned_talents || [];
      setLearnedTalents(learned);
      const spentPoints = learned.length;
      const totalPoints = Math.floor((characterProp.level || 1) / 2);
      setAvailablePoints(Math.max(0, totalPoints - spentPoints));
      setLoading(false);
      return;
    }

    const loadTalentData = async () => {
      try {
        setLoading(true);
        
        if (user && user.id) {
          // Charger le personnage courant
          const characterData = await databaseService.getCurrentCharacterData();
          const characterNormalized = characterData.character || characterData;
          setCharacter(characterNormalized);
          
          // Charger les arbres de talents
          const trees = await databaseService.getTalentTrees();
          setTalentTrees(Array.isArray(trees) ? trees : (trees?.trees || []));
          
          // Trouver l'arbre correspondant à la classe du personnage
          const characterTree = (Array.isArray(trees) ? trees : (trees?.trees || [])).find(
            tree => (tree.class === characterNormalized.class_name) || (tree.class_name === characterNormalized.class_name)
          );
          if (characterTree) {
            setSelectedTree(characterTree);
          }
          
          // Charger les talents appris
          const talents = characterNormalized.learned_talents || [];
          setLearnedTalents(talents);
          
          // Calculer les points disponibles
          const spentPoints = talents.length;
          const totalPoints = Math.floor(characterNormalized.level / 2);
          setAvailablePoints(Math.max(0, totalPoints - spentPoints));
        }
      } catch (err) {
        console.error('Erreur lors du chargement des talents:', err);
        setError('Impossible de charger les données des talents');
      } finally {
        setLoading(false);
      }
    };

    loadTalentData();
  }, [user, characterProp, tree]);

  // Apprendre un talent
  const learnTalent = async (talentId) => {
    try {
      if (!user || !user.id) {
        setError('Utilisateur non connecté');
        return;
      }

      await databaseService.learnTalent(character?.id, talentId);
      
      // Mettre à jour l'état local
      setLearnedTalents(prev => [...prev, talentId]);
      setAvailablePoints(prev => prev - 1);
      
      // Recharger les données du personnage
      const updatedCharacterData = await databaseService.getCurrentCharacterData();
      setCharacter(updatedCharacterData.character || updatedCharacterData);
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'apprentissage du talent');
    }
  };

  // Vérifier si un talent peut être appris
  const canLearnTalent = (talent) => {
    // Vérifier le niveau requis
    if (character.level < talent.level_requirement) {
      return { canLearn: false, reason: 'level_insufficient' };
    }

    // Vérifier les prérequis
    if (talent.prerequisites && talent.prerequisites.length > 0) {
      for (const prereqId of talent.prerequisites) {
        if (!learnedTalents.includes(prereqId)) {
          return { canLearn: false, reason: 'prerequisites_not_met' };
        }
      }
    }

    // Vérifier si déjà appris
    if (learnedTalents.includes(talent.id)) {
      return { canLearn: false, reason: 'already_learned' };
    }

    // Vérifier les points disponibles
    if (availablePoints <= 0) {
      return { canLearn: false, reason: 'no_talent_points' };
    }

    return { canLearn: true };
  };

  // Obtenir l'icône d'un talent
  const getTalentIcon = (talent) => {
    const iconMap = {
      '💪': Sword,
      '🛡️': Shield,
      '😡': Flame,
      '⚔️': Sword,
      '🗡️': Sword,
      '🏔️': Crown,
      '🔮': Zap,
      '✨': Star,
      '🔥': Flame,
      '🛡️': Shield,
      '👑': Crown,
      '🌟': Star,
      '🎯': Target,
      '💨': Eye,
      '🏹': Target,
      '💀': Skull,
      '🏆': Award,
      '👤': Eye,
      '🌑': Eye,
      '⚡': Zap,
      '☀️': Star
    };
    return iconMap[talent.icon] || Star;
  };

  // Obtenir la couleur d'un talent selon son état
  const getTalentColor = (talent) => {
    const canLearn = canLearnTalent(talent);
    
    if (learnedTalents.includes(talent.id)) {
      return '#4ade80'; // Vert pour appris
    } else if (canLearn.canLearn) {
      return '#3b82f6'; // Bleu pour disponible
    } else {
      return '#6b7280'; // Gris pour indisponible
    }
  };

  if (loading) {
    return (
      <div className="talent-tree">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de l'arbre de talents...</p>
        </div>
      </div>
    );
  }

  if (!selectedTree) {
    return (
      <div className="talent-tree">
        <div className="error-container">
          <p>Aucun arbre de talents disponible pour votre classe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="talent-tree">
      {/* Header */}
      <div className="talent-header">
        <h2>🌳 Arbre de Talents - {selectedTree.name}</h2>
        <div className="talent-info">
          <div className="talent-points">
            <Star size={20} />
            <span>Points disponibles: {availablePoints}</span>
          </div>
          <div className="character-level">
            <Crown size={20} />
            <span>Niveau: {character?.level || 1}</span>
          </div>
        </div>
      </div>

      {/* Description de l'arbre */}
      <div className="tree-description">
        <p>{selectedTree.description}</p>
      </div>

      {/* Arbre de talents */}
      <div className="talent-tree-container">
        <div className="talent-grid">
          {selectedTree.talents.map((talent, index) => {
            const IconComponent = getTalentIcon(talent);
            const canLearn = canLearnTalent(talent);
            const isLearned = learnedTalents.includes(talent.id);
            
            return (
              <motion.div
                key={talent.id}
                className={`talent-node ${isLearned ? 'learned' : ''} ${canLearn.canLearn ? 'available' : 'unavailable'}`}
                style={{
                  gridColumn: talent.position.x + 1,
                  gridRow: talent.position.y + 1
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  if (canLearn.canLearn) {
                    learnTalent(talent.id);
                  }
                }}
              >
                <div className="talent-icon" style={{ color: getTalentColor(talent) }}>
                  <IconComponent size={24} />
                </div>
                
                <div className="talent-info">
                  <h4>{talent.name}</h4>
                  <p className="talent-description">{talent.description}</p>
                  <div className="talent-requirements">
                    <span className="level-req">Niveau {talent.level_requirement}</span>
                  </div>
                </div>

                {/* Indicateur d'état */}
                <div className="talent-status">
                  {isLearned ? (
                    <Check size={16} className="learned-icon" />
                  ) : canLearn.canLearn ? (
                    <Star size={16} className="available-icon" />
                  ) : (
                    <Lock size={16} className="locked-icon" />
                  )}
                </div>

                {/* Tooltip */}
                <div className="talent-tooltip">
                  <h4>{talent.name}</h4>
                  <p>{talent.description}</p>
                  <div className="talent-effects">
                    {talent.effects?.stat_bonuses && Object.entries(talent.effects.stat_bonuses).map(([stat, value]) => (
                      <div key={stat} className="stat-bonus">
                        <span className="stat-name">{stat}:</span>
                        <span className="stat-value">+{value}</span>
                      </div>
                    ))}
                  </div>
                  {!canLearn.canLearn && canLearn.reason && (
                    <div className="talent-error">
                      {canLearn.reason === 'level_insufficient' && 'Niveau insuffisant'}
                      {canLearn.reason === 'prerequisites_not_met' && 'Prérequis non remplis'}
                      {canLearn.reason === 'already_learned' && 'Déjà appris'}
                      {canLearn.reason === 'no_talent_points' && 'Aucun point de talent'}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Talents appris */}
      <div className="learned-talents">
        <h3>Talents Appris ({learnedTalents.length})</h3>
        <div className="learned-talents-list">
          {learnedTalents.map(talentId => {
            const talent = selectedTree.talents.find(t => t.id === talentId);
            if (!talent) return null;
            
            const IconComponent = getTalentIcon(talent);
            
            return (
              <div key={talentId} className="learned-talent-item">
                <IconComponent size={20} />
                <span>{talent.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
    </div>
  );
};

export default TalentTree;

