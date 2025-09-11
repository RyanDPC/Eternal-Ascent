/**
 * Service de performance pour Eternal Ascent
 * Gère le monitoring des performances et l'optimisation
 */
import configService from './configService';

class PerformanceService {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
    this.listeners = new Map();
    this.isEnabled = configService.get('performance.monitoring', true);
    this.maxMetrics = 1000;
    this.cleanupInterval = 300000; // 5 minutes
    
    this.startCleanupTimer();
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
   * Démarrer le timer de nettoyage
   * @private
   */
  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Démarrer un timer
   * @param {string} name - Nom du timer
   * @returns {string} ID du timer
   */
  startTimer(name) {
    if (!this.isEnabled) return null;
    
    const id = `${name}_${Date.now()}_${Math.random()}`;
    this.timers.set(id, {
      name,
      startTime: performance.now(),
      startTimestamp: Date.now()
    });
    
    return id;
  }

  /**
   * Arrêter un timer
   * @param {string} id - ID du timer
   * @returns {Object|null} Métriques du timer
   */
  endTimer(id) {
    if (!this.isEnabled || !id) return null;
    
    const timer = this.timers.get(id);
    if (!timer) return null;
    
    const endTime = performance.now();
    const duration = endTime - timer.startTime;
    
    const metric = {
      name: timer.name,
      duration,
      startTime: timer.startTime,
      endTime,
      startTimestamp: timer.startTimestamp,
      endTimestamp: Date.now()
    };
    
    this.recordMetric(metric);
    this.timers.delete(id);
    
    return metric;
  }

  /**
   * Mesurer une fonction
   * @param {string} name - Nom de la mesure
   * @param {Function} fn - Fonction à mesurer
   * @returns {*} Résultat de la fonction
   */
  measure(name, fn) {
    if (!this.isEnabled) return fn();
    
    const timerId = this.startTimer(name);
    try {
      const result = fn();
      this.endTimer(timerId);
      return result;
    } catch (error) {
      this.endTimer(timerId);
      throw error;
    }
  }

  /**
   * Mesurer une fonction asynchrone
   * @param {string} name - Nom de la mesure
   * @param {Function} fn - Fonction à mesurer
   * @returns {Promise} Résultat de la fonction
   */
  async measureAsync(name, fn) {
    if (!this.isEnabled) return await fn();
    
    const timerId = this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(timerId);
      return result;
    } catch (error) {
      this.endTimer(timerId);
      throw error;
    }
  }

  /**
   * Enregistrer une métrique
   * @param {Object} metric - Métrique à enregistrer
   */
  recordMetric(metric) {
    if (!this.isEnabled) return;
    
    const key = `${metric.name}_${Date.now()}_${Math.random()}`;
    this.metrics.set(key, metric);
    
    // Limiter le nombre de métriques
    if (this.metrics.size > this.maxMetrics) {
      const firstKey = this.metrics.keys().next().value;
      this.metrics.delete(firstKey);
    }
    
    this.emit('metricRecorded', metric);
  }

  /**
   * Obtenir les métriques par nom
   * @param {string} name - Nom des métriques
   * @returns {Array} Métriques
   */
  getMetricsByName(name) {
    return Array.from(this.metrics.values())
      .filter(metric => metric.name === name);
  }

  /**
   * Obtenir les métriques par période
   * @param {Date} start - Date de début
   * @param {Date} end - Date de fin
   * @returns {Array} Métriques de la période
   */
  getMetricsByPeriod(start, end) {
    return Array.from(this.metrics.values())
      .filter(metric => 
        metric.startTimestamp >= start.getTime() && 
        metric.startTimestamp <= end.getTime()
      );
  }

  /**
   * Obtenir les statistiques d'une métrique
   * @param {string} name - Nom de la métrique
   * @returns {Object} Statistiques
   */
  getMetricStats(name) {
    const metrics = this.getMetricsByName(name);
    
    if (metrics.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        total: 0
      };
    }
    
    const durations = metrics.map(m => m.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);
    const average = total / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return {
      count: metrics.length,
      average: Math.round(average * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }

  /**
   * Obtenir toutes les métriques
   * @returns {Array} Toutes les métriques
   */
  getAllMetrics() {
    return Array.from(this.metrics.values());
  }

  /**
   * Obtenir les métriques récentes
   * @param {number} count - Nombre de métriques
   * @returns {Array} Métriques récentes
   */
  getRecentMetrics(count = 100) {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.startTimestamp - a.startTimestamp)
      .slice(0, count);
  }

  /**
   * Obtenir les performances de l'application
   * @returns {Object} Performances
   */
  getAppPerformance() {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      navigation: {
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
        loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
        totalTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0
      },
      paint: {
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      },
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    };
  }

  /**
   * Obtenir les performances des ressources
   * @returns {Array} Performances des ressources
   */
  getResourcePerformance() {
    return performance.getEntriesByType('resource').map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize,
      type: resource.initiatorType,
      startTime: resource.startTime
    }));
  }

  /**
   * Obtenir les performances des timers
   * @returns {Array} Performances des timers
   */
  getTimerPerformance() {
    return Array.from(this.timers.values()).map(timer => ({
      name: timer.name,
      duration: performance.now() - timer.startTime,
      startTime: timer.startTime,
      startTimestamp: timer.startTimestamp
    }));
  }

  /**
   * Nettoyer les métriques anciennes
   * @param {number} maxAge - Âge maximum en millisecondes
   */
  cleanup(maxAge = 3600000) { // 1 heure par défaut
    const now = Date.now();
    const toDelete = [];
    
    for (const [key, metric] of this.metrics.entries()) {
      if (now - metric.startTimestamp > maxAge) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => this.metrics.delete(key));
    
    if (toDelete.length > 0) {
      this.emit('metricsCleanup', { removed: toDelete.length });
    }
  }

  /**
   * Activer/désactiver le monitoring
   * @param {boolean} enabled - État du monitoring
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    this.emit('monitoringToggled', enabled);
  }

  /**
   * Vérifier si le monitoring est activé
   * @returns {boolean} True si activé
   */
  isMonitoringEnabled() {
    return this.isEnabled;
  }

  /**
   * Définir le nombre maximum de métriques
   * @param {number} max - Nombre maximum
   */
  setMaxMetrics(max) {
    this.maxMetrics = max;
    
    // Nettoyer si nécessaire
    if (this.metrics.size > max) {
      const toDelete = Array.from(this.metrics.keys()).slice(0, this.metrics.size - max);
      toDelete.forEach(key => this.metrics.delete(key));
    }
    
    this.emit('maxMetricsChanged', { max });
  }

  /**
   * Obtenir les statistiques globales
   * @returns {Object} Statistiques globales
   */
  getGlobalStats() {
    const allMetrics = this.getAllMetrics();
    const totalDuration = allMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = allMetrics.length > 0 ? totalDuration / allMetrics.length : 0;
    
    return {
      totalMetrics: allMetrics.length,
      totalDuration: Math.round(totalDuration * 100) / 100,
      averageDuration: Math.round(averageDuration * 100) / 100,
      activeTimers: this.timers.size,
      memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
    };
  }

  /**
   * Exporter les métriques
   * @param {string} format - Format d'export (json, csv)
   * @returns {string} Métriques exportées
   */
  exportMetrics(format = 'json') {
    const metrics = this.getAllMetrics();
    
    switch (format) {
      case 'json':
        return JSON.stringify(metrics, null, 2);
      case 'csv':
        const headers = ['name', 'duration', 'startTime', 'endTime', 'startTimestamp', 'endTimestamp'];
        const csv = [headers.join(',')];
        metrics.forEach(metric => {
          const row = [
            metric.name,
            metric.duration,
            metric.startTime,
            metric.endTime,
            metric.startTimestamp,
            metric.endTimestamp
          ];
          csv.push(row.join(','));
        });
        return csv.join('\n');
      default:
        return JSON.stringify(metrics, null, 2);
    }
  }

  /**
   * Réinitialiser le service
   */
  reset() {
    this.metrics.clear();
    this.timers.clear();
    this.listeners.clear();
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.startCleanupTimer();
  }
}

// Instance singleton
const performanceService = new PerformanceService();
export default performanceService;
