// Système de quêtes quotidiennes et hebdomadaires pour l'API RPG Dungeon

const { Pool } = require('pg');

class QuestSystem {
  constructor(pool) {
    this.pool = pool;
    this.dailyQuests = new Map();
    this.weeklyQuests = new Map();
    this.initializeQuests();
  }

  initializeQuests() {
    // Quêtes quotidiennes
    this.dailyQuests.set('kill_monsters', {
      id: 'kill_monsters',
      name: 'Chasse aux Monstres',
      description: 'Tuez 10 monstres dans les donjons',
      type: 'daily',
      difficulty: 'easy',
      requirements: {
        type: 'kill_monsters',
        target: 10,
        monsterTypes: ['goblin', 'orc', 'skeleton']
      },
      rewards: {
        gold: 100,
        experience: 50,
        items: [{ itemId: 'health_potion', quantity: 2 }]
      },
      level: 1
    });

    this.dailyQuests.set('collect_herbs', {
      id: 'collect_herbs',
      name: 'Collecte d\'Herbes',
      description: 'Collectez 5 herbes médicinales',
      type: 'daily',
      difficulty: 'easy',
      requirements: {
        type: 'collect_items',
        target: 5,
        itemTypes: ['healing_herb', 'mana_herb']
      },
      rewards: {
        gold: 80,
        experience: 40,
        items: [{ itemId: 'mana_potion', quantity: 1 }]
      },
      level: 1
    });

    this.dailyQuests.set('explore_dungeon', {
      id: 'explore_dungeon',
      name: 'Exploration de Donjon',
      description: 'Explorez 3 donjons différents',
      type: 'daily',
      difficulty: 'medium',
      requirements: {
        type: 'explore_dungeons',
        target: 3,
        dungeonTypes: ['cave', 'ruins', 'forest']
      },
      rewards: {
        gold: 150,
        experience: 75,
        items: [{ itemId: 'treasure_map', quantity: 1 }]
      },
      level: 5
    });

    this.dailyQuests.set('craft_items', {
      id: 'craft_items',
      name: 'Artisanat',
      description: 'Créez 3 objets',
      type: 'daily',
      difficulty: 'medium',
      requirements: {
        type: 'craft_items',
        target: 3,
        itemTypes: ['weapon', 'armor', 'potion']
      },
      rewards: {
        gold: 120,
        experience: 60,
        items: [{ itemId: 'crafting_materials', quantity: 5 }]
      },
      level: 8
    });

    this.dailyQuests.set('defeat_boss', {
      id: 'defeat_boss',
      name: 'Défaite de Boss',
      description: 'Défaites 1 boss de donjon',
      type: 'daily',
      difficulty: 'hard',
      requirements: {
        type: 'defeat_boss',
        target: 1,
        bossTypes: ['dragon', 'lich', 'demon']
      },
      rewards: {
        gold: 300,
        experience: 150,
        items: [{ itemId: 'boss_trophy', quantity: 1 }]
      },
      level: 15
    });

    this.dailyQuests.set('guild_contribution', {
      id: 'guild_contribution',
      name: 'Contribution de Guilde',
      description: 'Contribuez 500 or à votre guilde',
      type: 'daily',
      difficulty: 'medium',
      requirements: {
        type: 'guild_contribution',
        target: 500,
        resource: 'gold'
      },
      rewards: {
        gold: 200,
        experience: 100,
        guildPoints: 50
      },
      level: 10
    });

    this.dailyQuests.set('pvp_victory', {
      id: 'pvp_victory',
      name: 'Victoire PvP',
      description: 'Gagnez 2 combats PvP',
      type: 'daily',
      difficulty: 'hard',
      requirements: {
        type: 'pvp_victory',
        target: 2
      },
      rewards: {
        gold: 250,
        experience: 125,
        honor: 100
      },
      level: 20
    });

    this.dailyQuests.set('complete_dungeon', {
      id: 'complete_dungeon',
      name: 'Donjon Complet',
      description: 'Complétez 1 donjon de niveau 5 ou plus',
      type: 'daily',
      difficulty: 'medium',
      requirements: {
        type: 'complete_dungeon',
        target: 1,
        minLevel: 5
      },
      rewards: {
        gold: 180,
        experience: 90,
        items: [{ itemId: 'dungeon_key', quantity: 1 }]
      },
      level: 12
    });

    // Quêtes hebdomadaires
    this.weeklyQuests.set('weekly_dungeon_master', {
      id: 'weekly_dungeon_master',
      name: 'Maître des Donjons',
      description: 'Complétez 20 donjons cette semaine',
      type: 'weekly',
      difficulty: 'hard',
      requirements: {
        type: 'complete_dungeons',
        target: 20
      },
      rewards: {
        gold: 2000,
        experience: 1000,
        items: [
          { itemId: 'legendary_weapon', quantity: 1 },
          { itemId: 'dungeon_master_title', quantity: 1 }
        ]
      },
      level: 25
    });

    this.weeklyQuests.set('weekly_monster_slayer', {
      id: 'weekly_monster_slayer',
      name: 'Tueur de Monstres',
      description: 'Tuez 100 monstres cette semaine',
      type: 'weekly',
      difficulty: 'medium',
      requirements: {
        type: 'kill_monsters',
        target: 100
      },
      rewards: {
        gold: 1500,
        experience: 750,
        items: [
          { itemId: 'monster_slayer_armor', quantity: 1 },
          { itemId: 'slayer_title', quantity: 1 }
        ]
      },
      level: 20
    });

    this.weeklyQuests.set('weekly_crafter', {
      id: 'weekly_crafter',
      name: 'Artisan Expert',
      description: 'Créez 25 objets cette semaine',
      type: 'weekly',
      difficulty: 'medium',
      requirements: {
        type: 'craft_items',
        target: 25
      },
      rewards: {
        gold: 1800,
        experience: 900,
        items: [
          { itemId: 'master_crafter_tools', quantity: 1 },
          { itemId: 'crafter_title', quantity: 1 }
        ]
      },
      level: 18
    });

    this.weeklyQuests.set('weekly_pvp_champion', {
      id: 'weekly_pvp_champion',
      name: 'Champion PvP',
      description: 'Gagnez 15 combats PvP cette semaine',
      type: 'weekly',
      difficulty: 'hard',
      requirements: {
        type: 'pvp_victory',
        target: 15
      },
      rewards: {
        gold: 2500,
        experience: 1250,
        honor: 1000,
        items: [
          { itemId: 'champion_weapon', quantity: 1 },
          { itemId: 'pvp_champion_title', quantity: 1 }
        ]
      },
      level: 30
    });

    this.weeklyQuests.set('weekly_guild_hero', {
      id: 'weekly_guild_hero',
      name: 'Héros de Guilde',
      description: 'Contribuez 5000 or à votre guilde cette semaine',
      type: 'weekly',
      difficulty: 'medium',
      requirements: {
        type: 'guild_contribution',
        target: 5000,
        resource: 'gold'
      },
      rewards: {
        gold: 3000,
        experience: 1500,
        guildPoints: 500,
        items: [
          { itemId: 'guild_hero_badge', quantity: 1 },
          { itemId: 'guild_hero_title', quantity: 1 }
        ]
      },
      level: 22
    });

    this.weeklyQuests.set('weekly_explorer', {
      id: 'weekly_explorer',
      name: 'Explorateur Intrépide',
      description: 'Explorez 15 donjons différents cette semaine',
      type: 'weekly',
      difficulty: 'medium',
      requirements: {
        type: 'explore_dungeons',
        target: 15
      },
      rewards: {
        gold: 1600,
        experience: 800,
        items: [
          { itemId: 'explorer_compass', quantity: 1 },
          { itemId: 'explorer_title', quantity: 1 }
        ]
      },
      level: 15
    });

    this.weeklyQuests.set('weekly_boss_hunter', {
      id: 'weekly_boss_hunter',
      name: 'Chasseur de Boss',
      description: 'Défaites 10 boss cette semaine',
      type: 'weekly',
      difficulty: 'hard',
      requirements: {
        type: 'defeat_boss',
        target: 10
      },
      rewards: {
        gold: 3000,
        experience: 1500,
        items: [
          { itemId: 'boss_hunter_weapon', quantity: 1 },
          { itemId: 'boss_hunter_title', quantity: 1 }
        ]
      },
      level: 35
    });

    this.weeklyQuests.set('weekly_achievement_hunter', {
      id: 'weekly_achievement_hunter',
      name: 'Chasseur de Succès',
      description: 'Débloquez 5 succès cette semaine',
      type: 'weekly',
      difficulty: 'medium',
      requirements: {
        type: 'unlock_achievements',
        target: 5
      },
      rewards: {
        gold: 1200,
        experience: 600,
        items: [
          { itemId: 'achievement_hunter_badge', quantity: 1 },
          { itemId: 'achievement_hunter_title', quantity: 1 }
        ]
      },
      level: 12
    });
  }

  async getAvailableQuests(characterId) {
    try {
      const character = await this.pool.query(
        'SELECT level FROM characters WHERE id = $1',
        [characterId]
      );

      if (character.rows.length === 0) {
        return { daily: [], weekly: [] };
      }

      const charLevel = character.rows[0].level;
      const availableDaily = [];
      const availableWeekly = [];

      // Filtrer les quêtes quotidiennes disponibles
      for (const [questId, quest] of this.dailyQuests.entries()) {
        if (quest.level <= charLevel) {
          // Vérifier si la quête n'est pas déjà complétée aujourd'hui
          const completedToday = await this.pool.query(
            'SELECT id FROM quest_completions WHERE character_id = $1 AND quest_id = $2 AND completed_at >= CURRENT_DATE',
            [characterId, questId]
          );

          if (completedToday.rows.length === 0) {
            availableDaily.push(quest);
          }
        }
      }

      // Filtrer les quêtes hebdomadaires disponibles
      for (const [questId, quest] of this.weeklyQuests.entries()) {
        if (quest.level <= charLevel) {
          // Vérifier si la quête n'est pas déjà complétée cette semaine
          const completedThisWeek = await this.pool.query(
            'SELECT id FROM quest_completions WHERE character_id = $1 AND quest_id = $2 AND completed_at >= DATE_TRUNC(\'week\', CURRENT_DATE)',
            [characterId, questId]
          );

          if (completedThisWeek.rows.length === 0) {
            availableWeekly.push(quest);
          }
        }
      }

      return {
        daily: availableDaily,
        weekly: availableWeekly
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des quêtes disponibles:', error);
      return { daily: [], weekly: [] };
    }
  }

  async startQuest(characterId, questId) {
    try {
      const quest = this.dailyQuests.get(questId) || this.weeklyQuests.get(questId);
      if (!quest) {
        throw new Error('Quête introuvable');
      }

      // Vérifier si la quête est déjà en cours
      const activeQuest = await this.pool.query(
        'SELECT id FROM active_quests WHERE character_id = $1 AND quest_id = $2',
        [characterId, questId]
      );

      if (activeQuest.rows.length > 0) {
        throw new Error('Quête déjà en cours');
      }

      // Vérifier si la quête est déjà complétée
      const completedQuest = await this.pool.query(
        'SELECT id FROM quest_completions WHERE character_id = $1 AND quest_id = $2 AND completed_at >= $3',
        [characterId, questId, quest.type === 'daily' ? 'CURRENT_DATE' : 'DATE_TRUNC(\'week\', CURRENT_DATE)']
      );

      if (completedQuest.rows.length > 0) {
        throw new Error('Quête déjà complétée');
      }

      // Démarrer la quête
      await this.pool.query(
        'INSERT INTO active_quests (character_id, quest_id, started_at, progress) VALUES ($1, $2, NOW(), $3)',
        [characterId, questId, JSON.stringify({ current: 0, target: quest.requirements.target })]
      );

      return {
        message: 'Quête démarrée avec succès',
        quest: quest
      };
    } catch (error) {
      console.error('Erreur lors du démarrage de la quête:', error);
      throw error;
    }
  }

  async updateQuestProgress(characterId, questId, progress) {
    try {
      const activeQuest = await this.pool.query(
        'SELECT * FROM active_quests WHERE character_id = $1 AND quest_id = $2',
        [characterId, questId]
      );

      if (activeQuest.rows.length === 0) {
        throw new Error('Quête active introuvable');
      }

      const questData = activeQuest.rows[0];
      const currentProgress = JSON.parse(questData.progress);
      
      // Mettre à jour le progrès
      currentProgress.current = Math.min(currentProgress.current + progress, currentProgress.target);
      
      await this.pool.query(
        'UPDATE active_quests SET progress = $1 WHERE character_id = $2 AND quest_id = $3',
        [JSON.stringify(currentProgress), characterId, questId]
      );

      // Vérifier si la quête est complétée
      if (currentProgress.current >= currentProgress.target) {
        await this.completeQuest(characterId, questId);
      }

      return {
        current: currentProgress.current,
        target: currentProgress.target,
        completed: currentProgress.current >= currentProgress.target
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du progrès de la quête:', error);
      throw error;
    }
  }

  async completeQuest(characterId, questId) {
    try {
      const quest = this.dailyQuests.get(questId) || this.weeklyQuests.get(questId);
      if (!quest) {
        throw new Error('Quête introuvable');
      }

      // Vérifier si la quête est active
      const activeQuest = await this.pool.query(
        'SELECT * FROM active_quests WHERE character_id = $1 AND quest_id = $2',
        [characterId, questId]
      );

      if (activeQuest.rows.length === 0) {
        throw new Error('Quête active introuvable');
      }

      const questData = activeQuest.rows[0];
      const progress = JSON.parse(questData.progress);

      if (progress.current < progress.target) {
        throw new Error('Quête non complétée');
      }

      // Donner les récompenses
      await this.giveQuestRewards(characterId, quest);

      // Marquer la quête comme complétée
      await this.pool.query(
        'INSERT INTO quest_completions (character_id, quest_id, completed_at) VALUES ($1, $2, NOW())',
        [characterId, questId]
      );

      // Supprimer de la liste des quêtes actives
      await this.pool.query(
        'DELETE FROM active_quests WHERE character_id = $1 AND quest_id = $2',
        [characterId, questId]
      );

      return {
        message: 'Quête complétée avec succès',
        rewards: quest.rewards
      };
    } catch (error) {
      console.error('Erreur lors de la finalisation de la quête:', error);
      throw error;
    }
  }

  async giveQuestRewards(characterId, quest) {
    try {
      const client = await this.pool.connect();
      await client.query('BEGIN');

      // Donner de l'or
      if (quest.rewards.gold) {
        await client.query(
          'UPDATE characters SET gold = gold + $1 WHERE id = $2',
          [quest.rewards.gold, characterId]
        );
      }

      // Donner de l'expérience
      if (quest.rewards.experience) {
        await client.query(
          'UPDATE characters SET experience = experience + $1 WHERE id = $2',
          [quest.rewards.experience, characterId]
        );
      }

      // Donner des points de guilde
      if (quest.rewards.guildPoints) {
        const character = await client.query(
          'SELECT guild_id FROM characters WHERE id = $1',
          [characterId]
        );

        if (character.rows.length > 0 && character.rows[0].guild_id) {
          await client.query(
            'UPDATE guilds SET points = points + $1 WHERE id = $2',
            [quest.rewards.guildPoints, character.rows[0].guild_id]
          );
        }
      }

      // Donner de l'honneur
      if (quest.rewards.honor) {
        await client.query(
          'UPDATE characters SET honor = honor + $1 WHERE id = $2',
          [quest.rewards.honor, characterId]
        );
      }

      // Donner des objets
      if (quest.rewards.items) {
        for (const item of quest.rewards.items) {
          const existingItem = await client.query(
            'SELECT quantity FROM character_inventory WHERE character_id = $1 AND item_id = $2',
            [characterId, item.itemId]
          );

          if (existingItem.rows.length > 0) {
            await client.query(
              'UPDATE character_inventory SET quantity = quantity + $1 WHERE character_id = $2 AND item_id = $3',
              [item.quantity, characterId, item.itemId]
            );
          } else {
            await client.query(
              'INSERT INTO character_inventory (character_id, item_id, quantity) VALUES ($1, $2, $3)',
              [characterId, item.itemId, item.quantity]
            );
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getActiveQuests(characterId) {
    try {
      const result = await this.pool.query(`
        SELECT 
          aq.*,
          q.name,
          q.description,
          q.type,
          q.difficulty,
          q.rewards
        FROM active_quests aq
        LEFT JOIN daily_quests q ON aq.quest_id = q.id
        WHERE aq.character_id = $1
        UNION
        SELECT 
          aq.*,
          q.name,
          q.description,
          q.type,
          q.difficulty,
          q.rewards
        FROM active_quests aq
        LEFT JOIN weekly_quests q ON aq.quest_id = q.id
        WHERE aq.character_id = $1
        ORDER BY aq.started_at DESC
      `, [characterId]);

      return result.rows.map(row => ({
        ...row,
        progress: JSON.parse(row.progress),
        rewards: JSON.parse(row.rewards)
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des quêtes actives:', error);
      return [];
    }
  }

  async getQuestHistory(characterId, limit = 20) {
    try {
      const result = await this.pool.query(`
        SELECT 
          qc.*,
          q.name,
          q.description,
          q.type,
          q.difficulty,
          q.rewards
        FROM quest_completions qc
        LEFT JOIN daily_quests q ON qc.quest_id = q.id
        WHERE qc.character_id = $1
        UNION
        SELECT 
          qc.*,
          q.name,
          q.description,
          q.type,
          q.difficulty,
          q.rewards
        FROM quest_completions qc
        LEFT JOIN weekly_quests q ON qc.quest_id = q.id
        WHERE qc.character_id = $1
        ORDER BY qc.completed_at DESC
        LIMIT $2
      `, [characterId, limit]);

      return result.rows.map(row => ({
        ...row,
        rewards: JSON.parse(row.rewards)
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des quêtes:', error);
      return [];
    }
  }

  async getQuestStats(characterId) {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total_completed,
          COUNT(CASE WHEN q.type = 'daily' THEN 1 END) as daily_completed,
          COUNT(CASE WHEN q.type = 'weekly' THEN 1 END) as weekly_completed,
          SUM(CASE WHEN q.rewards->>'gold' IS NOT NULL THEN (q.rewards->>'gold')::int ELSE 0 END) as total_gold_earned,
          SUM(CASE WHEN q.rewards->>'experience' IS NOT NULL THEN (q.rewards->>'experience')::int ELSE 0 END) as total_experience_earned
        FROM quest_completions qc
        LEFT JOIN daily_quests q ON qc.quest_id = q.id
        WHERE qc.character_id = $1
        UNION
        SELECT 
          COUNT(*) as total_completed,
          COUNT(CASE WHEN q.type = 'daily' THEN 1 END) as daily_completed,
          COUNT(CASE WHEN q.type = 'weekly' THEN 1 END) as weekly_completed,
          SUM(CASE WHEN q.rewards->>'gold' IS NOT NULL THEN (q.rewards->>'gold')::int ELSE 0 END) as total_gold_earned,
          SUM(CASE WHEN q.rewards->>'experience' IS NOT NULL THEN (q.rewards->>'experience')::int ELSE 0 END) as total_experience_earned
        FROM quest_completions qc
        LEFT JOIN weekly_quests q ON qc.quest_id = q.id
        WHERE qc.character_id = $1
      `, [characterId]);

      if (result.rows.length === 0) {
        return {
          totalCompleted: 0,
          dailyCompleted: 0,
          weeklyCompleted: 0,
          totalGoldEarned: 0,
          totalExperienceEarned: 0
        };
      }

      const stats = result.rows[0];
      return {
        totalCompleted: parseInt(stats.total_completed),
        dailyCompleted: parseInt(stats.daily_completed),
        weeklyCompleted: parseInt(stats.weekly_completed),
        totalGoldEarned: parseInt(stats.total_gold_earned),
        totalExperienceEarned: parseInt(stats.total_experience_earned)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de quêtes:', error);
      return null;
    }
  }

  async getQuestLeaderboard(limit = 10) {
    try {
      const result = await this.pool.query(`
        SELECT 
          u.username,
          c.name as character_name,
          COUNT(qc.id) as quests_completed,
          SUM(CASE WHEN q.rewards->>'gold' IS NOT NULL THEN (q.rewards->>'gold')::int ELSE 0 END) as total_gold_earned
        FROM users u
        JOIN characters c ON u.id = c.user_id
        JOIN quest_completions qc ON c.id = qc.character_id
        LEFT JOIN daily_quests q ON qc.quest_id = q.id
        GROUP BY u.id, u.username, c.name
        UNION
        SELECT 
          u.username,
          c.name as character_name,
          COUNT(qc.id) as quests_completed,
          SUM(CASE WHEN q.rewards->>'gold' IS NOT NULL THEN (q.rewards->>'gold')::int ELSE 0 END) as total_gold_earned
        FROM users u
        JOIN characters c ON u.id = c.user_id
        JOIN quest_completions qc ON c.id = qc.character_id
        LEFT JOIN weekly_quests q ON qc.quest_id = q.id
        GROUP BY u.id, u.username, c.name
        ORDER BY quests_completed DESC, total_gold_earned DESC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération du leaderboard des quêtes:', error);
      return [];
    }
  }

  getDailyQuests() {
    return Array.from(this.dailyQuests.values());
  }

  getWeeklyQuests() {
    return Array.from(this.weeklyQuests.values());
  }

  getQuest(questId) {
    return this.dailyQuests.get(questId) || this.weeklyQuests.get(questId);
  }
}

module.exports = QuestSystem;

