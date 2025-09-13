// =====================================================
// DIFFICULTÉS DES DONJONS
// =====================================================

class DifficultyManager {
  constructor() {
    this.difficulties = this.generateDifficulties();
  }

  generateDifficulties() {
    // 19 niveaux de difficultés (progression complète)
    const difficulties = [
      { name: 'easy',        display_name: 'Facile',      color: '#4ecdc4', icon: '🟢', description: 'Parfait pour les débutants',             stat_multiplier: 0.8,  exp_multiplier: 0.8,  gold_multiplier: 0.8,  order: 1 },
      { name: 'normal',      display_name: 'Normal',      color: '#a3d9a5', icon: '🟡', description: 'Difficulté standard',                   stat_multiplier: 1.0,  exp_multiplier: 1.0,  gold_multiplier: 1.0,  order: 2 },
      { name: 'medium',      display_name: 'Moyen',       color: '#fdcb6e', icon: '🟡', description: 'Un défi équilibré',                     stat_multiplier: 1.2,  exp_multiplier: 1.2,  gold_multiplier: 1.2,  order: 3 },
      { name: 'hard',        display_name: 'Difficile',   color: '#ff6b6b', icon: '🔴', description: 'Pour les joueurs expérimentés',        stat_multiplier: 1.5,  exp_multiplier: 1.5,  gold_multiplier: 1.5,  order: 4 },
      { name: 'nightmare',   display_name: 'Cauchemar',   color: '#8e44ad', icon: '💀', description: 'Un cauchemar vivant',                   stat_multiplier: 1.8,  exp_multiplier: 1.8,  gold_multiplier: 1.8,  order: 5 },
      { name: 'hell',        display_name: 'Enfer',       color: '#e74c3c', icon: '🔥', description: 'Les profondeurs de l\'enfer',          stat_multiplier: 2.2,  exp_multiplier: 2.2,  gold_multiplier: 2.2,  order: 6 },
      { name: 'divine',      display_name: 'Divin',       color: '#f1c40f', icon: '✨', description: 'Le défi divin',                        stat_multiplier: 2.6,  exp_multiplier: 2.6,  gold_multiplier: 2.6,  order: 7 },
      // Hardcore tiers
      { name: 'ancient',     display_name: 'Ancien',      color: '#7f8c8d', icon: '🏺', description: 'Vestiges d\'une ère oubliée',         stat_multiplier: 3.0,  exp_multiplier: 3.0,  gold_multiplier: 3.0,  order: 8 },
      { name: 'mystical',    display_name: 'Mystique',    color: '#6c5ce7', icon: '🔮', description: 'Puissances occultes',                  stat_multiplier: 3.4,  exp_multiplier: 3.4,  gold_multiplier: 3.4,  order: 9 },
      { name: 'cursed',      display_name: 'Maudit',      color: '#2c3e50', icon: '☠️', description: 'Béni des malédictions',               stat_multiplier: 3.9,  exp_multiplier: 3.9,  gold_multiplier: 3.9,  order: 10 },
      { name: 'blessed',     display_name: 'Béni',        color: '#27ae60', icon: '🕊️', description: 'Sanctifié et dangereux',              stat_multiplier: 4.4,  exp_multiplier: 4.4,  gold_multiplier: 4.4,  order: 11 },
      { name: 'eternal',     display_name: 'Éternel',     color: '#2980b9', icon: '♾️', description: 'Défi sans fin',                        stat_multiplier: 4.9,  exp_multiplier: 4.9,  gold_multiplier: 4.9,  order: 12 },
      { name: 'forgotten',   display_name: 'Oublié',      color: '#95a5a6', icon: '🗿', description: 'Perdu dans le temps',                   stat_multiplier: 5.4,  exp_multiplier: 5.4,  gold_multiplier: 5.4,  order: 13 },
      { name: 'legendary',   display_name: 'Légendaire',  color: '#f093fb', icon: '👑', description: 'Héroïsme immortel',                    stat_multiplier: 6.0,  exp_multiplier: 6.0,  gold_multiplier: 6.0,  order: 14 },
      { name: 'mythical',    display_name: 'Mythique',    color: '#9b59b6', icon: '🐉', description: 'Au-delà des légendes',                 stat_multiplier: 6.7,  exp_multiplier: 6.7,  gold_multiplier: 6.7,  order: 15 },
      { name: 'primal',      display_name: 'Primal',      color: '#16a085', icon: '🦴', description: 'Forces primordiales',                  stat_multiplier: 7.4,  exp_multiplier: 7.4,  gold_multiplier: 7.4,  order: 16 },
      { name: 'arcane',      display_name: 'Arcanique',   color: '#34495e', icon: '✨', description: 'Magie interdite',                      stat_multiplier: 8.2,  exp_multiplier: 8.2,  gold_multiplier: 8.2,  order: 17 },
      // Ultimes
      { name: 'dark',        display_name: 'Dark',        color: '#2c3e50', icon: '🌑', description: 'Ténèbres absolues',                    stat_multiplier: 9.0,  exp_multiplier: 9.0,  gold_multiplier: 9.0,  order: 18 },
      { name: 'light',       display_name: 'Light',       color: '#f9e79f', icon: '🌟', description: 'Lumière transcendante',                 stat_multiplier: 10.0, exp_multiplier: 10.0, gold_multiplier: 10.0, order: 19 }
    ];

    this.difficulties = difficulties;
    return difficulties;
  }

  getDifficultyByName(name) {
    return this.difficulties.find(d => d.name === name);
  }

  getAllDifficulties() {
    return this.difficulties;
  }
}

module.exports = new DifficultyManager();
