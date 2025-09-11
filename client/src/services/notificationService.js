/**
 * Service de notifications pour Eternal Ascent
 * Gère toutes les notifications de l'application
 */
class NotificationService {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 50;
    this.listeners = new Map();
    this.soundEnabled = true;
    this.autoHide = true;
    this.autoHideDelay = 5000; // 5 secondes
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
   * Ajouter une notification
   * @param {string} message - Message de la notification
   * @param {string} type - Type de notification (success, error, warning, info)
   * @param {Object} options - Options supplémentaires
   */
  addNotification(message, type = 'info', options = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date(),
      read: false,
      persistent: options.persistent || false,
      duration: options.duration || this.autoHideDelay,
      actions: options.actions || [],
      data: options.data || {}
    };

    this.notifications.unshift(notification);

    // Limiter le nombre de notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    this.emit('notificationAdded', notification);

    // Auto-hide si activé
    if (this.autoHide && !notification.persistent) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }

    return notification;
  }

  /**
   * Ajouter une notification de succès
   * @param {string} message - Message
   * @param {Object} options - Options
   */
  addSuccess(message, options = {}) {
    return this.addNotification(message, 'success', options);
  }

  /**
   * Ajouter une notification d'erreur
   * @param {string} message - Message
   * @param {Object} options - Options
   */
  addError(message, options = {}) {
    return this.addNotification(message, 'error', { ...options, persistent: true });
  }

  /**
   * Ajouter une notification d'avertissement
   * @param {string} message - Message
   * @param {Object} options - Options
   */
  addWarning(message, options = {}) {
    return this.addNotification(message, 'warning', options);
  }

  /**
   * Ajouter une notification d'information
   * @param {string} message - Message
   * @param {Object} options - Options
   */
  addInfo(message, options = {}) {
    return this.addNotification(message, 'info', options);
  }

  /**
   * Supprimer une notification
   * @param {string} id - ID de la notification
   */
  removeNotification(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      const notification = this.notifications[index];
      this.notifications.splice(index, 1);
      this.emit('notificationRemoved', notification);
    }
  }

  /**
   * Marquer une notification comme lue
   * @param {string} id - ID de la notification
   */
  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.emit('notificationRead', notification);
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.emit('allNotificationsRead');
  }

  /**
   * Supprimer toutes les notifications
   */
  clearAll() {
    this.notifications = [];
    this.emit('allNotificationsCleared');
  }

  /**
   * Supprimer les notifications lues
   */
  clearRead() {
    this.notifications = this.notifications.filter(n => !n.read);
    this.emit('readNotificationsCleared');
  }

  /**
   * Obtenir toutes les notifications
   * @returns {Array} Notifications
   */
  getAllNotifications() {
    return this.notifications;
  }

  /**
   * Obtenir les notifications non lues
   * @returns {Array} Notifications non lues
   */
  getUnreadNotifications() {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Obtenir les notifications par type
   * @param {string} type - Type de notification
   * @returns {Array} Notifications du type
   */
  getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  /**
   * Obtenir le nombre de notifications non lues
   * @returns {number} Nombre de notifications non lues
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Obtenir le nombre total de notifications
   * @returns {number} Nombre total
   */
  getTotalCount() {
    return this.notifications.length;
  }

  /**
   * Vérifier si une notification existe
   * @param {string} id - ID de la notification
   * @returns {boolean} True si existe
   */
  hasNotification(id) {
    return this.notifications.some(n => n.id === id);
  }

  /**
   * Obtenir une notification par ID
   * @param {string} id - ID de la notification
   * @returns {Object|null} La notification ou null
   */
  getNotificationById(id) {
    return this.notifications.find(n => n.id === id) || null;
  }

  /**
   * Activer/désactiver le son
   * @param {boolean} enabled - État du son
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    this.emit('soundToggled', enabled);
  }

  /**
   * Activer/désactiver l'auto-hide
   * @param {boolean} enabled - État de l'auto-hide
   */
  setAutoHide(enabled) {
    this.autoHide = enabled;
    this.emit('autoHideToggled', enabled);
  }

  /**
   * Définir le délai d'auto-hide
   * @param {number} delay - Délai en millisecondes
   */
  setAutoHideDelay(delay) {
    this.autoHideDelay = delay;
    this.emit('autoHideDelayChanged', delay);
  }

  /**
   * Définir le nombre maximum de notifications
   * @param {number} max - Nombre maximum
   */
  setMaxNotifications(max) {
    this.maxNotifications = max;
    if (this.notifications.length > max) {
      this.notifications = this.notifications.slice(0, max);
    }
    this.emit('maxNotificationsChanged', max);
  }

  /**
   * Obtenir les paramètres
   * @returns {Object} Paramètres
   */
  getSettings() {
    return {
      soundEnabled: this.soundEnabled,
      autoHide: this.autoHide,
      autoHideDelay: this.autoHideDelay,
      maxNotifications: this.maxNotifications
    };
  }

  /**
   * Définir les paramètres
   * @param {Object} settings - Paramètres
   */
  setSettings(settings) {
    if (settings.soundEnabled !== undefined) {
      this.soundEnabled = settings.soundEnabled;
    }
    if (settings.autoHide !== undefined) {
      this.autoHide = settings.autoHide;
    }
    if (settings.autoHideDelay !== undefined) {
      this.autoHideDelay = settings.autoHideDelay;
    }
    if (settings.maxNotifications !== undefined) {
      this.maxNotifications = settings.maxNotifications;
    }
    this.emit('settingsChanged', this.getSettings());
  }

  /**
   * Réinitialiser le service
   */
  reset() {
    this.notifications = [];
    this.listeners.clear();
    this.soundEnabled = true;
    this.autoHide = true;
    this.autoHideDelay = 5000;
    this.maxNotifications = 50;
  }
}

// Instance singleton
const notificationService = new NotificationService();
export default notificationService;
