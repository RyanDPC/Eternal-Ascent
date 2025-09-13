const jwt = require('jsonwebtoken');

// Middleware d'authentification
// - Docker/Redis: géré côté serveur (cookie "sid" mappé en payload)
// - Sinon: support Bearer token et cookie JWT httpOnly ("token")
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cookieJwt = req.cookies && (req.cookies.token || req.cookies.jwt);
    const token = bearer || cookieJwt;

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


