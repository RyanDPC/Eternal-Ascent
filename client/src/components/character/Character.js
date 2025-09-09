import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Package, Star, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import databaseService from '../../services/databaseService';
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
      // Éviter les appels multiples
      if (hasLoaded || !user || !user.id) {
        return;
      }
      
      try {
        setLoading(true);
        setHasLoaded(true);
        
        const [characterData, profileData] = await Promise.all([
          databaseService.getCharacterData(user.id),
          databaseService.getUserProfile()
        ]);
        
        // Récupérer les stats finales avec équipement
        try {
          const statsResponse = await fetch(`/api/characters/${user.id}/stats`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            // Fusionner les données du personnage avec les stats finales
            const characterWithFinalStats = {
              ...characterData,
              ...statsData.final_stats,
              equipped_items: statsData.equipped_items
            };
            setCharacter(characterWithFinalStats);
            setFinalStats(statsData.final_stats);
          } else {
            console.warn('Stats API non disponible, utilisation des stats de base');
            setCharacter(characterData);
          }
        } catch (statsError) {
          console.warn('Erreur stats API, utilisation des stats de base:', statsError);
          setCharacter(characterData);
        }
        
        setUserProfile(profileData);
        console.log('Character data:', characterData);
        console.log('User profile data:', profileData);
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
        const statsResponse = await fetch(`/api/characters/${user.id}/stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setFinalStats(statsData.final_stats);
          
          // Mettre à jour le personnage avec les nouvelles stats
          setCharacter(prevCharacter => ({
            ...prevCharacter,
            ...statsData.final_stats,
            equipped_items: statsData.equipped_items
          }));
        }
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

      await databaseService.equipItem(user.id, item.id, item.type);
      
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
        await databaseService.unequipItem(user.id, slotType);
        
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
          className={`tab-button ${selectedSection === 'inventory3d' ? 'active' : ''}`}
          onClick={() => setSelectedSection('inventory3d')}
        >
          <Package size={16} /> Inventaire 3D
        </button>
        <button 
          className={`tab-button ${selectedSection === 'skills' ? 'active' : ''}`}
          onClick={() => setSelectedSection('skills')}
        >
          <Star size={16} /> Compétences
        </button>
        <button 
          className={`tab-button ${selectedSection === 'spells' ? 'active' : ''}`}
          onClick={() => setSelectedSection('spells')}
        >
          <BookOpen size={16} /> Sorts
        </button>
      </motion.div>

      {/* Contenu des sections */}
      {selectedSection === 'overview' && (
        <CharacterOverview {...commonProps} />
      )}

      {selectedSection === 'inventory3d' && (
        <CharacterInventory {...commonProps} />
      )}

      {selectedSection === 'skills' && (
        <SkillTree character={character} onStatsUpdate={reloadStats} />
      )}

      {selectedSection === 'spells' && (
        <SpellBook character={character} onStatsUpdate={reloadStats} />
      )}
    </div>
  );
};

export default Character;