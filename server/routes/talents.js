const express = require('express');
const router = express.Router();

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

// GET /api/talents/trees - retourne tous les arbres de talents
router.get('/trees', async (req, res) => {
  const pool = new Pool(getDbConfig());
  try {
    const result = await pool.query('SELECT * FROM skills ORDER BY class, level_requirement ASC');
    const treesMap = new Map();
    for (const s of result.rows) {
      const key = s.class || 'generic';
      if (!treesMap.has(key)) treesMap.set(key, []);
      treesMap.get(key).push({
        id: s.id,
        name: s.name,
        display_name: s.display_name,
        description: s.description,
        type: s.type,
        level_requirement: s.level_requirement,
        effects: s.effects
      });
    }
    const trees = Array.from(treesMap.entries()).map(([className, talents]) => ({ class_name: className, display_name: className, description: `Talents pour ${className}`, talents }));
    if (trees.length === 0) return res.status(204).send();
    res.json({ success: true, trees });
  } catch (error) {
    console.error('❌ Erreur talents/trees:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des arbres de talents' });
  } finally {
    await pool.end();
  }
});

// GET /api/talents/trees/:className - retourne un arbre de talents par classe
router.get('/trees/:className', async (req, res) => {
  const pool = new Pool(getDbConfig());
  try {
    const { className } = req.params;
    const result = await pool.query('SELECT * FROM skills WHERE class = $1 ORDER BY level_requirement ASC', [className]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Arbre de talents introuvable' });
    const tree = {
      class_name: className,
      display_name: className,
      description: `Talents pour ${className}`,
      talents: result.rows.map(s => ({
        id: s.id,
        name: s.name,
        display_name: s.display_name,
        description: s.description,
        type: s.type,
        level_requirement: s.level_requirement,
        effects: s.effects
      }))
    };
    res.json({ success: true, tree });
  } catch (error) {
    console.error('❌ Erreur talents/trees/:className:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'arbre de talents' });
  } finally {
    await pool.end();
  }
});

module.exports = router;


