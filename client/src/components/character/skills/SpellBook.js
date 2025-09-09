import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
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
  Minus,
  BookOpen,
  Flame,
  Snowflake,
  Wind
} from 'lucide-react';
import './SpellBook.css';

const SpellBook = ({ character, onStatsUpdate }) => {
  const [spellPoints, setSpellPoints] = useState(character?.spell_points || 0);
  const [spells, setSpells] = useState({});
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [spellCategories, setSpellCategories] = useState([
    {
      id: 'offensive',
      name: 'Sorts Offensifs',
      icon: <Sword size={20} />,
      color: '#e74c3c',
      spells: [
        {
          id: 'fireball',
          name: 'Boule de Feu',
          description: 'Lance une boule de feu qui inflige des dégâts de feu',
          maxLevel: 10,
          currentLevel: 0,
          cost: 1,
          requirements: [],
          category: 'offensive',
          icon: <Flame size={16} />,
          damage: 50,
          manaCost: 20,
          cooldown: 3,
          range: 'Moyenne',
          element: 'Feu'
        },
        {
          id: 'ice_shard',
          name: 'Éclat de Glace',
          description: 'Lance un éclat de glace qui ralentit l\'ennemi',
          maxLevel: 8,
          currentLevel: 0,
          cost: 2,
          requirements: [{ spell: 'fireball', level: 3 }],
          category: 'offensive',
          icon: <Snowflake size={16} />,
          damage: 35,
          manaCost: 15,
          cooldown: 2,
          range: 'Courte',
          element: 'Glace'
        },
        {
          id: 'lightning_bolt',
          name: 'Éclair',
          description: 'Frappe l\'ennemi avec un éclair instantané',
          maxLevel: 12,
          currentLevel: 0,
          cost: 3,
          requirements: [
            { spell: 'fireball', level: 5 },
            { spell: 'ice_shard', level: 3 }
          ],
          category: 'offensive',
          icon: <Zap size={16} />,
          damage: 80,
          manaCost: 30,
          cooldown: 4,
          range: 'Longue',
          element: 'Foudre'
        }
      ]
    },
    {
      id: 'defensive',
      name: 'Sorts Défensifs',
      icon: <Shield size={20} />,
      color: '#3498db',
      spells: [
        {
          id: 'heal',
          name: 'Soin',
          description: 'Restaure des points de vie',
          maxLevel: 15,
          currentLevel: 0,
          cost: 1,
          requirements: [],
          category: 'defensive',
          icon: <Heart size={16} />,
          healing: 40,
          manaCost: 25,
          cooldown: 5,
          range: 'Soi-même',
          element: 'Lumière'
        },
        {
          id: 'shield',
          name: 'Bouclier Magique',
          description: 'Crée un bouclier qui absorbe les dégâts',
          maxLevel: 10,
          currentLevel: 0,
          cost: 2,
          requirements: [{ spell: 'heal', level: 5 }],
          category: 'defensive',
          icon: <Shield size={16} />,
          absorption: 100,
          manaCost: 35,
          cooldown: 8,
          range: 'Soi-même',
          element: 'Lumière'
        },
        {
          id: 'regeneration',
          name: 'Régénération',
          description: 'Restaure progressivement la vie sur la durée',
          maxLevel: 8,
          currentLevel: 0,
          cost: 3,
          requirements: [
            { spell: 'heal', level: 8 },
            { spell: 'shield', level: 5 }
          ],
          category: 'defensive',
          icon: <Heart size={16} />,
          healing: 20,
          manaCost: 40,
          cooldown: 10,
          range: 'Soi-même',
          element: 'Nature'
        }
      ]
    },
    {
      id: 'utility',
      name: 'Sorts d\'Utilité',
      icon: <Brain size={20} />,
      color: '#9b59b6',
      spells: [
        {
          id: 'teleport',
          name: 'Téléportation',
          description: 'Se téléporte à une courte distance',
          maxLevel: 5,
          currentLevel: 0,
          cost: 2,
          requirements: [],
          category: 'utility',
          icon: <Wind size={16} />,
          distance: 10,
          manaCost: 20,
          cooldown: 6,
          range: 'Courte',
          element: 'Espace'
        },
        {
          id: 'invisibility',
          name: 'Invisibilité',
          description: 'Devient invisible pendant un court moment',
          maxLevel: 8,
          currentLevel: 0,
          cost: 3,
          requirements: [{ spell: 'teleport', level: 3 }],
          category: 'utility',
          icon: <Target size={16} />,
          duration: 5,
          manaCost: 30,
          cooldown: 12,
          range: 'Soi-même',
          element: 'Ombre'
        },
        {
          id: 'haste',
          name: 'Hâte',
          description: 'Augmente la vitesse de déplacement et d\'attaque',
          maxLevel: 6,
          currentLevel: 0,
          cost: 4,
          requirements: [
            { spell: 'teleport', level: 5 },
            { spell: 'invisibility', level: 3 }
          ],
          category: 'utility',
          icon: <Wind size={16} />,
          speedBoost: 50,
          manaCost: 25,
          cooldown: 15,
          range: 'Soi-même',
          element: 'Vent'
        }
      ]
    }
  ]);

  // Charger les sorts sauvegardés
  useEffect(() => {
    if (character?.spells) {
      setSpells(character.spells);
    }
  }, [character]);

  // Vérifier si un sort peut être amélioré
  const canUpgradeSpell = (spell) => {
    if (spell.currentLevel >= spell.maxLevel) return false;
    if (spellPoints < spell.cost) return false;
    
    // Vérifier les prérequis
    for (const req of spell.requirements) {
      const reqSpell = spells[req.spell];
      if (!reqSpell || reqSpell.currentLevel < req.level) {
        return false;
      }
    }
    
    return true;
  };

  // Améliorer un sort
  const upgradeSpell = (spellId) => {
    const spell = spellCategories
      .flatMap(cat => cat.spells)
      .find(s => s.id === spellId);
    
    if (!canUpgradeSpell(spell)) return;
    
    const newSpells = { ...spells };
    if (!newSpells[spellId]) {
      newSpells[spellId] = { ...spell, currentLevel: 0 };
    }
    
    newSpells[spellId].currentLevel += 1;
    setSpells(newSpells);
    setSpellPoints(prev => prev - spell.cost);
    
    // Sauvegarder les changements
    saveSpells(newSpells);
  };

  // Réduire un sort
  const downgradeSpell = (spellId) => {
    const spell = spells[spellId];
    if (!spell || spell.currentLevel <= 0) return;
    
    const newSpells = { ...spells };
    newSpells[spellId].currentLevel -= 1;
    setSpells(newSpells);
    setSpellPoints(prev => prev + spell.cost);
    
    // Sauvegarder les changements
    saveSpells(newSpells);
  };

  // Sauvegarder les sorts
  const saveSpells = async (spellsToSave) => {
    try {
      // Ici vous pouvez ajouter l'appel API pour sauvegarder
      console.log('Saving spells:', spellsToSave);
      // await databaseService.saveCharacterSpells(character.id, spellsToSave);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des sorts:', error);
    }
  };

  // Obtenir le niveau total d'un sort
  const getSpellLevel = (spellId) => {
    return spells[spellId]?.currentLevel || 0;
  };

  // Obtenir les statistiques d'un sort
  const getSpellStats = (spell) => {
    const level = getSpellLevel(spell.id);
    const stats = [];
    
    if (spell.damage) {
      stats.push(`Dégâts: ${spell.damage + (level * 10)}`);
    }
    if (spell.healing) {
      stats.push(`Soin: ${spell.healing + (level * 5)}`);
    }
    if (spell.absorption) {
      stats.push(`Absorption: ${spell.absorption + (level * 20)}`);
    }
    if (spell.distance) {
      stats.push(`Distance: ${spell.distance + (level * 2)}m`);
    }
    if (spell.duration) {
      stats.push(`Durée: ${spell.duration + (level * 1)}s`);
    }
    if (spell.speedBoost) {
      stats.push(`Vitesse: +${spell.speedBoost + (level * 10)}%`);
    }
    
    return stats;
  };

  return (
    <div className="spell-book-page">
      <div className="spell-book-header">
        <h1>📖 Grimoire de Sorts</h1>
        <p>Maîtrisez la magie et développez vos pouvoirs arcaniques</p>
        <div className="spell-points-display">
          <BookOpen className="spell-points-icon" />
          <span className="spell-points-text">Points de sort: {spellPoints}</span>
        </div>
      </div>

      <div className="spell-categories">
        {spellCategories.map((category) => (
          <motion.div
            key={category.id}
            className="spell-category"
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
            
            <div className="spells-grid">
              {category.spells.map((spell) => {
                const currentLevel = getSpellLevel(spell.id);
                const canUpgrade = canUpgradeSpell(spell);
                const canDowngrade = currentLevel > 0;
                const stats = getSpellStats(spell);
                
                return (
                  <motion.div
                    key={spell.id}
                    className={`spell-card ${currentLevel > 0 ? 'unlocked' : 'locked'}`}
                    style={{ borderColor: category.color }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSpell(spell)}
                  >
                    <div className="spell-icon" style={{ color: category.color }}>
                      {currentLevel > 0 ? spell.icon : <Lock size={16} />}
                    </div>
                    
                    <div className="spell-info">
                      <h4 className="spell-name">{spell.name}</h4>
                      <p className="spell-description">{spell.description}</p>
                      
                      <div className="spell-details">
                        <div className="spell-element">
                          <span className="element-label">Élément:</span>
                          <span className="element-value">{spell.element}</span>
                        </div>
                        <div className="spell-range">
                          <span className="range-label">Portée:</span>
                          <span className="range-value">{spell.range}</span>
                        </div>
                        <div className="spell-mana">
                          <span className="mana-label">Mana:</span>
                          <span className="mana-value">{spell.manaCost}</span>
                        </div>
                        <div className="spell-cooldown">
                          <span className="cooldown-label">Recharge:</span>
                          <span className="cooldown-value">{spell.cooldown}s</span>
                        </div>
                      </div>
                      
                      <div className="spell-level">
                        <span className="level-text">Niveau {currentLevel}/{spell.maxLevel}</span>
                        <div className="level-bar">
                          <div 
                            className="level-fill" 
                            style={{ 
                              width: `${(currentLevel / spell.maxLevel) * 100}%`,
                              backgroundColor: category.color
                            }}
                          />
                        </div>
                      </div>
                      
                      {stats.map((stat, index) => (
                        <div key={index} className="spell-stat">
                          {stat}
                        </div>
                      ))}
                    </div>
                    
                    <div className="spell-actions">
                      <button
                        className={`upgrade-btn ${canUpgrade ? 'enabled' : 'disabled'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          upgradeSpell(spell.id);
                        }}
                        disabled={!canUpgrade}
                      >
                        <Plus size={16} />
                        <span>{spell.cost}</span>
                      </button>
                      
                      <button
                        className={`downgrade-btn ${canDowngrade ? 'enabled' : 'disabled'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          downgradeSpell(spell.id);
                        }}
                        disabled={!canDowngrade}
                      >
                        <Minus size={16} />
                        <span>{spell.cost}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de détail de sort */}
      {selectedSpell && (
        <motion.div
          className="spell-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedSpell(null)}
        >
          <motion.div
            className="spell-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedSpell.name}</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedSpell(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <p className="spell-description">{selectedSpell.description}</p>
              
              <div className="spell-level-info">
                <span>Niveau actuel: {getSpellLevel(selectedSpell.id)}/{selectedSpell.maxLevel}</span>
                <span>Coût: {selectedSpell.cost} point(s)</span>
              </div>
              
              <div className="spell-stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Élément:</span>
                  <span className="stat-value">{selectedSpell.element}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Portée:</span>
                  <span className="stat-value">{selectedSpell.range}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Mana:</span>
                  <span className="stat-value">{selectedSpell.manaCost}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Recharge:</span>
                  <span className="stat-value">{selectedSpell.cooldown}s</span>
                </div>
              </div>
              
              {selectedSpell.requirements.length > 0 && (
                <div className="spell-requirements">
                  <h4>Prérequis:</h4>
                  <ul>
                    {selectedSpell.requirements.map((req, index) => (
                      <li key={index}>
                        {req.spell} (niveau {req.level})
                        {getSpellLevel(req.spell) >= req.level ? (
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

export default SpellBook;
