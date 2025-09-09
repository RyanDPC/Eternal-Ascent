const jwt = require('jsonwebtoken');

// Middleware d'authentification simple basé sur le header Authorization: Bearer <token>
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Token d\'accès requis' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'eterna_secret_key');
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token invalide' });
  }
}

module.exports = authenticateToken;


