#!/usr/bin/env node

/**
 * Script de nettoyage des fichiers inutiles
 * 
 * Ce script supprime :
 * 1. Les fichiers redondants
 * 2. Les anciens fichiers non utilisés
 * 3. Les dossiers vides
 * 4. Les fichiers temporaires
 */

const fs = require('fs');
const path = require('path');

class CleanupManager {
  constructor() {
    this.removedFiles = [];
    this.removedDirs = [];
    this.errors = [];
  }

  /**
   * Supprime un fichier s'il existe
   */
  removeFile(filePath, description) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.removedFiles.push(`✅ Supprimé: ${description} (${filePath})`);
        return true;
      } else {
        console.log(`ℹ️ Fichier déjà absent: ${description} (${filePath})`);
        return false;
      }
    } catch (error) {
      this.errors.push(`❌ Erreur suppression ${description}: ${error.message}`);
      return false;
    }
  }

  /**
   * Supprime un dossier s'il est vide
   */
  removeEmptyDir(dirPath, description) {
    try {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        if (files.length === 0) {
          fs.rmdirSync(dirPath);
          this.removedDirs.push(`✅ Dossier vide supprimé: ${description} (${dirPath})`);
          return true;
        } else {
          console.log(`ℹ️ Dossier non vide: ${description} (${dirPath})`);
          return false;
        }
      }
      return false;
    } catch (error) {
      this.errors.push(`❌ Erreur suppression dossier ${description}: ${error.message}`);
      return false;
    }
  }

  /**
   * Nettoie les fichiers redondants
   */
  cleanupRedundantFiles() {
    console.log('🧹 Nettoyage des fichiers redondants...\n');

    const redundantFiles = [
      {
        path: 'server.js',
        description: 'Ancien serveur (remplacé par server-ultra-optimized.js)'
      },
      {
        path: 'initDB.js',
        description: 'Ancien système d\'initialisation DB'
      },
      {
        path: 'seed-data.js',
        description: 'Ancien système de données de test'
      }
    ];

    redundantFiles.forEach(file => {
      this.removeFile(file.path, file.description);
    });
  }

  /**
   * Nettoie les fichiers de configuration obsolètes
   */
  cleanupObsoleteConfig() {
    console.log('⚙️ Nettoyage des configurations obsolètes...\n');

    const obsoleteFiles = [
      {
        path: 'config/api.js',
        description: 'Configuration API obsolète'
      },
      {
        path: 'config/environment.js',
        description: 'Configuration environnement obsolète'
      },
      {
        path: 'config/systems.js',
        description: 'Configuration systèmes obsolète'
      }
    ];

    obsoleteFiles.forEach(file => {
      this.removeFile(file.path, file.description);
    });
  }

  /**
   * Nettoie les systèmes non utilisés
   */
  cleanupUnusedSystems() {
    console.log('🔧 Nettoyage des systèmes non utilisés...\n');

    const unusedSystems = [
      {
        path: 'systems/achievements.js',
        description: 'Système d\'achievements non implémenté'
      },
      {
        path: 'systems/analytics.js',
        description: 'Système d\'analytics non implémenté'
      },
      {
        path: 'systems/crafting.js',
        description: 'Système de crafting non implémenté'
      },
      {
        path: 'systems/events.js',
        description: 'Système d\'événements non implémenté'
      },
      {
        path: 'systems/guild_wars.js',
        description: 'Système de guerres de guildes non implémenté'
      },
      {
        path: 'systems/leaderboards.js',
        description: 'Système de classements non implémenté'
      },
      {
        path: 'systems/pets.js',
        description: 'Système de pets non implémenté'
      },
      {
        path: 'systems/pvp.js',
        description: 'Système PvP non implémenté'
      },
      {
        path: 'systems/trading.js',
        description: 'Système de trading non implémenté'
      }
    ];

    unusedSystems.forEach(system => {
      this.removeFile(system.path, system.description);
    });
  }

  /**
   * Nettoie les utilitaires non utilisés
   */
  cleanupUnusedUtils() {
    console.log('🛠️ Nettoyage des utilitaires non utilisés...\n');

    const unusedUtils = [
      {
        path: 'utils/errors.js',
        description: 'Gestionnaire d\'erreurs non utilisé'
      },
      {
        path: 'utils/monitoring.js',
        description: 'Système de monitoring non utilisé'
      },
      {
        path: 'utils/validation.js',
        description: 'Système de validation non utilisé'
      }
    ];

    unusedUtils.forEach(util => {
      this.removeFile(util.path, util.description);
    });
  }

  /**
   * Nettoie les dossiers vides
   */
  cleanupEmptyDirs() {
    console.log('📁 Nettoyage des dossiers vides...\n');

    const emptyDirs = [
      {
        path: 'config',
        description: 'Dossier de configuration vide'
      },
      {
        path: 'systems',
        description: 'Dossier des systèmes vide'
      },
      {
        path: 'utils',
        description: 'Dossier des utilitaires vide'
      },
      {
        path: 'websocket',
        description: 'Dossier WebSocket non utilisé'
      }
    ];

    emptyDirs.forEach(dir => {
      this.removeEmptyDir(dir.path, dir.description);
    });
  }

  /**
   * Nettoie les fichiers de données dupliqués
   */
  cleanupDuplicateData() {
    console.log('🗄️ Nettoyage des données dupliquées...\n');

    // Supprimer le fichier equipments dupliqué
    this.removeFile('data/sid/equipments/index.js', 'Données équipements dupliquées (garder equipments)');
  }

  /**
   * Nettoie les fichiers temporaires
   */
  cleanupTempFiles() {
    console.log('🗑️ Nettoyage des fichiers temporaires...\n');

    const tempFiles = [
      '*.log',
      '*.tmp',
      '.DS_Store',
      'Thumbs.db'
    ];

    // Note: Les fichiers avec des patterns ne peuvent pas être supprimés facilement
    // mais on peut vérifier s'il y en a
    console.log('ℹ️ Vérifiez manuellement les fichiers temporaires si nécessaire');
  }

  /**
   * Génère le rapport de nettoyage
   */
  generateCleanupReport() {
    console.log('\n📋 RAPPORT DE NETTOYAGE');
    console.log('='.repeat(40));
    
    console.log(`\n✅ Fichiers supprimés: ${this.removedFiles.length}`);
    this.removedFiles.forEach(item => console.log(`   ${item}`));
    
    console.log(`\n📁 Dossiers supprimés: ${this.removedDirs.length}`);
    this.removedDirs.forEach(item => console.log(`   ${item}`));
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Erreurs: ${this.errors.length}`);
      this.errors.forEach(item => console.log(`   ${item}`));
    }
    
    const totalRemoved = this.removedFiles.length + this.removedDirs.length;
    console.log(`\n📊 Total supprimé: ${totalRemoved} éléments`);
    
    if (this.errors.length === 0) {
      console.log('\n🎉 Nettoyage terminé avec succès !');
    } else {
      console.log('\n⚠️ Nettoyage terminé avec des erreurs');
    }
  }

  /**
   * Exécute tout le nettoyage
   */
  async cleanup() {
    console.log('🧹 Début du nettoyage Eternal Ascent...\n');
    
    this.cleanupRedundantFiles();
    this.cleanupObsoleteConfig();
    this.cleanupUnusedSystems();
    this.cleanupUnusedUtils();
    this.cleanupEmptyDirs();
    this.cleanupDuplicateData();
    this.cleanupTempFiles();
    
    this.generateCleanupReport();
    
    return this.errors.length === 0;
  }
}

// Exécuter le nettoyage si le script est appelé directement
if (require.main === module) {
  const cleaner = new CleanupManager();
  
  cleaner.cleanup()
    .then((success) => {
      console.log('\n🏁 Script de nettoyage terminé');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Erreur lors du nettoyage:', error);
      process.exit(1);
    });
}

module.exports = CleanupManager;


