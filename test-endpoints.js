#!/usr/bin/env node

/**
 * Script de test complet pour tous les endpoints de l'API Eternal Ascent
 * Teste tous les endpoints locaux avec gestion d'erreurs et rapports détaillés
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class APITester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
    this.authToken = null;
    this.testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123'
    };
  }

  /**
   * Effectue une requête HTTP
   */
  async makeRequest(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (this.authToken) {
        options.headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const jsonBody = body ? JSON.parse(body) : {};
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: jsonBody
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: body
            });
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  /**
   * Teste un endpoint et enregistre le résultat
   */
  async testEndpoint(name, path, method = 'GET', data = null, expectedStatus = 200, authRequired = false) {
    this.results.total++;
    
    try {
      console.log(`🧪 Test: ${name}`);
      console.log(`   ${method} ${path}`);
      
      if (authRequired && !this.authToken) {
        console.log(`   ⚠️  Authentification requise mais token manquant`);
        this.results.failed++;
        this.results.errors.push(`${name}: Authentification requise`);
        return;
      }

      const response = await this.makeRequest(path, method, data);
      
      if (response.statusCode === expectedStatus) {
        console.log(`   ✅ Succès (${response.statusCode})`);
        this.results.passed++;
      } else {
        console.log(`   ❌ Échec - Status attendu: ${expectedStatus}, reçu: ${response.statusCode}`);
        console.log(`   📄 Réponse:`, JSON.stringify(response.body, null, 2));
        this.results.failed++;
        this.results.errors.push(`${name}: Status ${response.statusCode} au lieu de ${expectedStatus}`);
      }
    } catch (error) {
      console.log(`   💥 Erreur: ${error.message}`);
      this.results.failed++;
      this.results.errors.push(`${name}: ${error.message}`);
    }
    
    console.log('');
  }

  /**
   * Teste les endpoints de santé et monitoring
   */
  async testHealthEndpoints() {
    console.log('🏥 === TEST DES ENDPOINTS DE SANTÉ ===\n');
    
    await this.testEndpoint(
      'Health Check',
      '/api/health',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Métriques',
      '/api/metrics',
      'GET',
      null,
      200
    );
  }

  /**
   * Teste les endpoints d'authentification
   */
  async testAuthEndpoints() {
    console.log('🔐 === TEST DES ENDPOINTS D\'AUTHENTIFICATION ===\n');
    
    // Test d'inscription
    await this.testEndpoint(
      'Inscription utilisateur',
      '/api/auth/register',
      'POST',
      this.testUser,
      201
    );

    // Test de connexion
    const loginResponse = await this.makeRequest('/api/auth/login', 'POST', {
      username: this.testUser.username,
      password: this.testUser.password
    });

    if (loginResponse.statusCode === 200 && loginResponse.body.token) {
      this.authToken = loginResponse.body.token;
      console.log('✅ Token d\'authentification obtenu');
    } else {
      console.log('❌ Échec de l\'obtention du token d\'authentification');
    }

    console.log('');
  }

  /**
   * Teste les endpoints de personnages
   */
  async testCharacterEndpoints() {
    console.log('👤 === TEST DES ENDPOINTS DE PERSONNAGES ===\n');
    
    if (!this.authToken) {
      console.log('⚠️  Token d\'authentification manquant, passage des tests de personnages');
      return;
    }

    // Récupérer l'ID du personnage depuis la réponse de connexion
    const loginResponse = await this.makeRequest('/api/auth/login', 'POST', {
      username: this.testUser.username,
      password: this.testUser.password
    });

    let characterId = null;
    if (loginResponse.statusCode === 200 && loginResponse.body.character) {
      characterId = loginResponse.body.character.id;
    }

    if (!characterId) {
      console.log('⚠️  ID de personnage non trouvé');
      return;
    }

    await this.testEndpoint(
      'Récupérer personnage',
      `/api/characters/${characterId}`,
      'GET',
      null,
      200,
      true
    );

    await this.testEndpoint(
      'Stats du personnage',
      `/api/characters/${characterId}/stats`,
      'GET',
      null,
      200,
      true
    );

    await this.testEndpoint(
      'Inventaire du personnage',
      `/api/characters/${characterId}/inventory`,
      'GET',
      null,
      200,
      true
    );

    await this.testEndpoint(
      'Objets équipés',
      `/api/characters/${characterId}/equipped`,
      'GET',
      null,
      200,
      true
    );

    await this.testEndpoint(
      'Donjons du personnage',
      `/api/characters/${characterId}/dungeons`,
      'GET',
      null,
      200,
      true
    );

    // Test de montée de niveau
    await this.testEndpoint(
      'Montée de niveau',
      `/api/characters/${characterId}/level-up`,
      'POST',
      { experience: 50 },
      200,
      true
    );
  }

  /**
   * Teste les endpoints d'objets
   */
  async testItemEndpoints() {
    console.log('🎒 === TEST DES ENDPOINTS D\'OBJETS ===\n');
    
    await this.testEndpoint(
      'Liste des objets (page 1)',
      '/api/items?page=1&limit=10',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Liste des objets (page 2)',
      '/api/items?page=2&limit=10',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Recherche d\'objets',
      '/api/items/search/sword',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Objets par type',
      '/api/items/type/weapon',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Objets par rareté',
      '/api/items/rarity/common',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Popularité des objets',
      '/api/items/popularity',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Objets aléatoires',
      '/api/items/random?count=5',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Options de filtres',
      '/api/items/filters/options',
      'GET',
      null,
      200
    );

    // Test d'un objet spécifique (on suppose qu'il y a au moins un objet avec l'ID 1)
    await this.testEndpoint(
      'Objet par ID',
      '/api/items/1',
      'GET',
      null,
      200
    );
  }

  /**
   * Teste les endpoints de données statiques
   */
  async testStaticEndpoints() {
    console.log('📊 === TEST DES ENDPOINTS DE DONNÉES STATIQUES ===\n');
    
    await this.testEndpoint(
      'Classes de personnages',
      '/api/static/classes',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Types d\'objets',
      '/api/static/items/types',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Raretés',
      '/api/static/rarities',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Compétences',
      '/api/static/skills',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Donjons',
      '/api/static/dungeons',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Ennemis',
      '/api/static/enemies',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Statut du cache',
      '/api/static/cache/status',
      'GET',
      null,
      200
    );

    await this.testEndpoint(
      'Rafraîchissement du cache',
      '/api/static/cache/refresh',
      'POST',
      null,
      200
    );
  }

  /**
   * Teste les endpoints de guildes
   */
  async testGuildEndpoints() {
    console.log('🏰 === TEST DES ENDPOINTS DE GUILDES ===\n');
    
    if (!this.authToken) {
      console.log('⚠️  Token d\'authentification manquant, passage des tests de guildes');
      return;
    }

    await this.testEndpoint(
      'Liste des guildes',
      '/api/guilds',
      'GET',
      null,
      200,
      true
    );

    await this.testEndpoint(
      'Génération de guildes dynamiques',
      '/api/guilds/generate-dynamic',
      'POST',
      { count: 3 },
      200,
      true
    );
  }

  /**
   * Teste les endpoints de profil utilisateur
   */
  async testUserEndpoints() {
    console.log('👤 === TEST DES ENDPOINTS DE PROFIL ===\n');
    
    if (!this.authToken) {
      console.log('⚠️  Token d\'authentification manquant, passage des tests de profil');
      return;
    }

    await this.testEndpoint(
      'Profil utilisateur',
      '/api/user/profile',
      'GET',
      null,
      200,
      true
    );
  }

  /**
   * Teste les endpoints avec des paramètres invalides
   */
  async testErrorHandling() {
    console.log('🚫 === TEST DE GESTION D\'ERREURS ===\n');
    
    await this.testEndpoint(
      'Endpoint inexistant',
      '/api/nonexistent',
      'GET',
      null,
      404
    );

    await this.testEndpoint(
      'Personnage inexistant',
      '/api/characters/99999',
      'GET',
      null,
      404,
      true
    );

    await this.testEndpoint(
      'Objet inexistant',
      '/api/items/99999',
      'GET',
      null,
      404
    );

    await this.testEndpoint(
      'Recherche trop courte',
      '/api/items/search/a',
      'GET',
      null,
      400
    );

    await this.testEndpoint(
      'ID invalide',
      '/api/items/invalid',
      'GET',
      null,
      400
    );
  }

  /**
   * Affiche le rapport final
   */
  displayReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT FINAL DES TESTS');
    console.log('='.repeat(60));
    console.log(`Total des tests: ${this.results.total}`);
    console.log(`✅ Réussis: ${this.results.passed}`);
    console.log(`❌ Échoués: ${this.results.failed}`);
    console.log(`📈 Taux de réussite: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 ERREURS DÉTAILLÉES:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * Lance tous les tests
   */
  async runAllTests() {
    console.log('🚀 DÉMARRAGE DES TESTS COMPLETS DE L\'API ETERNAL ASCENT');
    console.log(`🌐 URL de base: ${this.baseUrl}`);
    console.log('='.repeat(60) + '\n');

    try {
      await this.testHealthEndpoints();
      await this.testAuthEndpoints();
      await this.testCharacterEndpoints();
      await this.testItemEndpoints();
      await this.testStaticEndpoints();
      await this.testGuildEndpoints();
      await this.testUserEndpoints();
      await this.testErrorHandling();
    } catch (error) {
      console.error('💥 Erreur fatale lors des tests:', error);
    }

    this.displayReport();
  }
}

// Exécution du script
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3001';
  const tester = new APITester(baseUrl);
  tester.runAllTests().catch(console.error);
}

module.exports = APITester;
