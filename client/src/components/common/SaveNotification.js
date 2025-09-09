import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import './SaveNotification.css';

const SaveNotification = ({ 
  lastSave, 
  isConnected, 
  onForceSave, 
  showLastSave = true,
  className = '' 
}) => {
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'success', 'error'
  const [lastSaveTime, setLastSaveTime] = useState(lastSave);
  const [showNotification, setShowNotification] = useState(false);

  // Mettre à jour le temps de la dernière sauvegarde
  useEffect(() => {
    if (lastSave) {
      setLastSaveTime(lastSave);
    }
  }, [lastSave]);

  // Formater le temps écoulé depuis la dernière sauvegarde
  const formatTimeSinceLastSave = () => {
    if (!lastSaveTime) return 'Jamais';
    
    const now = Date.now();
    const diff = now - lastSaveTime;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return `${seconds}s`;
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}j`;
  };

  // Gérer la sauvegarde forcée
  const handleForceSave = async () => {
    if (!isConnected) {
      setSaveStatus('error');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    setSaveStatus('saving');
    setShowNotification(true);

    try {
      await onForceSave();
      setSaveStatus('success');
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  // Déterminer l'icône et la couleur selon le statut
  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Clock size={16} className="status-icon saving" />;
      case 'success':
        return <CheckCircle size={16} className="status-icon success" />;
      case 'error':
        return <AlertCircle size={16} className="status-icon error" />;
      default:
        return <Save size={16} className="status-icon idle" />;
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
        return 'Prêt';
    }
  };

  const getStatusClass = () => {
    switch (saveStatus) {
      case 'saving':
        return 'saving';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'idle';
    }
  };

  return (
    <div className={`save-notification ${className}`}>
      {/* Indicateur de statut */}
      <div className="save-status">
        {getStatusIcon()}
        <span className={`status-text ${getStatusClass()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Informations de sauvegarde */}
      {showLastSave && (
        <div className="save-info">
          <span className="last-save-label">Dernière sauvegarde:</span>
          <span className="last-save-time">{formatTimeSinceLastSave()}</span>
        </div>
      )}

      {/* Bouton de sauvegarde forcée */}
      <motion.button
        className={`force-save-btn ${getStatusClass()}`}
        onClick={handleForceSave}
        disabled={saveStatus === 'saving'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Sauvegarder maintenant"
      >
        <Save size={16} />
        Sauvegarder
      </motion.button>

      {/* Indicateur de connexion */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <div className="connection-dot" />
        <span className="connection-text">
          {isConnected ? 'Connecté' : 'Hors ligne'}
        </span>
      </div>

      {/* Notification de statut */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className={`save-notification-toast ${getStatusClass()}`}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="toast-content">
              {getStatusIcon()}
              <span className="toast-text">{getStatusText()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SaveNotification;
