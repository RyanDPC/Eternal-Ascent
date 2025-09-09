const crypto = require('crypto');

class RotationService {
  constructor(dataService, cacheService, questSystem) {
    this.dataService = dataService;
    this.cache = cacheService;
    this.questSystem = questSystem;
  }

  getLevelSegment(level) {
    if (level <= 10) return 'new';
    if (level <= 30) return 'intermediate';
    return 'late';
  }

  secondsUntilMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    const ttl = Math.max(60, Math.floor((tomorrow - now) / 1000));
    return ttl;
  }

  sampleWithQuota(items, difficultyField, quotas, maxCount, seed) {
    const rng = crypto.createHash('sha256').update(seed).digest();
    let rngIndex = 0;
    const nextRand = () => {
      if (rngIndex >= rng.length) rngIndex = 0;
      return rng[rngIndex++] / 255;
    };

    const buckets = {
      easy: [],
      medium: [],
      hard: []
    };

    for (const it of items) {
      const diff = (it[difficultyField] || '').toLowerCase();
      if (buckets[diff]) buckets[diff].push(it);
    }

    const selected = [];
    const pickFrom = (arr, count) => {
      const copy = arr.slice();
      for (let i = 0; i < count && copy.length > 0; i++) {
        const idx = Math.floor(nextRand() * copy.length);
        selected.push(copy.splice(idx, 1)[0]);
      }
    };

    // Respect quotas first
    pickFrom(buckets.easy, quotas.easy || 0);
    pickFrom(buckets.medium, quotas.medium || 0);
    pickFrom(buckets.hard, quotas.hard || 0);

    // Fill remaining randomly from all
    const remaining = maxCount - selected.length;
    if (remaining > 0) {
      const rest = items.filter(x => !selected.includes(x));
      pickFrom(rest, remaining);
    }

    return selected.slice(0, maxCount);
  }

  async getDailyDungeonRotation(character) {
    const level = character.level || 1;
    const segment = this.getLevelSegment(level);
    const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const cacheKey = `rotation:dungeons:${segment}:${todayKey}`;

    const cached = await this.cache.getStaticData(cacheKey);
    if (cached) return cached;

    const all = await this.dataService.getDungeonsByLevel(level, true);
    const quotas = { easy: 2, medium: 2, hard: 2 };
    const maxCount = 10;
    const picked = this.sampleWithQuota(all, 'difficulty_name', quotas, maxCount, `${segment}:${todayKey}`);

    await this.cache.cacheStaticData(cacheKey, picked, this.secondsUntilMidnight());
    return picked;
  }

  async getDailyQuestRotation(characterId) {
    // Fetch character level to segment quests if needed in the future
    let characterLevel = 1;
    try {
      const c = await this.dataService.getCharacter(characterId);
      if (c?.level) characterLevel = c.level;
    } catch (_) {}

    const todayKey = new Date().toISOString().slice(0, 10);
    const cacheKey = `rotation:quests:${todayKey}`;
    const cached = await this.cache.getStaticData(cacheKey);
    if (cached) return cached;

    // Use QuestSystem to enumerate daily quests and pick with quotas
    const allDaily = Array.from(this.questSystem.dailyQuests.values());
    const quotas = { easy: 2, medium: 2, hard: 2 };
    const maxCount = 10;
    const picked = this.sampleWithQuota(allDaily, 'difficulty', quotas, maxCount, `quests:${todayKey}:${characterLevel}`);

    await this.cache.cacheStaticData(cacheKey, picked, this.secondsUntilMidnight());
    return picked;
  }
}

module.exports = RotationService;


