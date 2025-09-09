import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Package, Heart, Sword, Brain, Zap, Shield, Target, Star, BookOpen } from 'lucide-react';
import IdleSprite from '../../../assets/images/Idle.png';
import TalentTree from '../TalentTree';
import './CharacterInventory.css';

const CharacterInventory = ({ 
  character, 
  userProfile, 
  finalStats, 
  onStatsUpdate, 
  loading, 
  error, 
  selectedSection, 
  setSelectedSection,
  inventory,
  equipment,
  selectedItem,
  inventoryLoading,
  inventoryError,
  handleEquip,
  handleUnequip,
  handleItemClick,
  getRarityColor,
  getDefaultIcon
}) => {
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

  // Fonction pour calculer les bonus des stats secondaires
  const calculateSecondaryBonuses = (secondaryStats) => {
    if (!secondaryStats) return {};
    
    return {
      health_bonus: Math.round(secondaryStats.vitality * 2),
      mana_bonus: Math.round(secondaryStats.wisdom * 1.5),
      attack_bonus: Math.round(secondaryStats.strength * 1.2),
      defense_bonus: Math.round(secondaryStats.endurance * 0.8),
      magic_attack_bonus: Math.round(secondaryStats.intelligence * 1.0),
      magic_defense_bonus: Math.round(secondaryStats.resistance * 0.6),
      physical_power_bonus: Math.round(secondaryStats.strength * 2.0),
      spell_power_bonus: Math.round(secondaryStats.intelligence * 1.8)
    };
  };

  // Fonction pour obtenir les stats secondaires avec bonus
  const getSecondaryStats = () => {
    if (!character?.stats?.secondary_stats_with_ranks) {
      const fallbackStats = {
        vitality: character?.vitality || 10,
        strength: character?.strength || 10,
        intelligence: character?.intelligence || 10,
        agility: character?.agility || 10,
        resistance: character?.resistance || 10,
        precision: character?.precision || 10,
        endurance: character?.endurance || 10,
        wisdom: character?.wisdom || 10,
        constitution: character?.constitution || 10,
        dexterity: character?.dexterity || 10
      };
      
      const secondaryBonuses = calculateSecondaryBonuses(fallbackStats);
      
      return [
        {
          icon: <Heart size={16} />,
          label: 'Vitalité',
          value: `+${secondaryBonuses.health_bonus || 0} PV, +${((fallbackStats.vitality * 0.1).toFixed(1))}/s`,
          color: '#ff6b6b',
          rank: 'F'
        },
        {
          icon: <Sword size={16} />,
          label: 'Force',
          value: `+${secondaryBonuses.attack_bonus || 0} ATQ, +${secondaryBonuses.physical_power_bonus || 0} PWR`,
          color: '#e74c3c',
          rank: 'F'
        },
        {
          icon: <Brain size={16} />,
          label: 'Intelligence',
          value: `+${secondaryBonuses.magic_attack_bonus || 0} MATQ, +${secondaryBonuses.spell_power_bonus || 0} PWR`,
          color: '#2ecc71',
          rank: 'F'
        },
        {
          icon: <Zap size={16} />,
          label: 'Agilité',
          value: `+${((fallbackStats.agility * 0.3).toFixed(1))}% Esquive, +${((fallbackStats.agility * 0.5).toFixed(1))}% Vitesse`,
          color: '#9b59b6',
          rank: 'F'
        },
        {
          icon: <Shield size={16} />,
          label: 'Résistance',
          value: `+${Math.round(fallbackStats.resistance * 0.6)} MDEF`,
          color: '#f39c12',
          rank: 'F'
        },
        {
          icon: <Target size={16} />,
          label: 'Précision',
          value: `+${((fallbackStats.precision * 0.3).toFixed(1))}% Critique`,
          color: '#2ecc71',
          rank: 'F'
        },
        {
          icon: <Heart size={16} />,
          label: 'Endurance',
          value: `+${Math.round(fallbackStats.endurance * 0.8)} DEF`,
          color: '#f39c12',
          rank: 'F'
        },
        {
          icon: <Brain size={16} />,
          label: 'Sagesse',
          value: `+${((fallbackStats.wisdom * 0.15).toFixed(1))}/s Mana`,
          color: '#9b59b6',
          rank: 'F'
        },
        {
          icon: <Shield size={16} />,
          label: 'Constitution',
          value: `+${((fallbackStats.constitution * 0.28).toFixed(1))}% Blocage`,
          color: '#e67e22',
          rank: 'F'
        },
        {
          icon: <Target size={16} />,
          label: 'Dextérité',
          value: `+${((fallbackStats.dexterity * 0.2).toFixed(1))}% Esquive, +${((fallbackStats.dexterity * 0.15).toFixed(1))}% Parade`,
          color: '#27ae60',
          rank: 'F'
        }
      ];
    }

    const secondaryStatsWithRanks = character.stats.secondary_stats_with_ranks;
    const secondaryStats = character.stats.secondary_stats || {};
    const secondaryBonuses = calculateSecondaryBonuses(secondaryStats);

    return [
      {
        icon: <Heart size={16} />,
        label: 'Vitalité',
        value: `+${secondaryBonuses.health_bonus || 0} PV, +${((secondaryStatsWithRanks.vitality?.value || 10) * 0.1).toFixed(1)}/s`,
        color: secondaryStatsWithRanks.vitality?.color || '#ff6b6b',
        rank: secondaryStatsWithRanks.vitality?.rank || 'F'
      },
      {
        icon: <Sword size={16} />,
        label: 'Force',
        value: `+${secondaryBonuses.attack_bonus || 0} ATQ, +${secondaryBonuses.physical_power_bonus || 0} PWR`,
        color: secondaryStatsWithRanks.strength?.color || '#e74c3c',
        rank: secondaryStatsWithRanks.strength?.rank || 'F'
      },
      {
        icon: <Brain size={16} />,
        label: 'Intelligence',
        value: `+${secondaryBonuses.magic_attack_bonus || 0} MATQ, +${secondaryBonuses.spell_power_bonus || 0} PWR`,
        color: secondaryStatsWithRanks.intelligence?.color || '#2ecc71',
        rank: secondaryStatsWithRanks.intelligence?.rank || 'F'
      },
      {
        icon: <Zap size={16} />,
        label: 'Agilité',
        value: `+${((secondaryStatsWithRanks.agility?.value || 10) * 0.3).toFixed(1)}% Esquive, +${((secondaryStatsWithRanks.agility?.value || 10) * 0.5).toFixed(1)}% Vitesse`,
        color: secondaryStatsWithRanks.agility?.color || '#9b59b6',
        rank: secondaryStatsWithRanks.agility?.rank || 'F'
      },
      {
        icon: <Shield size={16} />,
        label: 'Résistance',
        value: `+${Math.round((secondaryStatsWithRanks.resistance?.value || 10) * 0.6)} MDEF`,
        color: secondaryStatsWithRanks.resistance?.color || '#f39c12',
        rank: secondaryStatsWithRanks.resistance?.rank || 'F'
      },
      {
        icon: <Target size={16} />,
        label: 'Précision',
        value: `+${((secondaryStatsWithRanks.precision?.value || 10) * 0.3).toFixed(1)}% Critique`,
        color: secondaryStatsWithRanks.precision?.color || '#2ecc71',
        rank: secondaryStatsWithRanks.precision?.rank || 'F'
      },
      {
        icon: <Heart size={16} />,
        label: 'Endurance',
        value: `+${Math.round((secondaryStatsWithRanks.endurance?.value || 10) * 0.8)} DEF`,
        color: secondaryStatsWithRanks.endurance?.color || '#f39c12',
        rank: secondaryStatsWithRanks.endurance?.rank || 'F'
      },
      {
        icon: <Brain size={16} />,
        label: 'Sagesse',
        value: `+${((secondaryStatsWithRanks.wisdom?.value || 10) * 0.15).toFixed(1)}/s Mana`,
        color: secondaryStatsWithRanks.wisdom?.color || '#9b59b6',
        rank: secondaryStatsWithRanks.wisdom?.rank || 'F'
      },
      {
        icon: <Shield size={16} />,
        label: 'Constitution',
        value: `+${((secondaryStatsWithRanks.constitution?.value || 10) * 0.28).toFixed(1)}% Blocage`,
        color: secondaryStatsWithRanks.constitution?.color || '#e67e22',
        rank: secondaryStatsWithRanks.constitution?.rank || 'F'
      },
      {
        icon: <Target size={16} />,
        label: 'Dextérité',
        value: `+${((secondaryStatsWithRanks.dexterity?.value || 10) * 0.2).toFixed(1)}% Esquive, +${((secondaryStatsWithRanks.dexterity?.value || 10) * 0.15).toFixed(1)}% Parade`,
        color: secondaryStatsWithRanks.dexterity?.color || '#27ae60',
        rank: secondaryStatsWithRanks.dexterity?.rank || 'F'
      }
    ];
  };

  // Animation du sprite chibi - arrêtée
  const [currentFrame, setCurrentFrame] = useState(0);

  // Fonctions de drag & drop
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e, slotType) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    try {
      const itemData = e.dataTransfer.getData('application/json');
      const item = JSON.parse(itemData);
      
      // Vérifier si l'objet peut être équipé dans ce slot
      if (item.type === slotType) {
        await handleEquip(item);
      }
    } catch (error) {
      console.error('Erreur lors du drop:', error);
    }
  };

  return (
    <div className="character-inventory-container">
      <Inventory3DContent 
        character={character}
        inventory={inventory}
        equipment={equipment}
        selectedItem={selectedItem}
        inventoryLoading={inventoryLoading}
        inventoryError={inventoryError}
        handleEquip={handleEquip}
        handleUnequip={handleUnequip}
        handleItemClick={handleItemClick}
        getRarityColor={getRarityColor}
        getDefaultIcon={getDefaultIcon}
        getSecondaryStats={getSecondaryStats}
        currentFrame={currentFrame}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDragEnter={handleDragEnter}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
      />
    </div>
  );
};

// Composant de contenu de l'inventaire 3D
const Inventory3DContent = ({
  character,
  inventory,
  equipment,
  selectedItem,
  inventoryLoading,
  inventoryError,
  handleEquip,
  handleUnequip,
  handleItemClick,
  getRarityColor,
  getDefaultIcon,
  getSecondaryStats,
  currentFrame,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop
}) => {
  if (inventoryLoading) {
    return (
      <div className="inventory-loading">
        <div className="loading-spinner">⚔️</div>
        <p>Chargement de l'inventaire...</p>
      </div>
    );
  }

  if (inventoryError) {
    return (
      <div className="inventory-error">
        <h3>❌ Erreur</h3>
        <p>{inventoryError}</p>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Header */}
      <div className="inventory-header">
        <h2>🎒 Inventaire 3D</h2>
        <p>Gérez votre équipement et optimisez vos statistiques</p>
      </div>

      {/* Panneaux principaux */}
      <div className="main-panels">
        {/* Panneau gauche */}
        <div className="left-panel">
          {/* Personnage */}
          <div className="character-section">
            <img 
              src={IdleSprite} 
              alt="Character Sprite" 
              className="character-sprite"
              style={{
                objectPosition: `-${currentFrame * 128}px 0px`
              }}
            />
          </div>

          {/* Équipements */}
          <div className="equipment-section">
            <h3>⚔️ Équipements</h3>
            <div className="equipment-grid">
              {/* Arme */}
              <div 
                className={`equipment-slot ${equipment.weapon ? 'equipped' : ''}`}
                onDrop={(e) => handleDrop(e, 'weapon')}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                title={equipment.weapon ? equipment.weapon.name : 'Aucune arme'}
              >
                <div className="equipment-icon">⚔️</div>
                <div className="equipment-name">Arme</div>
                {equipment.weapon && (
                  <button 
                    className="unequip-button"
                    onClick={() => handleUnequip('weapon')}
                    title="Déséquiper"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {/* Bouclier */}
              <div 
                className={`equipment-slot ${equipment.shield ? 'equipped' : ''}`}
                onDrop={(e) => handleDrop(e, 'shield')}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                title={equipment.shield ? equipment.shield.name : 'Aucun bouclier'}
              >
                <div className="equipment-icon">🛡️</div>
                <div className="equipment-name">Bouclier</div>
                {equipment.shield && (
                  <button 
                    className="unequip-button"
                    onClick={() => handleUnequip('shield')}
                    title="Déséquiper"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Armure */}
              <div 
                className={`equipment-slot ${equipment.armor ? 'equipped' : ''}`}
                onDrop={(e) => handleDrop(e, 'armor')}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                title={equipment.armor ? equipment.armor.name : 'Aucune armure'}
              >
                <div className="equipment-icon">👕</div>
                <div className="equipment-name">Armure</div>
                {equipment.armor && (
                  <button 
                    className="unequip-button"
                    onClick={() => handleUnequip('armor')}
                    title="Déséquiper"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Casque */}
              <div 
                className={`equipment-slot ${equipment.helmet ? 'equipped' : ''}`}
                onDrop={(e) => handleDrop(e, 'helmet')}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                title={equipment.helmet ? equipment.helmet.name : 'Aucun casque'}
              >
                <div className="equipment-icon">👑</div>
                <div className="equipment-name">Casque</div>
                {equipment.helmet && (
                  <button 
                    className="unequip-button"
                    onClick={() => handleUnequip('helmet')}
                    title="Déséquiper"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Gants */}
              <div 
                className={`equipment-slot ${equipment.gloves ? 'equipped' : ''}`}
                onDrop={(e) => handleDrop(e, 'gloves')}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                title={equipment.gloves ? equipment.gloves.name : 'Aucuns gants'}
              >
                <div className="equipment-icon">🧤</div>
                <div className="equipment-name">Gants</div>
                {equipment.gloves && (
                  <button 
                    className="unequip-button"
                    onClick={() => handleUnequip('gloves')}
                    title="Déséquiper"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Bottes */}
              <div 
                className={`equipment-slot ${equipment.boots ? 'equipped' : ''}`}
                onDrop={(e) => handleDrop(e, 'boots')}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                title={equipment.boots ? equipment.boots.name : 'Aucunes bottes'}
              >
                <div className="equipment-icon">👢</div>
                <div className="equipment-name">Bottes</div>
                {equipment.boots && (
                  <button 
                    className="unequip-button"
                    onClick={() => handleUnequip('boots')}
                    title="Déséquiper"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="info-section">
            <h3>👤 Informations</h3>
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Nom</span>
                <span className="info-value">{character.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Niveau</span>
                <span className="info-value">{character.level}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Classe</span>
                <span className="info-value">{character.class_display_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">PV</span>
                <span className="info-value">{character.current_health || 0}/{character.max_health || 0}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Mana</span>
                <span className="info-value">{character.current_mana || 0}/{character.max_mana || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panneau droit */}
        <div className="right-panel">
          {/* Inventaire (partie blanche) */}
          <div className="inventory-section">
            <h3>🎒 Inventaire</h3>
            <div className="inventory-grid">
              {inventory.map((item, index) => (
                <div 
                  key={item.id || index}
                  className={`inventory-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                  style={{ borderColor: getRarityColor(item.rarity) }}
                  onClick={() => handleItemClick(item)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                >
                  <div className="item-icon">{item.icon}</div>
                  <div className="item-name">{item.name}</div>
                  <div className="item-rarity" style={{ color: getRarityColor(item.rarity) }}>
                    {item.rarity?.toUpperCase()}
                  </div>
                  {item.quantity > 1 && (
                    <div className="item-quantity">{item.quantity}</div>
                  )}
                  {selectedItem?.id === item.id && (
                    <div className="item-actions">
                      <button 
                        className="equip-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEquip(item);
                        }}
                      >
                        Équiper
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats secondaires (partie rouge) */}
          <div className="secondary-stats-section">
            <h3>⭐ Statistiques Secondaires</h3>
            <div className="stats-grid">
              {getSecondaryStats().map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon" style={{ color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                    <div className="stat-rank" style={{ color: stat.color }}>
                      RANG {stat.rank}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Arbre de talents */}
      <div className="talent-tree-section">
        <TalentTree character={character} />
      </div>
    </div>
  );
};

export default CharacterInventory;