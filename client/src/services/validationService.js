/**
 * Service de validation pour Eternal Ascent
 * Gère la validation des données et des formulaires
 */
class ValidationService {
  constructor() {
    this.rules = new Map();
    this.messages = new Map();
    this.listeners = new Map();
    this.initDefaultRules();
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
   * Initialiser les règles par défaut
   * @private
   */
  initDefaultRules() {
    // Règle requise
    this.addRule('required', (value) => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value !== null && value !== undefined;
    }, 'Ce champ est requis');

    // Règle email
    this.addRule('email', (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }, 'Format d\'email invalide');

    // Règle minLength
    this.addRule('minLength', (value, min) => {
      return value.length >= min;
    }, (min) => `Minimum ${min} caractères`);

    // Règle maxLength
    this.addRule('maxLength', (value, max) => {
      return value.length <= max;
    }, (max) => `Maximum ${max} caractères`);

    // Règle min
    this.addRule('min', (value, min) => {
      return Number(value) >= min;
    }, (min) => `Minimum ${min}`);

    // Règle max
    this.addRule('max', (value, max) => {
      return Number(value) <= max;
    }, (max) => `Maximum ${max}`);

    // Règle pattern
    this.addRule('pattern', (value, pattern) => {
      const regex = new RegExp(pattern);
      return regex.test(value);
    }, 'Format invalide');

    // Règle custom
    this.addRule('custom', (value, validator) => {
      return validator(value);
    }, 'Validation échouée');
  }

  /**
   * Ajouter une règle de validation
   * @param {string} name - Nom de la règle
   * @param {Function} validator - Fonction de validation
   * @param {string|Function} message - Message d'erreur
   */
  addRule(name, validator, message) {
    this.rules.set(name, validator);
    this.messages.set(name, message);
    this.emit('ruleAdded', { name, validator, message });
  }

  /**
   * Supprimer une règle de validation
   * @param {string} name - Nom de la règle
   */
  removeRule(name) {
    this.rules.delete(name);
    this.messages.delete(name);
    this.emit('ruleRemoved', { name });
  }

  /**
   * Valider une valeur avec une règle
   * @param {*} value - Valeur à valider
   * @param {string} ruleName - Nom de la règle
   * @param {*} params - Paramètres de la règle
   * @returns {Object} Résultat de validation
   */
  validateRule(value, ruleName, params = null) {
    const validator = this.rules.get(ruleName);
    if (!validator) {
      return {
        valid: false,
        error: `Règle de validation non trouvée: ${ruleName}`
      };
    }

    try {
      const valid = validator(value, params);
      const message = this.messages.get(ruleName);
      
      return {
        valid,
        error: valid ? null : (typeof message === 'function' ? message(params) : message)
      };
    } catch (error) {
      return {
        valid: false,
        error: `Erreur de validation: ${error.message}`
      };
    }
  }

  /**
   * Valider une valeur avec plusieurs règles
   * @param {*} value - Valeur à valider
   * @param {Array} rules - Liste des règles
   * @returns {Object} Résultat de validation
   */
  validate(value, rules) {
    const errors = [];
    
    for (const rule of rules) {
      const { name, params, message } = rule;
      const result = this.validateRule(value, name, params);
      
      if (!result.valid) {
        errors.push({
          rule: name,
          message: message || result.error,
          params
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valider un objet avec des règles
   * @param {Object} data - Objet à valider
   * @param {Object} schema - Schéma de validation
   * @returns {Object} Résultat de validation
   */
  validateObject(data, schema) {
    const errors = {};
    let isValid = true;
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const result = this.validate(value, rules);
      
      if (!result.valid) {
        errors[field] = result.errors;
        isValid = false;
      }
    }
    
    return {
      valid: isValid,
      errors
    };
  }

  /**
   * Valider un formulaire
   * @param {Object} formData - Données du formulaire
   * @param {Object} formSchema - Schéma du formulaire
   * @returns {Object} Résultat de validation
   */
  validateForm(formData, formSchema) {
    const result = this.validateObject(formData, formSchema);
    
    this.emit('formValidated', {
      formData,
      formSchema,
      result
    });
    
    return result;
  }

  /**
   * Valider un email
   * @param {string} email - Email à valider
   * @returns {Object} Résultat de validation
   */
  validateEmail(email) {
    return this.validateRule(email, 'email');
  }

  /**
   * Valider un mot de passe
   * @param {string} password - Mot de passe à valider
   * @param {Object} options - Options de validation
   * @returns {Object} Résultat de validation
   */
  validatePassword(password, options = {}) {
    const rules = [
      { name: 'required' },
      { name: 'minLength', params: options.minLength || 8 },
      { name: 'maxLength', params: options.maxLength || 128 }
    ];
    
    if (options.requireUppercase) {
      rules.push({ name: 'pattern', params: '[A-Z]', message: 'Doit contenir au moins une majuscule' });
    }
    
    if (options.requireLowercase) {
      rules.push({ name: 'pattern', params: '[a-z]', message: 'Doit contenir au moins une minuscule' });
    }
    
    if (options.requireNumbers) {
      rules.push({ name: 'pattern', params: '[0-9]', message: 'Doit contenir au moins un chiffre' });
    }
    
    if (options.requireSpecialChars) {
      rules.push({ name: 'pattern', params: '[!@#$%^&*(),.?":{}|<>]', message: 'Doit contenir au moins un caractère spécial' });
    }
    
    return this.validate(password, rules);
  }

  /**
   * Valider un nom d'utilisateur
   * @param {string} username - Nom d'utilisateur à valider
   * @param {Object} options - Options de validation
   * @returns {Object} Résultat de validation
   */
  validateUsername(username, options = {}) {
    const rules = [
      { name: 'required' },
      { name: 'minLength', params: options.minLength || 3 },
      { name: 'maxLength', params: options.maxLength || 20 },
      { name: 'pattern', params: '^[a-zA-Z0-9_-]+$', message: 'Ne peut contenir que des lettres, chiffres, _ et -' }
    ];
    
    return this.validate(username, rules);
  }

  /**
   * Valider un nombre
   * @param {*} value - Valeur à valider
   * @param {Object} options - Options de validation
   * @returns {Object} Résultat de validation
   */
  validateNumber(value, options = {}) {
    const rules = [
      { name: 'required' },
      { name: 'pattern', params: '^-?\\d+(\\.\\d+)?$', message: 'Doit être un nombre valide' }
    ];
    
    if (options.min !== undefined) {
      rules.push({ name: 'min', params: options.min });
    }
    
    if (options.max !== undefined) {
      rules.push({ name: 'max', params: options.max });
    }
    
    return this.validate(value, rules);
  }

  /**
   * Valider une URL
   * @param {string} url - URL à valider
   * @returns {Object} Résultat de validation
   */
  validateURL(url) {
    const rules = [
      { name: 'required' },
      { name: 'pattern', params: '^https?://.+', message: 'Doit être une URL valide' }
    ];
    
    return this.validate(url, rules);
  }

  /**
   * Valider une date
   * @param {string|Date} date - Date à valider
   * @param {Object} options - Options de validation
   * @returns {Object} Résultat de validation
   */
  validateDate(date, options = {}) {
    const rules = [
      { name: 'required' }
    ];
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return {
        valid: false,
        errors: [{ rule: 'date', message: 'Date invalide' }]
      };
    }
    
    if (options.minDate) {
      const minDate = new Date(options.minDate);
      if (dateObj < minDate) {
        return {
          valid: false,
          errors: [{ rule: 'minDate', message: `Date minimum: ${minDate.toLocaleDateString()}` }]
        };
      }
    }
    
    if (options.maxDate) {
      const maxDate = new Date(options.maxDate);
      if (dateObj > maxDate) {
        return {
          valid: false,
          errors: [{ rule: 'maxDate', message: `Date maximum: ${maxDate.toLocaleDateString()}` }]
        };
      }
    }
    
    return { valid: true, errors: [] };
  }

  /**
   * Obtenir les règles disponibles
   * @returns {Array} Liste des règles
   */
  getAvailableRules() {
    return Array.from(this.rules.keys());
  }

  /**
   * Obtenir le message d'une règle
   * @param {string} ruleName - Nom de la règle
   * @returns {string|Function} Message de la règle
   */
  getRuleMessage(ruleName) {
    return this.messages.get(ruleName);
  }

  /**
   * Définir le message d'une règle
   * @param {string} ruleName - Nom de la règle
   * @param {string|Function} message - Nouveau message
   */
  setRuleMessage(ruleName, message) {
    this.messages.set(ruleName, message);
    this.emit('ruleMessageChanged', { ruleName, message });
  }

  /**
   * Réinitialiser le service
   */
  reset() {
    this.rules.clear();
    this.messages.clear();
    this.listeners.clear();
    this.initDefaultRules();
  }
}

// Instance singleton
const validationService = new ValidationService();
export default validationService;
