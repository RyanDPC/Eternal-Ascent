/**
 * Service de cache pour Eternal Ascent
 * Gère la mise en cache des données et l'optimisation des performances
 */
import configService from './configService';

class CacheService {
  constructor() {
    this.cache = new Map();
    this.maxSize = configService.get('performance.maxCacheSize', 50 * 1024 * 1024); // 50 MB
    this.defaultTTL = configService.get('performance.cacheTimeout', 300000); // 5 minutes
    this.listeners = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0
    };
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
   * Calculer la taille d'un objet
   * @param {*} obj - Objet à mesurer
   * @returns {number} Taille en octets
   * @private
   */
  _calculateSize(obj) {
    try {
      return JSON.stringify(obj).length * 2; // Approximation
    } catch (error) {
      return 0;
    }
  }

  /**
   * Vérifier si le cache est plein
   * @returns {boolean} True si plein
   * @private
   */
  _isCacheFull() {
    return this.stats.size >= this.maxSize;
  }

  /**
   * Nettoyer le cache (LRU)
   * @private
   */
  _cleanupCache() {
    if (!this._isCacheFull()) return;
    
    // Trier par timestamp (plus ancien en premier)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Supprimer les 20% les plus anciens
    const toRemove = Math.ceil(entries.length * 0.2);
    
    for (let i = 0; i < toRemove; i++) {
      const [key] = entries[i];
      this.delete(key);
    }
  }

  /**
   * Mettre en cache une valeur
   * @param {string} key - Clé
   * @param {*} value - Valeur
   * @param {number} ttl - TTL en millisecondes
   * @returns {boolean} True si mis en cache
   */
  set(key, value, ttl = this.defaultTTL) {
    try {
      const size = this._calculateSize(value);
      
      // Vérifier si on peut ajouter cette valeur
      if (size > this.maxSize) {
        this.emit('cacheError', { key, error: 'Value too large for cache' });
        return false;
      }
      
      // Nettoyer le cache si nécessaire
      while (this.stats.size + size > this.maxSize) {
        this._cleanupCache();
      }
      
      const entry = {
        value,
        timestamp: Date.now(),
        ttl,
        size,
        accessCount: 0,
        lastAccess: Date.now()
      };
      
      this.cache.set(key, entry);
      this.stats.sets++;
      this.stats.size += size;
      
      this.emit('cacheSet', { key, value, ttl });
      return true;
    } catch (error) {
      this.emit('cacheError', { key, error: error.message });
      return false;
    }
  }

  /**
   * Récupérer une valeur du cache
   * @param {string} key - Clé
   * @returns {*} Valeur ou null
   */
  get(key) {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.stats.misses++;
        return null;
      }
      
      // Vérifier si l'entrée a expiré
      const now = Date.now();
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }
      
      // Mettre à jour les statistiques d'accès
      entry.accessCount++;
      entry.lastAccess = now;
      
      this.stats.hits++;
      this.emit('cacheHit', { key, value: entry.value });
      return entry.value;
    } catch (error) {
      this.emit('cacheError', { key, error: error.message });
      return null;
    }
  }

  /**
   * Supprimer une valeur du cache
   * @param {string} key - Clé
   * @returns {boolean} True si supprimé
   */
  delete(key) {
    try {
      const entry = this.cache.get(key);
      if (entry) {
        this.stats.size -= entry.size;
        this.cache.delete(key);
        this.stats.deletes++;
        this.emit('cacheDelete', { key });
        return true;
      }
      return false;
    } catch (error) {
      this.emit('cacheError', { key, error: error.message });
      return false;
    }
  }

  /**
   * Vérifier si une clé existe dans le cache
   * @param {string} key - Clé
   * @returns {boolean} True si existe
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Vérifier si l'entrée a expiré
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Obtenir ou définir une valeur
   * @param {string} key - Clé
   * @param {Function} factory - Fonction pour créer la valeur
   * @param {number} ttl - TTL en millisecondes
   * @returns {*} Valeur
   */
  getOrSet(key, factory, ttl = this.defaultTTL) {
    let value = this.get(key);
    
    if (value === null) {
      value = factory();
      this.set(key, value, ttl);
    }
    
    return value;
  }

  /**
   * Vider le cache
   */
  clear() {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0
    };
    this.emit('cacheCleared');
  }

  /**
   * Obtenir les statistiques du cache
   * @returns {Object} Statistiques
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      entries: this.cache.size,
      maxSize: this.maxSize,
      usage: Math.round((this.stats.size / this.maxSize) * 100)
    };
  }

  /**
   * Obtenir les clés du cache
   * @returns {Array} Liste des clés
   */
  getKeys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Obtenir les entrées du cache
   * @returns {Array} Liste des entrées
   */
  getEntries() {
    return Array.from(this.cache.entries());
  }

  /**
   * Obtenir les entrées par pattern
   * @param {string} pattern - Pattern de recherche
   * @returns {Array} Entrées correspondantes
   */
  getEntriesByPattern(pattern) {
    const regex = new RegExp(pattern);
    return this.getEntries().filter(([key]) => regex.test(key));
  }

  /**
   * Nettoyer les entrées expirées
   * @returns {number} Nombre d'entrées supprimées
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        removed++;
      }
    }
    
    this.emit('cacheCleanup', { removed });
    return removed;
  }

  /**
   * Définir la taille maximale du cache
   * @param {number} size - Taille en octets
   */
  setMaxSize(size) {
    this.maxSize = size;
    
    // Nettoyer si nécessaire
    if (this.stats.size > size) {
      this._cleanupCache();
    }
    
    this.emit('maxSizeChanged', { size });
  }

  /**
   * Définir le TTL par défaut
   * @param {number} ttl - TTL en millisecondes
   */
  setDefaultTTL(ttl) {
    this.defaultTTL = ttl;
    this.emit('defaultTTLChanged', { ttl });
  }

  /**
   * Obtenir une entrée du cache
   * @param {string} key - Clé
   * @returns {Object|null} Entrée ou null
   */
  getEntry(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Vérifier si l'entrée a expiré
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }
    
    return entry;
  }

  /**
   * Mettre à jour le TTL d'une entrée
   * @param {string} key - Clé
   * @param {number} ttl - Nouveau TTL
   * @returns {boolean} True si mis à jour
   */
  updateTTL(key, ttl) {
    const entry = this.cache.get(key);
    if (entry) {
      entry.ttl = ttl;
      this.emit('ttlUpdated', { key, ttl });
      return true;
    }
    return false;
  }

  /**
   * Réinitialiser le service
   */
  reset() {
    this.clear();
    this.maxSize = configService.get('performance.maxCacheSize', 50 * 1024 * 1024);
    this.defaultTTL = configService.get('performance.cacheTimeout', 300000);
    this.listeners.clear();
  }
}

// Instance singleton
const cacheService = new CacheService();
export default cacheService;
