/**
 * Service de stockage pour Eternal Ascent
 * Gère le stockage local et la persistance des données
 */
class StorageService {
  constructor() {
    this.storageKey = 'eternal_ascent_';
    this.listeners = new Map();
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
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
   * Obtenir une clé complète
   * @param {string} key - Clé
   * @returns {string} Clé complète
   * @private
   */
  _getFullKey(key) {
    return `${this.storageKey}${key}`;
  }

  /**
   * Vérifier si le stockage local est disponible
   * @returns {boolean} True si disponible
   */
  isLocalStorageAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Vérifier si le stockage de session est disponible
   * @returns {boolean} True si disponible
   */
  isSessionStorageAvailable() {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sauvegarder des données
   * @param {string} key - Clé
   * @param {*} data - Données à sauvegarder
   * @param {string} type - Type de stockage (local, session, memory)
   * @returns {boolean} True si sauvegardé avec succès
   */
  save(key, data, type = 'local') {
    try {
      const fullKey = this._getFullKey(key);
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0'
      });

      switch (type) {
        case 'local':
          if (this.isLocalStorageAvailable()) {
            localStorage.setItem(fullKey, serializedData);
          } else {
            return this.save(key, data, 'memory');
          }
          break;
        case 'session':
          if (this.isSessionStorageAvailable()) {
            sessionStorage.setItem(fullKey, serializedData);
          } else {
            return this.save(key, data, 'memory');
          }
          break;
        case 'memory':
          this.cache.set(fullKey, {
            data: serializedData,
            timestamp: Date.now()
          });
          break;
        default:
          return false;
      }

      this.emit('dataSaved', { key, type });
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return false;
    }
  }

  /**
   * Charger des données
   * @param {string} key - Clé
   * @param {*} defaultValue - Valeur par défaut
   * @param {string} type - Type de stockage (local, session, memory)
   * @returns {*} Données chargées ou valeur par défaut
   */
  load(key, defaultValue = null, type = 'local') {
    try {
      const fullKey = this._getFullKey(key);
      let serializedData = null;

      switch (type) {
        case 'local':
          if (this.isLocalStorageAvailable()) {
            serializedData = localStorage.getItem(fullKey);
          } else {
            return this.load(key, defaultValue, 'memory');
          }
          break;
        case 'session':
          if (this.isSessionStorageAvailable()) {
            serializedData = sessionStorage.getItem(fullKey);
          } else {
            return this.load(key, defaultValue, 'memory');
          }
          break;
        case 'memory':
          const cached = this.cache.get(fullKey);
          if (cached && this._isCacheValid(fullKey)) {
            serializedData = cached.data;
          }
          break;
        default:
          return defaultValue;
      }

      if (serializedData) {
        const parsed = JSON.parse(serializedData);
        this.emit('dataLoaded', { key, type });
        return parsed.data;
      }

      return defaultValue;
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return defaultValue;
    }
  }

  /**
   * Supprimer des données
   * @param {string} key - Clé
   * @param {string} type - Type de stockage (local, session, memory)
   * @returns {boolean} True si supprimé avec succès
   */
  remove(key, type = 'local') {
    try {
      const fullKey = this._getFullKey(key);

      switch (type) {
        case 'local':
          if (this.isLocalStorageAvailable()) {
            localStorage.removeItem(fullKey);
          }
          break;
        case 'session':
          if (this.isSessionStorageAvailable()) {
            sessionStorage.removeItem(fullKey);
          }
          break;
        case 'memory':
          this.cache.delete(fullKey);
          break;
        default:
          return false;
      }

      this.emit('dataRemoved', { key, type });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  }

  /**
   * Vérifier si des données existent
   * @param {string} key - Clé
   * @param {string} type - Type de stockage (local, session, memory)
   * @returns {boolean} True si existe
   */
  exists(key, type = 'local') {
    try {
      const fullKey = this._getFullKey(key);

      switch (type) {
        case 'local':
          if (this.isLocalStorageAvailable()) {
            return localStorage.getItem(fullKey) !== null;
          }
          return this.exists(key, 'memory');
        case 'session':
          if (this.isSessionStorageAvailable()) {
            return sessionStorage.getItem(fullKey) !== null;
          }
          return this.exists(key, 'memory');
        case 'memory':
          return this.cache.has(fullKey);
        default:
          return false;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      return false;
    }
  }

  /**
   * Obtenir toutes les clés
   * @param {string} type - Type de stockage (local, session, memory)
   * @returns {Array} Liste des clés
   */
  getKeys(type = 'local') {
    try {
      const keys = [];

      switch (type) {
        case 'local':
          if (this.isLocalStorageAvailable()) {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith(this.storageKey)) {
                keys.push(key.substring(this.storageKey.length));
              }
            }
          }
          break;
        case 'session':
          if (this.isSessionStorageAvailable()) {
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key && key.startsWith(this.storageKey)) {
                keys.push(key.substring(this.storageKey.length));
              }
            }
          }
          break;
        case 'memory':
          this.cache.forEach((value, key) => {
            if (key.startsWith(this.storageKey)) {
              keys.push(key.substring(this.storageKey.length));
            }
          });
          break;
      }

      return keys;
    } catch (error) {
      console.error('Erreur lors de la récupération des clés:', error);
      return [];
    }
  }

  /**
   * Vider le stockage
   * @param {string} type - Type de stockage (local, session, memory)
   * @returns {boolean} True si vidé avec succès
   */
  clear(type = 'local') {
    try {
      switch (type) {
        case 'local':
          if (this.isLocalStorageAvailable()) {
            const keys = this.getKeys('local');
            keys.forEach(key => {
              localStorage.removeItem(this._getFullKey(key));
            });
          }
          break;
        case 'session':
          if (this.isSessionStorageAvailable()) {
            const keys = this.getKeys('session');
            keys.forEach(key => {
              sessionStorage.removeItem(this._getFullKey(key));
            });
          }
          break;
        case 'memory':
          this.cache.clear();
          break;
        case 'all':
          this.clear('local');
          this.clear('session');
          this.clear('memory');
          break;
        default:
          return false;
      }

      this.emit('storageCleared', { type });
      return true;
    } catch (error) {
      console.error('Erreur lors du vidage:', error);
      return false;
    }
  }

  /**
   * Obtenir la taille du stockage
   * @param {string} type - Type de stockage (local, session, memory)
   * @returns {number} Taille en octets
   */
  getSize(type = 'local') {
    try {
      let size = 0;

      switch (type) {
        case 'local':
          if (this.isLocalStorageAvailable()) {
            const keys = this.getKeys('local');
            keys.forEach(key => {
              const data = localStorage.getItem(this._getFullKey(key));
              if (data) {
                size += data.length;
              }
            });
          }
          break;
        case 'session':
          if (this.isSessionStorageAvailable()) {
            const keys = this.getKeys('session');
            keys.forEach(key => {
              const data = sessionStorage.getItem(this._getFullKey(key));
              if (data) {
                size += data.length;
              }
            });
          }
          break;
        case 'memory':
          this.cache.forEach((value, key) => {
            if (key.startsWith(this.storageKey)) {
              size += value.data.length;
            }
          });
          break;
      }

      return size;
    } catch (error) {
      console.error('Erreur lors du calcul de la taille:', error);
      return 0;
    }
  }

  /**
   * Vérifier si le cache est valide
   * @param {string} key - Clé
   * @returns {boolean} True si valide
   * @private
   */
  _isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.cacheTimeout;
  }

  /**
   * Réinitialiser le service
   */
  reset() {
    this.cache.clear();
    this.listeners.clear();
  }
}

// Instance singleton
const storageService = new StorageService();
export default storageService;
