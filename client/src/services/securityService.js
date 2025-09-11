/**
 * Service de sécurité pour Eternal Ascent
 * Gère la sécurité, l'authentification et la protection des données
 */
import configService from './configService';
import storageService from './storageService';

class SecurityService {
  constructor() {
    this.sessionTimeout = configService.get('security.sessionTimeout', 3600000); // 1 heure
    this.maxLoginAttempts = configService.get('security.maxLoginAttempts', 5);
    this.lockoutDuration = configService.get('security.lockoutDuration', 900000); // 15 minutes
    this.encryptSensitiveData = configService.get('security.encryptSensitiveData', true);
    
    this.loginAttempts = new Map();
    this.lockedAccounts = new Map();
    this.listeners = new Map();
    
    this.loadSecurityData();
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
   * Charger les données de sécurité
   * @private
   */
  loadSecurityData() {
    try {
      const stored = storageService.load('security_data', null, 'local');
      if (stored) {
        this.loginAttempts = new Map(stored.loginAttempts || []);
        this.lockedAccounts = new Map(stored.lockedAccounts || []);
      }
    } catch (error) {
      console.warn('Impossible de charger les données de sécurité:', error);
    }
  }

  /**
   * Sauvegarder les données de sécurité
   * @private
   */
  saveSecurityData() {
    try {
      const data = {
        loginAttempts: Array.from(this.loginAttempts.entries()),
        lockedAccounts: Array.from(this.lockedAccounts.entries())
      };
      storageService.save('security_data', data, 'local');
    } catch (error) {
      console.warn('Impossible de sauvegarder les données de sécurité:', error);
    }
  }

  /**
   * Chiffrer des données sensibles
   * @param {string} data - Données à chiffrer
   * @returns {string} Données chiffrées
   * @private
   */
  _encrypt(data) {
    if (!this.encryptSensitiveData) return data;
    
    try {
      // Chiffrement simple (en production, utiliser une bibliothèque de chiffrement)
      return btoa(data);
    } catch (error) {
      console.error('Erreur de chiffrement:', error);
      return data;
    }
  }

  /**
   * Déchiffrer des données sensibles
   * @param {string} encryptedData - Données chiffrées
   * @returns {string} Données déchiffrées
   * @private
   */
  _decrypt(encryptedData) {
    if (!this.encryptSensitiveData) return encryptedData;
    
    try {
      return atob(encryptedData);
    } catch (error) {
      console.error('Erreur de déchiffrement:', error);
      return encryptedData;
    }
  }

  /**
   * Vérifier si un compte est verrouillé
   * @param {string} accountId - ID du compte
   * @returns {boolean} True si verrouillé
   */
  isAccountLocked(accountId) {
    const lockInfo = this.lockedAccounts.get(accountId);
    if (!lockInfo) return false;
    
    const now = Date.now();
    if (now - lockInfo.timestamp > this.lockoutDuration) {
      this.lockedAccounts.delete(accountId);
      this.saveSecurityData();
      return false;
    }
    
    return true;
  }

  /**
   * Verrouiller un compte
   * @param {string} accountId - ID du compte
   * @param {string} reason - Raison du verrouillage
   */
  lockAccount(accountId, reason = 'Trop de tentatives de connexion') {
    this.lockedAccounts.set(accountId, {
      timestamp: Date.now(),
      reason
    });
    this.saveSecurityData();
    this.emit('accountLocked', { accountId, reason });
  }

  /**
   * Déverrouiller un compte
   * @param {string} accountId - ID du compte
   */
  unlockAccount(accountId) {
    this.lockedAccounts.delete(accountId);
    this.loginAttempts.delete(accountId);
    this.saveSecurityData();
    this.emit('accountUnlocked', { accountId });
  }

  /**
   * Enregistrer une tentative de connexion
   * @param {string} accountId - ID du compte
   * @param {boolean} success - Succès de la tentative
   */
  recordLoginAttempt(accountId, success) {
    if (success) {
      this.loginAttempts.delete(accountId);
      this.lockedAccounts.delete(accountId);
    } else {
      const attempts = this.loginAttempts.get(accountId) || 0;
      const newAttempts = attempts + 1;
      
      this.loginAttempts.set(accountId, newAttempts);
      
      if (newAttempts >= this.maxLoginAttempts) {
        this.lockAccount(accountId);
      }
    }
    
    this.saveSecurityData();
    this.emit('loginAttemptRecorded', { accountId, success });
  }

  /**
   * Obtenir le nombre de tentatives de connexion
   * @param {string} accountId - ID du compte
   * @returns {number} Nombre de tentatives
   */
  getLoginAttempts(accountId) {
    return this.loginAttempts.get(accountId) || 0;
  }

  /**
   * Vérifier la force d'un mot de passe
   * @param {string} password - Mot de passe à vérifier
   * @returns {Object} Résultat de la vérification
   */
  checkPasswordStrength(password) {
    const score = {
      length: 0,
      uppercase: 0,
      lowercase: 0,
      numbers: 0,
      special: 0,
      common: 0
    };
    
    // Longueur
    if (password.length >= 8) score.length = 1;
    if (password.length >= 12) score.length = 2;
    if (password.length >= 16) score.length = 3;
    
    // Caractères
    if (/[A-Z]/.test(password)) score.uppercase = 1;
    if (/[a-z]/.test(password)) score.lowercase = 1;
    if (/[0-9]/.test(password)) score.numbers = 1;
    if (/[^A-Za-z0-9]/.test(password)) score.special = 1;
    
    // Mots de passe communs
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      score.common = -2;
    }
    
    const totalScore = Object.values(score).reduce((sum, val) => sum + val, 0);
    
    let strength = 'weak';
    if (totalScore >= 6) strength = 'strong';
    else if (totalScore >= 4) strength = 'medium';
    
    return {
      score: totalScore,
      strength,
      details: score
    };
  }

  /**
   * Générer un token de session
   * @param {string} userId - ID de l'utilisateur
   * @returns {string} Token de session
   */
  generateSessionToken(userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const token = `${userId}_${timestamp}_${random}`;
    
    return this._encrypt(token);
  }

  /**
   * Valider un token de session
   * @param {string} token - Token à valider
   * @returns {Object} Résultat de la validation
   */
  validateSessionToken(token) {
    try {
      const decryptedToken = this._decrypt(token);
      const parts = decryptedToken.split('_');
      
      if (parts.length !== 3) {
        return { valid: false, error: 'Format de token invalide' };
      }
      
      const [userId, timestamp, random] = parts;
      const tokenAge = Date.now() - parseInt(timestamp);
      
      if (tokenAge > this.sessionTimeout) {
        return { valid: false, error: 'Token expiré' };
      }
      
      return { valid: true, userId, timestamp: parseInt(timestamp) };
    } catch (error) {
      return { valid: false, error: 'Token invalide' };
    }
  }

  /**
   * Chiffrer des données sensibles
   * @param {string} data - Données à chiffrer
   * @returns {string} Données chiffrées
   */
  encryptSensitiveData(data) {
    return this._encrypt(data);
  }

  /**
   * Déchiffrer des données sensibles
   * @param {string} encryptedData - Données chiffrées
   * @returns {string} Données déchiffrées
   */
  decryptSensitiveData(encryptedData) {
    return this._decrypt(encryptedData);
  }

  /**
   * Vérifier la sécurité d'une URL
   * @param {string} url - URL à vérifier
   * @returns {boolean} True si sécurisée
   */
  isSecureURL(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  /**
   * Vérifier la sécurité d'une requête
   * @param {Object} request - Requête à vérifier
   * @returns {Object} Résultat de la vérification
   */
  validateRequest(request) {
    const issues = [];
    
    // Vérifier l'URL
    if (request.url && !this.isSecureURL(request.url)) {
      issues.push('URL non sécurisée');
    }
    
    // Vérifier les headers
    if (request.headers) {
      for (const [key, value] of Object.entries(request.headers)) {
        if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
          issues.push('Headers sensibles détectés');
          break;
        }
      }
    }
    
    // Vérifier le body
    if (request.body) {
      const bodyStr = JSON.stringify(request.body);
      if (bodyStr.includes('password') || bodyStr.includes('token')) {
        issues.push('Données sensibles dans le body');
      }
    }
    
    return {
      secure: issues.length === 0,
      issues
    };
  }

  /**
   * Obtenir les statistiques de sécurité
   * @returns {Object} Statistiques
   */
  getSecurityStats() {
    return {
      lockedAccounts: this.lockedAccounts.size,
      loginAttempts: this.loginAttempts.size,
      sessionTimeout: this.sessionTimeout,
      maxLoginAttempts: this.maxLoginAttempts,
      lockoutDuration: this.lockoutDuration
    };
  }

  /**
   * Nettoyer les données de sécurité
   */
  cleanup() {
    const now = Date.now();
    
    // Nettoyer les tentatives de connexion anciennes
    for (const [accountId, attempts] of this.loginAttempts.entries()) {
      if (now - attempts.timestamp > this.lockoutDuration) {
        this.loginAttempts.delete(accountId);
      }
    }
    
    // Nettoyer les comptes verrouillés expirés
    for (const [accountId, lockInfo] of this.lockedAccounts.entries()) {
      if (now - lockInfo.timestamp > this.lockoutDuration) {
        this.lockedAccounts.delete(accountId);
      }
    }
    
    this.saveSecurityData();
    this.emit('securityCleanup');
  }

  /**
   * Réinitialiser le service
   */
  reset() {
    this.loginAttempts.clear();
    this.lockedAccounts.clear();
    this.listeners.clear();
    this.saveSecurityData();
  }
}

// Instance singleton
const securityService = new SecurityService();
export default securityService;
