import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Package, 
  BookOpen, 
  Trophy, 
  Sword,
  Shield,
  Zap,
  Heart,
  Brain,
  Star,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import CharacterOverview from './overview/CharacterOverview';
import CharacterInventory from './inventory/CharacterInventory';
import SkillTree from './skills/SkillTree';
import SpellBook from './skills/SpellBook';
import './Character.css';
// import AutoSaveIndicator from '../common/AutoSaveIndicator';

const Character = () => {
  const [selectedSection, setSelectedSection] = useState('overview');
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finalStats, setFinalStats] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // États pour l'inventaire
  const [inventory, setInventory] = useState([]);
  const [equipment, setEquipment] = useState({
    weapon: null,
    shield: null,
    armor: null,
    helmet: null,
    gloves: null,
    boots: null
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);
  
  useEffect(() => {
    const loadCharacterData = async () => {
      if (hasLoaded || !user || !user.id) {
        return;
      }
      
      try {
        setLoading(true);
        setHasLoaded(true);
        
        // Utiliser l'API optimisée pour charger toutes les données en une fois
        const response = await apiService.getCharacterPageData();
        
        if (response && response.character) {
          setCharacter(response.character);
          setFinalStats(response.character.stats || response.character);
          
          // Charger l'inventaire si disponible
          if (response.inventory) {
            processInventoryData(response.inventory);
          }
          
          // Charger les compétences si disponibles
          if (response.skills) {
            // Les compétences seront gérées par les composants enfants
          }
        } else {
          setError('Aucun personnage trouvé');
        }
        
        console.log('Character data loaded:', response);
      } catch (err) {
        console.error('Erreur lors du chargement du personnage:', err);
        setError('Impossible de charger les données du personnage');
      } finally {
        setLoading(false);
      }
    };

    loadCharacterData();
  }, [user, hasLoaded]);

  // Fonction pour recharger les stats après équipement/déséquipement
  const reloadStats = useCallback(async () => {
    try {
      if (user && user.id) {
        const characterId = character?.id || user?.character?.id;
        const stats = await databaseService.getCharacterStats(characterId);
        const final = stats.calculated || stats;
        setFinalStats(final);
        setCharacter(prev => ({ ...prev }));
      }
    } catch (err) {
      console.error('Erreur lors du rechargement des stats:', err);
    }
  }, [user]);

  // Fonctions de gestion de l'inventaire
  const loadInventory = async () => {
    try {
      setInventoryLoading(true);
      if (user && user.id) {
        const inventoryData = await databaseService.getCharacterInventory(user.id);
        processInventoryData(inventoryData);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'inventaire:', err);
      setInventoryError('Impossible de charger l\'inventaire');
      loadMockInventory();
    } finally {
      setInventoryLoading(false);
    }
  };

  const processInventoryData = (inventoryData) => {
    const inventoryItems = [];
    const equippedItems = {};

    inventoryData.forEach(item => {
      const processedItem = {
        id: item.item_id,
        name: item.item_display_name || item.item_name,
        type: item.item_type,
        icon: item.item_icon || getDefaultIcon(item.item_type),
        rarity: item.rarity_name,
        stats: item.item_stats || {},
        description: item.item_description || 'Description non disponible',
        quantity: item.quantity,
        equipped: item.equipped,
        equipped_slot: item.equipped_slot
      };

      if (item.equipped && item.equipped_slot) {
        equippedItems[item.equipped_slot] = processedItem;
      } else {
        inventoryItems.push(processedItem);
      }
    });

    setInventory(inventoryItems);
    setEquipment(equippedItems);
  };

  const loadMockInventory = () => {
    const mockInventory = [
      { 
        id: 1, 
        name: 'Épée Ardente', 
        type: 'weapon', 
        icon: '⚔️', 
        rarity: 'rare',
        stats: { attack: 45, durability: 85 },
        description: 'Une épée forgée dans les flammes éternelles',
        quantity: 1,
        equipped: false
      },
      { 
        id: 2, 
        name: 'Bouclier Arcanique', 
        type: 'shield', 
        icon: '🛡️', 
        rarity: 'epic',
        stats: { defense: 32, resistance: 70 },
        description: 'Bouclier imprégné de magie ancienne',
        quantity: 1,
        equipped: false
      }
    ];

    setInventory(mockInventory);
    setEquipment({
      weapon: null,
      shield: null,
      armor: null,
      helmet: null,
      gloves: null,
      boots: null
    });
  };

  const getDefaultIcon = (itemType) => {
    const iconMap = {
      'weapon': '⚔️',
      'shield': '🛡️',
      'armor': '👕',
      'helmet': '👑',
      'gloves': '🧤',
      'boots': '👢',
      'accessory': '💍',
      'consumable': '🧪',
      'material': '🔧'
    };
    return iconMap[itemType] || '📦';
  };

  const handleEquip = async (item) => {
    try {
      if (!user || !user.id) {
        console.error('Utilisateur non connecté');
        return;
      }

      await databaseService.equipItem((character?.id || user?.character?.id), item.id, item.type);
      
      if (equipment[item.type]) {
        setInventory(prev => [...prev, equipment[item.type]]);
      }

      setEquipment(prev => ({
        ...prev,
        [item.type]: item
      }));
      
      setInventory(prev => prev.filter(invItem => invItem.id !== item.id));
      setSelectedItem(null);
      
      if (reloadStats) {
        await reloadStats();
      }
    } catch (error) {
      console.error('Erreur lors de l\'équipement:', error);
      setInventoryError('Impossible d\'équiper cet objet');
    }
  };

  const handleUnequip = async (slotType) => {
    try {
      if (!user || !user.id) {
        console.error('Utilisateur non connecté');
        return;
      }

      const item = equipment[slotType];
      if (item) {
        await databaseService.unequipItem((character?.id || user?.character?.id), slotType);
        
        setInventory(prev => [...prev, item]);
        setEquipment(prev => ({
          ...prev,
          [slotType]: null
        }));
        
        if (reloadStats) {
          await reloadStats();
        }
      }
    } catch (error) {
      console.error('Erreur lors du déséquipement:', error);
      setInventoryError('Impossible de déséquiper cet objet');
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'common': return '#95a5a6';
      case 'rare': return '#3498db';
      case 'epic': return '#9b59b6';
      case 'legendary': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  // Charger l'inventaire quand l'utilisateur change
  useEffect(() => {
    if (user && user.id) {
      loadInventory();
    }
  }, [user]);

  // Props communes pour les composants enfants
  const commonProps = {
    character,
    userProfile,
    finalStats,
    onStatsUpdate: reloadStats,
    loading,
    error,
    selectedSection,
    setSelectedSection,
    // Props pour l'inventaire
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
  };

  return (
    <div className="character-page">
      <motion.div className="character-header" 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>👤 Personnage</h1>
        <p>Gérez votre personnage et ses équipements dans Eternal Ascent</p>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        className="character-tabs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <button 
          className={`tab-button ${selectedSection === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedSection('overview')}
        >
          <User size={16} /> Vue d'ensemble
        </button>
        <button 
          className={`tab-button ${selectedSection === 'stats' ? 'active' : ''}`}
          onClick={() => setSelectedSection('stats')}
        >
          <Brain size={16} /> Statistiques
        </button>
        <button 
          className={`tab-button ${selectedSection === 'inventory3d' ? 'active' : ''}`}
          onClick={() => setSelectedSection('inventory3d')}
        >
          <Package size={16} /> Inventaire
        </button>
        <button 
          className={`tab-button ${selectedSection === 'skills' ? 'active' : ''}`}
          onClick={() => setSelectedSection('skills')}
        >
          <BookOpen size={16} /> Compétences
        </button>
        <button 
          className={`tab-button ${selectedSection === 'achievements' ? 'active' : ''}`}
          onClick={() => setSelectedSection('achievements')}
        >
          <Trophy size={16} /> Succès
        </button>
        <button 
          className={`tab-button ${selectedSection === 'equipment' ? 'active' : ''}`}
          onClick={() => setSelectedSection('equipment')}
        >
          <Sword size={16} /> Équipement
        </button>
        <button 
          className={`tab-button ${selectedSection === 'spells' ? 'active' : ''}`}
          onClick={() => setSelectedSection('spells')}
        >
          <Zap size={16} /> Sorts
        </button>
      </motion.div>

      {/* Contenu des sections avec animations */}
      <div className="character-content">
        <AnimatePresence mode="wait">
          {selectedSection === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CharacterOverview {...commonProps} />
            </motion.div>
          )}

          {selectedSection === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="stats-tab"
            >
              <h3>Statistiques détaillées</h3>
              <div className="detailed-stats">
                <div className="stat-section">
                  <h4>Stats de base</h4>
                  <div className="stat-list">
                    <div className="stat-item">
                      <span>Santé:</span>
                      <span>{finalStats?.health || character?.health || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Mana:</span>
                      <span>{finalStats?.mana || character?.mana || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Attaque:</span>
                      <span>{finalStats?.attack || character?.attack || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Défense:</span>
                      <span>{finalStats?.defense || character?.defense || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Attaque magique:</span>
                      <span>{finalStats?.magic_attack || character?.magic_attack || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Défense magique:</span>
                      <span>{finalStats?.magic_defense || character?.magic_defense || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Vitesse:</span>
                      <span>{finalStats?.speed || character?.speed || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span>Taux critique:</span>
                      <span>{((finalStats?.critical_rate || character?.critical_rate || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="stat-item">
                      <span>Dégâts critiques:</span>
                      <span>{((finalStats?.critical_damage || character?.critical_damage || 1) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedSection === 'inventory3d' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CharacterInventory {...commonProps} />
            </motion.div>
          )}

          {selectedSection === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SkillTree character={character} onStatsUpdate={reloadStats} />
            </motion.div>
          )}

          {selectedSection === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="achievements-tab"
            >
              <h3>Succès</h3>
              <div className="achievement-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: '0%' }}
                  />
                </div>
                <p>0 / 0 succès débloqués</p>
              </div>
              <div className="achievements-grid">
                <div className="achievement-card locked">
                  <Trophy className="achievement-icon" />
                  <div className="achievement-content">
                    <h4>Premier pas</h4>
                    <p>Créez votre premier personnage</p>
                    <span className="achievement-rarity">Commun</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedSection === 'equipment' && (
            <motion.div
              key="equipment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="equipment-tab"
            >
              <h3>Équipement</h3>
              <div className="equipment-grid">
                {Object.entries(equipment).map(([slot, item]) => (
                  <div key={slot} className="equipment-card">
                    <div className="equipment-slot">
                      <span className="slot-name">{slot}</span>
                    </div>
                    <div className="equipment-item">
                      {item ? (
                        <>
                          <h4>{item.name}</h4>
                          <p>{item.description}</p>
                          <div className="equipment-stats">
                            <span>Niveau: {item.level || 1}</span>
                            <span>Rareté: {item.rarity || 'Commun'}</span>
                          </div>
                        </>
                      ) : (
                        <p>Aucun objet équipé</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {selectedSection === 'spells' && (
            <motion.div
              key="spells"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SpellBook character={character} onStatsUpdate={reloadStats} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Character;