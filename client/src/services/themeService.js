/**
 * Service de thème pour Eternal Ascent
 * Gère les thèmes et les préférences visuelles
 */
class ThemeService {
  constructor() {
    this.currentTheme = 'dark';
    this.availableThemes = ['light', 'dark', 'auto'];
    this.listeners = new Map();
    this.storageKey = 'eternal_ascent_theme';
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
   * Charger le thème depuis le stockage local
   * @private
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored && this.availableThemes.includes(stored)) {
        this.currentTheme = stored;
      }
    } catch (error) {
      console.warn('Impossible de charger le thème depuis le stockage local:', error);
    }
  }

  /**
   * Sauvegarder le thème dans le stockage local
   * @private
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, this.currentTheme);
    } catch (error) {
      console.warn('Impossible de sauvegarder le thème:', error);
    }
  }

  /**
   * Définir le thème
   * @param {string} theme - Nom du thème
   */
  setTheme(theme) {
    if (!this.availableThemes.includes(theme)) {
      console.warn(`Thème non supporté: ${theme}`);
      return;
    }

    this.currentTheme = theme;
    this.saveToStorage();
    this.applyTheme();
    this.emit('themeChanged', theme);
  }

  /**
   * Appliquer le thème à l'application
   * @private
   */
  applyTheme() {
    const root = document.documentElement;
    
    // Supprimer les classes de thème existantes
    this.availableThemes.forEach(theme => {
      root.classList.remove(`theme-${theme}`);
    });
    
    // Ajouter la classe du thème actuel
    root.classList.add(`theme-${this.currentTheme}`);
    
    // Gérer le thème automatique
    if (this.currentTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(`theme-${prefersDark ? 'dark' : 'light'}`);
    }
  }

  /**
   * Obtenir le thème actuel
   * @returns {string} Thème actuel
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Obtenir les thèmes disponibles
   * @returns {Array} Thèmes disponibles
   */
  getAvailableThemes() {
    return this.availableThemes;
  }

  /**
   * Vérifier si un thème est actif
   * @param {string} theme - Nom du thème
   * @returns {boolean} True si actif
   */
  isThemeActive(theme) {
    return this.currentTheme === theme;
  }

  /**
   * Basculer entre les thèmes clair et sombre
   */
  toggleTheme() {
    if (this.currentTheme === 'light') {
      this.setTheme('dark');
    } else if (this.currentTheme === 'dark') {
      this.setTheme('light');
    } else {
      // Si auto, basculer vers le thème opposé à la préférence système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'light' : 'dark');
    }
  }

  /**
   * Obtenir le thème effectif (résolu)
   * @returns {string} Thème effectif
   */
  getEffectiveTheme() {
    if (this.currentTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  /**
   * Obtenir les couleurs du thème
   * @returns {Object} Couleurs du thème
   */
  getThemeColors() {
    const theme = this.getEffectiveTheme();
    
    const colors = {
      light: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#111827',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        shadow: 'rgba(0, 0, 0, 0.1)'
      },
      dark: {
        primary: '#60a5fa',
        secondary: '#9ca3af',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        background: '#111827',
        surface: '#1f2937',
        text: '#f9fafb',
        textSecondary: '#d1d5db',
        border: '#374151',
        shadow: 'rgba(0, 0, 0, 0.3)'
      }
    };
    
    return colors[theme] || colors.dark;
  }

  /**
   * Obtenir les variables CSS du thème
   * @returns {Object} Variables CSS
   */
  getCSSVariables() {
    const colors = this.getThemeColors();
    
    return {
      '--color-primary': colors.primary,
      '--color-secondary': colors.secondary,
      '--color-success': colors.success,
      '--color-warning': colors.warning,
      '--color-error': colors.error,
      '--color-background': colors.background,
      '--color-surface': colors.surface,
      '--color-text': colors.text,
      '--color-text-secondary': colors.textSecondary,
      '--color-border': colors.border,
      '--color-shadow': colors.shadow
    };
  }

  /**
   * Appliquer les variables CSS
   * @private
   */
  applyCSSVariables() {
    const root = document.documentElement;
    const variables = this.getCSSVariables();
    
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  /**
   * Initialiser le service
   */
  initialize() {
    this.applyTheme();
    this.applyCSSVariables();
    
    // Écouter les changements de préférence système
    if (this.currentTheme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        this.applyTheme();
        this.applyCSSVariables();
        this.emit('themeChanged', this.getEffectiveTheme());
      });
    }
  }

  /**
   * Réinitialiser le service
   */
  reset() {
    this.currentTheme = 'dark';
    this.listeners.clear();
    this.saveToStorage();
    this.applyTheme();
    this.applyCSSVariables();
  }
}

// Instance singleton
const themeService = new ThemeService();
export default themeService;
