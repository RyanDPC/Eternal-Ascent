#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Charger le fichier .env s'il existe
const envPath = path.join(__dirname, 'server', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

console.log('🚀 Initialisation de la base de données Eternal Ascent...');

// Vérifier que DATABASE_URL est défini
if (!process.env.DATABASE_URL) {
  console.log('❌ Erreur: DATABASE_URL n\'est pas défini.');
  console.log('   Veuillez définir la variable d\'environnement DATABASE_URL');
  console.log('   Exemple: set DATABASE_URL=postgresql://username:password@localhost:5432/eternal_ascent');
  console.log('   Ou consultez database-config.example.txt pour plus d\'informations');
  process.exit(1);
}

console.log('📁 Répertoire serveur: server');

// Vérifier que les scripts existent
const resetScript = path.join(__dirname, 'server', 'scripts', 'reset-and-seed.js');

if (!fs.existsSync(resetScript)) {
  console.log('❌ Erreur: Script reset-and-seed.js introuvable dans server/scripts/');
  process.exit(1);
}

console.log('🔄 Application du schéma, des vues et des seeds via Node...');
console.log('   - Création des tables et contraintes');
console.log('   - Création des vues optimisées');
console.log('   - Insertion des données statiques (skills, etc.)');

// Exécuter le script de reset et seed
const child = spawn(process.execPath, [resetScript], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.join(__dirname, 'server')
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Initialisation terminée avec succès !');
    console.log('🎯 La base de données est prête pour Eternal Ascent');
  } else {
    console.log('❌ Échec de l\'initialisation de la base de données');
    process.exit(1);
  }
});

child.on('error', (error) => {
  console.error('❌ Erreur lors de l\'exécution:', error.message);
  process.exit(1);
});
