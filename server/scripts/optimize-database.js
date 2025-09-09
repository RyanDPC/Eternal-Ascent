#!/usr/bin/env node

/**
 * Script d'optimisation de la base de données
 * 
 * Ce script :
 * 1. Crée les vues SQL optimisées
 * 2. Ajoute les index manquants
 * 3. Analyse les performances
 * 4. Optimise les requêtes lentes
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration de la base de données
const pool = new Pool({
  host: process.env.DB_HOST || 'dpg-d2jnela4d50c73891omg-a.frankfurt-postgres.render.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'eterna',
  user: process.env.DB_USER || 'eterna_user',
  password: process.env.DB_PASSWORD || 'u5K6UbCBstAUIXvuIEqlaC7ZyHUor79G',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class DatabaseOptimizer {
  constructor() {
    this.optimizations = [];
    this.performanceMetrics = {};
  }

  /**
   * Exécute une requête et mesure les performances
   */
  async executeWithMetrics(query, params = []) {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      const result = await client.query(query, params);
      const executionTime = Date.now() - startTime;
      
      this.performanceMetrics[query.substring(0, 50)] = {
        executionTime,
        rowCount: result.rowCount,
        timestamp: new Date().toISOString()
      };
      
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Crée les vues SQL optimisées
   */
  async createOptimizedViews() {
    console.log('📊 Création des vues SQL optimisées...');
    
    try {
      const viewsPath = path.join(__dirname, '..', 'database-views.sql');
      const viewsSQL = fs.readFileSync(viewsPath, 'utf8');
      
      await this.executeWithMetrics(viewsSQL);
      console.log('✅ Vues créées avec succès');
      
      this.optimizations.push('Vues SQL optimisées créées');
    } catch (error) {
      console.error('❌ Erreur lors de la création des vues:', error.message);
      throw error;
    }
  }

  /**
   * Ajoute des index manquants pour les performances
   */
  async addPerformanceIndexes() {
    console.log('🔍 Ajout d\'index de performance...');
    
    const indexes = [
      // Index composites pour les requêtes fréquentes
      'CREATE INDEX IF NOT EXISTS idx_characters_user_level ON characters(user_id, level)',
      'CREATE INDEX IF NOT EXISTS idx_character_inventory_character_equipped ON character_inventory(character_id, equipped)',
      'CREATE INDEX IF NOT EXISTS idx_items_type_rarity_level ON items(type_id, rarity_id, level_requirement)',
      'CREATE INDEX IF NOT EXISTS idx_enemies_type_level ON enemies(type, level)',
      'CREATE INDEX IF NOT EXISTS idx_guild_members_guild_rank ON guild_members(guild_id, rank)',
      
      // Index partiels pour les requêtes spécifiques
      'CREATE INDEX IF NOT EXISTS idx_characters_high_level ON characters(level) WHERE level > 50',
      'CREATE INDEX IF NOT EXISTS idx_character_inventory_equipped_items ON character_inventory(character_id) WHERE equipped = true',
      'CREATE INDEX IF NOT EXISTS idx_items_rare_items ON items(rarity_id) WHERE rarity_id > 3',
      
      // Index pour les recherches textuelles
      'CREATE INDEX IF NOT EXISTS idx_items_name_trgm ON items USING gin(name gin_trgm_ops)',
      'CREATE INDEX IF NOT EXISTS idx_characters_name_trgm ON characters USING gin(name gin_trgm_ops)',
      
      // Index pour les requêtes JSONB
      'CREATE INDEX IF NOT EXISTS idx_characters_stats_gin ON characters USING gin(stats)',
      'CREATE INDEX IF NOT EXISTS idx_items_base_stats_gin ON items USING gin(base_stats)',
      'CREATE INDEX IF NOT EXISTS idx_items_effects_gin ON items USING gin(effects)',
      
      // Index pour les timestamps
      'CREATE INDEX IF NOT EXISTS idx_characters_updated_at ON characters(updated_at)',
      'CREATE INDEX IF NOT EXISTS idx_guild_members_last_active ON guild_members(last_active)',
      'CREATE INDEX IF NOT EXISTS idx_character_inventory_created_at ON character_inventory(created_at)'
    ];

    for (const indexSQL of indexes) {
      try {
        await this.executeWithMetrics(indexSQL);
        console.log(`   ✅ Index créé: ${indexSQL.split(' ')[5] || 'composite'}`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn(`   ⚠️ Erreur index: ${error.message}`);
        }
      }
    }

    this.optimizations.push('Index de performance ajoutés');
  }

  /**
   * Analyse les performances de la base de données
   */
  async analyzePerformance() {
    console.log('📈 Analyse des performances...');
    
    const analysisQueries = [
      {
        name: 'Requêtes lentes',
        query: `
          SELECT query, mean_time, calls, total_time
          FROM pg_stat_statements 
          WHERE mean_time > 1000 
          ORDER BY mean_time DESC 
          LIMIT 10
        `
      },
      {
        name: 'Tables les plus utilisées',
        query: `
          SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup
          FROM pg_stat_user_tables 
          ORDER BY n_live_tup DESC 
          LIMIT 10
        `
      },
      {
        name: 'Index non utilisés',
        query: `
          SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
          FROM pg_stat_user_indexes 
          WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
          ORDER BY schemaname, tablename
        `
      },
      {
        name: 'Taille des tables',
        query: `
          SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        `
      }
    ];

    for (const analysis of analysisQueries) {
      try {
        const result = await this.executeWithMetrics(analysis.query);
        console.log(`\n📊 ${analysis.name}:`);
        console.table(result.rows);
      } catch (error) {
        console.warn(`   ⚠️ Analyse ${analysis.name} échouée: ${error.message}`);
      }
    }
  }

  /**
   * Optimise les requêtes en créant des statistiques
   */
  async updateStatistics() {
    console.log('📊 Mise à jour des statistiques...');
    
    const tables = [
      'characters', 'character_inventory', 'items', 'item_types', 'rarities',
      'guilds', 'guild_members', 'dungeons', 'enemies', 'quests', 'skills'
    ];

    for (const table of tables) {
      try {
        await this.executeWithMetrics(`ANALYZE ${table}`);
        console.log(`   ✅ Statistiques mises à jour pour ${table}`);
      } catch (error) {
        console.warn(`   ⚠️ Erreur ANALYZE ${table}: ${error.message}`);
      }
    }

    this.optimizations.push('Statistiques mises à jour');
  }

  /**
   * Vérifie l'intégrité des données
   */
  async checkDataIntegrity() {
    console.log('🔍 Vérification de l\'intégrité des données...');
    
    const integrityChecks = [
      {
        name: 'Personnages orphelins',
        query: 'SELECT COUNT(*) FROM characters c LEFT JOIN users u ON c.user_id = u.id WHERE u.id IS NULL'
      },
      {
        name: 'Objets d\'inventaire orphelins',
        query: 'SELECT COUNT(*) FROM character_inventory ci LEFT JOIN characters c ON ci.character_id = c.id WHERE c.id IS NULL'
      },
      {
        name: 'Objets avec types invalides',
        query: 'SELECT COUNT(*) FROM items i LEFT JOIN item_types it ON i.type_id = it.id WHERE it.id IS NULL'
      },
      {
        name: 'Objets avec raretés invalides',
        query: 'SELECT COUNT(*) FROM items i LEFT JOIN rarities r ON i.rarity_id = r.id WHERE r.id IS NULL'
      }
    ];

    for (const check of integrityChecks) {
      try {
        const result = await this.executeWithMetrics(check.query);
        const count = parseInt(result.rows[0].count);
        
        if (count > 0) {
          console.warn(`   ⚠️ ${check.name}: ${count} enregistrements problématiques`);
        } else {
          console.log(`   ✅ ${check.name}: OK`);
        }
      } catch (error) {
        console.warn(`   ⚠️ Vérification ${check.name} échouée: ${error.message}`);
      }
    }
  }

  /**
   * Génère un rapport d'optimisation
   */
  generateReport() {
    console.log('\n📋 RAPPORT D\'OPTIMISATION');
    console.log('='.repeat(50));
    
    console.log('\n✅ Optimisations appliquées:');
    this.optimizations.forEach((opt, index) => {
      console.log(`   ${index + 1}. ${opt}`);
    });

    console.log('\n📊 Métriques de performance:');
    Object.entries(this.performanceMetrics).forEach(([query, metrics]) => {
      console.log(`   ${query}: ${metrics.executionTime}ms (${metrics.rowCount} lignes)`);
    });

    console.log('\n💡 Recommandations:');
    console.log('   1. Surveiller les requêtes lentes avec pg_stat_statements');
    console.log('   2. Vérifier régulièrement l\'utilisation des index');
    console.log('   3. Nettoyer les données anciennes si nécessaire');
    console.log('   4. Configurer le monitoring des performances');
    console.log('   5. Utiliser le cache Redis pour les données statiques');
  }

  /**
   * Exécute toutes les optimisations
   */
  async optimize() {
    try {
      console.log('🚀 Début de l\'optimisation de la base de données...\n');
      
      // Vérifier la connexion
      await this.executeWithMetrics('SELECT NOW()');
      console.log('✅ Connexion à la base de données établie\n');
      
      // Exécuter les optimisations
      await this.createOptimizedViews();
      await this.addPerformanceIndexes();
      await this.updateStatistics();
      await this.checkDataIntegrity();
      await this.analyzePerformance();
      
      // Générer le rapport
      this.generateReport();
      
      console.log('\n🎉 Optimisation terminée avec succès !');
      
    } catch (error) {
      console.error('💥 Erreur lors de l\'optimisation:', error);
      throw error;
    } finally {
      await pool.end();
    }
  }
}

// Exécuter l'optimisation si le script est appelé directement
if (require.main === module) {
  const optimizer = new DatabaseOptimizer();
  
  optimizer.optimize()
    .then(() => {
      console.log('\n🏁 Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script échoué:', error);
      process.exit(1);
    });
}

module.exports = DatabaseOptimizer;

