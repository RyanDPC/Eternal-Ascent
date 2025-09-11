/**
 * Service API optimisé pour Eternal Ascent
 * Gère toutes les interactions avec l'API backend
 */
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.token = localStorage.getItem('authToken');
  }

  // Helper pour les requêtes authentifiées
  async authenticatedRequest(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ===== AUTHENTIFICATION =====
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        this.setToken(data.token);
        return data;
      } else {
        throw new Error(data.error || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (response.ok) {
        this.setToken(data.token);
        return data;
      } else {
        throw new Error(data.error || 'Erreur d\'inscription');
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.authenticatedRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    } finally {
      this.clearToken();
    }
  }

  // ===== PAGES CONSOLIDÉES =====
  async getDashboardData() {
    try {
      return await this.authenticatedRequest('/static/dashboard');
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      throw error;
    }
  }

  async getCharacterPageData() {
    try {
      return await this.authenticatedRequest('/static/character');
    } catch (error) {
      console.error('Erreur lors du chargement de la page personnage:', error);
      throw error;
    }
  }

  async getDungeonsPageData() {
    try {
      return await this.authenticatedRequest('/static/dungeons');
    } catch (error) {
      console.error('Erreur lors du chargement de la page donjons:', error);
      throw error;
    }
  }

  async getQuestsPageData() {
    try {
      return await this.authenticatedRequest('/static/quests');
    } catch (error) {
      console.error('Erreur lors du chargement de la page quêtes:', error);
      throw error;
    }
  }

  async getInventoryPageData() {
    try {
      return await this.authenticatedRequest('/static/inventory');
    } catch (error) {
      console.error('Erreur lors du chargement de la page inventaire:', error);
      throw error;
    }
  }

  // ===== PERSONNAGES =====
  async getCharacters() {
    try {
      return await this.authenticatedRequest('/characters');
    } catch (error) {
      console.error('Erreur lors du chargement des personnages:', error);
      throw error;
    }
  }

  async getCharacter(characterId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}`);
    } catch (error) {
      console.error('Erreur lors du chargement du personnage:', error);
      throw error;
    }
  }

  async createCharacter(characterData) {
    try {
      return await this.authenticatedRequest('/characters', {
        method: 'POST',
        body: JSON.stringify(characterData)
      });
    } catch (error) {
      console.error('Erreur lors de la création du personnage:', error);
      throw error;
    }
  }

  async updateCharacter(characterId, characterData) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}`, {
        method: 'PUT',
        body: JSON.stringify(characterData)
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du personnage:', error);
      throw error;
    }
  }

  // ===== INVENTAIRE =====
  async getInventory(characterId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/inventory`);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inventaire:', error);
      throw error;
    }
  }

  async equipItem(characterId, itemId, slot) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/equip`, {
        method: 'POST',
        body: JSON.stringify({ itemId, slot })
      });
    } catch (error) {
      console.error('Erreur lors de l\'équipement:', error);
      throw error;
    }
  }

  async unequipItem(characterId, slot) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/unequip`, {
        method: 'POST',
        body: JSON.stringify({ slot })
      });
    } catch (error) {
      console.error('Erreur lors du déséquipement:', error);
      throw error;
    }
  }

  // ===== UTILITAIRES =====
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  isAuthenticated() {
    return !!this.token;
  }
}

// Instance singleton
const apiService = new ApiService();
export default apiService;
