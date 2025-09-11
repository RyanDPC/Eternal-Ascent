/**
 * Service de log pour Eternal Ascent
 * Gère les logs et le debugging
 */
import configService from './configService';

class LogService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    };
    this.currentLevel = this.levels.INFO;
    this.listeners = new Map();
    this.enabled = configService.get('app.debug', false);
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
   * Ajouter un log
   * @param {string} level - Niveau du log
   * @param {string} message - Message
   * @param {*} data - Données supplémentaires
   * @private
   */
  _addLog(level, message, data = null) {
    if (!this.enabled) return;
    
    const log = {
      id: Date.now() + Math.random(),
      level,
      message,
      data,
      timestamp: new Date(),
      stack: level === 'ERROR' ? new Error().stack : null
    };
    
    this.logs.unshift(log);
    
    // Limiter le nombre de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    this.emit('logAdded', log);
    
    // Log dans la console
    this._logToConsole(level, message, data);
  }

  /**
   * Logger dans la console
   * @param {string} level - Niveau du log
   * @param {string} message - Message
   * @param {*} data - Données supplémentaires
   * @private
   */
  _logToConsole(level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    switch (level) {
      case 'ERROR':
        console.error(prefix, message, data);
        break;
      case 'WARN':
        console.warn(prefix, message, data);
        break;
      case 'INFO':
        console.info(prefix, message, data);
        break;
      case 'DEBUG':
        console.debug(prefix, message, data);
        break;
      case 'TRACE':
        console.trace(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
  }

  /**
   * Vérifier si un niveau de log est activé
   * @param {string} level - Niveau à vérifier
   * @returns {boolean} True si activé
   * @private
   */
  _isLevelEnabled(level) {
    return this.levels[level] <= this.currentLevel;
  }

  /**
   * Log d'erreur
   * @param {string} message - Message
   * @param {*} data - Données supplémentaires
   */
  error(message, data = null) {
    if (this._isLevelEnabled('ERROR')) {
      this._addLog('ERROR', message, data);
    }
  }

  /**
   * Log d'avertissement
   * @param {string} message - Message
   * @param {*} data - Données supplémentaires
   */
  warn(message, data = null) {
    if (this._isLevelEnabled('WARN')) {
      this._addLog('WARN', message, data);
    }
  }

  /**
   * Log d'information
   * @param {string} message - Message
   * @param {*} data - Données supplémentaires
   */
  info(message, data = null) {
    if (this._isLevelEnabled('INFO')) {
      this._addLog('INFO', message, data);
    }
  }

  /**
   * Log de debug
   * @param {string} message - Message
   * @param {*} data - Données supplémentaires
   */
  debug(message, data = null) {
    if (this._isLevelEnabled('DEBUG')) {
      this._addLog('DEBUG', message, data);
    }
  }

  /**
   * Log de trace
   * @param {string} message - Message
   * @param {*} data - Données supplémentaires
   */
  trace(message, data = null) {
    if (this._isLevelEnabled('TRACE')) {
      this._addLog('TRACE', message, data);
    }
  }

  /**
   * Obtenir tous les logs
   * @returns {Array} Liste des logs
   */
  getAllLogs() {
    return [...this.logs];
  }

  /**
   * Obtenir les logs par niveau
   * @param {string} level - Niveau
   * @returns {Array} Logs du niveau
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Obtenir les logs par période
   * @param {Date} start - Date de début
   * @param {Date} end - Date de fin
   * @returns {Array} Logs de la période
   */
  getLogsByPeriod(start, end) {
    return this.logs.filter(log => 
      log.timestamp >= start && log.timestamp <= end
    );
  }

  /**
   * Obtenir les logs récents
   * @param {number} count - Nombre de logs
   * @returns {Array} Logs récents
   */
  getRecentLogs(count = 100) {
    return this.logs.slice(0, count);
  }

  /**
   * Supprimer les logs
   * @param {string} level - Niveau à supprimer (optionnel)
   */
  clearLogs(level = null) {
    if (level) {
      this.logs = this.logs.filter(log => log.level !== level);
    } else {
      this.logs = [];
    }
    this.emit('logsCleared', { level });
  }

  /**
   * Définir le niveau de log
   * @param {string} level - Nouveau niveau
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.currentLevel = this.levels[level];
      this.emit('levelChanged', level);
    }
  }

  /**
   * Obtenir le niveau actuel
   * @returns {string} Niveau actuel
   */
  getLevel() {
    return Object.keys(this.levels).find(key => this.levels[key] === this.currentLevel);
  }

  /**
   * Activer/désactiver les logs
   * @param {boolean} enabled - État des logs
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Vérifier si les logs sont activés
   * @returns {boolean} True si activés
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Définir le nombre maximum de logs
   * @param {number} max - Nombre maximum
   */
  setMaxLogs(max) {
    this.maxLogs = max;
    if (this.logs.length > max) {
      this.logs = this.logs.slice(0, max);
    }
    this.emit('maxLogsChanged', max);
  }

  /**
   * Obtenir le nombre de logs
   * @returns {number} Nombre de logs
   */
  getLogCount() {
    return this.logs.length;
  }

  /**
   * Obtenir les statistiques des logs
   * @returns {Object} Statistiques
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      byHour: {},
      errors: 0,
      warnings: 0
    };
    
    this.logs.forEach(log => {
      // Par niveau
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Par heure
      const hour = log.timestamp.getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
      
      // Erreurs et avertissements
      if (log.level === 'ERROR') stats.errors++;
      if (log.level === 'WARN') stats.warnings++;
    });
    
    return stats;
  }

  /**
   * Exporter les logs
   * @param {string} format - Format d'export (json, csv, txt)
   * @returns {string} Logs exportés
   */
  export(format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logs, null, 2);
      case 'csv':
        const headers = ['timestamp', 'level', 'message', 'data'];
        const csv = [headers.join(',')];
        this.logs.forEach(log => {
          const row = [
            log.timestamp.toISOString(),
            log.level,
            `"${log.message.replace(/"/g, '""')}"`,
            log.data ? `"${JSON.stringify(log.data).replace(/"/g, '""')}"` : ''
          ];
          csv.push(row.join(','));
        });
        return csv.join('\n');
      case 'txt':
        return this.logs.map(log => 
          `[${log.timestamp.toISOString()}] [${log.level}] ${log.message}${log.data ? ' ' + JSON.stringify(log.data) : ''}`
        ).join('\n');
      default:
        return JSON.stringify(this.logs, null, 2);
    }
  }

  /**
   * Réinitialiser le service
   */
  reset() {
    this.logs = [];
    this.currentLevel = this.levels.INFO;
    this.enabled = configService.get('app.debug', false);
    this.listeners.clear();
  }
}

// Instance singleton
const logService = new LogService();
export default logService;
