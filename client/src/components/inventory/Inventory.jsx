import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Sword, 
  Shield, 
  Zap, 
  Star, 
  Filter, 
  Search, 
  Grid, 
  List,
  Plus,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import databaseService from '../../services/databaseService';
import './Inventory.css';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [sortBy, setSortBy] = useState('rarity');
  const { user } = useAuth();

  // Types d'objets disponibles
  const itemTypes = [
    { value: 'all', label: 'Tous', icon: Package },
    { value: 'weapon', label: 'Armes', icon: Sword },
    { value: 'armor', label: 'Armures', icon: Shield },
    { value: 'consumable', label: 'Consommables', icon: Zap },
    { value: 'material', label: 'Matériaux', icon: Package },
    { value: 'quest', label: 'Quêtes', icon: Star }
  ];

  // Raretés des objets
  const rarities = {
    common: { name: 'Commune', color: '#7f8c8d', icon: '🔷' },
    uncommon: { name: 'Peu commune', color: '#27ae60', icon: '🔶' },
    rare: { name: 'Rare', color: '#3498db', icon: '💎' },
    epic: { name: 'Épique', color: '#9b59b6', icon: '⭐' },
    legendary: { name: 'Légendaire', color: '#f39c12', icon: '👑' },
    mythic: { name: 'Mythique', color: '#e74c3c', icon: '🔥' }
  };

  useEffect(() => {
    loadInventory();
  }, [user]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      if (user && user.id) {
        // Récupérer le personnage courant et son ID réel
        const characterData = await databaseService.getCurrentCharacterData();
        const characterNormalized = characterData.character || characterData;
        setCharacter(characterNormalized);
        // Charger l'inventaire avec l'ID du personnage
        let items = await databaseService.getCharacterInventory(characterNormalized.id);
        // Normaliser pour garantir un tableau et clés attendues
        if (!Array.isArray(items)) {
          items = [];
        }
        const normalized = items.map((it) => ({
          id: it.id || it.item_id,
          item_name: it.item_name || it.name,
          item_display_name: it.item_display_name || it.display_name || it.item_name || it.name,
          item_description: it.item_description || it.description || '',
          item_type: it.item_type || it.item_type_name || it.type || it.equip_slot || 'misc',
          item_level: it.level_requirement || it.item_level || 1,
          rarity_name: it.rarity_name || it.rarity || 'common',
          rarity_color: it.rarity_color || '#7f8c8d',
          equip_slot: it.equipped_slot || null,
          equipped: !!it.equipped,
          quantity: it.quantity || 1,
          item_stats: it.item_stats || it.item_base_stats || it.base_stats || {}
        }));
        setInventory(normalized);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'inventaire:', err);
      setError('Impossible de charger l\'inventaire');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer et trier l'inventaire
  const filteredAndSortedInventory = inventory
    .filter(item => {
      const matchesSearch = (item.item_name || item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.item_description || item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || (item.item_type === filterType);
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rarity':
          const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
          return rarityOrder.indexOf(a.rarity_name || '') - rarityOrder.indexOf(b.rarity_name || '');
        case 'level':
          return (b.item_level || 0) - (a.item_level || 0);
        case 'name':
          return (a.item_name || '').localeCompare(b.item_name || '');
        case 'type':
          return (a.item_type || '').localeCompare(b.item_type || '');
        default:
          return 0;
      }
    });

  // Équiper/Déséquiper un objet
  const toggleEquip = (item) => {
    if (item.item_type === 'potion' || item.item_type === 'material' || item.item_type === 'currency') {
      return; // Ces types ne peuvent pas être équipés
    }

    setInventory(prev => prev.map(invItem => {
      if (invItem.id === item.id) {
        return { ...invItem, equipped: !invItem.equipped };
      }
      // Déséquiper les autres objets du même type
      if (invItem.equip_slot === item.equip_slot && invItem.equipped) {
        return { ...invItem, equipped: false };
      }
      return invItem;
    }));
  };

  // Afficher les détails d'un objet
  const showItemDetail = (item) => {
    setSelectedItem(item);
    setShowItemDetails(true);
  };

  // Fermer les détails
  const closeItemDetails = () => {
    setShowItemDetails(false);
    setSelectedItem(null);
  };

  // Utiliser un objet consommable
  const useItem = (item) => {
    if (item.type === 'consumable' && item.quantity > 0) {
      setInventory(prev => prev.map(invItem => {
        if (invItem.id === item.id) {
          return { ...invItem, quantity: invItem.quantity - 1 };
        }
        return invItem;
      }));
      
      // Logique d'utilisation (à implémenter)
      alert(`Utilisation de ${item.name}: ${item.effect}`);
    }
  };

  if (loading) {
    return (
      <div className="inventory-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="loading-spinner"
        >
          📦
        </motion.div>
        <p>Chargement de l'inventaire...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-error">
        <h2>❌ Erreur</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="inventory-no-character">
        <h2>🎭 Aucun personnage trouvé</h2>
        <p>Créez votre premier personnage pour accéder à l'inventaire !</p>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <motion.div className="inventory-header" 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>📦 Inventaire</h1>
        <p>Gérez vos objets, équipements et ressources dans Eternal Ascent</p>
        <div className="character-info-banner">
          <span>Niveau {character.level}</span>
          <span>•</span>
          <span>{character.experience} / {character.experience_to_next} EXP</span>
          <span>•</span>
          <span>Classe: {character.class_display_name || character.class_name || (character.class && (character.class.display_name || character.class.name)) || 'Inconnue'}</span>
        </div>
      </motion.div>

      {/* Résumé de l'inventaire */}
      <motion.div
        className="inventory-summary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="summary-item">
          <div className="summary-icon">📦</div>
          <div className="summary-content">
            <div className="summary-number">{inventory.length}</div>
            <div className="summary-label">OBJETS</div>
          </div>
        </div>
        
        <div className="summary-item">
          <div className="summary-icon">⚔️</div>
          <div className="summary-content">
            <div className="summary-number">{inventory.filter(item => item.equip_slot && item.equip_slot !== null).length}</div>
            <div className="summary-label">ÉQUIPEMENTS</div>
          </div>
        </div>
        
        <div className="summary-item">
          <div className="summary-icon">💎</div>
          <div className="summary-content">
            <div className="summary-number">{inventory.filter(item => item.rarity_name === 'rare' || item.rarity_name === 'epic' || item.rarity_name === 'legendary' || item.rarity_name === 'mythic').length}</div>
            <div className="summary-label">OBJETS RARES</div>
          </div>
        </div>
      </motion.div>

      {/* Contrôles de l'inventaire */}
      <motion.div
        className="inventory-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="search-section">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher un objet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <Filter size={20} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            {itemTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sort-section">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="rarity">Trier par rareté</option>
            <option value="level">Trier par niveau</option>
            <option value="name">Trier par nom</option>
            <option value="type">Trier par type</option>
          </select>
        </div>

        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid size={16} />
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
          </button>
        </div>
      </motion.div>

      {/* Grille de l'inventaire */}
      <div className={`inventory-grid ${viewMode}`}>
        {filteredAndSortedInventory.map((item, index) => (
          <motion.div
            key={item.id}
            className={`inventory-item ${item.rarity} ${item.equipped ? 'equipped' : ''}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => showItemDetail(item)}
            style={{ cursor: 'pointer' }}
          >
            <div className="item-header">
              <div className="item-icon">
                {item.item_type === 'weapon' ? '⚔️' : 
                 item.item_type === 'chest' ? '🛡️' : 
                 item.item_type === 'boots' ? '👢' :
                 item.item_type === 'gloves' ? '🧤' :
                 item.item_type === 'potion' ? '🧪' : 
                 item.item_type === 'material' ? '💎' : 
                 item.item_type === 'accessory' ? '💍' : 
                 item.item_type === 'currency' ? '💰' : '📦'}
              </div>
              <div className="item-info">
                <h4>{item.item_display_name || item.item_name}</h4>
                <div className="item-meta">
                  <span 
                    className="rarity-badge" 
                    style={{ backgroundColor: item.rarity_color || '#7f8c8d' }}
                  >
                    {item.rarity_name === 'common' ? '🔷' : 
                     item.rarity_name === 'rare' ? '💎' : 
                     item.rarity_name === 'epic' ? '⭐' : 
                     item.rarity_name === 'legendary' ? '👑' : '🔷'} {item.rarity_name?.toUpperCase() || 'COMMUNE'}
                  </span>
                </div>
              </div>
              {item.equipped && (
                <div className="equipped-indicator">✓</div>
              )}
            </div>

            <div className="item-description">
              <p>{item.item_description || `Objet de type ${item.item_type}`}</p>
            </div>

            {item.item_stats && (
              <div className="item-stats">
                {item.item_stats.attack && <span>⚔️ Attaque: {item.item_stats.attack}</span>}
                {item.item_stats.defense && <span>🛡️ Défense: {item.item_stats.defense}</span>}
                {item.item_stats.healing && <span>💊 Soin: {item.item_stats.healing}</span>}
                {item.item_stats.value && <span>💰 Valeur: {item.item_stats.value}</span>}
                {item.item_stats.maxMana && <span>🔮 Mana: +{item.item_stats.maxMana}</span>}
              </div>
            )}

            <div className="item-footer">
              <div className="item-quantity">
                Quantité: {item.quantity || 1}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de détails d'objet */}
      {showItemDetails && selectedItem && (
        <motion.div
          className="item-details-modal"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <div className="modal-content-game-style">
            <button className="close-modal-btn" onClick={closeItemDetails}>×</button>
            
            {/* Header avec icône et nom */}
            <div className="item-header-game">
              <div className="item-icon-main">
                {selectedItem.item_type === 'weapon' ? '⚔️' : 
                 selectedItem.item_type === 'chest' ? '🛡️' : 
                 selectedItem.item_type === 'boots' ? '👢' :
                 selectedItem.item_type === 'gloves' ? '🧤' :
                 selectedItem.item_type === 'potion' ? '🧪' : 
                 selectedItem.item_type === 'material' ? '💎' : 
                 selectedItem.item_type === 'accessory' ? '💍' : 
                 selectedItem.item_type === 'currency' ? '💰' : '📦'}
              </div>
              <div className="item-title-section">
                <h2 className="item-title-game">{selectedItem.item_display_name || selectedItem.item_name}</h2>
                <div className="item-meta-game">
                  <span className="rarity-stars">★★★★★</span>
                  <div className="item-info-row">
                    <span className="item-type">Type: {selectedItem.item_type}</span>
                    <span className="item-level">Niveau: {selectedItem.item_level || 1}</span>
                  </div>
                  {selectedItem.equipped && (
                    <span className="equipped-indicator">✓ Équipé</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section Stats */}
            <div className="stats-section-game">
              <h3 className="section-title-game">Stats</h3>
              <div className="stats-list-game">
                {selectedItem.item_stats && Object.entries(selectedItem.item_stats).map(([stat, value]) => (
                  <div key={stat} className="stat-row-game">
                    <span className="stat-label-game">
                      {stat === 'weight' ? 'Poids' : 
                       stat === 'defense' ? 'Défense' : 
                       stat === 'attack' ? 'Attaque' : 
                       stat === 'magic_attack' ? 'Attaque Magique' : 
                       stat === 'magic_defense' ? 'Défense Magique' : 
                       stat === 'maxHealth' ? 'Vie Max' : 
                       stat === 'maxMana' ? 'Mana Max' : 
                       stat === 'durability' ? 'Durabilité' : 
                       stat === 'healing' ? 'Soin' : 
                       stat === 'value' ? 'Valeur' : stat}:
                    </span>
                    <span className="stat-value-game">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Description */}
            <div className="description-section-game">
              <h3 className="section-title-game">Description</h3>
              <p className="item-description-game">{selectedItem.item_description || `Objet de type ${selectedItem.item_type}`}</p>
            </div>

            {/* Section Gestion */}
            <div className="management-section-game">
              <h3 className="section-title-game">Gestion</h3>
              <div className="quantity-management-game">
                <span className="quantity-label-game">Quantité:</span>
                <div className="quantity-controls-game">
                  <button 
                    className="quantity-btn-game" 
                    onClick={() => {
                      if (selectedItem.quantity > 1) {
                        setInventory(prev => prev.map(invItem => 
                          invItem.id === selectedItem.id 
                            ? { ...invItem, quantity: invItem.quantity - 1 }
                            : invItem
                        ));
                      }
                    }}
                    disabled={selectedItem.quantity <= 1}
                  >
                    −
                  </button>
                  <span className="quantity-value-game">{selectedItem.quantity}</span>
                  <button 
                    className="quantity-btn-game" 
                    onClick={() => {
                      setInventory(prev => prev.map(invItem => 
                        invItem.id === selectedItem.id 
                          ? { ...invItem, quantity: invItem.quantity + 1 }
                          : invItem
                      ));
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <button 
                className="delete-btn-game" 
                onClick={() => {
                  setInventory(prev => prev.filter(invItem => invItem.id !== selectedItem.id));
                  closeItemDetails();
                }}
              >
                🗑️ Supprimer l'objet
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Inventory;


