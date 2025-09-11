// =====================================================
// DIFFICULTÉS DES DONJONS
// =====================================================

class DifficultyManager {
  constructor() {
    this.difficulties = this.generateDifficulties();
  }

  generateDifficulties() {
    const difficulties = [
      {
        name: 'easy',
        display_name: 'Facile',
        color: '#4ecdc4',
        icon: '🟢',
        description: 'Parfait pour les débutants',
        stat_multiplier: 0.8,
        exp_multiplier: 0.8,
        gold_multiplier: 0.8,
        order: 1
      },
      {
        name: 'medium',
        display_name: 'Moyen',
        color: '#fdcb6e',
        icon: '🟡',
        description: 'Un défi équilibré',
        stat_multiplier: 1.0,
        exp_multiplier: 1.0,
        gold_multiplier: 1.0,
        order: 2
      },
      {
        name: 'hard',
        display_name: 'Difficile',
        color: '#ff6b6b',
        icon: '🔴',
        description: 'Pour les joueurs expérimentés',
        stat_multiplier: 1.3,
        exp_multiplier: 1.3,
        gold_multiplier: 1.3,
        order: 3
      },
      {
        name: 'legendary',
        display_name: 'Légendaire',
        color: '#f093fb',
        icon: '🟣',
        description: 'Un défi épique',
        stat_multiplier: 1.6,
        exp_multiplier: 1.6,
        gold_multiplier: 1.6,
        order: 4
      },
      {
        name: 'epic',
        display_name: 'Épique',
        color: '#9b59b6',
        icon: '🟠',
        description: 'Le défi ultime',
        stat_multiplier: 2.0,
        exp_multiplier: 2.0,
        gold_multiplier: 2.0,
        order: 5
      },
      {
        name: 'normal',
        display_name: 'Normal',
        color: '#fdcb6e',
        icon: '🟡',
        description: 'Difficulté standard',
        stat_multiplier: 1.0,
        exp_multiplier: 1.0,
        gold_multiplier: 1.0,
        order: 2
      },
      {
        name: 'nightmare',
        display_name: 'Cauchemar',
        color: '#8e44ad',
        icon: '💀',
        description: 'Un cauchemar vivant',
        stat_multiplier: 1.8,
        exp_multiplier: 1.8,
        gold_multiplier: 1.8,
        order: 6
      },
      {
        name: 'hell',
        display_name: 'Enfer',
        color: '#e74c3c',
        icon: '🔥',
        description: 'Les profondeurs de l\'enfer',
        stat_multiplier: 2.5,
        exp_multiplier: 2.5,
        gold_multiplier: 2.5,
        order: 7
      },
      {
        name: 'divine',
        display_name: 'Divin',
        color: '#f1c40f',
        icon: '✨',
        description: 'Le défi divin',
        stat_multiplier: 3.0,
        exp_multiplier: 3.0,
        gold_multiplier: 3.0,
        order: 8
      }
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
