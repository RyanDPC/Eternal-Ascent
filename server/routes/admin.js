const express = require('express');
const router = express.Router();
const config = require('../config');

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!config.admin.token || token !== config.admin.token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.get('/admin/refresh-tokens', requireAdmin, async (req, res) => {
  const rows = await req.app.locals.dataService.pool.query(
    `SELECT id, user_id, created_at, expires_at, revoked_at FROM refresh_tokens ORDER BY created_at DESC LIMIT 200`
  );
  res.json({ success: true, tokens: rows.rows });
});

router.post('/admin/refresh-tokens/revoke', requireAdmin, async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token requis' });
  await req.app.locals.dataService.pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1`, [token]);
  res.json({ success: true });
});

module.exports = router;


