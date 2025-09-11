const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Auth middleware (compatible with different payload shapes)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token d\'accès requis' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eterna_secret_key');
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(403).json({ error: 'Token invalide' });
  }
}

// Inject data service
function injectDataService(req, res, next) {
  req.dataService = req.app.locals.dataService;
  next();
}

async function getOrCreateCharacterIdForUser(pool, userId) {
  const result = await pool.query('SELECT id FROM characters WHERE user_id = $1 LIMIT 1', [userId]);
  return result.rows[0] ? result.rows[0].id : null;
}

// GET /api/activity/recent?limit=10
router.get('/recent', authenticateToken, injectDataService, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié' });

    const characterId = await getOrCreateCharacterIdForUser(req.dataService.pool, userId);
    if (!characterId) return res.json({ success: true, events: [] });

    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '10', 10), 50));
    const eventsRes = await req.dataService.pool.query(
      'SELECT id, character_id, type, description, metadata, created_at FROM activity_events WHERE character_id = $1 ORDER BY created_at DESC LIMIT $2',
      [characterId, limit]
    );

    return res.json({ success: true, events: eventsRes.rows });
  } catch (e) {
    console.error('❌ Error fetching recent activity:', e);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/activity/log { type, description, metadata }
router.post('/log', authenticateToken, injectDataService, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    if (!userId) return res.status(401).json({ error: 'Utilisateur non authentifié' });

    const { type, description, metadata } = req.body || {};
    if (!type) return res.status(400).json({ error: 'type requis' });

    const characterId = await getOrCreateCharacterIdForUser(req.dataService.pool, userId);
    if (!characterId) return res.status(400).json({ error: 'Aucun personnage' });

    const insert = await req.dataService.pool.query(
      'INSERT INTO activity_events (character_id, type, description, metadata) VALUES ($1,$2,$3,$4) RETURNING id, created_at',
      [characterId, String(type), description || null, metadata || {}]
    );

    return res.json({ success: true, event: { id: insert.rows[0].id, character_id: characterId, type, description, metadata: metadata || {}, created_at: insert.rows[0].created_at } });
  } catch (e) {
    console.error('❌ Error logging activity:', e);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;

