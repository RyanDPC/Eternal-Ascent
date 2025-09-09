-- =====================================================
-- VUES SQL OPTIMISÉES POUR ETERNAL ASCENT
-- =====================================================

-- Vue pour les personnages avec toutes les informations
CREATE OR REPLACE VIEW characters_full AS
SELECT 
    c.id,
    c.user_id,
    c.name,
    c.level,
    c.experience,
    c.experience_to_next,
    c.health,
    c.max_health,
    c.mana,
    c.max_mana,
    c.attack,
    c.defense,
    c.magic_attack,
    c.magic_defense,
    c.critical_rate,
    c.critical_damage,
    c.vitality,
    c.strength,
    c.intelligence,
    c.agility,
    c.resistance,
    c.precision,
    c.endurance,
    c.wisdom,
    c.constitution,
    c.dexterity,
    c.health_regen,
    c.mana_regen,
    c.attack_speed,
    c.movement_speed,
    c.dodge_chance,
    c.block_chance,
    c.parry_chance,
    c.spell_power,
    c.physical_power,
    c.stats,
    c.created_at,
    c.updated_at,
    -- Informations de classe
    cc.name as class_name,
    cc.display_name as class_display_name,
    cc.description as class_description,
    cc.rarity as class_rarity,
    cc.base_stats as class_base_stats,
    cc.stat_ranges as class_stat_ranges,
    cc.starting_equipment as class_starting_equipment,
    cc.icon as class_icon,
    -- Informations utilisateur
    u.username,
    u.email,
    u.last_login
FROM characters c
JOIN character_classes cc ON c.class_id = cc.id
JOIN users u ON c.user_id = u.id;

-- Vue pour l'inventaire complet des personnages
CREATE OR REPLACE VIEW character_inventory_full AS
SELECT 
    ci.id,
    ci.character_id,
    ci.item_id,
    ci.quantity,
    ci.equipped,
    ci.equipped_slot,
    ci.created_at,
    ci.updated_at,
    -- Informations de l'objet
    i.name as item_name,
    i.display_name as item_display_name,
    i.description as item_description,
    i.level_requirement,
    i.base_stats as item_base_stats,
    i.stat_ranges as item_stat_ranges,
    i.effects as item_effects,
    i.icon as item_icon,
    i.image as item_image,
    -- Informations du type d'objet
    it.name as item_type,
    it.display_name as item_type_display_name,
    it.category as item_category,
    it.equip_slot as item_equip_slot,
    it.max_stack as item_max_stack,
    it.description as item_type_description,
    it.icon as item_type_icon,
    -- Informations de rareté
    r.name as rarity_name,
    r.display_name as rarity_display_name,
    r.color as rarity_color,
    r.probability as rarity_probability,
    r.stat_multiplier as rarity_stat_multiplier,
    r.description as rarity_description,
    r.icon as rarity_icon
FROM character_inventory ci
JOIN items i ON ci.item_id = i.id
JOIN item_types it ON i.type_id = it.id
JOIN rarities r ON i.rarity_id = r.id;

-- Vue pour les guildes avec statistiques
CREATE OR REPLACE VIEW guilds_full AS
SELECT 
    g.id,
    g.name,
    g.display_name,
    g.description,
    g.level,
    g.experience,
    g.experience_to_next,
    g.max_members,
    g.current_members,
    g.guild_coin,
    g.guild_honor,
    g.emblem,
    g.banner,
    g.status,
    g.created_at,
    g.updated_at,
    -- Créateur
    c.name as creator_name,
    c.level as creator_level,
    cc.display_name as creator_class,
    -- Statistiques calculées
    (SELECT COUNT(*) FROM guild_members WHERE guild_id = g.id) as total_members,
    (SELECT COUNT(*) FROM guild_territories WHERE guild_id = g.id) as total_territories,
    (SELECT COUNT(*) FROM guild_projects WHERE guild_id = g.id AND status = 'active') as active_projects,
    (SELECT COUNT(*) FROM guild_raids WHERE guild_id = g.id AND status = 'active') as active_raids
FROM guilds g
LEFT JOIN characters c ON g.created_by = c.id
LEFT JOIN character_classes cc ON c.class_id = cc.id;

-- Vue pour les membres de guilde avec détails
CREATE OR REPLACE VIEW guild_members_full AS
SELECT 
    gm.id,
    gm.guild_id,
    gm.character_id,
    gm.rank,
    gm.joined_at,
    gm.last_active,
    gm.contribution_points,
    gm.weekly_contribution,
    gm.permissions,
    -- Informations du personnage
    c.name as character_name,
    c.level as character_level,
    c.experience as character_experience,
    c.health as character_health,
    c.max_health as character_max_health,
    c.mana as character_mana,
    c.max_mana as character_max_mana,
    c.attack as character_attack,
    c.defense as character_defense,
    c.magic_attack as character_magic_attack,
    c.magic_defense as character_magic_defense,
    -- Informations de classe
    cc.name as class_name,
    cc.display_name as class_display_name,
    cc.rarity as class_rarity,
    -- Informations utilisateur
    u.username,
    u.email,
    u.last_login,
    -- Calculs de temps
    EXTRACT(EPOCH FROM (NOW() - gm.last_active)) as seconds_since_active,
    EXTRACT(EPOCH FROM (NOW() - gm.joined_at)) as seconds_since_joined
FROM guild_members gm
JOIN characters c ON gm.character_id = c.id
JOIN character_classes cc ON c.class_id = cc.id
JOIN users u ON c.user_id = u.id;

-- Vue pour les donjons avec progression des personnages
CREATE OR REPLACE VIEW dungeons_with_progress AS
SELECT 
    d.id,
    d.name,
    d.display_name,
    d.description,
    d.level_requirement,
    d.difficulty,
    d.estimated_duration,
    d.rewards,
    d.requirements,
    d.enemies,
    d.icon,
    d.theme,
    d.created_at,
    d.updated_at,
    -- Progression du personnage (si spécifié)
    cd.status as character_status,
    cd.best_time as character_best_time,
    cd.completion_count as character_completion_count,
    cd.last_completed as character_last_completed
FROM dungeons d
LEFT JOIN character_dungeons cd ON d.id = cd.dungeon_id;

-- Vue pour les items avec statistiques de popularité
CREATE OR REPLACE VIEW items_with_stats AS
SELECT 
    i.id,
    i.name,
    i.display_name,
    i.description,
    i.level_requirement,
    i.base_stats,
    i.stat_ranges,
    i.effects,
    i.icon,
    i.image,
    i.created_at,
    i.updated_at,
    -- Informations du type
    it.name as type_name,
    it.display_name as type_display_name,
    it.category as type_category,
    it.equip_slot as type_equip_slot,
    it.max_stack as type_max_stack,
    -- Informations de rareté
    r.name as rarity_name,
    r.display_name as rarity_display_name,
    r.color as rarity_color,
    r.probability as rarity_probability,
    r.stat_multiplier as rarity_stat_multiplier,
    -- Statistiques d'utilisation
    (SELECT COUNT(*) FROM character_inventory WHERE item_id = i.id) as total_owned,
    (SELECT COUNT(*) FROM character_inventory WHERE item_id = i.id AND equipped = true) as total_equipped,
    (SELECT SUM(quantity) FROM character_inventory WHERE item_id = i.id) as total_quantity
FROM items i
JOIN item_types it ON i.type_id = it.id
JOIN rarities r ON i.rarity_id = r.id;

-- Vue pour les ennemis avec informations de combat
CREATE OR REPLACE VIEW enemies_with_combat_info AS
SELECT 
    e.id,
    e.name,
    e.display_name,
    e.description,
    e.type,
    e.level,
    e.health,
    e.attack,
    e.defense,
    e.magic_attack,
    e.magic_defense,
    e.speed,
    e.experience_reward,
    e.gold_reward,
    e.abilities,
    e.weaknesses,
    e.resistances,
    e.loot_table,
    e.icon,
    e.created_at,
    e.updated_at,
    -- Informations de rareté
    r.name as rarity_name,
    r.display_name as rarity_display_name,
    r.color as rarity_color,
    r.probability as rarity_probability,
    r.stat_multiplier as rarity_stat_multiplier,
    -- Calculs de puissance
    (e.health + e.attack + e.defense + e.magic_attack + e.magic_defense) as total_power,
    (e.experience_reward + e.gold_reward) as total_rewards,
    -- Niveau de difficulté estimé
    CASE 
        WHEN e.level <= 10 THEN 'Facile'
        WHEN e.level <= 25 THEN 'Normal'
        WHEN e.level <= 50 THEN 'Difficile'
        WHEN e.level <= 75 THEN 'Très Difficile'
        ELSE 'Extrême'
    END as difficulty_rating
FROM enemies e
JOIN rarities r ON e.rarity_id = r.id;

-- Vue pour les quêtes avec progression
CREATE OR REPLACE VIEW quests_with_progress AS
SELECT 
    q.id,
    q.title,
    q.description,
    q.type,
    q.level_requirement,
    q.rewards,
    q.requirements,
    q.objectives,
    q.icon,
    q.created_at,
    q.updated_at,
    -- Progression du personnage (si spécifié)
    cq.status as character_status,
    cq.progress as character_progress,
    cq.started_at as character_started_at,
    cq.completed_at as character_completed_at,
    -- Calculs de temps
    CASE 
        WHEN cq.started_at IS NOT NULL AND cq.completed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (cq.completed_at - cq.started_at))
        ELSE NULL
    END as completion_time_seconds
FROM quests q
LEFT JOIN character_quests cq ON q.id = cq.quest_id;

-- =====================================================
-- INDEX POUR LES VUES
-- =====================================================

-- Index pour la vue characters_full
CREATE INDEX IF NOT EXISTS idx_characters_full_user_id ON characters_full(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_full_class_name ON characters_full(class_name);
CREATE INDEX IF NOT EXISTS idx_characters_full_level ON characters_full(level);

-- Index pour la vue character_inventory_full
CREATE INDEX IF NOT EXISTS idx_character_inventory_full_character_id ON character_inventory_full(character_id);
CREATE INDEX IF NOT EXISTS idx_character_inventory_full_item_type ON character_inventory_full(item_type);
CREATE INDEX IF NOT EXISTS idx_character_inventory_full_rarity_name ON character_inventory_full(rarity_name);
CREATE INDEX IF NOT EXISTS idx_character_inventory_full_equipped ON character_inventory_full(equipped);

-- Index pour la vue guilds_full
CREATE INDEX IF NOT EXISTS idx_guilds_full_status ON guilds_full(status);
CREATE INDEX IF NOT EXISTS idx_guilds_full_level ON guilds_full(level);
CREATE INDEX IF NOT EXISTS idx_guilds_full_current_members ON guilds_full(current_members);

-- Index pour la vue guild_members_full
CREATE INDEX IF NOT EXISTS idx_guild_members_full_guild_id ON guild_members_full(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_full_rank ON guild_members_full(rank);
CREATE INDEX IF NOT EXISTS idx_guild_members_full_contribution_points ON guild_members_full(contribution_points);

-- Index pour la vue items_with_stats
CREATE INDEX IF NOT EXISTS idx_items_with_stats_type_name ON items_with_stats(type_name);
CREATE INDEX IF NOT EXISTS idx_items_with_stats_rarity_name ON items_with_stats(rarity_name);
CREATE INDEX IF NOT EXISTS idx_items_with_stats_level_requirement ON items_with_stats(level_requirement);

-- Index pour la vue enemies_with_combat_info
CREATE INDEX IF NOT EXISTS idx_enemies_with_combat_info_type ON enemies_with_combat_info(type);
CREATE INDEX IF NOT EXISTS idx_enemies_with_combat_info_level ON enemies_with_combat_info(level);
CREATE INDEX IF NOT EXISTS idx_enemies_with_combat_info_rarity_name ON enemies_with_combat_info(rarity_name);

