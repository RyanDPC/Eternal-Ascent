const express = require('express');
const router = express.Router();
const zlib = require('zlib');
const authenticateToken = require('../middleware/auth');

// POST /api/combat-sessions - enregistre un log de combat compressé
router.post('/combat-sessions', authenticateToken, async (req, res) => {
  try {
    const { characterId, dungeonId, result, log } = req.body || {};
    if (!characterId || !dungeonId || !result || !log) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const dataBuffer = Buffer.from(JSON.stringify(log));
    const compressed = zlib.gzipSync(dataBuffer, { level: zlib.constants.Z_BEST_SPEED });

    const client = req.app.locals.dataService.pool;
    const insert = await client.query(
      `INSERT INTO combat_sessions (character_id, dungeon_id, result, log_gzip, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
      [characterId, dungeonId, result, compressed]
    );

    res.json({ success: true, id: insert.rows[0].id });
  } catch (error) {
    console.error('❌ Error saving combat session:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde du combat' });
  }
});

module.exports = router;

