/**
 * Service de base de données pour le client
 * Gère toutes les interactions avec l'API backend
 */
class DatabaseService {
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
  async login(username, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
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

  async deleteCharacter(characterId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du personnage:', error);
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

  // Alias compat pour anciens composants (Inventory.jsx)
  async getCharacterInventory(characterId) {
    try {
      // Utiliser l'endpoint optimisé qui retourne l'inventaire intégré au personnage
      const res = await this.getCurrentCharacterData();
      return (res && res.character && Array.isArray(res.character.inventory)) ? res.character.inventory : [];
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inventaire (compat):', error);
      throw error;
    }
  }

  async updateInventory(characterId, inventoryData) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/inventory`, {
        method: 'PUT',
        body: JSON.stringify(inventoryData)
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'inventaire:', error);
      throw error;
    }
  }

  async equipItem(characterId, itemId, slot) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/equip`, {
        method: 'PUT',
        body: JSON.stringify({ item_id: itemId, slot })
      });
    } catch (error) {
      console.error('Erreur lors de l\'équipement:', error);
      throw error;
    }
  }

  async unequipItem(characterId, itemId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/unequip`, {
        method: 'PUT',
        body: JSON.stringify({ item_id: itemId })
      });
    } catch (error) {
      console.error('Erreur lors du déséquipement:', error);
      throw error;
    }
  }

  // ===== DONJONS =====
  async getDungeons() {
    try {
      return await this.authenticatedRequest('/dungeons');
    } catch (error) {
      console.error('Erreur lors du chargement des donjons:', error);
      throw error;
    }
  }

  async getAvailableDungeons() {
    try {
      const res = await this.authenticatedRequest('/static/dungeons');
      return Array.isArray(res?.dungeons) ? res.dungeons : (Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Erreur lors du chargement des donjons (static):', error);
      throw error;
    }
  }

  async getDifficulties() {
    try {
      const res = await this.authenticatedRequest('/static/difficulties');
      return Array.isArray(res?.difficulties) ? res.difficulties : (Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Erreur lors du chargement des difficultés:', error);
      throw error;
    }
  }

  async getDungeon(dungeonId) {
    try {
      return await this.authenticatedRequest(`/dungeons/${dungeonId}`);
    } catch (error) {
      console.error('Erreur lors du chargement du donjon:', error);
      throw error;
    }
  }

  async startDungeon(characterId, dungeonId, difficulty = 'normal') {
    try {
      return await this.authenticatedRequest('/dungeons/start', {
        method: 'POST',
        body: JSON.stringify({ characterId, dungeonId, difficulty })
      });
    } catch (error) {
      console.error('Erreur lors du démarrage du donjon:', error);
      throw error;
    }
  }

  async completeDungeon(characterId, dungeonId, results) {
    try {
      return await this.authenticatedRequest('/dungeons/complete', {
        method: 'POST',
        body: JSON.stringify({ characterId, dungeonId, results })
      });
    } catch (error) {
      console.error('Erreur lors de la completion du donjon:', error);
      throw error;
    }
  }

  // ===== QUÊTES =====
  async getQuests(characterId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/quests`);
    } catch (error) {
      console.error('Erreur lors du chargement des quêtes:', error);
      throw error;
    }
  }

  async getQuest(questId) {
    try {
      return await this.authenticatedRequest(`/quests/${questId}`);
    } catch (error) {
      console.error('Erreur lors du chargement de la quête:', error);
      throw error;
    }
  }

  async acceptQuest(characterId, questId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/quests/accept`, {
        method: 'POST',
        body: JSON.stringify({ questId })
      });
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la quête:', error);
      throw error;
    }
  }

  async completeQuest(characterId, questId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/quests/complete`, {
        method: 'POST',
        body: JSON.stringify({ questId })
      });
    } catch (error) {
      console.error('Erreur lors de la completion de la quête:', error);
      throw error;
    }
  }

  // ===== NOUVELLES APIs COMPAT /static =====
  async getCurrentCharacterData() {
    try {
      return await this.authenticatedRequest('/static/character');
    } catch (error) {
      console.error('Erreur lors du chargement du personnage (static):', error);
      throw error;
    }
  }

  async getAvailableQuests(limit) {
    try {
      const res = await this.authenticatedRequest('/static/quests');
      return Array.isArray(res) ? res : (res && res.quests) ? res.quests : [];
    } catch (error) {
      console.error('Erreur lors du chargement des quêtes (static):', error);
      throw error;
    }
  }

  async updateQuestProgress(payload) {
    try {
      // Journaliser l'événement comme activité côté serveur pour garder une trace
      await this.authenticatedRequest('/activity/log', {
        method: 'POST',
        body: JSON.stringify({
          type: `quest_${payload?.status || 'update'}`,
          description: `Quest ${payload?.quest_id} ${payload?.status || 'update'}`,
          metadata: payload || {}
        })
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de progression de quête:', error);
      throw error;
    }
  }

  // ===== GUILDES =====
  async getGuilds({ search, limit, offset } = {}) {
    try {
      const params = new URLSearchParams();
      if (search && String(search).trim().length) params.set('search', String(search).trim());
      if (limit) params.set('limit', String(limit));
      if (offset) params.set('offset', String(offset));
      const qs = params.toString();
      return await this.authenticatedRequest(`/guilds${qs ? `?${qs}` : ''}`);
    } catch (error) {
      console.error('Erreur lors du chargement des guildes:', error);
      throw error;
    }
  }

  async generateDynamicGuilds(count = 3) {
    try {
      return await this.authenticatedRequest('/guilds/generate-dynamic', {
        method: 'POST',
        body: JSON.stringify({ count })
      });
    } catch (error) {
      console.error('Erreur lors de la génération de guildes dynamiques:', error);
      throw error;
    }
  }

  async getGuild(guildId) {
    try {
      return await this.authenticatedRequest(`/guilds/${guildId}`);
    } catch (error) {
      console.error('Erreur lors du chargement de la guilde:', error);
      throw error;
    }
  }

  async createGuild(guildData) {
    try {
      return await this.authenticatedRequest('/guilds', {
        method: 'POST',
        body: JSON.stringify(guildData)
      });
    } catch (error) {
      console.error('Erreur lors de la création de la guilde:', error);
      throw error;
    }
  }

  async joinGuild(guildId, characterId) {
    try {
      return await this.authenticatedRequest(`/guilds/${guildId}/join`, { method: 'POST', body: JSON.stringify({ characterId }) });
    } catch (error) {
      console.error('Erreur lors de l\'adhésion à la guilde:', error);
      throw error;
    }
  }

  async leaveGuild(guildId, characterId) {
    try {
      return await this.authenticatedRequest(`/guilds/${guildId}/leave`, { method: 'POST', body: JSON.stringify({ characterId }) });
    } catch (error) {
      console.error('Erreur lors de la sortie de la guilde:', error);
      throw error;
    }
  }

  async getCharacterGuild(characterId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/guild`);
    } catch (error) {
      console.error('Erreur lors du chargement de la guilde du personnage:', error);
      throw error;
    }
  }

  async getGuildRaids(guildId) {
    try {
      return await this.authenticatedRequest(`/guilds/${guildId}/raids`);
    } catch (error) {
      console.error('Erreur lors du chargement des raids de guilde:', error);
      throw error;
    }
  }

  async startGuildRaid(guildId, raidData) {
    try {
      return await this.authenticatedRequest(`/guilds/${guildId}/raids`, { method: 'POST', body: JSON.stringify(raidData) });
    } catch (error) {
      console.error('Erreur lors du démarrage du raid de guilde:', error);
      throw error;
    }
  }

  async joinGuildRaid(raidId, characterId) {
    try {
      return await this.authenticatedRequest(`/raids/${raidId}/join`, { method: 'POST', body: JSON.stringify({ characterId }) });
    } catch (error) {
      console.error('Erreur lors de l\'adhésion au raid de guilde:', error);
      throw error;
    }
  }

  async getGuildProjects(guildId) {
    try {
      return await this.authenticatedRequest(`/guilds/${guildId}/projects`);
    } catch (error) {
      console.error('Erreur lors du chargement des projets de guilde:', error);
      throw error;
    }
  }

  async startGuildProject(guildId, projectData) {
    try {
      return await this.authenticatedRequest(`/guilds/${guildId}/projects`, { method: 'POST', body: JSON.stringify(projectData) });
    } catch (error) {
      console.error('Erreur lors du démarrage du projet de guilde:', error);
      throw error;
    }
  }

  async contributeToGuildProject(projectId, contribution, characterId) {
    try {
      return await this.authenticatedRequest(`/projects/${projectId}/contribute`, { method: 'POST', body: JSON.stringify({ amount: contribution, characterId }) });
    } catch (error) {
      console.error('Erreur lors de la contribution au projet de guilde:', error);
      throw error;
    }
  }

  async getGuildEvents(guildId) {
    try {
      return await this.authenticatedRequest(`/guilds/${guildId}/events`);
    } catch (error) {
      console.error('Erreur lors du chargement des événements de guilde:', error);
      throw error;
    }
  }

  async createGuildEvent(guildId, eventData) {
    try {
      return await this.authenticatedRequest(`/guilds/${guildId}/events`, { method: 'POST', body: JSON.stringify(eventData) });
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement de guilde:', error);
      throw error;
    }
  }

  // ===== COMPÉTENCES ET TALENTS =====
  async getSkills(characterId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/skills`);
    } catch (error) {
      console.error('Erreur lors du chargement des compétences:', error);
      throw error;
    }
  }

  async getTalents(characterId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/talents`);
    } catch (error) {
      console.error('Erreur lors du chargement des talents:', error);
      throw error;
    }
  }

  async upgradeSkill(characterId, skillId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/skills/upgrade`, {
        method: 'POST',
        body: JSON.stringify({ skillId })
      });
    } catch (error) {
      console.error('Erreur lors de l\'amélioration de la compétence:', error);
      throw error;
    }
  }

  async upgradeTalent(characterId, talentId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/talents/upgrade`, {
        method: 'POST',
        body: JSON.stringify({ talentId })
      });
    } catch (error) {
      console.error('Erreur lors de l\'amélioration du talent:', error);
      throw error;
    }
  }

  // ===== COMBAT =====
  async startCombat(characterId, enemyId) {
    try {
      return await this.authenticatedRequest('/combat/start', {
        method: 'POST',
        body: JSON.stringify({ characterId, enemyId })
      });
    } catch (error) {
      console.error('Erreur lors du démarrage du combat:', error);
      throw error;
    }
  }

  async performAction(combatId, action) {
    try {
      return await this.authenticatedRequest(`/combat/${combatId}/action`, {
        method: 'POST',
        body: JSON.stringify(action)
      });
    } catch (error) {
      console.error('Erreur lors de l\'action de combat:', error);
      throw error;
    }
  }

  // ===== STATISTIQUES =====
  async getCharacterStats(characterId) {
    try {
      return await this.authenticatedRequest(`/characters/${characterId}/stats`);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      throw error;
    }
  }

  // ===== DONNÉES POUR GAMEPAGE =====
  async getEnemies(params = {}) {
    try {
      const qs = new URLSearchParams();
      if (params.type) qs.set('type', String(params.type));
      if (params.level_min) qs.set('level_min', String(params.level_min));
      if (params.level_max) qs.set('level_max', String(params.level_max));
      if (params.rarity) qs.set('rarity', String(params.rarity));
      const res = await this.authenticatedRequest(`/static/enemies${qs.toString() ? `?${qs.toString()}` : ''}`);
      return Array.isArray(res?.enemies) ? res.enemies : (Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Erreur lors du chargement des ennemis (static):', error);
      throw error;
    }
  }

  async getSkillsByClass(className) {
    try {
      const res = await this.authenticatedRequest('/static/skills');
      const all = Array.isArray(res?.skills) ? res.skills : (Array.isArray(res) ? res : []);
      if (!className) return all;
      const cls = String(className).toLowerCase();
      const filtered = all.filter(s => {
        const sc = (s.class || '').toLowerCase();
        const avail = Array.isArray(s.available_classes) ? s.available_classes.map(c => String(c).toLowerCase()) : [];
        return sc === cls || avail.includes(cls);
      });
      return filtered.sort((a, b) => (a.level_requirement || 0) - (b.level_requirement || 0));
    } catch (error) {
      console.error('Erreur lors du chargement des compétences par classe (static):', error);
      throw error;
    }
  }

  async getLeaderboard(type = 'level') {
    try {
      return await this.authenticatedRequest(`/leaderboard/${type}`);
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
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

  // ===== DONNÉES STATIQUES =====
  async getStaticData() {
    try {
      return await this.authenticatedRequest('/static');
    } catch (error) {
      console.error('Erreur lors du chargement des données statiques:', error);
      throw error;
    }
  }

  async getItemTypes() {
    try {
      return await this.authenticatedRequest('/static/item-types');
    } catch (error) {
      console.error('Erreur lors du chargement des types d\'objets:', error);
      throw error;
    }
  }

  async getCharacterClasses() {
    try {
      return await this.authenticatedRequest('/static/character-classes');
    } catch (error) {
      console.error('Erreur lors du chargement des classes de personnage:', error);
      throw error;
    }
  }

  async getRarities() {
    try {
      return await this.authenticatedRequest('/static/rarities');
    } catch (error) {
      console.error('Erreur lors du chargement des raretés:', error);
      throw error;
    }
  }
}

// Instance singleton
const databaseService = new DatabaseService();
export default databaseService;
