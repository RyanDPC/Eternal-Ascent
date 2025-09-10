const jwt = require('jsonwebtoken');
const config = require('../config');

class TokenService {
  constructor(pool) {
    this.pool = pool;
  }

  async issueTokens(payload) {
    const access = jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessTtl });
    const refresh = jwt.sign({ sub: payload.userId }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshTtl });
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        revoked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `);
    await this.pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2, NOW() + INTERVAL '7 days')`,
      [payload.userId, refresh]
    );
    return { access, refresh };
  }

  async rotateRefreshToken(userId, oldToken) {
    // Revoke old token
    await this.pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1`, [oldToken]);
    return this.issueTokens({ userId });
  }

  async verifyRefresh(token) {
    const payload = jwt.verify(token, config.jwt.refreshSecret);
    const res = await this.pool.query(`SELECT revoked_at FROM refresh_tokens WHERE token = $1`, [token]);
    if (res.rows.length === 0 || res.rows[0].revoked_at) throw new Error('Refresh token invalid');
    return payload;
  }

  async cleanupExpired() {
    await this.pool.query(`DELETE FROM refresh_tokens WHERE (expires_at IS NOT NULL AND expires_at < NOW()) OR revoked_at IS NOT NULL`);
  }
}

module.exports = TokenService;


