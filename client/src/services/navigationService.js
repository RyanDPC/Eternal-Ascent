/**
 * Service de navigation pour Eternal Ascent
 * Gère la navigation entre les pages et l'état de l'application
 */
class NavigationService {
  constructor() {
    this.currentPage = 'dashboard';
    this.previousPage = null;
    this.navigationHistory = [];
    this.listeners = new Map();
    this.pageData = new Map();
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
   * Naviguer vers une page
   * @param {string} page - Nom de la page
   * @param {Object} data - Données à transmettre
   */
  navigateTo(page, data = {}) {
    if (this.currentPage !== page) {
      this.previousPage = this.currentPage;
      this.currentPage = page;
      
      // Ajouter à l'historique
      this.navigationHistory.push({
        page: this.previousPage,
        timestamp: Date.now(),
        data: this.pageData.get(this.previousPage) || {}
      });
      
      // Limiter l'historique à 50 entrées
      if (this.navigationHistory.length > 50) {
        this.navigationHistory.shift();
      }
      
      this.emit('pageChanged', {
        current: this.currentPage,
        previous: this.previousPage,
        data
      });
    }
  }

  /**
   * Retourner à la page précédente
   * @returns {boolean} True si retour réussi
   */
  goBack() {
    if (this.navigationHistory.length > 0) {
      const lastPage = this.navigationHistory.pop();
      this.previousPage = this.currentPage;
      this.currentPage = lastPage.page;
      
      this.emit('pageChanged', {
        current: this.currentPage,
        previous: this.previousPage,
        data: lastPage.data
      });
      
      return true;
    }
    return false;
  }

  /**
   * Obtenir la page actuelle
   * @returns {string} Page actuelle
   */
  getCurrentPage() {
    return this.currentPage;
  }

  /**
   * Obtenir la page précédente
   * @returns {string|null} Page précédente
   */
  getPreviousPage() {
    return this.previousPage;
  }

  /**
   * Obtenir l'historique de navigation
   * @returns {Array} Historique
   */
  getNavigationHistory() {
    return this.navigationHistory;
  }

  /**
   * Vérifier si une page est active
   * @param {string} page - Nom de la page
   * @returns {boolean} True si active
   */
  isPageActive(page) {
    return this.currentPage === page;
  }

  /**
   * Obtenir les données d'une page
   * @param {string} page - Nom de la page
   * @returns {Object} Données de la page
   */
  getPageData(page) {
    return this.pageData.get(page) || {};
  }

  /**
   * Définir les données d'une page
   * @param {string} page - Nom de la page
   * @param {Object} data - Données à définir
   */
  setPageData(page, data) {
    this.pageData.set(page, data);
  }

  /**
   * Effacer les données d'une page
   * @param {string} page - Nom de la page
   */
  clearPageData(page) {
    this.pageData.delete(page);
  }

  /**
   * Effacer toutes les données
   */
  clearAllPageData() {
    this.pageData.clear();
  }

  /**
   * Obtenir le nombre de pages dans l'historique
   * @returns {number} Nombre de pages
   */
  getHistoryLength() {
    return this.navigationHistory.length;
  }

  /**
   * Vérifier si on peut revenir en arrière
   * @returns {boolean} True si possible
   */
  canGoBack() {
    return this.navigationHistory.length > 0;
  }

  /**
   * Obtenir la page à l'index donné
   * @param {number} index - Index dans l'historique
   * @returns {Object|null} Page à l'index
   */
  getPageAtIndex(index) {
    if (index >= 0 && index < this.navigationHistory.length) {
      return this.navigationHistory[index];
    }
    return null;
  }

  /**
   * Obtenir la dernière page visitée
   * @returns {Object|null} Dernière page
   */
  getLastPage() {
    if (this.navigationHistory.length > 0) {
      return this.navigationHistory[this.navigationHistory.length - 1];
    }
    return null;
  }

  /**
   * Obtenir la première page visitée
   * @returns {Object|null} Première page
   */
  getFirstPage() {
    if (this.navigationHistory.length > 0) {
      return this.navigationHistory[0];
    }
    return null;
  }

  /**
   * Réinitialiser la navigation
   */
  reset() {
    this.currentPage = 'dashboard';
    this.previousPage = null;
    this.navigationHistory = [];
    this.pageData.clear();
    this.listeners.clear();
  }

  /**
   * Obtenir les statistiques de navigation
   * @returns {Object} Statistiques
   */
  getNavigationStats() {
    const pageCounts = {};
    this.navigationHistory.forEach(entry => {
      pageCounts[entry.page] = (pageCounts[entry.page] || 0) + 1;
    });

    return {
      totalPages: this.navigationHistory.length,
      currentPage: this.currentPage,
      previousPage: this.previousPage,
      pageCounts,
      canGoBack: this.canGoBack()
    };
  }
}

// Instance singleton
const navigationService = new NavigationService();
export default navigationService;
