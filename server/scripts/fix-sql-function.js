#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Charger le fichier .env s'il existe
const envPath = path.join(__dirname, '..', '.env');
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

async function fixSqlFunction() {
  const pool = new Pool(getDbConfig());
  try {
    console.log('🔧 Fixing SQL function calculate_character_stats...');
    
    // Corriger la fonction calculate_character_stats
    const fixQuery = `
      CREATE OR REPLACE FUNCTION calculate_character_stats(character_id INTEGER)
      RETURNS JSONB AS $$
      DECLARE
          char_stats JSONB;
          base_stats JSONB;
          equipment_bonus JSONB := '{}';
          final_stats JSONB;
          item_stats JSONB;
      BEGIN
          -- Récupérer les stats de base du personnage
          SELECT stats INTO char_stats FROM characters WHERE id = character_id;
          
          -- Récupérer les stats de base de la classe
          SELECT cc.base_stats INTO base_stats 
          FROM characters c 
          JOIN character_classes cc ON c.class_id = cc.id 
          WHERE c.id = character_id;
          
          -- Calculer les bonus d'équipement
          SELECT jsonb_object_agg(key, value) INTO equipment_bonus
          FROM (
              SELECT key, SUM(value::numeric) as value
              FROM character_inventory ci
              JOIN items i ON ci.item_id = i.id
              CROSS JOIN LATERAL jsonb_each_text(i.base_stats)
              WHERE ci.character_id = calculate_character_stats.character_id AND ci.equipped = true
              GROUP BY key
          ) equipment;
          
          -- Combiner les stats
          final_stats := COALESCE(char_stats, '{}') || COALESCE(base_stats, '{}') || COALESCE(equipment_bonus, '{}');
          
          RETURN final_stats;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await pool.query(fixQuery);
    console.log('✅ Function calculate_character_stats fixed successfully!');
    
    // Tester la fonction
    console.log('🧪 Testing the function...');
    try {
      const testResult = await pool.query('SELECT calculate_character_stats(1)');
      console.log('✅ Function test successful!');
    } catch (testError) {
      console.log('⚠️ Function test failed (expected if no character with id 1):', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  fixSqlFunction();
}