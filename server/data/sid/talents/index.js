class TalentManager {
  constructor() {
    this.talentTrees = this.generateTalentTrees();
  }

  // =====================================================
  // GESTION DES TALENTS
  // =====================================================

  // Obtenir tous les arbres de talents
  getAllTalentTrees() {
    return this.talentTrees;
  }

  // Obtenir l'arbre de talents par classe
  getTalentTreeByClass(className) {
    return this.talentTrees.find(tree => tree.class === className);
  }

  // Obtenir un talent par ID
  getTalentById(talentId) {
    for (const tree of this.talentTrees) {
      const talent = tree.talents.find(t => t.id === talentId);
      if (talent) return talent;
    }
    return null;
  }

  // Vérifier si un talent peut être appris
  canLearnTalent(talentId, character, learnedTalents) {
    const talent = this.getTalentById(talentId);
    if (!talent) return { canLearn: false, reason: 'talent_not_found' };

    // Vérifier le niveau requis
    if (character.level < talent.level_requirement) {
      return { canLearn: false, reason: 'level_insufficient' };
    }

    // Vérifier les prérequis
    if (talent.prerequisites && talent.prerequisites.length > 0) {
      for (const prereqId of talent.prerequisites) {
        if (!learnedTalents.includes(prereqId)) {
          return { canLearn: false, reason: 'prerequisites_not_met' };
        }
      }
    }

    // Vérifier si déjà appris
    if (learnedTalents.includes(talentId)) {
      return { canLearn: false, reason: 'already_learned' };
    }

    // Vérifier les points de talent disponibles
    const spentPoints = learnedTalents.length;
    const availablePoints = Math.floor(character.level / 2); // 1 point tous les 2 niveaux
    if (spentPoints >= availablePoints) {
      return { canLearn: false, reason: 'no_talent_points' };
    }

    return { canLearn: true };
  }

  // Apprendre un talent
  async learnTalent(characterId, talentId, client) {
    const talent = this.getTalentById(talentId);
    if (!talent) {
      throw new Error('Talent non trouvé');
    }

    // Récupérer le personnage et ses talents
    const characterResult = await client.query(
      'SELECT * FROM characters WHERE id = $1',
      [characterId]
    );

    if (characterResult.rows.length === 0) {
      throw new Error('Personnage non trouvé');
    }

    const character = characterResult.rows[0];
    const learnedTalents = character.learned_talents || [];

    // Vérifier si le talent peut être appris
    const canLearn = this.canLearnTalent(talentId, character, learnedTalents);
    if (!canLearn.canLearn) {
      throw new Error(`Impossible d'apprendre ce talent: ${canLearn.reason}`);
    }

    // Ajouter le talent
    const newLearnedTalents = [...learnedTalents, talentId];

    // Appliquer les effets du talent
    const updatedStats = this.applyTalentEffects(character, talent);

    // Mettre à jour le personnage
    await client.query(`
      UPDATE characters 
      SET learned_talents = $1, stats = $2, updated_at = NOW()
      WHERE id = $3
    `, [JSON.stringify(newLearnedTalents), JSON.stringify(updatedStats), characterId]);

    return {
      success: true,
      talent: talent,
      newStats: updatedStats
    };
  }

  // Appliquer les effets d'un talent
  applyTalentEffects(character, talent) {
    const stats = character.stats || {};
    const talentEffects = stats.talent_effects || {};

    // Ajouter les effets du talent
    if (talent.effects) {
      talentEffects[talent.id] = talent.effects;
    }

    // Recalculer les stats finales
    const finalStats = this.calculateFinalStats(character, talentEffects);

    return {
      ...stats,
      talent_effects: talentEffects,
      final_stats: finalStats
    };
  }

  // Calculer les stats finales avec les talents
  calculateFinalStats(character, talentEffects) {
    const baseStats = {
      health: character.max_health,
      mana: character.max_mana,
      attack: character.attack,
      defense: character.defense,
      magic_attack: character.magic_attack,
      magic_defense: character.magic_defense,
      critical_rate: character.critical_rate,
      critical_damage: character.critical_damage
    };

    // Appliquer tous les effets de talents
    Object.values(talentEffects).forEach(effects => {
      if (effects.stat_bonuses) {
        Object.entries(effects.stat_bonuses).forEach(([stat, bonus]) => {
          if (baseStats[stat] !== undefined) {
            baseStats[stat] += bonus;
          }
        });
      }
    });

    return baseStats;
  }

  // =====================================================
  // GÉNÉRATION DES ARBRES DE TALENTS
  // =====================================================

  generateTalentTrees() {
    return [
      // Arbre de talents Guerrier
      {
        id: 'warrior',
        class: 'warrior',
        name: 'Guerrier',
        description: 'Talents pour les combattants au corps à corps',
        talents: [
          {
            id: 'warrior_1',
            name: 'Force Brute',
            description: '+10 Attaque, +5% Chance Critique',
            level_requirement: 2,
            prerequisites: [],
            effects: {
              stat_bonuses: {
                attack: 10,
                critical_rate: 5
              }
            },
            icon: '💪',
            position: { x: 0, y: 0 }
          },
          {
            id: 'warrior_2',
            name: 'Endurance',
            description: '+20 PV, +10 Défense',
            level_requirement: 2,
            prerequisites: [],
            effects: {
              stat_bonuses: {
                health: 20,
                defense: 10
              }
            },
            icon: '🛡️',
            position: { x: 1, y: 0 }
          },
          {
            id: 'warrior_3',
            name: 'Fureur Berserker',
            description: '+15% Dégâts Critiques, +5% Chance Critique',
            level_requirement: 4,
            prerequisites: ['warrior_1'],
            effects: {
              stat_bonuses: {
                critical_damage: 15,
                critical_rate: 5
              }
            },
            icon: '😡',
            position: { x: 0, y: 1 }
          },
          {
            id: 'warrior_4',
            name: 'Armure Renforcée',
            description: '+25 Défense, +10% Résistance Magique',
            level_requirement: 4,
            prerequisites: ['warrior_2'],
            effects: {
              stat_bonuses: {
                defense: 25,
                magic_defense: 10
              }
            },
            icon: '⚔️',
            position: { x: 1, y: 1 }
          },
          {
            id: 'warrior_5',
            name: 'Maître des Armes',
            description: '+20 Attaque, +10% Dégâts Critiques',
            level_requirement: 6,
            prerequisites: ['warrior_3'],
            effects: {
              stat_bonuses: {
                attack: 20,
                critical_damage: 10
              }
            },
            icon: '🗡️',
            position: { x: 0, y: 2 }
          },
          {
            id: 'warrior_6',
            name: 'Titan',
            description: '+50 PV, +30 Défense, +15 Attaque',
            level_requirement: 8,
            prerequisites: ['warrior_4', 'warrior_5'],
            effects: {
              stat_bonuses: {
                health: 50,
                defense: 30,
                attack: 15
              }
            },
            icon: '🏔️',
            position: { x: 0.5, y: 2 }
          }
        ]
      },

      // Arbre de talents Mage
      {
        id: 'mage',
        class: 'mage',
        name: 'Mage',
        description: 'Talents pour les maîtres de la magie',
        talents: [
          {
            id: 'mage_1',
            name: 'Sagesse Arcanique',
            description: '+15 Attaque Magique, +20 Mana',
            level_requirement: 2,
            prerequisites: [],
            effects: {
              stat_bonuses: {
                magic_attack: 15,
                mana: 20
              }
            },
            icon: '🔮',
            position: { x: 0, y: 0 }
          },
          {
            id: 'mage_2',
            name: 'Résistance Magique',
            description: '+15 Défense Magique, +10 PV',
            level_requirement: 2,
            prerequisites: [],
            effects: {
              stat_bonuses: {
                magic_defense: 15,
                health: 10
              }
            },
            icon: '✨',
            position: { x: 1, y: 0 }
          },
          {
            id: 'mage_3',
            name: 'Maître du Feu',
            description: '+25 Attaque Magique, +5% Chance Critique',
            level_requirement: 4,
            prerequisites: ['mage_1'],
            effects: {
              stat_bonuses: {
                magic_attack: 25,
                critical_rate: 5
              }
            },
            icon: '🔥',
            position: { x: 0, y: 1 }
          },
          {
            id: 'mage_4',
            name: 'Bouclier Mystique',
            description: '+20 Défense Magique, +30 Mana',
            level_requirement: 4,
            prerequisites: ['mage_2'],
            effects: {
              stat_bonuses: {
                magic_defense: 20,
                mana: 30
              }
            },
            icon: '🛡️',
            position: { x: 1, y: 1 }
          },
          {
            id: 'mage_5',
            name: 'Archimage',
            description: '+30 Attaque Magique, +10% Dégâts Critiques',
            level_requirement: 6,
            prerequisites: ['mage_3'],
            effects: {
              stat_bonuses: {
                magic_attack: 30,
                critical_damage: 10
              }
            },
            icon: '👑',
            position: { x: 0, y: 2 }
          },
          {
            id: 'mage_6',
            name: 'Légende Arcanique',
            description: '+50 Attaque Magique, +40 Mana, +25 Défense Magique',
            level_requirement: 8,
            prerequisites: ['mage_4', 'mage_5'],
            effects: {
              stat_bonuses: {
                magic_attack: 50,
                mana: 40,
                magic_defense: 25
              }
            },
            icon: '🌟',
            position: { x: 0.5, y: 2 }
          }
        ]
      },

      // Arbre de talents Archer
      {
        id: 'archer',
        class: 'archer',
        name: 'Archer',
        description: 'Talents pour les maîtres de l\'arc',
        talents: [
          {
            id: 'archer_1',
            name: 'Précision',
            description: '+10 Attaque, +5% Chance Critique',
            level_requirement: 2,
            prerequisites: [],
            effects: {
              stat_bonuses: {
                attack: 10,
                critical_rate: 5
              }
            },
            icon: '🎯',
            position: { x: 0, y: 0 }
          },
          {
            id: 'archer_2',
            name: 'Agilité',
            description: '+10% Chance d\'Esquive, +5 Vitesse',
            level_requirement: 2,
            prerequisites: [],
            effects: {
              stat_bonuses: {
                dodge_chance: 10,
                speed: 5
              }
            },
            icon: '💨',
            position: { x: 1, y: 0 }
          },
          {
            id: 'archer_3',
            name: 'Tir Rapide',
            description: '+15 Attaque, +10% Chance Critique',
            level_requirement: 4,
            prerequisites: ['archer_1'],
            effects: {
              stat_bonuses: {
                attack: 15,
                critical_rate: 10
              }
            },
            icon: '🏹',
            position: { x: 0, y: 1 }
          },
          {
            id: 'archer_4',
            name: 'Évasion',
            description: '+15% Chance d\'Esquive, +10 Défense',
            level_requirement: 4,
            prerequisites: ['archer_2'],
            effects: {
              stat_bonuses: {
                dodge_chance: 15,
                defense: 10
              }
            },
            icon: '👤',
            position: { x: 1, y: 1 }
          },
          {
            id: 'archer_5',
            name: 'Tir Mortel',
            description: '+20 Attaque, +15% Dégâts Critiques',
            level_requirement: 6,
            prerequisites: ['archer_3'],
            effects: {
              stat_bonuses: {
                attack: 20,
                critical_damage: 15
              }
            },
            icon: '💀',
            position: { x: 0, y: 2 }
          },
          {
            id: 'archer_6',
            name: 'Maître Archer',
            description: '+30 Attaque, +25% Chance d\'Esquive, +20% Dégâts Critiques',
            level_requirement: 8,
            prerequisites: ['archer_4', 'archer_5'],
            effects: {
              stat_bonuses: {
                attack: 30,
                dodge_chance: 25,
                critical_damage: 20
              }
            },
            icon: '🏆',
            position: { x: 0.5, y: 2 }
          }
        ]
      },

      // Arbre de talents Voleur
      {
        id: 'rogue',
        class: 'rogue',
        name: 'Voleur',
        description: 'Talents pour les maîtres de l\'ombre',
        talents: [
          {
            id: 'rogue_1',
            name: 'Furtivité',
            description: '+15% Chance d\'Esquive, +5 Attaque',
            level_requirement: 2,
            prerequisites: [],
            effects: {
              stat_bonuses: {
                dodge_chance: 15,
                attack: 5
              }
            },
            icon: '👤',
            position: { x: 0, y: 0 }
          },
          {
            id: 'rogue_2',
            name: 'Assassinat',
            description: '+10 Attaque, +10% Chance Critique',
            level_requirement: 2,
            prerequisites: [],
            effects: {
              stat_bonuses: {
                attack: 10,
                critical_rate: 10
              }
            },
            icon: '🗡️',
            position: { x: 1, y: 0 }
          },
          {
            id: 'rogue_3',
            name: 'Ombre',
            description: '+20% Chance d\'Esquive, +10 Défense',
            level_requirement: 4,
            prerequisites: ['rogue_1'],
            effects: {
              stat_bonuses: {
                dodge_chance: 20,
                defense: 10
              }
            },
            icon: '🌑',
            position: { x: 0, y: 1 }
          },
          {
            id: 'rogue_4',
            name: 'Coup Mortel',
            description: '+15 Attaque, +15% Dégâts Critiques',
            level_requirement: 4,
            prerequisites: ['rogue_2'],
            effects: {
              stat_bonuses: {
                attack: 15,
                critical_damage: 15
              }
            },
            icon: '💀',
            position: { x: 1, y: 1 }
          },
          {
            id: 'rogue_5',
            name: 'Maître Assassin',
            description: '+25 Attaque, +20% Chance Critique',
            level_requirement: 6,
            prerequisites: ['rogue_4'],
            effects: {
              stat_bonuses: {
                attack: 25,
                critical_rate: 20
              }
            },
            icon: '⚔️',
            position: { x: 1, y: 2 }
          },
          {
            id: 'rogue_6',
            name: 'Légende des Ombres',
            description: '+35 Attaque, +30% Chance d\'Esquive, +25% Dégâts Critiques',
            level_requirement: 8,
            prerequisites: ['rogue_3', 'rogue_5'],
            effects: {
              stat_bonuses: {
                attack: 35,
                dodge_chance: 30,
                critical_damage: 25
              }
            },
            icon: '👑',
            position: { x: 0.5, y: 2 }
          }
        ]
      },

      // Arbre de talents Prêtre
      {
        id: 'priest',
        class: 'priest',
        name: 'Prêtre',
        description: 'Talents pour les guérisseurs sacrés',
        talents: [
          {
            id: 'priest_1',
            name: 'Bénédiction Divine',
            description: '+15 Attaque Magique, +20 Mana',
            level_requirement: 2,
            prerequisites: [],
            effects: {
              stat_bonuses: {
                magic_attack: 15,
                mana: 20
              }
            },
            icon: '✨',
            position: { x: 0, y: 0 }
          },
          {
            id: 'priest_2',
            name: 'Protection Sacrée',
            description: '+15 Défense Magique, +20 PV',
            level_requirement: 2,
            prerequisites: [],
            effects: {
              stat_bonuses: {
                magic_defense: 15,
                health: 20
              }
            },
            icon: '🛡️',
            position: { x: 1, y: 0 }
          },
          {
            id: 'priest_3',
            name: 'Guérison Divine',
            description: '+25 Attaque Magique, +30 Mana',
            level_requirement: 4,
            prerequisites: ['priest_1'],
            effects: {
              stat_bonuses: {
                magic_attack: 25,
                mana: 30
              }
            },
            icon: '☀️',
            position: { x: 0, y: 1 }
          },
          {
            id: 'priest_4',
            name: 'Bouclier Sacré',
            description: '+25 Défense Magique, +30 PV',
            level_requirement: 4,
            prerequisites: ['priest_2'],
            effects: {
              stat_bonuses: {
                magic_defense: 25,
                health: 30
              }
            },
            icon: '⚡',
            position: { x: 1, y: 1 }
          },
          {
            id: 'priest_5',
            name: 'Grand Prêtre',
            description: '+35 Attaque Magique, +40 Mana',
            level_requirement: 6,
            prerequisites: ['priest_3'],
            effects: {
              stat_bonuses: {
                magic_attack: 35,
                mana: 40
              }
            },
            icon: '👑',
            position: { x: 0, y: 2 }
          },
          {
            id: 'priest_6',
            name: 'Avatar Divin',
            description: '+50 Attaque Magique, +60 Mana, +40 Défense Magique, +50 PV',
            level_requirement: 8,
            prerequisites: ['priest_4', 'priest_5'],
            effects: {
              stat_bonuses: {
                magic_attack: 50,
                mana: 60,
                magic_defense: 40,
                health: 50
              }
            },
            icon: '🌟',
            position: { x: 0.5, y: 2 }
          }
        ]
      }
    ];
  }
}

module.exports = new TalentManager();

