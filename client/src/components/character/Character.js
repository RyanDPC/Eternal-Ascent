import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home,
  Package, 
  BookOpen, 
  Trophy, 
  Sword,
  Shield,
  Zap,
  Heart,
  TrendingUp,
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import './Character.css';
import '../dashboard/Dashboard.css';
import CharacterOverview from './overview/CharacterOverview';
import CharacterInventory from './inventory/CharacterInventory';
import TalentTree from './TalentTree';
import SkillTree from './skills/SkillTree';
// import AutoSaveIndicator from '../common/AutoSaveIndicator';

const Character = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finalStats, setFinalStats] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  
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
          const ch = response.character;
          setCharacter(ch);
          setFinalStats(ch.stats || null);

          // Les sections consommeront directement ch.inventory, ch.equipped_items, ch.skills, ch.achievements
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
      // Recharger les données de la page personnage pour rester aligné avec l'endpoint
      const response = await apiService.getCharacterPageData();
      if (response && response.character) {
        setCharacter(response.character);
        setFinalStats(response.character.stats || null);
      }
    } catch (err) {
      console.error('Erreur lors du rechargement des stats:', err);
    }
  }, []);

  // L'inventaire est lu directement depuis character.inventory / character.equipped_items

  // Removed old mock/equip handlers; we present read-only inventory/equipment here

  // Plus de chargement séparé d'inventaire: tout vient de l'endpoint optimisé

  const stats = (character?.stats || finalStats || {});

  // Helpers to present inventory/equipment in a consistent shape for CharacterInventory
  const getDefaultIcon = (itemType) => {
    const iconMap = {
      'weapon': '⚔️',
      'shield': '🛡️',
      'armor': '👕',
      'helmet': '👑',
      'gloves': '🧤',
      'boots': '👢',
      'accessory': '💍',
      'ring': '💍',
      'necklace': '🧿',
      'consumable': '🧪',
      'material': '🔧'
    };
    return iconMap[itemType] || '📦';
  };

  const getRarityColor = (rarity) => {
    switch(String(rarity || '').toLowerCase()) {
      case 'common': return '#95a5a6';
      case 'uncommon': return '#2ecc71';
      case 'rare': return '#3498db';
      case 'epic': return '#9b59b6';
      case 'legendary': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const mapItem = (item) => ({
    id: item.item_id || item.id,
    name: item.item_display_name || item.item_name || item.name,
    type: item.equip_slot || item.item_type || item.item_type_name,
    icon: item.item_icon || getDefaultIcon(item.equip_slot || item.item_type || item.item_type_name),
    rarity: item.rarity_name || item.rarity || 'common',
    stats: item.item_base_stats || item.base_stats || {},
    description: item.item_description || item.description || '',
    quantity: item.quantity || 1,
    equipped: !!item.equipped,
    equipped_slot: item.equipped_slot || null
  });

  const processedInventory = (character?.inventory || []).map(mapItem);
  const equipmentMap = (() => {
    const out = {};
    (character?.equipped_items || []).map(mapItem).forEach((it) => {
      if (it.equipped_slot) out[it.equipped_slot] = it;
    });
    return out;
  })();

  return (
    <div className="optimized-dashboard-v2">
      <div className="dashboard-header">
        <h1>Personnage</h1>
        {character && (
          <div className="character-info">
            <h2>{character.name}</h2>
            <span className="character-level">Niveau {character.level}</span>
            <span className="character-class">{character.class_name}</span>
          </div>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setShowDebug(v => !v)} className="btn-debug">
            {showDebug ? 'Masquer comparaison' : 'Comparer données'}
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          <Home /> Vue d'ensemble
        </button>
        <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>
          <TrendingUp /> Statistiques
        </button>
        <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
          <Package /> Inventaire
        </button>
        <button className={activeTab === 'skills' ? 'active' : ''} onClick={() => setActiveTab('skills')}>
          <BookOpen /> Compétences
        </button>
        <button className={activeTab === 'talents' ? 'active' : ''} onClick={() => setActiveTab('talents')}>
          <Trophy /> Talents
        </button>
        <button className={activeTab === 'achievements' ? 'active' : ''} onClick={() => setActiveTab('achievements')}>
          <Trophy /> Succès
        </button>
      </div>

      <div className="dashboard-content">
        {showDebug && (
          <div style={{ background: '#1f2937', color: '#e5e7eb', padding: '12px', borderRadius: '8px', marginBottom: '12px', overflow: 'auto' }}>
            <strong>Données brutes character.stats (backend):</strong>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(character?.stats || {}, null, 2)}</pre>
          </div>
        )}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <CharacterOverview 
                character={character} 
                finalStats={finalStats || character?.stats} 
                loading={loading}
                error={error}
              />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="stats-tab">
              <h3>Statistiques détaillées</h3>
              <div className="detailed-stats">
                <div className="stat-section">
                  <h4>Stats de base</h4>
                  <div className="stat-list">
                    <div className="stat-item"><span>Santé:</span><span>{stats.health || character?.health || 0}</span></div>
                    <div className="stat-item"><span>Mana:</span><span>{stats.mana || character?.mana || 0}</span></div>
                    <div className="stat-item"><span>Attaque:</span><span>{stats.attack || character?.attack || 0}</span></div>
                    <div className="stat-item"><span>Défense:</span><span>{stats.defense || character?.defense || 0}</span></div>
                    <div className="stat-item"><span>Attaque magique:</span><span>{stats.magic_attack || character?.magic_attack || 0}</span></div>
                    <div className="stat-item"><span>Défense magique:</span><span>{stats.magic_defense || character?.magic_defense || 0}</span></div>
                    <div className="stat-item"><span>Taux critique:</span><span>{((stats.critical_rate || character?.critical_rate || 0) * 1).toFixed(1)}%</span></div>
                    <div className="stat-item"><span>Dégâts critiques:</span><span>{((stats.critical_damage || character?.critical_damage || 1) * 1).toFixed(1)}%</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div key="inventory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="inventory-tab">
              <CharacterInventory 
                character={character}
                inventory={processedInventory}
                equipment={equipmentMap}
                selectedItem={null}
                inventoryLoading={false}
                inventoryError={null}
                handleEquip={() => {}}
                handleUnequip={() => {}}
                handleItemClick={() => {}}
                getRarityColor={getRarityColor}
                getDefaultIcon={getDefaultIcon}
                onStatsUpdate={reloadStats}
              />
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div key="skills" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="skills-tab">
              <SkillTree character={character} onStatsUpdate={reloadStats} />
            </motion.div>
          )}

          {activeTab === 'talents' && (
            <motion.div key="talents" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="skills-tab">
              <TalentTree character={character} tree={character?.skill_tree} />
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div key="achievements" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="achievements-tab">
              <h3>Succès</h3>
              <div className="achievement-progress">
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${(0)}%` }} /></div>
                <p>0 / 0 succès débloqués</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Character;