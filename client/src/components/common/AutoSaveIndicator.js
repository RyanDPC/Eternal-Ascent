import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import databaseService from '../../services/databaseService';
import './AutoSaveIndicator.css';

const AutoSaveIndicator = ({ characterData, onSaveComplete }) => {
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, success, error
  const [lastSave, setLastSave] = useState(null);
  const [autoSaveInterval, setAutoSaveInterval] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  // Vérifier la connexion à la base de données
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await databaseService.checkConnection();
        setIsConnected(connected);
      } catch (error) {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Vérifier toutes les 30 secondes
    return () => clearInterval(interval);
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    if (!characterData || !user || !isConnected) return;

    const saveData = async () => {
      try {
        setSaveStatus('saving');
        
        // Sauvegarder les données du personnage
        await databaseService.saveCharacterData(characterData);
        
        setSaveStatus('success');
        setLastSave(new Date());
        
        if (onSaveComplete) {
          onSaveComplete();
        }

        // Réinitialiser le statut après 3 secondes
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (error) {
        console.error('Erreur de sauvegarde automatique:', error);
        setSaveStatus('error');
        
        // Réinitialiser le statut après 5 secondes
        setTimeout(() => setSaveStatus('idle'), 5000);
      }
    };

    // Sauvegarde automatique toutes les 30 secondes
    const interval = setInterval(saveData, 30000);
    setAutoSaveInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [characterData, user, isConnected, onSaveComplete]);

  // Sauvegarde manuelle
  const handleManualSave = async () => {
    if (!characterData || !user) return;

    try {
      setSaveStatus('saving');
      
      await databaseService.saveCharacterData(characterData);
      
      setSaveStatus('success');
      setLastSave(new Date());
      
      if (onSaveComplete) {
        onSaveComplete();
      }

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Erreur de sauvegarde manuelle:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  // Sauvegarde avant de quitter la page
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (characterData && user && isConnected) {
        try {
          await databaseService.saveCharacterData(characterData);
        } catch (error) {
          console.error('Erreur de sauvegarde avant fermeture:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [characterData, user, isConnected]);

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Save size={16} className="spinning" />;
      case 'success':
        return <CheckCircle size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Sauvegarde...';
      case 'success':
        return 'Sauvegardé !';
      case 'error':
        return 'Erreur de sauvegarde';
      default:
        return lastSave ? `Dernière sauvegarde: ${lastSave.toLocaleTimeString('fr-FR')}` : 'Prêt';
    }
  };

  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return '#f39c12';
      case 'success':
        return '#27ae60';
      case 'error':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  if (!user) return null;

  return (
    <motion.div
      className="auto-save-indicator"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="indicator-content">
        <div className="status-section">
          <div 
            className="status-icon"
            style={{ color: getStatusColor() }}
          >
            {getStatusIcon()}
          </div>
          <div className="status-text">
            {getStatusText()}
          </div>
        </div>

        <div className="connection-status">
          <div className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="connection-text">
            {isConnected ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>

        <button
          className="manual-save-btn"
          onClick={handleManualSave}
          disabled={saveStatus === 'saving' || !isConnected}
          title="Sauvegarder maintenant"
        >
          <Save size={14} />
          Sauvegarder
        </button>
      </div>

      {/* Toast de notification */}
      <AnimatePresence>
        {saveStatus !== 'idle' && (
          <motion.div
            className={`save-toast ${saveStatus}`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="toast-icon">
              {saveStatus === 'saving' && <Save size={16} className="spinning" />}
              {saveStatus === 'success' && <CheckCircle size={16} />}
              {saveStatus === 'error' && <AlertCircle size={16} />}
            </div>
            <div className="toast-text">
              {getStatusText()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AutoSaveIndicator;
