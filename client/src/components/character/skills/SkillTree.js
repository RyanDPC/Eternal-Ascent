import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Zap, 
  Shield, 
  Sword, 
  Heart, 
  Brain, 
  Target, 
  Crown,
  Lock,
  Check,
  Plus,
  Minus
} from 'lucide-react';
import './SkillTree.css';

const SkillTree = ({ character, onStatsUpdate }) => {
  const [skillPoints, setSkillPoints] = useState(character?.skill_points || 0);
  const [skills, setSkills] = useState({});
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillCategories, setSkillCategories] = useState([
    {
      id: 'combat',
      name: 'Combat',
      icon: <Sword size={20} />,
      color: '#e74c3c',
      skills: [
        {
          id: 'sword_mastery',
          name: 'Maîtrise de l\'Épée',
          description: 'Augmente les dégâts d\'épée de 5% par niveau',
          maxLevel: 20,
          currentLevel: 0,
          cost: 1,
          requirements: [],
          category: 'combat',
          icon: <Sword size={16} />
        },
        {
          id: 'critical_strike',
          name: 'Coup Critique',
          description: 'Chance de coup critique +2% par niveau',
          maxLevel: 15,
          currentLevel: 0,
          cost: 2,
          requirements: [{ skill: 'sword_mastery', level: 5 }],
          category: 'combat',
          icon: <Target size={16} />
        },
        {
          id: 'berserker_rage',
          name: 'Rage Berserker',
          description: 'Augmente l\'attaque de 10% mais réduit la défense de 5% par niveau',
          maxLevel: 10,
          currentLevel: 0,
          cost: 3,
          requirements: [{ skill: 'sword_mastery', level: 10 }],
          category: 'combat',
          icon: <Zap size={16} />
        }
      ]
    },
    {
      id: 'magic',
      name: 'Magie',
      icon: <Brain size={20} />,
      color: '#9b59b6',
      skills: [
        {
          id: 'fire_magic',
          name: 'Magie de Feu',
          description: 'Augmente les dégâts de feu de 8% par niveau',
          maxLevel: 25,
          currentLevel: 0,
          cost: 1,
          requirements: [],
          category: 'magic',
          icon: <Zap size={16} />
        },
        {
          id: 'ice_magic',
          name: 'Magie de Glace',
          description: 'Ralentit les ennemis et inflige des dégâts de glace',
          maxLevel: 20,
          currentLevel: 0,
          cost: 2,
          requirements: [{ skill: 'fire_magic', level: 8 }],
          category: 'magic',
          icon: <Zap size={16} />
        },
        {
          id: 'arcane_mastery',
          name: 'Maîtrise Arcanique',
          description: 'Réduit le coût en mana de 3% par niveau',
          maxLevel: 15,
          currentLevel: 0,
          requirements: [
            { skill: 'fire_magic', level: 15 },
            { skill: 'ice_magic', level: 10 }
          ],
          cost: 4,
          category: 'magic',
          icon: <Crown size={16} />
        }
      ]
    },
    {
      id: 'defense',
      name: 'Défense',
      icon: <Shield size={20} />,
      color: '#3498db',
      skills: [
        {
          id: 'armor_mastery',
          name: 'Maîtrise de l\'Armure',
          description: 'Augmente la défense de 4% par niveau',
          maxLevel: 20,
          currentLevel: 0,
          cost: 1,
          requirements: [],
          category: 'defense',
          icon: <Shield size={16} />
        },
        {
          id: 'magic_resistance',
          name: 'Résistance Magique',
          description: 'Réduit les dégâts magiques de 5% par niveau',
          maxLevel: 15,
          currentLevel: 0,
          cost: 2,
          requirements: [{ skill: 'armor_mastery', level: 8 }],
          category: 'defense',
          icon: <Shield size={16} />
        },
        {
          id: 'regeneration',
          name: 'Régénération',
          description: 'Régénère 1% de la vie max par seconde par niveau',
          maxLevel: 10,
          currentLevel: 0,
          cost: 3,
          requirements: [
            { skill: 'armor_mastery', level: 15 },
            { skill: 'magic_resistance', level: 10 }
          ],
          category: 'defense',
          icon: <Heart size={16} />
        }
      ]
    },
    {
      id: 'utility',
      name: 'Utilité',
      icon: <Star size={20} />,
      color: '#f39c12',
      skills: [
        {
          id: 'experience_boost',
          name: 'Boost d\'Expérience',
          description: 'Gagne 5% d\'expérience supplémentaire par niveau',
          maxLevel: 10,
          currentLevel: 0,
          cost: 2,
          requirements: [],
          category: 'utility',
          icon: <Star size={16} />
        },
        {
          id: 'lucky_find',
          name: 'Trouvaille Chanceuse',
          description: 'Chance de trouver des objets rares +3% par niveau',
          maxLevel: 15,
          currentLevel: 0,
          cost: 3,
          requirements: [{ skill: 'experience_boost', level: 5 }],
          category: 'utility',
          icon: <Star size={16} />
        },
        {
          id: 'master_crafter',
          name: 'Maître Artisan',
          description: 'Peut créer des objets de meilleure qualité',
          maxLevel: 5,
          currentLevel: 0,
          cost: 5,
          requirements: [
            { skill: 'experience_boost', level: 10 },
            { skill: 'lucky_find', level: 8 }
          ],
          category: 'utility',
          icon: <Crown size={16} />
        }
      ]
    }
  ]);

  // Charger les compétences sauvegardées
  useEffect(() => {
    if (character?.skills) {
      setSkills(character.skills);
    }
  }, [character]);

  // Vérifier si une compétence peut être améliorée
  const canUpgradeSkill = (skill) => {
    if (skill.currentLevel >= skill.maxLevel) return false;
    if (skillPoints < skill.cost) return false;
    
    // Vérifier les prérequis
    for (const req of skill.requirements) {
      const reqSkill = skills[req.skill];
      if (!reqSkill || reqSkill.currentLevel < req.level) {
        return false;
      }
    }
    
    return true;
  };

  // Améliorer une compétence
  const upgradeSkill = (skillId) => {
    const skill = skillCategories
      .flatMap(cat => cat.skills)
      .find(s => s.id === skillId);
    
    if (!canUpgradeSkill(skill)) return;
    
    const newSkills = { ...skills };
    if (!newSkills[skillId]) {
      newSkills[skillId] = { ...skill, currentLevel: 0 };
    }
    
    newSkills[skillId].currentLevel += 1;
    setSkills(newSkills);
    setSkillPoints(prev => prev - skill.cost);
    
    // Sauvegarder les changements
    saveSkills(newSkills);
  };

  // Réduire une compétence
  const downgradeSkill = (skillId) => {
    const skill = skills[skillId];
    if (!skill || skill.currentLevel <= 0) return;
    
    const newSkills = { ...skills };
    newSkills[skillId].currentLevel -= 1;
    setSkills(newSkills);
    setSkillPoints(prev => prev + skill.cost);
    
    // Sauvegarder les changements
    saveSkills(newSkills);
  };

  // Sauvegarder les compétences
  const saveSkills = async (skillsToSave) => {
    try {
      // Ici vous pouvez ajouter l'appel API pour sauvegarder
      console.log('Saving skills:', skillsToSave);
      // await databaseService.saveCharacterSkills(character.id, skillsToSave);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des compétences:', error);
    }
  };

  // Obtenir le niveau total d'une compétence
  const getSkillLevel = (skillId) => {
    return skills[skillId]?.currentLevel || 0;
  };

  // Obtenir les bonus d'une compétence
  const getSkillBonuses = (skill) => {
    const level = getSkillLevel(skill.id);
    const bonuses = [];
    
    switch (skill.id) {
      case 'sword_mastery':
        bonuses.push(`+${level * 5}% Dégâts d'épée`);
        break;
      case 'critical_strike':
        bonuses.push(`+${level * 2}% Chance de critique`);
        break;
      case 'fire_magic':
        bonuses.push(`+${level * 8}% Dégâts de feu`);
        break;
      case 'armor_mastery':
        bonuses.push(`+${level * 4}% Défense`);
        break;
      case 'experience_boost':
        bonuses.push(`+${level * 5}% Expérience`);
        break;
      default:
        bonuses.push(`Niveau ${level}`);
    }
    
    return bonuses;
  };

  return (
    <div className="skill-tree-page">
      <div className="skill-tree-header">
        <h1>🌟 Arbre de Compétences</h1>
        <p>Développez vos compétences et maîtrisez de nouveaux sorts</p>
        <div className="skill-points-display">
          <Star className="skill-points-icon" />
          <span className="skill-points-text">Points de compétence: {skillPoints}</span>
        </div>
      </div>

      <div className="skill-categories">
        {skillCategories.map((category) => (
          <motion.div
            key={category.id}
            className="skill-category"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="category-header" style={{ borderColor: category.color }}>
              <div className="category-icon" style={{ color: category.color }}>
                {category.icon}
              </div>
              <h3 style={{ color: category.color }}>{category.name}</h3>
            </div>
            
            <div className="skills-grid">
              {category.skills.map((skill) => {
                const currentLevel = getSkillLevel(skill.id);
                const canUpgrade = canUpgradeSkill(skill);
                const canDowngrade = currentLevel > 0;
                const bonuses = getSkillBonuses(skill);
                
                return (
                  <motion.div
                    key={skill.id}
                    className={`skill-card ${currentLevel > 0 ? 'unlocked' : 'locked'}`}
                    style={{ borderColor: category.color }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSkill(skill)}
                  >
                    <div className="skill-icon" style={{ color: category.color }}>
                      {currentLevel > 0 ? skill.icon : <Lock size={16} />}
                    </div>
                    
                    <div className="skill-info">
                      <h4 className="skill-name">{skill.name}</h4>
                      <p className="skill-description">{skill.description}</p>
                      
                      <div className="skill-level">
                        <span className="level-text">Niveau {currentLevel}/{skill.maxLevel}</span>
                        <div className="level-bar">
                          <div 
                            className="level-fill" 
                            style={{ 
                              width: `${(currentLevel / skill.maxLevel) * 100}%`,
                              backgroundColor: category.color
                            }}
                          />
                        </div>
                      </div>
                      
                      {bonuses.map((bonus, index) => (
                        <div key={index} className="skill-bonus">
                          {bonus}
                        </div>
                      ))}
                    </div>
                    
                    <div className="skill-actions">
                      <button
                        className={`upgrade-btn ${canUpgrade ? 'enabled' : 'disabled'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          upgradeSkill(skill.id);
                        }}
                        disabled={!canUpgrade}
                      >
                        <Plus size={16} />
                        <span>{skill.cost}</span>
                      </button>
                      
                      <button
                        className={`downgrade-btn ${canDowngrade ? 'enabled' : 'disabled'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          downgradeSkill(skill.id);
                        }}
                        disabled={!canDowngrade}
                      >
                        <Minus size={16} />
                        <span>{skill.cost}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de détail de compétence */}
      {selectedSkill && (
        <motion.div
          className="skill-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedSkill(null)}
        >
          <motion.div
            className="skill-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedSkill.name}</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedSkill(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <p className="skill-description">{selectedSkill.description}</p>
              
              <div className="skill-level-info">
                <span>Niveau actuel: {getSkillLevel(selectedSkill.id)}/{selectedSkill.maxLevel}</span>
                <span>Coût: {selectedSkill.cost} point(s)</span>
              </div>
              
              {selectedSkill.requirements.length > 0 && (
                <div className="skill-requirements">
                  <h4>Prérequis:</h4>
                  <ul>
                    {selectedSkill.requirements.map((req, index) => (
                      <li key={index}>
                        {req.skill} (niveau {req.level})
                        {getSkillLevel(req.skill) >= req.level ? (
                          <Check className="check-icon" />
                        ) : (
                          <Lock className="lock-icon" />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SkillTree;
