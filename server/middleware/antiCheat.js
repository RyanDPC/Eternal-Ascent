// Anti-cheat basique: limite XP/min et gold/min par utilisateur

const WINDOW_MS = 60 * 1000; // 1 minute
const LIMITS = {
  xpPerMinute: 5000,
  goldPerMinute: 10000
};

// In-memory window counters (for production, move to Redis)
const userWindows = new Map(); // key: userId -> { windowStart, xp, gold }

function getUserWindow(userId) {
  const now = Date.now();
  let w = userWindows.get(userId);
  if (!w || now - w.windowStart > WINDOW_MS) {
    w = { windowStart: now, xp: 0, gold: 0 };
    userWindows.set(userId, w);
  }
  return w;
}

// Middleware factory for applying XP/gold increments safely
function trackEconomyChange({ xp = 0, gold = 0 }) {
  return (req, res, next) => {
    try {
      const userId = req.user?.userId || req.auth?.userId;
      if (!userId) return next();
      const w = getUserWindow(userId);
      const newXp = w.xp + Math.max(0, xp);
      const newGold = w.gold + Math.max(0, gold);

      if (newXp > LIMITS.xpPerMinute) {
        return res.status(429).json({ error: 'XP/min dépassé (anti-cheat)' });
      }
      if (newGold > LIMITS.goldPerMinute) {
        return res.status(429).json({ error: 'Gold/min dépassé (anti-cheat)' });
      }

      w.xp = newXp;
      w.gold = newGold;
      next();
    } catch (e) {
      next();
    }
  };
}

module.exports = {
  trackEconomyChange,
  LIMITS,
};

