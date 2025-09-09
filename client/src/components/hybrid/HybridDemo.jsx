import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  HardDrive, 
  Server, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Package,
  BookOpen,
  Castle,
  User,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import './HybridDemo.css';

const HybridDemo = () => {
  const [databaseStatus, setDatabaseStatus] = useState(null);
  const [globalItems, setGlobalItems] = useState([]);
  const [globalQuests, setGlobalQuests] = useState([]);
  const [globalDungeons, setGlobalDungeons] = useState([]);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [playerInventory, setPlayerInventory] = useState([]);
  const [playerQuests, setPlayerQuests] = useState([]);
  const [playerDungeons, setPlayerDungeons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('test_player_1');
  const [activeTab, setActiveTab] = useState('overview');

  const testPlayerIds = ['test_player_1', 'test_player_2'];

  useEffect(() => {
    loadData();
  }, [selectedPlayerId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Charger le statut de la base de données
      const statusResponse = await fetch('/api/hybrid/status');
      const statusData = await statusResponse.json();
      setDatabaseStatus(statusData.data);

      // Charger les données globales
      const [itemsResponse, questsResponse, dungeonsResponse] = await Promise.all([
        fetch('/api/hybrid/items'),
        fetch('/api/hybrid/quests'),
        fetch('/api/hybrid/dungeons')
      ]);

      const itemsData = await itemsResponse.json();
      const questsData = await questsResponse.json();
      const dungeonsData = await dungeonsResponse.json();

      setGlobalItems(itemsData.data || []);
      setGlobalQuests(questsData.data || []);
      setGlobalDungeons(dungeonsData.data || []);

      // Charger les données personnelles du joueur
      const [profileResponse, inventoryResponse, questsResponse2, dungeonsResponse2] = await Promise.all([
        fetch(`/api/hybrid/profile/${selectedPlayerId}`),
        fetch(`/api/hybrid/inventory/${selectedPlayerId}`),
        fetch(`/api/hybrid/quests/${selectedPlayerId}`),
        fetch(`/api/hybrid/dungeons/${selectedPlayerId}`)
      ]);

      const profileData = await profileResponse.json();
      const inventoryData = await inventoryResponse.json();
      const questsData2 = await questsResponse2.json();
      const dungeonsData2 = await dungeonsResponse2.json();

      setPlayerProfile(profileData.data);
      setPlayerInventory(inventoryData.data || []);
      setPlayerQuests(questsData2.data || []);
      setPlayerDungeons(dungeonsData2.data || []);

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const simulateDisconnect = async () => {
    try {
      const response = await fetch('/api/hybrid/test/disconnect-postgres', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        // Recharger les données pour voir le changement
        await loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const simulateReconnect = async () => {
    try {
      const response = await fetch('/api/hybrid/test/reconnect-postgres', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        // Recharger les données pour voir le changement
        await loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la reconnexion:', error);
    }
  };

  const forceSync = async () => {
    try {
      const response = await fetch('/api/hybrid/sync', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        // Recharger les données
        await loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    }
  };

  const addItemToInventory = async (itemId) => {
    try {
      const response = await fetch(`/api/hybrid/inventory/${selectedPlayerId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId, quantity: 1 })
      });
      
      if (response.ok) {
        // Recharger l'inventaire
        const inventoryResponse = await fetch(`/api/hybrid/inventory/${selectedPlayerId}`);
        const inventoryData = await inventoryResponse.json();
        setPlayerInventory(inventoryData.data || []);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'item:', error);
    }
  };

  const toggleItemEquipped = async (itemId) => {
    try {
      const response = await fetch(`/api/hybrid/inventory/${selectedPlayerId}/items/${itemId}/toggle-equipped`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        // Recharger l'inventaire
        const inventoryResponse = await fetch(`/api/hybrid/inventory/${selectedPlayerId}`);
        const inventoryData = await inventoryResponse.json();
        setPlayerInventory(inventoryData.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du changement d\'équipement:', error);
    }
  };

  const startQuest = async (questId) => {
    try {
      const response = await fetch(`/api/hybrid/quests/${selectedPlayerId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questId })
      });
      
      if (response.ok) {
        // Recharger les quêtes
        const questsResponse = await fetch(`/api/hybrid/quests/${selectedPlayerId}`);
        const questsData = await questsResponse.json();
        setPlayerQuests(questsData.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du démarrage de quête:', error);
    }
  };

  const unlockDungeon = async (dungeonId) => {
    try {
      const response = await fetch(`/api/hybrid/dungeons/${selectedPlayerId}/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dungeonId })
      });
      
      if (response.ok) {
        // Recharger les donjons
        const dungeonsResponse = await fetch(`/api/hybrid/dungeons/${selectedPlayerId}`);
        const dungeonsData = await dungeonsResponse.json();
        setPlayerDungeons(dungeonsData.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du déblocage de donjon:', error);
    }
  };

  if (loading) {
    return (
      <div className="hybrid-demo">
        <div className="loading-container">
          <RefreshCw className="loading-spinner" />
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hybrid-demo">
        <div className="error-container">
          <XCircle className="error-icon" />
          <p>{error}</p>
          <button onClick={loadData} className="retry-btn">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hybrid-demo">
      <motion.div
        className="demo-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>🚀 Démonstration du Système Hybride</h1>
        <p>Test du stockage hybride PostgreSQL + SQLite avec fallback automatique</p>
      </motion.div>

      {/* Statut de la base de données */}
      <motion.div
        className="database-status"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h2>
          <Database className="status-icon" />
          Statut de la Base de Données
        </h2>
        
        <div className="status-grid">
          <div className={`status-card ${databaseStatus?.postgres ? 'online' : 'offline'}`}>
            <div className="status-header">
              <Server className="status-icon" />
              <span>PostgreSQL</span>
            </div>
            <div className="status-indicator">
              {databaseStatus?.postgres ? (
                <>
                  <Wifi className="online-icon" />
                  <span>En ligne</span>
                </>
              ) : (
                <>
                  <WifiOff className="offline-icon" />
                  <span>Hors ligne</span>
                </>
              )}
            </div>
          </div>

          <div className={`status-card ${databaseStatus?.sqlite ? 'online' : 'offline'}`}>
            <div className="status-header">
              <HardDrive className="status-icon" />
              <span>SQLite Local</span>
            </div>
            <div className="status-indicator">
              {databaseStatus?.sqlite ? (
                <>
                  <Wifi className="online-icon" />
                  <span>Disponible</span>
                </>
              ) : (
                <>
                  <WifiOff className="offline-icon" />
                  <span>Indisponible</span>
                </>
              )}
            </div>
          </div>

          <div className="status-card mode">
            <div className="status-header">
              <Database className="status-icon" />
              <span>Mode</span>
            </div>
            <div className="status-indicator">
              <span className={`mode-badge ${databaseStatus?.mode}`}>
                {databaseStatus?.mode === 'hybrid' ? 'Hybride' : 'Local uniquement'}
              </span>
            </div>
          </div>
        </div>

        <div className="status-actions">
          <button 
            onClick={simulateDisconnect} 
            className="action-btn disconnect-btn"
            disabled={!databaseStatus?.postgres}
          >
            <WifiOff size={16} />
            Simuler Déconnexion PostgreSQL
          </button>
          
          <button 
            onClick={simulateReconnect} 
            className="action-btn reconnect-btn"
            disabled={databaseStatus?.postgres}
          >
            <Wifi size={16} />
            Simuler Reconnexion PostgreSQL
          </button>
          
          <button 
            onClick={forceSync} 
            className="action-btn sync-btn"
            disabled={!databaseStatus?.postgres}
          >
            <RefreshCw size={16} />
            Forcer Synchronisation
          </button>
        </div>
      </motion.div>

      {/* Sélecteur de joueur */}
      <motion.div
        className="player-selector"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h3>
          <User className="selector-icon" />
          Sélectionner un Joueur de Test
        </h3>
        <div className="player-buttons">
          {testPlayerIds.map(playerId => (
            <button
              key={playerId}
              onClick={() => setSelectedPlayerId(playerId)}
              className={`player-btn ${selectedPlayerId === playerId ? 'active' : ''}`}
            >
              {playerId}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Onglets */}
      <motion.div
        className="demo-tabs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Vue d'ensemble
          </button>
          <button
            className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            Catalogue Global
          </button>
          <button
            className={`tab-btn ${activeTab === 'player' ? 'active' : ''}`}
            onClick={() => setActiveTab('player')}
          >
            Données Personnelles
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-grid">
                <div className="overview-card">
                  <h4>
                    <Package className="card-icon" />
                    Items Globaux
                  </h4>
                  <p className="card-count">{globalItems.length}</p>
                  <p className="card-desc">Catalogue des items du jeu</p>
                </div>

                <div className="overview-card">
                  <h4>
                    <BookOpen className="card-icon" />
                    Quêtes Globales
                  </h4>
                  <p className="card-count">{globalQuests.length}</p>
                  <p className="card-desc">Catalogue des quêtes du jeu</p>
                </div>

                <div className="overview-card">
                  <h4>
                    <Castle className="card-icon" />
                    Donjons Globaux
                  </h4>
                  <p className="card-count">{globalDungeons.length}</p>
                  <p className="card-desc">Catalogue des donjons du jeu</p>
                </div>

                <div className="overview-card">
                  <h4>
                    <User className="card-icon" />
                    Profil Joueur
                  </h4>
                  <p className="card-count">{playerProfile?.username}</p>
                  <p className="card-desc">Niveau {playerProfile?.level}</p>
                </div>

                <div className="overview-card">
                  <h4>
                    <Package className="card-icon" />
                    Inventaire
                  </h4>
                  <p className="card-count">{playerInventory.length}</p>
                  <p className="card-desc">Objets possédés</p>
                </div>

                <div className="overview-card">
                  <h4>
                    <BookOpen className="card-icon" />
                    Quêtes Actives
                  </h4>
                  <p className="card-count">{playerQuests.filter(q => q.status === 'active').length}</p>
                  <p className="card-desc">Quêtes en cours</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="catalog-tab">
              <div className="catalog-section">
                <h3>
                  <Package className="section-icon" />
                  Catalogue des Items
                </h3>
                <div className="items-grid">
                  {globalItems.map(item => (
                    <div key={item.id} className="catalog-item">
                      <div className="item-header">
                        <span className="item-icon">{item.icon || '📦'}</span>
                        <h4>{item.name}</h4>
                        <span className={`rarity-badge ${item.rarity}`}>
                          {item.rarity}
                        </span>
                      </div>
                      <p className="item-description">{item.description}</p>
                      <div className="item-stats">
                        {item.attack && <span>⚔️ ATK: {item.attack}</span>}
                        {item.defense && <span>🛡️ DEF: {item.defense}</span>}
                        {item.magic && <span>✨ MAG: {item.magic}</span>}
                        {item.level && <span>📊 Niveau: {item.level}</span>}
                      </div>
                      <button 
                        onClick={() => addItemToInventory(item.id)}
                        className="add-item-btn"
                      >
                        <Plus size={16} />
                        Ajouter à l'inventaire
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="catalog-section">
                <h3>
                  <BookOpen className="section-icon" />
                  Catalogue des Quêtes
                </h3>
                <div className="quests-grid">
                  {globalQuests.map(quest => (
                    <div key={quest.id} className="catalog-quest">
                      <div className="quest-header">
                        <h4>{quest.title}</h4>
                        <span className={`quest-type ${quest.type}`}>
                          {quest.type}
                        </span>
                      </div>
                      <p className="quest-description">{quest.description}</p>
                      <div className="quest-info">
                        <span>📊 Niveau: {quest.level}</span>
                        <span>🎁 XP: {quest.rewards?.experience || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="catalog-section">
                <h3>
                  <Castle className="section-icon" />
                  Catalogue des Donjons
                </h3>
                <div className="dungeons-grid">
                  {globalDungeons.map(dungeon => (
                    <div key={dungeon.id} className="catalog-dungeon">
                      <div className="dungeon-header">
                        <h4>{dungeon.name}</h4>
                        <span className={`difficulty ${dungeon.difficulty}`}>
                          {dungeon.difficulty}
                        </span>
                      </div>
                      <p className="dungeon-description">{dungeon.description}</p>
                      <div className="dungeon-info">
                        <span>📊 Niveau: {dungeon.level}</span>
                        <span>🎁 XP: {dungeon.rewards?.experience || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'player' && (
            <div className="player-tab">
              {/* Profil du joueur */}
              <div className="player-section">
                <h3>
                  <User className="section-icon" />
                  Profil du Joueur
                </h3>
                {playerProfile && (
                  <div className="player-profile">
                    <div className="profile-header">
                      <h4>{playerProfile.username}</h4>
                      <span className="player-class">{playerProfile.class}</span>
                    </div>
                    <div className="profile-stats">
                      <div className="stat-item">
                        <span className="stat-label">Niveau</span>
                        <span className="stat-value">{playerProfile.level}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Expérience</span>
                        <span className="stat-value">
                          {playerProfile.experience} / {playerProfile.experienceToNext}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Vie</span>
                        <span className="stat-value">
                          {playerProfile.health} / {playerProfile.maxHealth}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Mana</span>
                        <span className="stat-value">
                          {playerProfile.mana} / {playerProfile.maxMana}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Inventaire du joueur */}
              <div className="player-section">
                <h3>
                  <Package className="section-icon" />
                  Inventaire Personnel
                </h3>
                <div className="inventory-grid">
                  {playerInventory.map(item => (
                    <div key={item.playerItemId} className="inventory-item">
                      <div className="item-header">
                        <span className="item-icon">{item.icon || '📦'}</span>
                        <h4>{item.name}</h4>
                        <span className={`rarity-badge ${item.rarity}`}>
                          {item.rarity}
                        </span>
                      </div>
                      <p className="item-description">{item.description}</p>
                      <div className="item-meta">
                        <span>📦 Quantité: {item.quantity}</span>
                        {item.equipped && (
                          <span className="equipped-badge">
                            <CheckCircle size={14} />
                            Équipé
                          </span>
                        )}
                      </div>
                      <div className="item-actions">
                        <button
                          onClick={() => toggleItemEquipped(item.id)}
                          className={`action-btn ${item.equipped ? 'unequip' : 'equip'}`}
                        >
                          {item.equipped ? 'Déséquiper' : 'Équiper'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quêtes du joueur */}
              <div className="player-section">
                <h3>
                  <BookOpen className="section-icon" />
                  Quêtes Personnelles
                </h3>
                <div className="quests-grid">
                  {playerQuests.map(quest => (
                    <div key={quest.id} className="player-quest">
                      <div className="quest-header">
                        <h4>{quest.globalQuest?.title}</h4>
                        <span className={`quest-status ${quest.status}`}>
                          {quest.status === 'active' ? 'Active' : 
                           quest.status === 'completed' ? 'Terminée' : 'Échouée'}
                        </span>
                      </div>
                      <p className="quest-description">{quest.globalQuest?.description}</p>
                      <div className="quest-progress">
                        {quest.status === 'active' && quest.progress && (
                          <div className="progress-info">
                            <span>Progression: {JSON.stringify(quest.progress)}</span>
                          </div>
                        )}
                        {quest.status === 'completed' && quest.completedAt && (
                          <span>Terminée le: {new Date(quest.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Donjons du joueur */}
              <div className="player-section">
                <h3>
                  <Castle className="section-icon" />
                  Donjons Personnels
                </h3>
                <div className="dungeons-grid">
                  {playerDungeons.map(dungeon => (
                    <div key={dungeon.id} className="player-dungeon">
                      <div className="dungeon-header">
                        <h4>{dungeon.globalDungeon?.name}</h4>
                        <span className={`dungeon-status ${dungeon.status}`}>
                          {dungeon.status === 'unlocked' ? 'Débloqué' : 
                           dungeon.status === 'completed' ? 'Terminé' : 'Échoué'}
                        </span>
                      </div>
                      <p className="dungeon-description">{dungeon.globalDungeon?.description}</p>
                      <div className="dungeon-info">
                        {dungeon.bestTime && (
                          <span>⏱️ Meilleur temps: {Math.floor(dungeon.bestTime / 60)}m {dungeon.bestTime % 60}s</span>
                        )}
                        {dungeon.completedAt && (
                          <span>✅ Terminé le: {new Date(dungeon.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HybridDemo;


