#!/usr/bin/env node

const { Pool } = require('pg');

function getDbConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false, require: true } };
  }
  const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: useSsl ? { rejectUnauthorized: false, require: true } : false
  };
}

async function testDatabase() {
  const pool = new Pool(getDbConfig());
  try {
    console.log('🔍 Testing database connection and structure...');
    
    // Test de connexion
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Vérifier les tables principales
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Vérifier les données dans chaque table
    const tableChecks = [
      { name: 'rarities', description: 'Rarities' },
      { name: 'character_classes', description: 'Character Classes' },
      { name: 'difficulties', description: 'Difficulties' },
      { name: 'skills', description: 'Skills' },
      { name: 'dungeons', description: 'Dungeons' },
      { name: 'items', description: 'Items' },
      { name: 'enemies', description: 'Enemies' },
      { name: 'quests', description: 'Quests' }
    ];
    
    console.log('\n📊 Data counts:');
    for (const table of tableChecks) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table.name}`);
        const count = result.rows[0].count;
        console.log(`   - ${table.description}: ${count} records`);
        
        // Afficher quelques exemples pour les tables importantes
        if (table.name === 'skills' && count > 0) {
          const sample = await pool.query(`SELECT name, display_name, type, class FROM ${table.name} LIMIT 3`);
          console.log('     Sample skills:');
          sample.rows.forEach(skill => {
            console.log(`       - ${skill.display_name} (${skill.name}) - ${skill.type} - ${skill.class}`);
          });
        }
      } catch (error) {
        console.log(`   - ${table.description}: Table not found or error`);
      }
    }
    
    console.log('\n✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testDatabase();
}
