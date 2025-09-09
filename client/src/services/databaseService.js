// Service de base de données pour Eternal Ascent
class DatabaseService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.isConnected = false;
  }

  // Vérifier la connexion à la base de données
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      const data = await response.json();
      this.isConnected = data.status === 'ok';
      return this.isConnected;
    } catch (error) {
      console.error('Erreur de connexion à la base de données:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Authentification des utilisateurs
  async authenticateUser(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Échec de l\'authentification');
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      throw error;
    }
  }

  // Créer un nouveau compte utilisateur
  async createUser(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Échec de la création du compte');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur de création de compte:', error);
      throw error;
    }
  }

  // Récupérer les données du personnage
  async getCharacterData(characterId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/characters/${characterId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Échec de récupération des données du personnage');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur de récupération du personnage:', error);
      throw error;
    }
  }

  // Sauvegarder les données du personnage
  async saveCharacterData(characterData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/characters/${characterData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(characterData),
      });

      if (!response.ok) {
        throw new Error('Échec de la sauvegarde du personnage');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur de sauvegarde du personnage:', error);
      throw error;
    }
  }

  // Récupérer l'inventaire du personnage
  async getCharacterInventory(characterId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/characters/${characterId}/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Échec de récupération de l\'inventaire');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur de récupération de l\'inventaire:', error);
      throw error;
    }
  }

  // Récupérer les informations utilisateur
  async getUserProfile() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Échec de récupération du profil utilisateur');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur de récupération du profil utilisateur:', error);
      throw error;
    }
  }

  // Sauvegarder l'inventaire du personnage
  async saveCharacterInventory(characterId, inventoryData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/characters/${characterId}/inventory`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(inventoryData),
      });

      if (!response.ok) {
        throw new Error('Échec de la sauvegarde de l\'inventaire');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur de sauvegarde de l\'inventaire:', error);
      throw error;
    }
  }

  // Équiper un objet
  async equipItem(characterId, itemId, slot) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/characters/${characterId}/equip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId, slot }),
      });

      if (!response.ok) {
        throw new Error('Échec de l\'équipement de l\'objet');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur d\'équipement de l\'objet:', error);
      throw error;
    }
  }

  // Déséquiper un objet
  async unequipItem(characterId, slot) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/characters/${characterId}/unequip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ slot }),
      });

      if (!response.ok) {
        throw new Error('Échec du déséquipement de l\'objet');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur de déséquipement de l\'objet:', error);
      throw error;
    }
  }

  // Récupérer les donjons disponibles
  async getAvailableDungeons() {
    try {
      const response = await fetch(`${this.baseURL}/dungeons`);

      if (!response.ok) {
        throw new Error('Échec de récupération des donjons');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur de récupération des donjons:', error);
      throw error;
    }
  }

  // Récupérer toutes les difficultés
  async getDifficulties() {
    try {
      const response = await fetch(`${this.baseURL}/difficulties`);

      if (!response.ok) {
        throw new Error('Échec de récupération des difficultés');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur de récupération des difficultés:', error);
      throw error;
    }
  }

  // Récupérer les stats calculées d'un personnage avec équipement
  async getCharacterStats(characterId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/characters/${characterId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Échec de récupération des stats du personnage');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur de récupération des stats du personnage:', error);
      throw error;
    }
  }

  // Sauvegarder une session de combat
  async saveCombatSession(combatData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/combat-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(combatData),
      });

      if (!response.ok) {
        throw new Error('Échec de la sauvegarde de la session de combat');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur de sauvegarde de la session de combat:', error);
      throw error;
    }
  }

  // Récupérer l'historique des combats
  async getCombatHistory(characterId, limit = 10) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/characters/${characterId}/combat-history?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Échec de récupération de l\'historique des combats');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur de récupération de l\'historique des combats:', error);
      throw error;
    }
  }

  // Récupérer les quêtes disponibles pour un personnage
  async getAvailableQuests(characterId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/systems/quests/available/character/${characterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Échec de récupération des quêtes');
      }

      const data = await response.json();
      // Normaliser en tableau plat pour le composant (daily + weekly)
      const daily = Array.isArray(data.data?.daily) ? data.data.daily : [];
      const weekly = Array.isArray(data.data?.weekly) ? data.data.weekly : [];
      return [...daily, ...weekly].map((q) => ({
        id: q.id,
        title: q.name,
        description: q.description,
        type: q.requirements?.type || q.type,
        rarity: 'common',
        min_level: q.level || 1,
        exp_reward: q.rewards?.experience || 0,
        gold_reward: q.rewards?.gold || 0,
        item_rewards: (q.rewards?.items || []).map(it => `${it.itemId} x${it.quantity}`),
        available: true
      }));
    } catch (error) {
      console.error('Erreur de récupération des quêtes:', error);
      throw error;
    }
  }

  // Démarrer une quête
  async startQuest(characterId, questId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/systems/quests/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ characterId, questId })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Échec du démarrage de la quête');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur démarrage quête:', error);
      throw error;
    }
  }

  // Sauvegarder automatiquement (appelé périodiquement)
  async autoSave(characterData) {
    try {
      await this.saveCharacterData(characterData);
      console.log('Sauvegarde automatique réussie');
      return true;
    } catch (error) {
      console.error('Échec de la sauvegarde automatique:', error);
      return false;
    }
  }

  // Déconnexion
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    this.isConnected = false;
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  // Récupérer les données utilisateur stockées
  getStoredUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  // =====================================================
  // MÉTHODES POUR LES DONJONS
  // =====================================================

  // Récupérer tous les donjons disponibles
  async getDungeons() {
    try {
      const response = await fetch(`${this.baseURL}/dungeons`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des donjons');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des donjons:', error);
      throw error;
    }
  }

  // Récupérer un donjon spécifique avec ses ennemis
  async getDungeonById(dungeonId) {
    try {
      const response = await fetch(`${this.baseURL}/dungeons/${dungeonId}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du donjon');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération du donjon:', error);
      throw error;
    }
  }

  // Terminer un donjon et récupérer les récompenses
  async completeDungeon(dungeonId) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/dungeons/${dungeonId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la completion du donjon');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la completion du donjon:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTHODES POUR LES GUILDES
  // =====================================================

  // Récupérer toutes les guildes
  async getGuilds() {
    try {
      console.log('🔍 Tentative de récupération des guildes depuis:', `${this.baseURL}/guilds`);
      const response = await fetch(`${this.baseURL}/guilds`);
      console.log('📡 Réponse reçue:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Données des guildes reçues:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des guildes:', error);
      throw error;
    }
  }

  // Générer des guildes dynamiques
  async generateDynamicGuilds(count = 3) {
    try {
      console.log('🎲 Génération de guildes dynamiques:', count);
      const response = await fetch(`${this.baseURL}/guilds/generate-dynamic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Guildes dynamiques générées:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la génération de guildes dynamiques:', error);
      throw error;
    }
  }

  // Récupérer une guilde spécifique
  async getGuild(guildId) {
    try {
      const response = await fetch(`${this.baseURL}/guilds/${guildId}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la guilde');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération de la guilde:', error);
      throw error;
    }
  }

  // Créer une nouvelle guilde
  async createGuild(guildData) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/guilds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(guildData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la guilde');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la création de la guilde:', error);
      throw error;
    }
  }

  // Rejoindre une guilde
  async joinGuild(guildId) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/guilds/${guildId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'adhésion à la guilde');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'adhésion à la guilde:', error);
      throw error;
    }
  }

  // Quitter une guilde
  async leaveGuild(guildId) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/guilds/${guildId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sortie de la guilde');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la sortie de la guilde:', error);
      throw error;
    }
  }

  // Récupérer les raids de guilde
  async getGuildRaids(guildId) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/guilds/${guildId}/raids`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des raids');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des raids:', error);
      throw error;
    }
  }

  // Démarrer un raid de guilde
  async startGuildRaid(guildId, raidData) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/guilds/${guildId}/raids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(raidData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors du démarrage du raid');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors du démarrage du raid:', error);
      throw error;
    }
  }

  // Rejoindre un raid de guilde
  async joinGuildRaid(raidId) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/guild-raids/${raidId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'adhésion au raid');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'adhésion au raid:', error);
      throw error;
    }
  }

  // Récupérer les projets de guilde
  async getGuildProjects(guildId) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/guilds/${guildId}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des projets');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des projets:', error);
      throw error;
    }
  }

  // Démarrer un projet de guilde
  async startGuildProject(guildId, projectData) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/guilds/${guildId}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors du démarrage du projet');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors du démarrage du projet:', error);
      throw error;
    }
  }

  // Contribuer à un projet de guilde
  async contributeToGuildProject(projectId, contribution) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/guild-projects/${projectId}/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contribution })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la contribution au projet');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la contribution au projet:', error);
      throw error;
    }
  }

  // Récupérer les événements de guilde
  async getGuildEvents(guildId) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/guilds/${guildId}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des événements');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      throw error;
    }
  }

  // Créer un événement de guilde
  async createGuildEvent(guildId, eventData) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/guilds/${guildId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de l\'événement');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTHODES POUR LES TALENTS
  // =====================================================

  // Récupérer tous les arbres de talents
  async getTalentTrees() {
    try {
      const response = await fetch(`${this.baseURL}/talents/trees`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des arbres de talents');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des arbres de talents:', error);
      throw error;
    }
  }

  // Récupérer l'arbre de talents par classe
  async getTalentTreeByClass(className) {
    try {
      const response = await fetch(`${this.baseURL}/talents/trees/${className}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'arbre de talents');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'arbre de talents:', error);
      throw error;
    }
  }

  // Apprendre un talent
  async learnTalent(characterId, talentId) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/characters/${characterId}/talents/${talentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'apprentissage du talent');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'apprentissage du talent:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTHODES POUR LES ENNEMIS
  // =====================================================

  // Récupérer tous les ennemis
  async getEnemies() {
    try {
      const response = await fetch(`${this.baseURL}/enemies`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des ennemis');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des ennemis:', error);
      throw error;
    }
  }

  // Récupérer les ennemis par niveau
  async getEnemiesByLevel(level) {
    try {
      const response = await fetch(`${this.baseURL}/enemies/level/${level}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des ennemis par niveau');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des ennemis par niveau:', error);
      throw error;
    }
  }

  // Récupérer un ennemi aléatoire par niveau
  async getRandomEnemyByLevel(level) {
    try {
      const response = await fetch(`${this.baseURL}/enemies/random/level/${level}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération d\'un ennemi aléatoire');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération d\'un ennemi aléatoire:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTHODES POUR LES COMPÉTENCES
  // =====================================================

  // Récupérer toutes les compétences
  async getSkills() {
    try {
      const response = await fetch(`${this.baseURL}/skills`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des compétences');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des compétences:', error);
      throw error;
    }
  }

  // Récupérer les compétences par classe
  async getSkillsByClass(className) {
    try {
      const response = await fetch(`${this.baseURL}/skills/class/${className}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des compétences');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des compétences:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTHODES POUR L'ÉQUIPEMENT
  // =====================================================

  // Récupérer tous les sets d'équipement
  async getEquipmentSets() {
    try {
      const response = await fetch(`${this.baseURL}/equipment/sets`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des sets d\'équipement');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des sets d\'équipement:', error);
      throw error;
    }
  }

  // Améliorer un équipement
  async upgradeEquipment(characterId, itemId, materials) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/characters/${characterId}/equipment/${itemId}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ materials })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'amélioration de l\'équipement');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'amélioration de l\'équipement:', error);
      throw error;
    }
  }

  // Enchanter un équipement
  async enchantEquipment(characterId, itemId, enchantmentName) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${this.baseURL}/characters/${characterId}/equipment/${itemId}/enchant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enchantmentName })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enchantement de l\'équipement');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'enchantement de l\'équipement:', error);
      throw error;
    }
  }
}

// Créer une instance singleton
const databaseService = new DatabaseService();

export default databaseService;
