class GuildManager {
  constructor() {
    this.guildProjects = this.generateGuildProjects();
    this.guildRaids = this.generateGuildRaids();
    this.guildEvents = this.generateGuildEvents();
  }

  // =====================================================
  // GESTION DES GUILDES
  // =====================================================

  // Créer une nouvelle guilde
  async createGuild(guildData, characterId, client) {
    const { name, display_name, description, emblem, banner } = guildData;

    try {
      await client.query('BEGIN');

      // Créer la guilde
      const guildResult = await client.query(`
        INSERT INTO guilds (name, display_name, description, emblem, banner, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [name, display_name, description, emblem, banner, characterId]);

      const guild = guildResult.rows[0];

      // Ajouter le créateur comme leader
      await client.query(`
        INSERT INTO guild_members (guild_id, character_id, rank, joined_at, last_active, contribution_points, weekly_contribution, permissions)
        VALUES ($1, $2, 'leader', NOW(), NOW(), 0, 0, $3)
      `, [guild.id, characterId, JSON.stringify({
        can_invite: true,
        can_kick: true,
        can_manage_projects: true,
        can_declare_war: true,
        can_manage_territories: true
      })]);

      // Mettre à jour le compteur de membres
      await client.query(`
        UPDATE guilds SET current_members = 1 WHERE id = $1
      `, [guild.id]);

      await client.query('COMMIT');
      return guild;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  // Rejoindre une guilde
  async joinGuild(guildId, characterId, client) {
    try {
      await client.query('BEGIN');

      // Vérifier que la guilde existe et a de la place
      const guildResult = await client.query(`
        SELECT id, max_members, current_members FROM guilds WHERE id = $1 AND status = 'active'
      `, [guildId]);

      if (guildResult.rows.length === 0) {
        throw new Error('Guilde non trouvée ou inactive');
      }

      const guild = guildResult.rows[0];
      if (guild.current_members >= guild.max_members) {
        throw new Error('Guilde pleine');
      }

      // Vérifier que le personnage n'est pas déjà dans une guilde
      const existingMember = await client.query(`
        SELECT id FROM guild_members WHERE character_id = $1
      `, [characterId]);

      if (existingMember.rows.length > 0) {
        throw new Error('Personnage déjà membre d\'une guilde');
      }

      // Ajouter le membre
      await client.query(`
        INSERT INTO guild_members (guild_id, character_id, rank, joined_at, last_active, contribution_points, weekly_contribution, permissions)
        VALUES ($1, $2, 'recruit', NOW(), NOW(), 0, 0, $3)
      `, [guildId, characterId, JSON.stringify({
        can_invite: false,
        can_kick: false,
        can_manage_projects: false,
        can_declare_war: false,
        can_manage_territories: false
      })]);

      // Mettre à jour le compteur de membres
      await client.query(`
        UPDATE guilds SET current_members = current_members + 1 WHERE id = $1
      `, [guildId]);

      await client.query('COMMIT');
      return { success: true, message: 'Rejoint la guilde avec succès' };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  // Quitter une guilde
  async leaveGuild(guildId, characterId, client) {
    try {
      await client.query('BEGIN');

      // Vérifier que le personnage est membre de la guilde
      const memberResult = await client.query(`
        SELECT rank FROM guild_members WHERE guild_id = $1 AND character_id = $2
      `, [guildId, characterId]);

      if (memberResult.rows.length === 0) {
        throw new Error('Personnage non membre de cette guilde');
      }

      const member = memberResult.rows[0];

      // Si c'est le leader, transférer le leadership ou dissoudre la guilde
      if (member.rank === 'leader') {
        // Chercher un officier pour transférer le leadership
        const officerResult = await client.query(`
          SELECT character_id FROM guild_members 
          WHERE guild_id = $1 AND rank = 'officer' 
          ORDER BY contribution_points DESC 
          LIMIT 1
        `, [guildId]);

        if (officerResult.rows.length > 0) {
          // Transférer le leadership
          await client.query(`
            UPDATE guild_members SET rank = 'leader' WHERE guild_id = $1 AND character_id = $2
          `, [guildId, officerResult.rows[0].character_id]);
        } else {
          // Dissoudre la guilde
          await client.query(`
            UPDATE guilds SET status = 'disbanded' WHERE id = $1
          `, [guildId]);
        }
      }

      // Supprimer le membre
      await client.query(`
        DELETE FROM guild_members WHERE guild_id = $1 AND character_id = $2
      `, [guildId, characterId]);

      // Mettre à jour le compteur de membres
      await client.query(`
        UPDATE guilds SET current_members = current_members - 1 WHERE id = $1
      `, [guildId]);

      await client.query('COMMIT');
      return { success: true, message: 'Quitté la guilde avec succès' };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  // =====================================================
  // GESTION DES TERRITOIRES
  // =====================================================

  // Contrôler un territoire
  async controlTerritory(guildId, territoryData, client) {
    const { territory_name, territory_type, coordinates, level = 1 } = territoryData;

    try {
      await client.query('BEGIN');

      // Vérifier que la guilde n'a pas déjà ce territoire
      const existingTerritory = await client.query(`
        SELECT id FROM guild_territories WHERE guild_id = $1 AND territory_name = $2
      `, [guildId, territory_name]);

      if (existingTerritory.rows.length > 0) {
        throw new Error('Territoire déjà contrôlé par cette guilde');
      }

      // Créer le territoire
      const territoryResult = await client.query(`
        INSERT INTO guild_territories (guild_id, territory_name, territory_type, coordinates, level, defense_points, max_defense_points, resource_production, controlled_since, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
        RETURNING *
      `, [
        guildId, 
        territory_name, 
        territory_type, 
        JSON.stringify(coordinates), 
        level,
        100, // defense_points
        100, // max_defense_points
        JSON.stringify(this.calculateResourceProduction(territory_type, level))
      ]);

      await client.query('COMMIT');
      return territoryResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  // Calculer la production de ressources selon le type de territoire
  calculateResourceProduction(territoryType, level) {
    const baseProduction = {
      'resource': { gold: 100, materials: 50, experience: 25 },
      'strategic': { gold: 75, materials: 75, experience: 50 },
      'defensive': { gold: 50, materials: 100, experience: 25 },
      'economic': { gold: 150, materials: 25, experience: 25 }
    };

    const production = baseProduction[territoryType] || baseProduction['resource'];
    const multiplier = 1 + (level - 1) * 0.2; // +20% par niveau

    return Object.fromEntries(
      Object.entries(production).map(([resource, amount]) => [
        resource, 
        Math.floor(amount * multiplier)
      ])
    );
  }

  // =====================================================
  // GESTION DES PROJETS DE GUILDE
  // =====================================================

  // Démarrer un projet de guilde
  async startGuildProject(guildId, projectData, client) {
    const { project_name, project_type, description, level = 1 } = projectData;

    try {
      await client.query('BEGIN');

      // Vérifier que la guilde n'a pas déjà ce projet actif
      const existingProject = await client.query(`
        SELECT id FROM guild_projects WHERE guild_id = $1 AND project_name = $2 AND status = 'active'
      `, [guildId, project_name]);

      if (existingProject.rows.length > 0) {
        throw new Error('Projet déjà en cours');
      }

      const projectTemplate = this.guildProjects.find(p => p.name === project_name);
      if (!projectTemplate) {
        throw new Error('Projet non trouvé');
      }

      // Créer le projet
      const projectResult = await client.query(`
        INSERT INTO guild_projects (guild_id, project_name, project_type, description, level, max_level, current_progress, required_progress, required_resources, benefits, status, started_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, 'active', NOW(), NOW(), NOW())
        RETURNING *
      `, [
        guildId,
        project_name,
        project_type,
        description,
        level,
        projectTemplate.max_level,
        projectTemplate.required_progress,
        JSON.stringify(projectTemplate.required_resources),
        JSON.stringify(projectTemplate.benefits)
      ]);

      await client.query('COMMIT');
      return projectResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  // Contribuer à un projet de guilde
  async contributeToProject(projectId, characterId, contribution, client) {
    try {
      await client.query('BEGIN');

      // Vérifier que le projet existe et est actif
      const projectResult = await client.query(`
        SELECT * FROM guild_projects WHERE id = $1 AND status = 'active'
      `, [projectId]);

      if (projectResult.rows.length === 0) {
        throw new Error('Projet non trouvé ou inactif');
      }

      const project = projectResult.rows[0];

      // Vérifier que le personnage est membre de la guilde
      const memberResult = await client.query(`
        SELECT id FROM guild_members WHERE guild_id = $1 AND character_id = $2
      `, [project.guild_id, characterId]);

      if (memberResult.rows.length === 0) {
        throw new Error('Personnage non membre de cette guilde');
      }

      // Mettre à jour le progrès du projet
      const newProgress = Math.min(project.current_progress + contribution, project.required_progress);
      const isCompleted = newProgress >= project.required_progress;

      await client.query(`
        UPDATE guild_projects 
        SET current_progress = $1, status = $2, completed_at = $3, updated_at = NOW()
        WHERE id = $4
      `, [
        newProgress,
        isCompleted ? 'completed' : 'active',
        isCompleted ? 'NOW()' : null,
        projectId
      ]);

      // Mettre à jour les points de contribution du membre
      await client.query(`
        UPDATE guild_members 
        SET contribution_points = contribution_points + $1, weekly_contribution = weekly_contribution + $1
        WHERE guild_id = $2 AND character_id = $3
      `, [contribution, project.guild_id, characterId]);

      await client.query('COMMIT');
      return { 
        success: true, 
        new_progress: newProgress,
        is_completed: isCompleted,
        contribution_added: contribution
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  // =====================================================
  // GESTION DES RAIDS DE GUILDE
  // =====================================================

  // Démarrer un raid de guilde
  async startGuildRaid(guildId, raidData, client) {
    const { raid_name, raid_type, boss_name, boss_level, difficulty = 'normal' } = raidData;

    try {
      await client.query('BEGIN');

      // Vérifier qu'il n'y a pas déjà un raid actif
      const activeRaid = await client.query(`
        SELECT id FROM guild_raids WHERE guild_id = $1 AND status = 'active'
      `, [guildId]);

      if (activeRaid.rows.length > 0) {
        throw new Error('Raid déjà en cours');
      }

      const raidTemplate = this.guildRaids.find(r => r.name === raid_name);
      if (!raidTemplate) {
        throw new Error('Raid non trouvé');
      }

      // Calculer les stats du boss
      const bossStats = this.calculateBossStats(boss_level, difficulty, raidTemplate.base_stats);
      const maxHp = bossStats.hp;

      // Créer le raid
      const raidResult = await client.query(`
        INSERT INTO guild_raids (guild_id, raid_name, raid_type, boss_name, boss_level, boss_stats, current_hp, max_hp, difficulty, max_participants, current_participants, rewards, status, started_at, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, 'active', NOW(), NOW() + INTERVAL '2 hours', NOW(), NOW())
        RETURNING *
      `, [
        guildId,
        raid_name,
        raid_type,
        boss_name,
        boss_level,
        JSON.stringify(bossStats),
        maxHp,
        maxHp,
        difficulty,
        raidTemplate.max_participants,
        JSON.stringify(raidTemplate.rewards)
      ]);

      await client.query('COMMIT');
      return raidResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  // Rejoindre un raid de guilde
  async joinGuildRaid(raidId, characterId, client) {
    try {
      await client.query('BEGIN');

      // Vérifier que le raid existe et est actif
      const raidResult = await client.query(`
        SELECT * FROM guild_raids WHERE id = $1 AND status = 'active'
      `, [raidId]);

      if (raidResult.rows.length === 0) {
        throw new Error('Raid non trouvé ou inactif');
      }

      const raid = raidResult.rows[0];

      // Vérifier que le personnage est membre de la guilde
      const memberResult = await client.query(`
        SELECT id FROM guild_members WHERE guild_id = $1 AND character_id = $2
      `, [raid.guild_id, characterId]);

      if (memberResult.rows.length === 0) {
        throw new Error('Personnage non membre de cette guilde');
      }

      // Vérifier qu'il y a de la place
      if (raid.current_participants >= raid.max_participants) {
        throw new Error('Raid plein');
      }

      // Vérifier que le personnage n'est pas déjà dans le raid
      const existingParticipant = await client.query(`
        SELECT id FROM guild_raid_participants WHERE raid_id = $1 AND character_id = $2
      `, [raidId, characterId]);

      if (existingParticipant.rows.length > 0) {
        throw new Error('Déjà participant au raid');
      }

      // Ajouter le participant
      await client.query(`
        INSERT INTO guild_raid_participants (raid_id, character_id, damage_dealt, healing_done, deaths, joined_at, last_activity)
        VALUES ($1, $2, 0, 0, 0, NOW(), NOW())
      `, [raidId, characterId]);

      // Mettre à jour le compteur de participants
      await client.query(`
        UPDATE guild_raids SET current_participants = current_participants + 1 WHERE id = $1
      `, [raidId]);

      await client.query('COMMIT');
      return { success: true, message: 'Rejoint le raid avec succès' };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  // Calculer les stats du boss selon le niveau et la difficulté
  calculateBossStats(level, difficulty, baseStats) {
    const difficultyMultipliers = {
      'easy': 1.0,
      'normal': 1.5,
      'hard': 2.0,
      'nightmare': 3.0,
      'hell': 4.0
    };

    const multiplier = difficultyMultipliers[difficulty] || 1.0;
    const levelMultiplier = 1 + (level - 1) * 0.3; // +30% par niveau

    return {
      hp: Math.floor(baseStats.hp * multiplier * levelMultiplier),
      attack: Math.floor(baseStats.attack * multiplier * levelMultiplier),
      defense: Math.floor(baseStats.defense * multiplier * levelMultiplier),
      speed: Math.floor(baseStats.speed * multiplier * levelMultiplier),
      magic_attack: Math.floor(baseStats.magic_attack * multiplier * levelMultiplier),
      magic_defense: Math.floor(baseStats.magic_defense * multiplier * levelMultiplier)
    };
  }

  // =====================================================
  // GESTION DES GUERRES DE GUILDES
  // =====================================================

  // Déclarer une guerre de guilde
  async declareGuildWar(attackingGuildId, defendingGuildId, warData, client) {
    const { war_type, territory_id, war_duration = 3600 } = warData;

    try {
      await client.query('BEGIN');

      // Vérifier que les guildes existent
      const guildsResult = await client.query(`
        SELECT id, name FROM guilds WHERE id IN ($1, $2) AND status = 'active'
      `, [attackingGuildId, defendingGuildId]);

      if (guildsResult.rows.length !== 2) {
        throw new Error('Une ou plusieurs guildes non trouvées');
      }

      // Vérifier qu'il n'y a pas déjà une guerre active entre ces guildes
      const existingWar = await client.query(`
        SELECT id FROM guild_wars 
        WHERE ((attacking_guild_id = $1 AND defending_guild_id = $2) OR 
               (attacking_guild_id = $2 AND defending_guild_id = $1)) 
        AND status IN ('declared', 'active')
      `, [attackingGuildId, defendingGuildId]);

      if (existingWar.rows.length > 0) {
        throw new Error('Guerre déjà en cours entre ces guildes');
      }

      // Créer la guerre
      const warResult = await client.query(`
        INSERT INTO guild_wars (attacking_guild_id, defending_guild_id, war_type, territory_id, status, attacking_score, defending_score, war_duration, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'declared', 0, 0, $5, NOW(), NOW())
        RETURNING *
      `, [attackingGuildId, defendingGuildId, war_type, territory_id, war_duration]);

      await client.query('COMMIT');
      return warResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  // =====================================================
  // GESTION DES ÉVÉNEMENTS DE GUILDE
  // =====================================================

  // Créer un événement de guilde
  async createGuildEvent(guildId, eventData, createdBy, client) {
    const { event_name, event_type, description, start_time, end_time, max_participants, requirements, rewards } = eventData;

    try {
      await client.query('BEGIN');

      // Vérifier que le créateur est membre de la guilde
      const memberResult = await client.query(`
        SELECT rank FROM guild_members WHERE guild_id = $1 AND character_id = $2
      `, [guildId, createdBy]);

      if (memberResult.rows.length === 0) {
        throw new Error('Personnage non membre de cette guilde');
      }

      const member = memberResult.rows[0];
      if (!['leader', 'officer'].includes(member.rank)) {
        throw new Error('Seuls les leaders et officiers peuvent créer des événements');
      }

      // Créer l'événement
      const eventResult = await client.query(`
        INSERT INTO guild_events (guild_id, event_name, event_type, description, start_time, end_time, max_participants, current_participants, requirements, rewards, status, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, 'scheduled', $10, NOW(), NOW())
        RETURNING *
      `, [
        guildId,
        event_name,
        event_type,
        description,
        start_time,
        end_time,
        max_participants,
        JSON.stringify(requirements || {}),
        JSON.stringify(rewards || {}),
        createdBy
      ]);

      await client.query('COMMIT');
      return eventResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  // =====================================================
  // GÉNÉRATION DYNAMIQUE DE GUILDES
  // =====================================================

  // Générer des guildes dynamiques
  async generateDynamicGuilds(count = 3, client) {
    const guildTemplates = this.getGuildTemplates();
    const generatedGuilds = [];

    for (let i = 0; i < count; i++) {
      const template = guildTemplates[Math.floor(Math.random() * guildTemplates.length)];
      const guildData = this.generateGuildFromTemplate(template, i + 1);
      
      try {
        // Créer la guilde dans la base de données
        const guild = await this.createGuild(guildData, null, client);
        
        // Ajouter des membres fictifs pour la démonstration
        await this.addDemoMembers(guild.id, guildData.memberCount, client);
        
        // Ajouter des territoires, projets et raids de démonstration
        await this.addDemoContent(guild.id, guildData, client);
        
        // Récupérer la guilde complète avec toutes ses données
        const completeGuild = await this.getGuildWithDetails(guild.id, client);
        generatedGuilds.push(completeGuild);
        
      } catch (error) {
        console.error(`Erreur lors de la génération de la guilde ${i + 1}:`, error);
      }
    }

    return generatedGuilds;
  }

  // Obtenir les templates de guildes
  getGuildTemplates() {
    return [
      {
        name: 'Gardiens de la Lumière',
        description: 'Protecteurs des royaumes et défenseurs de la justice',
        theme: 'defensive',
        memberCount: Math.floor(Math.random() * 20) + 30,
        level: Math.floor(Math.random() * 15) + 10
      },
      {
        name: 'Chasseurs d\'Ombres',
        description: 'Maîtres de l\'infiltration et de l\'assassinat',
        theme: 'stealth',
        memberCount: Math.floor(Math.random() * 15) + 25,
        level: Math.floor(Math.random() * 12) + 8
      },
      {
        name: 'Mages Élémentaires',
        description: 'Maîtres des arts arcaniques et de la magie',
        theme: 'magic',
        memberCount: Math.floor(Math.random() * 18) + 20,
        level: Math.floor(Math.random() * 18) + 12
      },
      {
        name: 'Guerriers du Nord',
        description: 'Combattants endurcis des terres glacées',
        theme: 'warrior',
        memberCount: Math.floor(Math.random() * 25) + 35,
        level: Math.floor(Math.random() * 20) + 15
      },
      {
        name: 'Explorateurs Intrépides',
        description: 'Aventuriers cherchant les trésors perdus',
        theme: 'adventure',
        memberCount: Math.floor(Math.random() * 12) + 18,
        level: Math.floor(Math.random() * 10) + 6
      }
    ];
  }

  // Générer une guilde à partir d'un template
  generateGuildFromTemplate(template, index) {
    const guildNames = [
      'Gardiens de la Lumière', 'Chasseurs d\'Ombres', 'Mages Élémentaires',
      'Guerriers du Nord', 'Explorateurs Intrépides', 'Défenseurs du Royaume',
      'Légion de Fer', 'Ordre Mystique', 'Fraternité des Braves',
      'Alliance Céleste', 'Confrérie des Sages', 'Garde Éternelle'
    ];

    const descriptions = [
      'Une guilde légendaire dédiée à la protection des royaumes',
      'Maîtres de l\'infiltration et de l\'assassinat',
      'Maîtres des arts arcaniques et de la magie',
      'Combattants endurcis des terres glacées',
      'Aventuriers cherchant les trésors perdus',
      'Protecteurs des territoires et défenseurs des faibles',
      'Guerriers d\'élite spécialisés dans la chasse aux dragons',
      'Groupe de mages étudiant les mystères anciens',
      'Fraternité de héros unis par l\'honneur',
      'Alliance divine protégeant les mortels',
      'Confrérie de sages préservant la connaissance',
      'Garde immortelle veillant sur l\'équilibre'
    ];

    const name = guildNames[Math.floor(Math.random() * guildNames.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    const level = Math.floor(Math.random() * 20) + 5;
    const memberCount = Math.floor(Math.random() * 30) + 20;
    const maxMembers = Math.min(memberCount + Math.floor(Math.random() * 15) + 5, 50);

    return {
      name: name.toLowerCase().replace(/\s+/g, '_'),
      display_name: name,
      description: description,
      emblem: this.generateEmblem(template.theme),
      banner: this.generateBanner(template.theme),
      level: level,
      memberCount: memberCount,
      maxMembers: maxMembers,
      guild_honor: Math.floor(Math.random() * 20000) + 5000,
      guild_coin: Math.floor(Math.random() * 100000) + 10000
    };
  }

  // Générer un emblème basé sur le thème
  generateEmblem(theme) {
    const emblems = {
      defensive: '🛡️',
      stealth: '🗡️',
      magic: '🔮',
      warrior: '⚔️',
      adventure: '🗺️'
    };
    return emblems[theme] || '⚔️';
  }

  // Générer une bannière basée sur le thème
  generateBanner(theme) {
    const banners = {
      defensive: '🛡️ Gardiens',
      stealth: '🗡️ Ombres',
      magic: '🔮 Arcanes',
      warrior: '⚔️ Guerriers',
      adventure: '🗺️ Explorateurs'
    };
    return banners[theme] || '⚔️ Guilde';
  }

  // Ajouter des membres de démonstration
  async addDemoMembers(guildId, memberCount, client) {
    const ranks = ['leader', 'officer', 'veteran', 'member', 'recruit'];
    const rankWeights = [1, 2, 3, 8, 6]; // Plus de membres normaux que de leaders

    for (let i = 0; i < memberCount; i++) {
      const rank = this.getWeightedRandomRank(ranks, rankWeights);
      const permissions = this.getRankPermissions(rank);

      await client.query(`
        INSERT INTO guild_members (guild_id, character_id, rank, joined_at, last_active, contribution_points, weekly_contribution, permissions)
        VALUES ($1, $2, $3, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days', NOW() - INTERVAL '${Math.floor(Math.random() * 7)} days', $4, $5, $6)
      `, [
        guildId,
        null, // Pas de character_id réel pour les démos
        rank,
        Math.floor(Math.random() * 1000),
        Math.floor(Math.random() * 100),
        JSON.stringify(permissions)
      ]);
    }

    // Mettre à jour le compteur de membres
    await client.query(`
      UPDATE guilds SET current_members = $1 WHERE id = $2
    `, [memberCount, guildId]);
  }

  // Obtenir un rang aléatoire pondéré
  getWeightedRandomRank(ranks, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < ranks.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return ranks[i];
      }
    }
    return ranks[ranks.length - 1];
  }

  // Obtenir les permissions selon le rang
  getRankPermissions(rank) {
    const permissions = {
      leader: {
        can_invite: true,
        can_kick: true,
        can_manage_projects: true,
        can_declare_war: true,
        can_manage_territories: true
      },
      officer: {
        can_invite: true,
        can_kick: true,
        can_manage_projects: true,
        can_declare_war: false,
        can_manage_territories: true
      },
      veteran: {
        can_invite: true,
        can_kick: false,
        can_manage_projects: false,
        can_declare_war: false,
        can_manage_territories: false
      },
      member: {
        can_invite: false,
        can_kick: false,
        can_manage_projects: false,
        can_declare_war: false,
        can_manage_territories: false
      },
      recruit: {
        can_invite: false,
        can_kick: false,
        can_manage_projects: false,
        can_declare_war: false,
        can_manage_territories: false
      }
    };
    return permissions[rank] || permissions.member;
  }

  // Ajouter du contenu de démonstration (territoires, projets, raids)
  async addDemoContent(guildId, guildData, client) {
    // Ajouter des territoires
    await this.addDemoTerritories(guildId, client);
    
    // Ajouter des projets
    await this.addDemoProjects(guildId, client);
    
    // Ajouter des raids
    await this.addDemoRaids(guildId, client);
    
    // Ajouter des événements
    await this.addDemoEvents(guildId, client);
  }

  // Ajouter des territoires de démonstration
  async addDemoTerritories(guildId, client) {
    const territoryCount = Math.floor(Math.random() * 3) + 1;
    const territoryTypes = ['resource', 'strategic', 'defensive', 'economic'];
    const territoryNames = [
      'Forteresse du Nord', 'Mines de Cristal', 'Repaire Secret', 'Tour de Guet',
      'Sanctuaire Mystique', 'Bastion de Fer', 'Oasis Cachée', 'Citadelle Perdue'
    ];

    for (let i = 0; i < territoryCount; i++) {
      const territoryData = {
        territory_name: territoryNames[Math.floor(Math.random() * territoryNames.length)],
        territory_type: territoryTypes[Math.floor(Math.random() * territoryTypes.length)],
        coordinates: { x: Math.random() * 1000, y: Math.random() * 1000 },
        level: Math.floor(Math.random() * 5) + 1
      };

      await this.controlTerritory(guildId, territoryData, client);
    }
  }

  // Ajouter des projets de démonstration
  async addDemoProjects(guildId, client) {
    const projectCount = Math.floor(Math.random() * 2) + 1;
    const projects = this.guildProjects;

    for (let i = 0; i < projectCount; i++) {
      const project = projects[Math.floor(Math.random() * projects.length)];
      const level = Math.floor(Math.random() * project.max_level) + 1;
      const progress = Math.floor(Math.random() * project.required_progress);

      const projectData = {
        project_name: project.name,
        project_type: project.type,
        description: `Projet ${project.name} de niveau ${level}`,
        level: level
      };

      try {
        await this.startGuildProject(guildId, projectData, client);
        
        // Mettre à jour le progrès
        await client.query(`
          UPDATE guild_projects 
          SET current_progress = $1, status = $2
          WHERE guild_id = $3 AND project_name = $4
        `, [
          progress,
          progress >= project.required_progress ? 'completed' : 'active',
          guildId,
          project.name
        ]);
      } catch (error) {
        console.error('Erreur lors de l\'ajout du projet de démo:', error);
      }
    }
  }

  // Ajouter des raids de démonstration
  async addDemoRaids(guildId, client) {
    const raidCount = Math.floor(Math.random() * 2) + 1;
    const raids = this.guildRaids;

    for (let i = 0; i < raidCount; i++) {
      const raid = raids[Math.floor(Math.random() * raids.length)];
      const bossLevel = Math.floor(Math.random() * 20) + 10;
      const difficulty = ['easy', 'normal', 'hard'][Math.floor(Math.random() * 3)];
      const status = Math.random() > 0.5 ? 'active' : 'completed';

      const raidData = {
        raid_name: raid.name,
        raid_type: raid.type,
        boss_name: this.generateBossName(raid.name),
        boss_level: bossLevel,
        difficulty: difficulty
      };

      try {
        const createdRaid = await this.startGuildRaid(guildId, raidData, client);
        
        if (status === 'completed') {
          await client.query(`
            UPDATE guild_raids 
            SET status = 'completed', current_hp = 0, completed_at = NOW()
            WHERE id = $1
          `, [createdRaid.id]);
        }
      } catch (error) {
        console.error('Erreur lors de l\'ajout du raid de démo:', error);
      }
    }
  }

  // Générer un nom de boss
  generateBossName(raidName) {
    const bossNames = {
      'Dragon Ancien': ['Vermithrax', 'Draconis', 'Ignis', 'Flamberge'],
      'Légion Démoniaque': ['Balrog', 'Mephisto', 'Diablo', 'Azazel'],
      'Garde Céleste': ['Seraphim', 'Gabriel', 'Michael', 'Raphael']
    };
    
    const names = bossNames[raidName] || ['Boss Mystérieux', 'Gardeien', 'Seigneur'];
    return names[Math.floor(Math.random() * names.length)];
  }

  // Ajouter des événements de démonstration
  async addDemoEvents(guildId, client) {
    const eventCount = Math.floor(Math.random() * 2) + 1;
    const events = this.guildEvents;

    for (let i = 0; i < eventCount; i++) {
      const event = events[Math.floor(Math.random() * events.length)];
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + Math.floor(Math.random() * 7));
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2);

      const eventData = {
        event_name: event.name,
        event_type: event.type,
        description: event.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        max_participants: Math.floor(Math.random() * 20) + 10,
        requirements: {},
        rewards: event.rewards
      };

      try {
        await this.createGuildEvent(guildId, eventData, null, client);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'événement de démo:', error);
      }
    }
  }

  // Obtenir une guilde avec tous ses détails
  async getGuildWithDetails(guildId, client) {
    const guildResult = await client.query(`
      SELECT g.*, 
             COUNT(gm.id) as current_members,
             COALESCE(SUM(gm.contribution_points), 0) as total_contribution
      FROM guilds g
      LEFT JOIN guild_members gm ON g.id = gm.guild_id
      WHERE g.id = $1
      GROUP BY g.id
    `, [guildId]);

    if (guildResult.rows.length === 0) {
      throw new Error('Guilde non trouvée');
    }

    const guild = guildResult.rows[0];

    // Ajouter les territoires
    const territoriesResult = await client.query(`
      SELECT * FROM guild_territories WHERE guild_id = $1
    `, [guildId]);
    guild.territories = territoriesResult.rows;

    // Ajouter les projets
    const projectsResult = await client.query(`
      SELECT * FROM guild_projects WHERE guild_id = $1
    `, [guildId]);
    guild.projects = projectsResult.rows;

    // Ajouter les raids
    const raidsResult = await client.query(`
      SELECT * FROM guild_raids WHERE guild_id = $1
    `, [guildId]);
    guild.raids = raidsResult.rows;

    // Ajouter les événements
    const eventsResult = await client.query(`
      SELECT * FROM guild_events WHERE guild_id = $1
    `, [guildId]);
    guild.events = eventsResult.rows;

    return guild;
  }

  // =====================================================
  // DONNÉES DE RÉFÉRENCE
  // =====================================================

  // Générer les projets de guilde disponibles
  generateGuildProjects() {
    return [
      {
        name: 'Tour de Guilde',
        type: 'building',
        max_level: 10,
        required_progress: 1000,
        required_resources: { gold: 5000, materials: 2000, guild_coin: 100 },
        benefits: { max_members: 2, guild_honor: 10 }
      },
      {
        name: 'Laboratoire de Recherche',
        type: 'research',
        max_level: 5,
        required_progress: 1500,
        required_resources: { gold: 8000, materials: 3000, guild_coin: 150 },
        benefits: { research_speed: 0.1, unlock_technologies: ['advanced_equipment'] }
      },
      {
        name: 'Forteresse Défensive',
        type: 'defense',
        max_level: 8,
        required_progress: 2000,
        required_resources: { gold: 12000, materials: 5000, guild_coin: 200 },
        benefits: { territory_defense: 0.2, raid_protection: true }
      },
      {
        name: 'Mine de Ressources',
        type: 'resource',
        max_level: 6,
        required_progress: 1200,
        required_resources: { gold: 6000, materials: 1500, guild_coin: 120 },
        benefits: { resource_production: 0.15, rare_materials: true }
      }
    ];
  }

  // Générer les raids de guilde disponibles
  generateGuildRaids() {
    return [
      {
        name: 'Dragon Ancien',
        type: 'world_boss',
        max_participants: 20,
        base_stats: {
          hp: 100000,
          attack: 5000,
          defense: 3000,
          speed: 200,
          magic_attack: 4000,
          magic_defense: 2500
        },
        rewards: {
          experience: 10000,
          gold: 50000,
          items: ['dragon_scale', 'ancient_artifact'],
          guild_honor: 100
        }
      },
      {
        name: 'Légion Démoniaque',
        type: 'dungeon_raid',
        max_participants: 15,
        base_stats: {
          hp: 75000,
          attack: 4000,
          defense: 2500,
          speed: 250,
          magic_attack: 3500,
          magic_defense: 2000
        },
        rewards: {
          experience: 8000,
          gold: 40000,
          items: ['demon_essence', 'hellfire_crystal'],
          guild_honor: 80
        }
      },
      {
        name: 'Garde Céleste',
        type: 'territory_raid',
        max_participants: 12,
        base_stats: {
          hp: 60000,
          attack: 3500,
          defense: 3000,
          speed: 300,
          magic_attack: 3000,
          magic_defense: 3000
        },
        rewards: {
          experience: 6000,
          gold: 30000,
          items: ['celestial_wing', 'divine_light'],
          guild_honor: 60
        }
      }
    ];
  }

  // Générer les événements de guilde disponibles
  generateGuildEvents() {
    return [
      {
        name: 'Tournoi de Guilde',
        type: 'tournament',
        description: 'Compétition amicale entre membres de la guilde',
        rewards: { experience: 2000, gold: 10000, guild_honor: 20 }
      },
      {
        name: 'Célébration de Victoire',
        type: 'celebration',
        description: 'Fête pour célébrer les succès de la guilde',
        rewards: { experience: 1000, gold: 5000, guild_honor: 10 }
      },
      {
        name: 'Session d\'Entraînement',
        type: 'training',
        description: 'Entraînement collectif pour améliorer les compétences',
        rewards: { experience: 1500, skill_points: 5, guild_honor: 15 }
      }
    ];
  }
}

module.exports = new GuildManager();

