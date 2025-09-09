#!/usr/bin/env node

/**
 * Script de test des optimisations
 * 
 * Ce script teste :
 * 1. Les performances des requêtes
 * 2. L'efficacité du cache
 * 3. Les temps de réponse
 * 4. La charge du serveur
 */

const http = require('http');
const { performance } = require('perf_hooks');

class OptimizationTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  /**
   * Effectue une requête HTTP et mesure les performances
   */
  async makeRequest(path, method = 'GET', data = null) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          resolve({
            statusCode: res.statusCode,
            responseTime: responseTime,
            body: body,
            headers: res.headers
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  /**
   * Teste les performances des endpoints principaux
   */
  async testEndpoints() {
    console.log('🧪 Test des performances des endpoints...\n');

    const endpoints = [
      { name: 'Health Check', path: '/api/health', method: 'GET' },
      { name: 'Métriques', path: '/api/metrics', method: 'GET' },
      { name: 'Classes statiques', path: '/api/static/classes', method: 'GET' },
      { name: 'Raretés statiques', path: '/api/static/rarities', method: 'GET' },
      { name: 'Types d\'objets', path: '/api/static/items/types', method: 'GET' },
      { name: 'Objets (page 1)', path: '/api/items?page=1&limit=20', method: 'GET' },
      { name: 'Objets (page 2)', path: '/api/items?page=2&limit=20', method: 'GET' },
      { name: 'Recherche d\'objets', path: '/api/items/search/sword', method: 'GET' },
      { name: 'Objets par type', path: '/api/items/type/weapon', method: 'GET' },
      { name: 'Objets par rareté', path: '/api/items/rarity/common', method: 'GET' },
      { name: 'Popularité des objets', path: '/api/items/popularity', method: 'GET' },
      { name: 'Objets aléatoires', path: '/api/items/random?count=5', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Test: ${endpoint.name}...`);
        
        const results = [];
        const iterations = 5; // Test 5 fois chaque endpoint
        
        for (let i = 0; i < iterations; i++) {
          const result = await this.makeRequest(endpoint.path, endpoint.method);
          results.push(result);
          
          // Petite pause entre les requêtes
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Calculer les statistiques
        const responseTimes = results.map(r => r.responseTime);
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const minResponseTime = Math.min(...responseTimes);
        const maxResponseTime = Math.max(...responseTimes);
        const successRate = results.filter(r => r.statusCode === 200).length / results.length;
        
        const testResult = {
          endpoint: endpoint.name,
          path: endpoint.path,
          iterations: iterations,
          avgResponseTime: Math.round(avgResponseTime * 100) / 100,
          minResponseTime: Math.round(minResponseTime * 100) / 100,
          maxResponseTime: Math.round(maxResponseTime * 100) / 100,
          successRate: Math.round(successRate * 100),
          statusCodes: results.map(r => r.statusCode)
        };
        
        this.results.push(testResult);
        
        console.log(`   ✅ Moyenne: ${testResult.avgResponseTime}ms | Min: ${testResult.minResponseTime}ms | Max: ${testResult.maxResponseTime}ms | Succès: ${testResult.successRate}%`);
        
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        this.results.push({
          endpoint: endpoint.name,
          path: endpoint.path,
          error: error.message,
          avgResponseTime: null,
          successRate: 0
        });
      }
    }
  }

  /**
   * Teste la charge du serveur
   */
  async testLoad() {
    console.log('\n🔥 Test de charge du serveur...\n');

    const concurrentRequests = 10;
    const requestsPerBatch = 5;
    
    console.log(`📊 Exécution de ${concurrentRequests} requêtes concurrentes par batch (${requestsPerBatch} batches)...`);

    const allResults = [];

    for (let batch = 0; batch < requestsPerBatch; batch++) {
      console.log(`   Batch ${batch + 1}/${requestsPerBatch}...`);
      
      const batchPromises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        const path = `/api/items?page=${Math.floor(Math.random() * 5) + 1}&limit=20`;
        batchPromises.push(this.makeRequest(path));
      }
      
      try {
        const batchResults = await Promise.all(batchPromises);
        allResults.push(...batchResults);
        
        const avgTime = batchResults.reduce((sum, r) => sum + r.responseTime, 0) / batchResults.length;
        const successCount = batchResults.filter(r => r.statusCode === 200).length;
        
        console.log(`     ✅ Temps moyen: ${Math.round(avgTime * 100) / 100}ms | Succès: ${successCount}/${concurrentRequests}`);
        
        // Pause entre les batches
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`     ❌ Erreur batch ${batch + 1}: ${error.message}`);
      }
    }

    // Calculer les statistiques globales
    const responseTimes = allResults.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const successRate = allResults.filter(r => r.statusCode === 200).length / allResults.length;

    console.log(`\n📈 Résultats du test de charge:`);
    console.log(`   Total requêtes: ${allResults.length}`);
    console.log(`   Temps moyen: ${Math.round(avgResponseTime * 100) / 100}ms`);
    console.log(`   Temps min: ${Math.round(minResponseTime * 100) / 100}ms`);
    console.log(`   Temps max: ${Math.round(maxResponseTime * 100) / 100}ms`);
    console.log(`   Taux de succès: ${Math.round(successRate * 100)}%`);
  }

  /**
   * Teste l'efficacité du cache
   */
  async testCacheEfficiency() {
    console.log('\n💾 Test de l\'efficacité du cache...\n');

    const cacheTestPaths = [
      '/api/static/classes',
      '/api/static/rarities',
      '/api/static/items/types'
    ];

    for (const path of cacheTestPaths) {
      console.log(`🔄 Test cache pour ${path}...`);
      
      // Première requête (cache miss)
      const firstRequest = await this.makeRequest(path);
      console.log(`   Première requête: ${Math.round(firstRequest.responseTime * 100) / 100}ms`);
      
      // Deuxième requête (cache hit)
      const secondRequest = await this.makeRequest(path);
      console.log(`   Deuxième requête: ${Math.round(secondRequest.responseTime * 100) / 100}ms`);
      
      const improvement = ((firstRequest.responseTime - secondRequest.responseTime) / firstRequest.responseTime) * 100;
      console.log(`   Amélioration: ${Math.round(improvement * 100) / 100}%`);
    }
  }

  /**
   * Génère un rapport de test
   */
  generateReport() {
    console.log('\n📋 RAPPORT DE TEST D\'OPTIMISATION');
    console.log('='.repeat(60));
    
    const successfulTests = this.results.filter(r => r.avgResponseTime !== null);
    const failedTests = this.results.filter(r => r.avgResponseTime === null);
    
    console.log(`\n✅ Tests réussis: ${successfulTests.length}`);
    console.log(`❌ Tests échoués: ${failedTests.length}`);
    
    if (successfulTests.length > 0) {
      const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.avgResponseTime, 0) / successfulTests.length;
      const fastestEndpoint = successfulTests.reduce((min, r) => r.avgResponseTime < min.avgResponseTime ? r : min);
      const slowestEndpoint = successfulTests.reduce((max, r) => r.avgResponseTime > max.avgResponseTime ? r : max);
      
      console.log(`\n📊 Statistiques de performance:`);
      console.log(`   Temps de réponse moyen: ${Math.round(avgResponseTime * 100) / 100}ms`);
      console.log(`   Endpoint le plus rapide: ${fastestEndpoint.endpoint} (${fastestEndpoint.avgResponseTime}ms)`);
      console.log(`   Endpoint le plus lent: ${slowestEndpoint.endpoint} (${slowestEndpoint.avgResponseTime}ms)`);
      
      console.log(`\n🏆 Top 5 des endpoints les plus rapides:`);
      successfulTests
        .sort((a, b) => a.avgResponseTime - b.avgResponseTime)
        .slice(0, 5)
        .forEach((test, index) => {
          console.log(`   ${index + 1}. ${test.endpoint}: ${test.avgResponseTime}ms`);
        });
    }
    
    if (failedTests.length > 0) {
      console.log(`\n❌ Tests échoués:`);
      failedTests.forEach(test => {
        console.log(`   - ${test.endpoint}: ${test.error}`);
      });
    }
    
    console.log(`\n💡 Recommandations:`);
    console.log(`   1. Surveiller les endpoints avec des temps de réponse > 500ms`);
    console.log(`   2. Vérifier l'efficacité du cache Redis`);
    console.log(`   3. Optimiser les requêtes les plus lentes`);
    console.log(`   4. Configurer le monitoring en continu`);
    console.log(`   5. Tester avec plus de données en production`);
  }

  /**
   * Exécute tous les tests
   */
  async runAllTests() {
    try {
      console.log('🚀 Début des tests d\'optimisation...\n');
      
      // Vérifier que le serveur est accessible
      try {
        await this.makeRequest('/api/health');
        console.log('✅ Serveur accessible\n');
      } catch (error) {
        console.error('❌ Serveur non accessible. Assurez-vous qu\'il est démarré sur le port 3001');
        process.exit(1);
      }
      
      // Exécuter les tests
      await this.testEndpoints();
      await this.testLoad();
      await this.testCacheEfficiency();
      
      // Générer le rapport
      this.generateReport();
      
      console.log('\n🎉 Tests d\'optimisation terminés !');
      
    } catch (error) {
      console.error('💥 Erreur lors des tests:', error);
      process.exit(1);
    }
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  const tester = new OptimizationTester();
  
  tester.runAllTests()
    .then(() => {
      console.log('\n🏁 Script de test terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script de test échoué:', error);
      process.exit(1);
    });
}

module.exports = OptimizationTester;

