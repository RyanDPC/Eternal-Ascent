// =====================================================
// DONJONS (SID)
// Génération basée sur les référentiels: difficultés, ennemis, consommables,
// matériaux, raretés, items spéciaux, monnaies.
// - 15 donjons par difficulté
// - Sauf 'dark' et 'light' → 3 donjons chacun, boss échelonné (tiers)
// - Récompenses tirées des datasets importés (pas de recréation)
// =====================================================

const Difficulties = require('../difficulties');
const Enemies = require('../enemies');
const Consumables = require('../consumables');
const Materials = require('../materials');
const Rarities = require('../rarities');
const SpecialItems = require('../special_items');
const Currency = require('../currency');

// Échelle globale pour réduire les gains (XP/Gold)
const GLOBAL_EXP_SCALE = 0.4;   // 40% des valeurs précédentes
const GLOBAL_GOLD_SCALE = 0.35; // 35% des valeurs précédentes
const MAX_ORDER = 19;           // Nombre total de paliers de difficulté

class DungeonManager {
  constructor() {}

  // =====================
  // Utils
  // =====================
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomPick(array) {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }

  pickMultiple(array, count) {
    if (!Array.isArray(array) || array.length === 0) return [];
    const copy = [...array];
    const picks = [];
    for (let i = 0; i < count && copy.length > 0; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      picks.push(copy.splice(idx, 1)[0]);
    }
    return picks;
  }

  pickByRarity() {
    // Rarities is an array with probability field
    const roll = Math.random();
    let acc = 0;
    for (const r of Rarities) {
      acc += Number(r.probability || 0);
      if (roll <= acc) return r.name;
    }
    return 'common';
  }

  filterByRarity(items, rarityName) {
    if (!Array.isArray(items)) return [];
    return items.filter(it => String(it.rarity || '').toLowerCase() === String(rarityName).toLowerCase());
  }

  enemyPoolForOrder(order) {
    if (order <= 2) return Enemies.beginnerEnemies || [];
    if (order <= 6) return (Enemies.intermediateEnemies || []).concat(Enemies.beginnerEnemies || []);
    if (order <= 12) return (Enemies.intermediateEnemies || []).concat(Enemies.bosses || []);
    if (order <= 17) return (Enemies.legendaryEnemies || []).concat(Enemies.bosses || []);
    // Ultimes
    return (Enemies.legendaryEnemies || []).concat(Enemies.bosses || []);
  }

  bossPool() {
    return (Enemies.bosses || []).concat(Enemies.legendaryEnemies || []);
  }

  levelRangeForOrder(order) {
    // Simple, croissant, large pour HL
    if (order <= 1) return { min: 1, max: 5 };
    if (order === 2) return { min: 3, max: 10 };
    if (order === 3) return { min: 5, max: 12 };
    if (order === 4) return { min: 8, max: 16 };
    if (order === 5) return { min: 12, max: 20 };
    if (order === 6) return { min: 16, max: 24 };
    if (order === 7) return { min: 20, max: 30 };
    if (order === 8) return { min: 25, max: 35 };
    if (order === 9) return { min: 30, max: 40 };
    if (order === 10) return { min: 35, max: 45 };
    if (order === 11) return { min: 40, max: 50 };
    if (order === 12) return { min: 45, max: 55 };
    if (order === 13) return { min: 50, max: 60 };
    if (order === 14) return { min: 55, max: 65 };
    if (order === 15) return { min: 60, max: 70 };
    if (order === 16) return { min: 65, max: 75 };
    if (order === 17) return { min: 70, max: 80 };
    if (order === 18) return { min: 75, max: 85 };
    return { min: 80, max: 90 };
  }

  computeStats(level, diffDef, enemies) {
    const expBase = enemies.reduce((sum, e) => sum + Number(e.exp || e.experience || 0), 0) || this.randomInt(50, 120);
    const goldBase = enemies.reduce((sum, e) => sum + Number(e.gold || e.gold_reward || 0), 0) || this.randomInt(30, 100);
    // Courbe de progression forte par ordre de difficulté: très bas en easy, très haut en HL
    const order = Math.max(1, Math.min(MAX_ORDER, diffDef?.order || 1));
    const progress = (order - 1) / (MAX_ORDER - 1); // 0..1
    const orderExpScale = 0.2 + Math.pow(progress, 1.8) * 1.8;
    const orderGoldScale = 0.2 + Math.pow(progress, 1.6) * 1.6;

    // Réduction globale + scaling niveau adouci + amplification par difficulté
    const exp = Math.max(1, Math.floor(
      expBase * (diffDef?.exp_multiplier || 1) * (1 + level / 60) * GLOBAL_EXP_SCALE * orderExpScale
    ));
    const gold = Math.max(1, Math.floor(
      goldBase * (diffDef?.gold_multiplier || 1) * (1 + level / 65) * GLOBAL_GOLD_SCALE * orderGoldScale
    ));
    const monsterCount = Math.max(enemies.length, this.randomInt(6, 14));
    // Durée estimée: plus la diff est haute, plus la durée augmente légèrement
    const baseMin = 6 + Math.floor((diffDef?.order || 1) / 2);
    const time_limit = `${baseMin + this.randomInt(0, 8)}m`;
    return { exp_reward: exp, gold_reward: gold, monster_count: monsterCount, estimated_duration: time_limit };
  }

  buildLoot(diffDef) {
    // Rareté pondérée
    const rarityPick = this.pickByRarity();
    const cons = this.filterByRarity(Consumables, rarityPick);
    const mats = this.filterByRarity(Materials, rarityPick);
    const specs = this.filterByRarity(SpecialItems, rarityPick);

    const consumables = this.pickMultiple(cons.length ? cons : Consumables, this.randomInt(1, 3));
    const materials = this.pickMultiple(mats.length ? mats : Materials, this.randomInt(1, 3));
    const specials = this.pickMultiple(specs.length ? specs : SpecialItems, this.randomInt(0, 2));
    const currencyPicks = this.pickMultiple(Currency, 1);

    return {
      rarity_hint: rarityPick,
      consumables: consumables.map(i => i.name),
      materials: materials.map(i => i.name),
      specials: specials.map(i => i.name),
      currency: currencyPicks.map(c => c.name)
    };
  }

  themePool() {
    return ['cave', 'forest', 'fortress', 'ice', 'fire', 'storm', 'abyss', 'void', 'city', 'temple', 'crystal', 'undead', 'desert', 'mountain', 'swamp', 'celestial', 'cosmic', 'arena', 'corrupted'];
  }

  buildDungeon(diffDef, idx, total) {
    const theme = this.themePool()[idx % this.themePool().length];
    const displayTheme = theme.charAt(0).toUpperCase() + theme.slice(1);
    const levelRange = this.levelRangeForOrder(diffDef.order || 1);
    const level = this.randomInt(levelRange.min, levelRange.max);

    const pool = this.enemyPoolForOrder(diffDef.order || 1);
    const enemies = this.pickMultiple(pool, this.randomInt(6, 10));

    const stats = this.computeStats(level, diffDef, enemies);
    const loot = this.buildLoot(diffDef);

    return {
      name: `${diffDef.name}_${theme}_${idx + 1}`,
      display_name: `${displayTheme} (${diffDef.display_name})`,
      description: `Un ${displayTheme.toLowerCase()} aux énergies ${diffDef.display_name.toLowerCase()}.`,
      level_requirement: level,
      difficulty: diffDef.name,
      requirements: { level },
      enemies: enemies.map(e => e.id || e.name),
      boss: null,
      icon: `${theme}_icon`,
      theme,
      ...stats,
      rewards: loot
    };
  }

  buildDarkLightDungeon(diffDef, tierIdx) {
    // 3 paliers par difficulté (0..2), boss échelonné
    const theme = diffDef.name === 'dark' ? 'void' : 'celestial';
    const displayTheme = theme.charAt(0).toUpperCase() + theme.slice(1);
    const baseRange = this.levelRangeForOrder(diffDef.order || 18);
    const step = Math.max(1, Math.floor((baseRange.max - baseRange.min) / 3));
    const level = baseRange.min + step * tierIdx + this.randomInt(0, Math.max(0, step - 1));

    const boss = this.randomPick(this.bossPool());
    const supportPool = this.enemyPoolForOrder(diffDef.order || 18);
    const adds = this.pickMultiple(supportPool, this.randomInt(3, 5));

    const enemies = [...adds, boss].filter(Boolean);
    const stats = this.computeStats(level, diffDef, enemies);
    const loot = this.buildLoot(diffDef);

    // Boss boost par palier (léger bonus d'or/exp)
    stats.exp_reward = Math.floor(stats.exp_reward * (1 + tierIdx * 0.15));
    stats.gold_reward = Math.floor(stats.gold_reward * (1 + tierIdx * 0.20));

    return {
      name: `${diffDef.name}_boss_tier_${tierIdx + 1}`,
      display_name: `${displayTheme} (${diffDef.display_name}) T${tierIdx + 1}`,
      description: `Affrontez un boss ${diffDef.display_name.toLowerCase()} (palier ${tierIdx + 1}).`,
      level_requirement: level,
      difficulty: diffDef.name,
      requirements: { level },
      enemies: enemies.map(e => e.id || e.name),
      boss: boss ? (boss.id || boss.name) : null,
      icon: `${theme}_icon`,
      theme,
      ...stats,
      rewards: loot
    };
  }

  getDungeons() {
    const dungeons = [];
    const diffs = Difficulties.getAllDifficulties();

    for (const diff of diffs) {
      const isUlt = diff.name === 'dark' || diff.name === 'light';
      const count = isUlt ? 3 : 15;

      for (let i = 0; i < count; i++) {
        if (isUlt) {
          dungeons.push(this.buildDarkLightDungeon(diff, i));
        } else {
          dungeons.push(this.buildDungeon(diff, i, count));
        }
      }
    }

    return dungeons;
  }
}

module.exports = new DungeonManager();


