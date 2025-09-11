/**
 * Service de configuration pour Eternal Ascent
 * Gère la configuration de l'application
 */
import storageService from './storageService';

class ConfigService {
  constructor() {
    this.config = {
      // Configuration générale
      app: {
        name: 'Eternal Ascent',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        debug: process.env.NODE_ENV === 'development'
      },
      
      // Configuration API
      api: {
        baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
      },
      
      // Configuration du jeu
      game: {
        maxLevel: 100,
        maxSkillPoints: 1000,
        maxInventorySlots: 100,
        maxGuildMembers: 50,
        autoSaveInterval: 30000, // 30 secondes
        combatTimeout: 300000, // 5 minutes
        tradingTimeout: 600000 // 10 minutes
      },
      
      // Configuration UI
      ui: {
        theme: 'dark',
        language: 'fr',
        animations: true,
        soundEnabled: true,
        musicEnabled: true,
        notifications: true,
        autoHideNotifications: true,
        notificationDuration: 5000
      },
      
      // Configuration des performances
      performance: {
        cacheEnabled: true,
        cacheTimeout: 300000, // 5 minutes
        maxCacheSize: 50 * 1024 * 1024, // 50 MB
        lazyLoading: true,
        virtualScrolling: true
      },
      
      // Configuration de sécurité
      security: {
        encryptSensitiveData: true,
        sessionTimeout: 3600000, // 1 heure
        maxLoginAttempts: 5,
        lockoutDuration: 900000 // 15 minutes
      }
    };
    
    this.listeners = new Map();
    this.loadFromStorage();
  }

  /**
   * Écouter les changements
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction de callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Émettre un événement
   * @param {string} event - Nom de l'événement
   * @param {*} data - Données à transmettre
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  /**
   * Charger la configuration depuis le stockage
   * @private
   */
  loadFromStorage() {
    try {
      const stored = storageService.load('config', null, 'local');
      if (stored) {
        this.config = this._mergeConfig(this.config, stored);
      }
    } catch (error) {
      console.warn('Impossible de charger la configuration:', error);
    }
  }

  /**
   * Sauvegarder la configuration
   * @private
   */
  saveToStorage() {
    try {
      storageService.save('config', this.config, 'local');
    } catch (error) {
      console.warn('Impossible de sauvegarder la configuration:', error);
    }
  }

  /**
   * Fusionner les configurations
   * @param {Object} base - Configuration de base
   * @param {Object} override - Configuration à appliquer
   * @returns {Object} Configuration fusionnée
   * @private
   */
  _mergeConfig(base, override) {
    const merged = { ...base };
    
    for (const key in override) {
      if (override.hasOwnProperty(key)) {
        if (typeof override[key] === 'object' && override[key] !== null && !Array.isArray(override[key])) {
          merged[key] = this._mergeConfig(base[key] || {}, override[key]);
        } else {
          merged[key] = override[key];
        }
      }
    }
    
    return merged;
  }

  /**
   * Obtenir une valeur de configuration
   * @param {string} path - Chemin vers la valeur (ex: 'ui.theme')
   * @param {*} defaultValue - Valeur par défaut
   * @returns {*} Valeur de configuration
   */
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * Définir une valeur de configuration
   * @param {string} path - Chemin vers la valeur (ex: 'ui.theme')
   * @param {*} value - Nouvelle valeur
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.config;
    
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[lastKey] = value;
    this.saveToStorage();
    this.emit('configChanged', { path, value });
  }

  /**
   * Obtenir toute la configuration
   * @returns {Object} Configuration complète
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Définir une section de configuration
   * @param {string} section - Section (ex: 'ui')
   * @param {Object} values - Valeurs à définir
   */
  setSection(section, values) {
    if (this.config[section]) {
      this.config[section] = { ...this.config[section], ...values };
    } else {
      this.config[section] = values;
    }
    
    this.saveToStorage();
    this.emit('configSectionChanged', { section, values });
  }

  /**
   * Réinitialiser une section
   * @param {string} section - Section à réinitialiser
   */
  resetSection(section) {
    if (this.config[section]) {
      delete this.config[section];
      this.saveToStorage();
      this.emit('configSectionReset', { section });
    }
  }

  /**
   * Réinitialiser toute la configuration
   */
  reset() {
    this.config = {
      app: {
        name: 'Eternal Ascent',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        debug: process.env.NODE_ENV === 'development'
      },
      api: {
        baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
      },
      game: {
        maxLevel: 100,
        maxSkillPoints: 1000,
        maxInventorySlots: 100,
        maxGuildMembers: 50,
        autoSaveInterval: 30000,
        combatTimeout: 300000,
        tradingTimeout: 600000
      },
      ui: {
        theme: 'dark',
        language: 'fr',
        animations: true,
        soundEnabled: true,
        musicEnabled: true,
        notifications: true,
        autoHideNotifications: true,
        notificationDuration: 5000
      },
      performance: {
        cacheEnabled: true,
        cacheTimeout: 300000,
        maxCacheSize: 50 * 1024 * 1024,
        lazyLoading: true,
        virtualScrolling: true
      },
      security: {
        encryptSensitiveData: true,
        sessionTimeout: 3600000,
        maxLoginAttempts: 5,
        lockoutDuration: 900000
      }
    };
    
    this.saveToStorage();
    this.emit('configReset');
  }

  /**
   * Vérifier si une valeur existe
   * @param {string} path - Chemin vers la valeur
   * @returns {boolean} True si existe
   */
  has(path) {
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Obtenir les sections disponibles
   * @returns {Array} Liste des sections
   */
  getSections() {
    return Object.keys(this.config);
  }

  /**
   * Obtenir les clés d'une section
   * @param {string} section - Section
   * @returns {Array} Liste des clés
   */
  getSectionKeys(section) {
    if (this.config[section] && typeof this.config[section] === 'object') {
      return Object.keys(this.config[section]);
    }
    return [];
  }

  /**
   * Exporter la configuration
   * @returns {string} Configuration exportée
   */
  export() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Importer une configuration
   * @param {string} configJson - Configuration JSON
   * @returns {boolean} True si importé avec succès
   */
  import(configJson) {
    try {
      const imported = JSON.parse(configJson);
      this.config = this._mergeConfig(this.config, imported);
      this.saveToStorage();
      this.emit('configImported', imported);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'import de la configuration:', error);
      return false;
    }
  }
}

// Instance singleton
const configService = new ConfigService();
export default configService;
