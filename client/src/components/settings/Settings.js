import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Shield, Bell, Palette, Database, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import databaseService from '../../services/databaseService';
import './Settings.css';

const SettingsPage = () => {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [settings, setSettings] = useState({
    notifications: {
      combat: true,
      quests: true,
      guild: true,
      achievements: true
    },
    display: {
      theme: 'dark',
      animations: true,
      soundEffects: true,
      music: true
    },
    gameplay: {
      autoSave: true,
      confirmActions: true,
      showDamage: true,
      showFPS: false
    },
    privacy: {
      showOnlineStatus: true,
      allowFriendRequests: true,
      showLevel: true,
      showEquipment: false
    }
  });
  const { user, logout } = useAuth();

  // Charger les données du personnage et des paramètres
  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        setLoading(true);
        if (user && user.id) {
          // Charger le personnage courant
          const current = await databaseService.getCurrentCharacterData();
          setCharacter(current.character || current);

          // Charger les paramètres sauvegardés (à implémenter)
          // const savedSettings = await databaseService.getUserSettings(user.id);
          // if (savedSettings) {
          //   setSettings(savedSettings);
          // }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des paramètres:', err);
        setError('Impossible de charger les paramètres');
      } finally {
        setLoading(false);
      }
    };

    loadSettingsData();
  }, [user]);

  // Sauvegarder les paramètres
  const saveSettings = async () => {
    try {
      setSaveStatus('saving');
      // Sauvegarde (à implémenter)
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  const resetSettings = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      setSettings({
        notifications: { combat: true, quests: true, guild: true, achievements: true },
        display: { theme: 'dark', animations: true, soundEffects: true, music: true },
        gameplay: { autoSave: true, confirmActions: true, showDamage: true, showFPS: false },
        privacy: { showOnlineStatus: true, allowFriendRequests: true, showLevel: true, showEquipment: false }
      });
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value }
    }));
  };

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  const checkDatabaseConnection = async () => {
    try {
      const connected = await databaseService.checkConnection();
      return connected;
    } catch (error) {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="loading-spinner"
        >
          ⚙️
        </motion.div>
        <p>Chargement des paramètres...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-error">
        <h2>❌ Erreur</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="settings-no-character">
        <h2>🎭 Aucun personnage trouvé</h2>
        <p>Créez votre premier personnage pour accéder aux paramètres !</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <motion.div className="settings-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1>⚙️ Paramètres</h1>
        <p>Personnalisez votre expérience de jeu et gérez vos préférences</p>
        <div className="character-info-banner">
          <span>Niveau {character.level}</span>
          <span>•</span>
          <span>{character.experience} / {character.experience_to_next} EXP</span>
          <span>•</span>
          <span>Classe: {character.class}</span>
        </div>
      </motion.div>

      <motion.div className="settings-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
        <button className="save-settings-btn" onClick={saveSettings} disabled={saveStatus === 'saving'}>
          {saveStatus === 'saving' ? (<RefreshCw size={16} className="spinning" />) : saveStatus === 'success' ? (<CheckCircle size={16} />) : saveStatus === 'error' ? (<AlertCircle size={16} />) : (<Save size={16} />)}
          {saveStatus === 'saving' ? 'Sauvegarde...' : saveStatus === 'success' ? 'Sauvegardé !' : saveStatus === 'error' ? 'Erreur' : 'Sauvegarder'}
        </button>
        <button className="reset-settings-btn" onClick={resetSettings}>
          <RefreshCw size={16} />
          Réinitialiser
        </button>
      </motion.div>

      <div className="settings-sections">
        <motion.div className="settings-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <div className="section-header">
            <Bell size={24} />
            <h3>🔔 Notifications</h3>
          </div>
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.notifications.combat} onChange={(e) => updateSetting('notifications', 'combat', e.target.checked)} />
                <span>Notifications de combat</span>
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.notifications.quests} onChange={(e) => updateSetting('notifications', 'quests', e.target.checked)} />
                <span>Notifications de quêtes</span>
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.notifications.guild} onChange={(e) => updateSetting('notifications', 'guild', e.target.checked)} />
                <span>Notifications de guilde</span>
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.notifications.achievements} onChange={(e) => updateSetting('notifications', 'achievements', e.target.checked)} />
                <span>Notifications d'achievements</span>
              </label>
            </div>
          </div>
        </motion.div>

        <motion.div className="settings-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <div className="section-header">
            <Palette size={24} />
            <h3>🎨 Affichage</h3>
          </div>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Thème</label>
              <select value={settings.display.theme} onChange={(e) => updateSetting('display', 'theme', e.target.value)}>
                <option value="dark">Sombre</option>
                <option value="light">Clair</option>
                <option value="auto">Automatique</option>
              </select>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.display.animations} onChange={(e) => updateSetting('display', 'animations', e.target.checked)} />
                <span>Animations</span>
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.display.soundEffects} onChange={(e) => updateSetting('display', 'soundEffects', e.target.checked)} />
                <span>Effets sonores</span>
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.display.music} onChange={(e) => updateSetting('display', 'music', e.target.checked)} />
                <span>Musique de fond</span>
              </label>
            </div>
          </div>
        </motion.div>

        <motion.div className="settings-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
          <div className="section-header">
            <User size={24} />
            <h3>🎮 Gameplay</h3>
          </div>
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.gameplay.autoSave} onChange={(e) => updateSetting('gameplay', 'autoSave', e.target.checked)} />
                <span>Sauvegarde automatique</span>
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.gameplay.confirmActions} onChange={(e) => updateSetting('gameplay', 'confirmActions', e.target.checked)} />
                <span>Confirmer les actions importantes</span>
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.gameplay.showDamage} onChange={(e) => updateSetting('gameplay', 'showDamage', e.target.checked)} />
                <span>Afficher les dégâts</span>
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.gameplay.showFPS} onChange={(e) => updateSetting('gameplay', 'showFPS', e.target.checked)} />
                <span>Afficher le FPS</span>
              </label>
            </div>
          </div>
        </motion.div>

        <motion.div className="settings-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
          <div className="section-header">
            <Shield size={24} />
            <h3>🔒 Confidentialité</h3>
          </div>
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.privacy.showOnlineStatus} onChange={(e) => updateSetting('privacy', 'showOnlineStatus', e.target.checked)} />
                <span>Afficher le statut en ligne</span>
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.privacy.allowFriendRequests} onChange={(e) => updateSetting('privacy', 'allowFriendRequests', e.target.checked)} />
                <span>Autoriser les demandes d'amis</span>
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.privacy.showLevel} onChange={(e) => updateSetting('privacy', 'showLevel', e.target.checked)} />
                <span>Afficher le niveau</span>
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" checked={settings.privacy.showEquipment} onChange={(e) => updateSetting('privacy', 'showEquipment', e.target.checked)} />
                <span>Afficher l'équipement</span>
              </label>
            </div>
          </div>
        </motion.div>

        <motion.div className="settings-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
          <div className="section-header">
            <Database size={24} />
            <h3>💾 Informations système</h3>
          </div>
          <div className="system-info">
            <div className="info-item"><strong>Version:</strong> 1.0.0</div>
            <div className="info-item"><strong>Base de données:</strong> <span className="status-indicator">{checkDatabaseConnection() ? '🟢 Connectée' : '🔴 Déconnectée'}</span></div>
            <div className="info-item"><strong>Dernière sauvegarde:</strong> {character.last_played ? new Date(character.last_played).toLocaleString('fr-FR') : 'Jamais'}</div>
            <div className="info-item"><strong>Stockage local:</strong> <span className="status-indicator">🟢 Disponible</span></div>
          </div>
        </motion.div>

        <motion.div className="settings-section danger-zone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.7 }}>
          <div className="section-header">
            <AlertCircle size={24} />
            <h3>⚠️ Zone de danger</h3>
          </div>
          <div className="danger-actions">
            <button className="logout-btn" onClick={handleLogout}>
              <User size={16} />
              Se déconnecter
            </button>
            <button className="delete-account-btn" onClick={() => alert('🚧 Fonctionnalité en cours de développement')}>
              <AlertCircle size={16} />
              Supprimer le compte
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
