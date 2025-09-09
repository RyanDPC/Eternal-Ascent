class SkillManager {
  constructor() {
    this.skills = this.generateSkills();
  }

  // =====================================================
  // GESTION DES COMPÉTENCES
  // =====================================================

  // Obtenir toutes les compétences
  getAllSkills() {
    return this.skills;
  }

  // Obtenir les compétences par classe
  getSkillsByClass(className) {
    return this.skills.filter(skill => 
      skill.available_classes.includes(className) || 
      skill.available_classes.includes('all')
    );
  }

  // Obtenir une compétence par ID
  getSkillById(skillId) {
    return this.skills.find(skill => skill.id === skillId);
  }

  // Calculer les dégâts d'une compétence
  calculateSkillDamage(skill, caster, target) {
    const baseDamage = skill.damage;
    const casterAttack = caster.attack || caster.magic_attack;
    const targetDefense = target.defense || target.magic_defense;
    
    // Calcul des dégâts de base
    let damage = baseDamage.min + Math.floor(Math.random() * (baseDamage.max - baseDamage.min + 1));
    
    // Bonus d'attaque du lanceur
    damage += Math.floor(casterAttack * 0.3);
    
    // Réduction de défense de la cible
    damage = Math.max(1, damage - Math.floor(targetDefense * 0.2));
    
    // Chance critique
    const criticalChance = (caster.critical_rate || 5) / 100;
    if (Math.random() < criticalChance) {
      damage = Math.floor(damage * (caster.critical_damage || 150) / 100);
    }
    
    return damage;
  }

  // Calculer les soins d'une compétence
  calculateSkillHealing(skill, caster) {
    const baseHealing = skill.healing;
    const casterMagic = caster.magic_attack || caster.attack;
    
    let healing = baseHealing.min + Math.floor(Math.random() * (baseHealing.max - baseHealing.min + 1));
    healing += Math.floor(casterMagic * 0.2);
    
    return healing;
  }

  // Appliquer les effets de statut
  applyStatusEffects(skill, caster, target) {
    const effects = [];
    
    if (skill.buffs) {
      for (const [stat, value] of Object.entries(skill.buffs)) {
        effects.push({
          type: 'buff',
          stat: stat,
          value: value,
          duration: skill.duration || 3,
          target: 'self'
        });
      }
    }
    
    if (skill.debuffs) {
      for (const [stat, value] of Object.entries(skill.debuffs)) {
        effects.push({
          type: 'debuff',
          stat: stat,
          value: value,
          duration: skill.duration || 3,
          target: 'enemy'
        });
      }
    }
    
    return effects;
  }

  // Vérifier si une compétence peut être utilisée
  canUseSkill(skill, caster) {
    // Vérifier le coût en mana
    if (caster.current_mana < skill.mana_cost) {
      return { canUse: false, reason: 'mana_insufficient' };
    }
    
    // Vérifier le niveau requis
    if (caster.level < skill.level_requirement) {
      return { canUse: false, reason: 'level_insufficient' };
    }
    
    // Vérifier le cooldown (serait géré côté client/serveur)
    
    return { canUse: true };
  }

  // =====================================================
  // GÉNÉRATION DES COMPÉTENCES
  // =====================================================

  generateSkills() {
    return [
      // Compétences de Guerrier
      {
        id: 1,
        name: 'fury_strike',
        display_name: 'Frappe de Fureur',
        description: 'Une attaque puissante qui inflige des dégâts élevés',
        type: 'offensive',
        class: 'warrior',
        available_classes: ['warrior', 'paladin'],
        level_requirement: 1,
        mana_cost: 15,
        cooldown: 0,
        damage: { min: 25, max: 40 },
        healing: null,
        shield: null,
        buffs: null,
        debuffs: null,
        effects: ['stun_chance'],
        icon: '⚔️',
        animation: 'fury_strike'
      },
      {
        id: 2,
        name: 'shield_bash',
        display_name: 'Coup de Bouclier',
        description: 'Assomme l\'ennemi et réduit sa défense',
        type: 'offensive',
        class: 'warrior',
        available_classes: ['warrior', 'paladin'],
        level_requirement: 3,
        mana_cost: 20,
        cooldown: 2,
        damage: { min: 15, max: 25 },
        healing: null,
        shield: null,
        buffs: null,
        debuffs: { defense: -20 },
        effects: ['stun'],
        icon: '🛡️',
        animation: 'shield_bash'
      },
      {
        id: 3,
        name: 'berserker_rage',
        display_name: 'Rage Berserker',
        description: 'Augmente l\'attaque et la vitesse au détriment de la défense',
        type: 'buff',
        class: 'warrior',
        available_classes: ['warrior'],
        level_requirement: 5,
        mana_cost: 30,
        cooldown: 5,
        damage: null,
        healing: null,
        shield: null,
        buffs: { attack: 30, speed: 20, defense: -15 },
        debuffs: null,
        effects: [],
        duration: 5,
        icon: '😡',
        animation: 'berserker_rage'
      },

      // Compétences de Mage
      {
        id: 4,
        name: 'fireball',
        display_name: 'Boule de Feu',
        description: 'Lance une boule de feu qui brûle l\'ennemi',
        type: 'offensive',
        class: 'mage',
        available_classes: ['mage', 'wizard'],
        level_requirement: 1,
        mana_cost: 20,
        cooldown: 0,
        damage: { min: 30, max: 45 },
        healing: null,
        shield: null,
        buffs: null,
        debuffs: null,
        effects: ['burn'],
        icon: '🔥',
        animation: 'fireball'
      },
      {
        id: 5,
        name: 'ice_shard',
        display_name: 'Éclat de Glace',
        description: 'Gèle l\'ennemi et réduit sa vitesse',
        type: 'offensive',
        class: 'mage',
        available_classes: ['mage', 'wizard'],
        level_requirement: 2,
        mana_cost: 18,
        cooldown: 1,
        damage: { min: 20, max: 35 },
        healing: null,
        shield: null,
        buffs: null,
        debuffs: { speed: -25 },
        effects: ['freeze'],
        icon: '❄️',
        animation: 'ice_shard'
      },
      {
        id: 6,
        name: 'heal',
        display_name: 'Soin',
        description: 'Restaure les points de vie',
        type: 'healing',
        class: 'mage',
        available_classes: ['mage', 'wizard', 'priest'],
        level_requirement: 1,
        mana_cost: 25,
        cooldown: 0,
        damage: null,
        healing: { min: 40, max: 60 },
        shield: null,
        buffs: null,
        debuffs: null,
        effects: [],
        icon: '✨',
        animation: 'heal'
      },
      {
        id: 7,
        name: 'mana_shield',
        display_name: 'Bouclier de Mana',
        description: 'Crée un bouclier qui absorbe les dégâts',
        type: 'defensive',
        class: 'mage',
        available_classes: ['mage', 'wizard'],
        level_requirement: 4,
        mana_cost: 35,
        cooldown: 3,
        damage: null,
        healing: null,
        shield: { min: 50, max: 80 },
        buffs: null,
        debuffs: null,
        effects: [],
        duration: 4,
        icon: '🔮',
        animation: 'mana_shield'
      },

      // Compétences d'Archer
      {
        id: 8,
        name: 'precise_shot',
        display_name: 'Tir Précis',
        description: 'Un tir qui ignore une partie de la défense',
        type: 'offensive',
        class: 'archer',
        available_classes: ['archer', 'ranger'],
        level_requirement: 1,
        mana_cost: 12,
        cooldown: 0,
        damage: { min: 20, max: 35 },
        healing: null,
        shield: null,
        buffs: null,
        debuffs: null,
        effects: ['armor_penetration'],
        icon: '🏹',
        animation: 'precise_shot'
      },
      {
        id: 9,
        name: 'multi_shot',
        display_name: 'Tir Multiple',
        description: 'Tire plusieurs flèches en même temps',
        type: 'offensive',
        class: 'archer',
        available_classes: ['archer', 'ranger'],
        level_requirement: 3,
        mana_cost: 25,
        cooldown: 2,
        damage: { min: 15, max: 25 },
        healing: null,
        shield: null,
        buffs: null,
        debuffs: null,
        effects: ['multi_hit'],
        icon: '🏹',
        animation: 'multi_shot'
      },
      {
        id: 10,
        name: 'evasion',
        display_name: 'Évasion',
        description: 'Augmente temporairement la chance d\'esquive',
        type: 'buff',
        class: 'archer',
        available_classes: ['archer', 'ranger', 'rogue'],
        level_requirement: 2,
        mana_cost: 20,
        cooldown: 4,
        damage: null,
        healing: null,
        shield: null,
        buffs: { dodge_chance: 30 },
        debuffs: null,
        effects: [],
        duration: 3,
        icon: '💨',
        animation: 'evasion'
      },

      // Compétences de Voleur
      {
        id: 11,
        name: 'backstab',
        display_name: 'Attaque Furtive',
        description: 'Attaque dans le dos pour des dégâts critiques',
        type: 'offensive',
        class: 'rogue',
        available_classes: ['rogue', 'assassin'],
        level_requirement: 1,
        mana_cost: 18,
        cooldown: 1,
        damage: { min: 25, max: 40 },
        healing: null,
        shield: null,
        buffs: null,
        debuffs: null,
        effects: ['critical_boost'],
        icon: '🗡️',
        animation: 'backstab'
      },
      {
        id: 12,
        name: 'poison_dart',
        display_name: 'Dard Empoisonné',
        description: 'Empoisonne l\'ennemi causant des dégâts sur la durée',
        type: 'offensive',
        class: 'rogue',
        available_classes: ['rogue', 'assassin'],
        level_requirement: 2,
        mana_cost: 15,
        cooldown: 0,
        damage: { min: 10, max: 20 },
        healing: null,
        shield: null,
        buffs: null,
        debuffs: null,
        effects: ['poison'],
        icon: '☠️',
        animation: 'poison_dart'
      },
      {
        id: 13,
        name: 'stealth',
        display_name: 'Furtivité',
        description: 'Devient invisible et augmente les dégâts de la prochaine attaque',
        type: 'buff',
        class: 'rogue',
        available_classes: ['rogue', 'assassin'],
        level_requirement: 4,
        mana_cost: 30,
        cooldown: 5,
        damage: null,
        healing: null,
        shield: null,
        buffs: { stealth: true, next_attack_damage: 50 },
        debuffs: null,
        effects: ['invisibility'],
        duration: 2,
        icon: '👤',
        animation: 'stealth'
      },

      // Compétences de Prêtre
      {
        id: 14,
        name: 'holy_light',
        display_name: 'Lumière Sacrée',
        description: 'Soin puissant qui guérit et bénit',
        type: 'healing',
        class: 'priest',
        available_classes: ['priest', 'paladin'],
        level_requirement: 1,
        mana_cost: 30,
        cooldown: 0,
        damage: null,
        healing: { min: 50, max: 80 },
        shield: null,
        buffs: { magic_defense: 15 },
        debuffs: null,
        effects: [],
        icon: '☀️',
        animation: 'holy_light'
      },
      {
        id: 15,
        name: 'smite',
        display_name: 'Châtiment',
        description: 'Attaque sacrée contre les morts-vivants et démons',
        type: 'offensive',
        class: 'priest',
        available_classes: ['priest', 'paladin'],
        level_requirement: 2,
        mana_cost: 25,
        cooldown: 1,
        damage: { min: 35, max: 50 },
        healing: null,
        shield: null,
        buffs: null,
        debuffs: null,
        effects: ['holy_damage'],
        icon: '⚡',
        animation: 'smite'
      },
      {
        id: 16,
        name: 'blessing',
        display_name: 'Bénédiction',
        description: 'Bénit l\'équipe augmentant toutes les stats',
        type: 'buff',
        class: 'priest',
        available_classes: ['priest', 'paladin'],
        level_requirement: 3,
        mana_cost: 40,
        cooldown: 6,
        damage: null,
        healing: null,
        shield: null,
        buffs: { attack: 15, defense: 15, magic_attack: 15, magic_defense: 15 },
        debuffs: null,
        effects: [],
        duration: 5,
        icon: '🙏',
        animation: 'blessing'
      }
    ];
  }

  // =====================================================
  // EFFETS DE STATUT
  // =====================================================

  // Appliquer un effet de statut
  applyStatusEffect(target, effect) {
    if (!target.status_effects) {
      target.status_effects = [];
    }
    
    // Vérifier si l'effet existe déjà
    const existingEffect = target.status_effects.find(e => e.type === effect.type);
    if (existingEffect) {
      // Renouveler la durée
      existingEffect.duration = effect.duration;
    } else {
      // Ajouter le nouvel effet
      target.status_effects.push({
        ...effect,
        id: Date.now() + Math.random()
      });
    }
  }

  // Traiter les effets de statut au début du tour
  processStatusEffects(character) {
    if (!character.status_effects || character.status_effects.length === 0) {
      return { effects: [], damage: 0, healing: 0 };
    }

    const results = {
      effects: [],
      damage: 0,
      healing: 0
    };

    // Traiter chaque effet
    character.status_effects = character.status_effects.filter(effect => {
      effect.duration--;
      
      // Effets de dégâts sur la durée
      if (effect.type === 'burn' || effect.type === 'poison') {
        const damage = Math.floor(character.max_health * 0.05); // 5% des PV max
        results.damage += damage;
        results.effects.push({
          type: 'damage_over_time',
          effect: effect.type,
          damage: damage
        });
      }
      
      // Effets de soin sur la durée
      if (effect.type === 'regeneration') {
        const healing = Math.floor(character.max_health * 0.03); // 3% des PV max
        results.healing += healing;
        results.effects.push({
          type: 'healing_over_time',
          effect: effect.type,
          healing: healing
        });
      }
      
      // Retourner true si l'effet doit continuer
      return effect.duration > 0;
    });

    return results;
  }

  // Calculer les stats modifiées par les effets
  calculateModifiedStats(character) {
    const modifiedStats = { ...character };
    
    if (!character.status_effects) {
      return modifiedStats;
    }
    
    // Appliquer les buffs et debuffs
    character.status_effects.forEach(effect => {
      if (effect.buffs) {
        Object.entries(effect.buffs).forEach(([stat, value]) => {
          if (modifiedStats[stat] !== undefined) {
            modifiedStats[stat] += value;
          }
        });
      }
      
      if (effect.debuffs) {
        Object.entries(effect.debuffs).forEach(([stat, value]) => {
          if (modifiedStats[stat] !== undefined) {
            modifiedStats[stat] += value; // value est déjà négatif pour les debuffs
          }
        });
      }
    });
    
    return modifiedStats;
  }
}

module.exports = new SkillManager();