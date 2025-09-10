-- =====================================================
-- ETERNAL ASCENT - SCHÉMA ULTRA-OPTIMISÉ
-- =====================================================

-- Nettoyage complet
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- =====================================================
-- EXTENSIONS ET CONFIGURATIONS
-- =====================================================

-- Extensions pour les performances
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Configuration des performances
-- Note: Ces paramètres doivent être configurés dans postgresql.conf
-- SET work_mem = '256MB';
-- SET maintenance_work_mem = '1GB';
-- SET shared_buffers = '256MB';
-- SET effective_cache_size = '1GB';

-- =====================================================
-- TABLES DE CONFIGURATION STATIQUES
-- =====================================================

-- Table des raretés (optimisée)
CREATE TABLE rarities (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    probability DECIMAL(8,7) NOT NULL CHECK (probability > 0 AND probability <= 1),
    stat_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00 CHECK (stat_multiplier > 0),
    description TEXT,
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des types d'objets (optimisée)
CREATE TABLE item_types (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    display_name VARCHAR(60) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('weapon', 'armor', 'consumable', 'material', 'currency', 'special')),
    equip_slot VARCHAR(20) CHECK (equip_slot IN ('head', 'chest', 'legs', 'boots', 'gloves', 'weapon', 'accessory', 'ring', 'necklace')),
    max_stack INTEGER NOT NULL DEFAULT 1 CHECK (max_stack > 0),
    description TEXT,
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des classes de personnages (optimisée)
CREATE TABLE character_classes (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    display_name VARCHAR(60) NOT NULL,
    description TEXT,
    rarity_id SMALLINT NOT NULL REFERENCES rarities(id),
    probability DECIMAL(5,4) NOT NULL DEFAULT 0.9800 CHECK (probability > 0 AND probability <= 1),
    base_stats JSONB NOT NULL DEFAULT '{}',
    stat_ranges JSONB NOT NULL DEFAULT '{}',
    starting_equipment JSONB DEFAULT '[]',
    starting_skills JSONB DEFAULT '[]',
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des difficultés
CREATE TABLE difficulties (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    display_name VARCHAR(40) NOT NULL,
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    description TEXT,
    stat_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00 CHECK (stat_multiplier > 0),
    exp_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00 CHECK (exp_multiplier > 0),
    gold_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00 CHECK (gold_multiplier > 0),
    order_index SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLES D'OBJETS ET ÉQUIPEMENTS
-- =====================================================

-- Table des objets (ultra-optimisée)
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    type_id SMALLINT NOT NULL REFERENCES item_types(id),
    rarity_id SMALLINT NOT NULL REFERENCES rarities(id),
    level_requirement SMALLINT NOT NULL DEFAULT 1 CHECK (level_requirement > 0),
    base_stats JSONB DEFAULT '{}',
    stat_ranges JSONB DEFAULT '{}',
    effects JSONB DEFAULT '[]',
    icon VARCHAR(100),
    image VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index GIN pour les recherches JSONB
    CONSTRAINT items_base_stats_valid CHECK (jsonb_typeof(base_stats) = 'object'),
    CONSTRAINT items_stat_ranges_valid CHECK (jsonb_typeof(stat_ranges) = 'object'),
    CONSTRAINT items_effects_valid CHECK (jsonb_typeof(effects) = 'array')
);

-- =====================================================
-- TABLES UTILISATEURS ET PERSONNAGES
-- =====================================================

-- Table des utilisateurs (optimisée)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE CHECK (length(username) >= 3 AND length(username) <= 30),
    email VARCHAR(100) NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des personnages (ultra-optimisée)
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL UNIQUE CHECK (length(name) >= 3 AND length(name) <= 50),
    class_id SMALLINT NOT NULL REFERENCES character_classes(id),
    
    -- Stats de base
    level SMALLINT NOT NULL DEFAULT 1 CHECK (level > 0 AND level <= 100),
    experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0),
    experience_to_next INTEGER NOT NULL DEFAULT 100 CHECK (experience_to_next > 0),
    
    -- Stats de combat (optimisées avec contraintes)
    health INTEGER NOT NULL CHECK (health > 0),
    max_health INTEGER NOT NULL CHECK (max_health > 0 AND max_health >= health),
    mana INTEGER NOT NULL CHECK (mana >= 0),
    max_mana INTEGER NOT NULL CHECK (max_mana >= 0 AND max_mana >= mana),
    
    -- Stats principales
    attack INTEGER NOT NULL CHECK (attack > 0),
    defense INTEGER NOT NULL CHECK (defense > 0),
    magic_attack INTEGER NOT NULL CHECK (magic_attack > 0),
    magic_defense INTEGER NOT NULL CHECK (magic_defense > 0),
    critical_rate DECIMAL(4,2) NOT NULL DEFAULT 5.00 CHECK (critical_rate >= 0 AND critical_rate <= 100),
    critical_damage DECIMAL(4,2) NOT NULL DEFAULT 150.00 CHECK (critical_damage >= 100),
    
    -- Stats secondaires (optimisées)
    vitality SMALLINT NOT NULL DEFAULT 10 CHECK (vitality > 0 AND vitality <= 1000),
    strength SMALLINT NOT NULL DEFAULT 10 CHECK (strength > 0 AND strength <= 1000),
    intelligence SMALLINT NOT NULL DEFAULT 10 CHECK (intelligence > 0 AND intelligence <= 1000),
    agility SMALLINT NOT NULL DEFAULT 10 CHECK (agility > 0 AND agility <= 1000),
    resistance SMALLINT NOT NULL DEFAULT 10 CHECK (resistance > 0 AND resistance <= 1000),
    precision SMALLINT NOT NULL DEFAULT 10 CHECK (precision > 0 AND precision <= 1000),
    endurance SMALLINT NOT NULL DEFAULT 10 CHECK (endurance > 0 AND endurance <= 1000),
    wisdom SMALLINT NOT NULL DEFAULT 10 CHECK (wisdom > 0 AND wisdom <= 1000),
    constitution SMALLINT NOT NULL DEFAULT 10 CHECK (constitution > 0 AND constitution <= 1000),
    dexterity SMALLINT NOT NULL DEFAULT 10 CHECK (dexterity > 0 AND dexterity <= 1000),
    
    -- Stats dérivées (optimisées)
    health_regen DECIMAL(5,2) NOT NULL DEFAULT 1.00 CHECK (health_regen >= 0),
    mana_regen DECIMAL(5,2) NOT NULL DEFAULT 0.50 CHECK (mana_regen >= 0),
    attack_speed DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (attack_speed > 0),
    movement_speed DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (movement_speed > 0),
    dodge_chance DECIMAL(4,2) NOT NULL DEFAULT 8.00 CHECK (dodge_chance >= 0 AND dodge_chance <= 100),
    block_chance DECIMAL(4,2) NOT NULL DEFAULT 5.00 CHECK (block_chance >= 0 AND block_chance <= 100),
    parry_chance DECIMAL(4,2) NOT NULL DEFAULT 3.00 CHECK (parry_chance >= 0 AND parry_chance <= 100),
    spell_power DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (spell_power > 0),
    physical_power DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (physical_power > 0),
    
    -- Métadonnées
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    CONSTRAINT unique_user_character UNIQUE (user_id),
    CONSTRAINT characters_stats_valid CHECK (jsonb_typeof(stats) = 'object')
);

-- =====================================================
-- TABLES D'INVENTAIRE ET ÉQUIPEMENT
-- =====================================================

-- Table de l'inventaire (ultra-optimisée)
CREATE TABLE character_inventory (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    equipped BOOLEAN NOT NULL DEFAULT FALSE,
    equipped_slot VARCHAR(20) CHECK (equipped_slot IN ('head', 'chest', 'legs', 'boots', 'gloves', 'weapon', 'accessory', 'ring', 'necklace')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes d'unicité
    CONSTRAINT unique_character_item UNIQUE (character_id, item_id),
    CONSTRAINT equipped_slot_required CHECK (NOT equipped OR equipped_slot IS NOT NULL)
);

-- =====================================================
-- TABLES DE GAMEPLAY
-- =====================================================

-- Table des donjons (optimisée)
CREATE TABLE dungeons (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    description TEXT,
    level_requirement SMALLINT NOT NULL DEFAULT 1 CHECK (level_requirement > 0),
    difficulty_id SMALLINT NOT NULL REFERENCES difficulties(id),
    estimated_duration SMALLINT CHECK (estimated_duration > 0), -- en minutes
    rewards JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '[]',
    enemies JSONB DEFAULT '[]',
    icon VARCHAR(100),
    theme VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT dungeons_rewards_valid CHECK (jsonb_typeof(rewards) = 'array'),
    CONSTRAINT dungeons_requirements_valid CHECK (jsonb_typeof(requirements) = 'array'),
    CONSTRAINT dungeons_enemies_valid CHECK (jsonb_typeof(enemies) = 'array')
);

-- Table des quêtes (optimisée)
CREATE TABLE quests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('main', 'side', 'daily', 'weekly', 'guild', 'event')),
    level_requirement SMALLINT NOT NULL DEFAULT 1 CHECK (level_requirement > 0),
    rewards JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '[]',
    objectives JSONB DEFAULT '[]',
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT quests_rewards_valid CHECK (jsonb_typeof(rewards) = 'array'),
    CONSTRAINT quests_requirements_valid CHECK (jsonb_typeof(requirements) = 'array'),
    CONSTRAINT quests_objectives_valid CHECK (jsonb_typeof(objectives) = 'array')
);

-- Table des ennemis (optimisée)
CREATE TABLE enemies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL,
    level SMALLINT NOT NULL CHECK (level > 0 AND level <= 100),
    rarity_id SMALLINT NOT NULL REFERENCES rarities(id),
    
    -- Stats de combat (optimisées)
    health INTEGER NOT NULL CHECK (health > 0),
    attack INTEGER NOT NULL CHECK (attack > 0),
    defense INTEGER NOT NULL CHECK (defense > 0),
    magic_attack INTEGER DEFAULT 0 CHECK (magic_attack >= 0),
    magic_defense INTEGER DEFAULT 0 CHECK (magic_defense >= 0),
    speed SMALLINT DEFAULT 100 CHECK (speed > 0),
    
    -- Récompenses
    experience_reward INTEGER NOT NULL DEFAULT 0 CHECK (experience_reward >= 0),
    gold_reward INTEGER NOT NULL DEFAULT 0 CHECK (gold_reward >= 0),
    
    -- Capacités et résistances
    abilities JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    resistances JSONB DEFAULT '[]',
    loot_table JSONB DEFAULT '[]',
    
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT enemies_abilities_valid CHECK (jsonb_typeof(abilities) = 'array'),
    CONSTRAINT enemies_weaknesses_valid CHECK (jsonb_typeof(weaknesses) = 'array'),
    CONSTRAINT enemies_resistances_valid CHECK (jsonb_typeof(resistances) = 'array'),
    CONSTRAINT enemies_loot_table_valid CHECK (jsonb_typeof(loot_table) = 'array')
);

-- =====================================================
-- TABLES DE LOGS DE COMBAT
-- =====================================================

-- Table des sessions de combat (logs compressés)
CREATE TABLE IF NOT EXISTS combat_sessions (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    dungeon_id SMALLINT NOT NULL REFERENCES dungeons(id),
    result TEXT NOT NULL,
    log_gzip BYTEA NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLES DE PROGRESSION
-- =====================================================

-- Table de progression des donjons
CREATE TABLE character_dungeons (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    dungeon_id SMALLINT NOT NULL REFERENCES dungeons(id),
    status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'completed', 'mastered')),
    best_time INTEGER CHECK (best_time > 0), -- en secondes
    completion_count INTEGER DEFAULT 0 CHECK (completion_count >= 0),
    last_completed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_character_dungeon UNIQUE (character_id, dungeon_id)
);

-- Table de progression des quêtes
CREATE TABLE character_quests (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    quest_id INTEGER NOT NULL REFERENCES quests(id),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'active', 'completed', 'failed')),
    progress JSONB DEFAULT '{}',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_character_quest UNIQUE (character_id, quest_id),
    CONSTRAINT character_quests_progress_valid CHECK (jsonb_typeof(progress) = 'object')
);

-- =====================================================
-- TABLES DE GUILDES (OPTIMISÉES)
-- =====================================================

-- Table des guildes
CREATE TABLE guilds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE CHECK (length(name) >= 3 AND length(name) <= 50),
    display_name VARCHAR(80) NOT NULL,
    description TEXT,
    level SMALLINT NOT NULL DEFAULT 1 CHECK (level > 0 AND level <= 100),
    experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0),
    experience_to_next INTEGER NOT NULL DEFAULT 1000 CHECK (experience_to_next > 0),
    max_members SMALLINT NOT NULL DEFAULT 20 CHECK (max_members > 0 AND max_members <= 100),
    current_members SMALLINT NOT NULL DEFAULT 0 CHECK (current_members >= 0 AND current_members <= max_members),
    guild_coin INTEGER NOT NULL DEFAULT 0 CHECK (guild_coin >= 0),
    guild_honor INTEGER NOT NULL DEFAULT 0 CHECK (guild_honor >= 0),
    emblem VARCHAR(200),
    banner VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disbanded')),
    created_by INTEGER NOT NULL REFERENCES characters(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- EXTENSIONS DU SCHÉMA DEMANDÉS (UTILISATEURS, PERSOS, MONDE, ÉCONOMIE, SOCIAL)
-- =====================================================

-- Paramètres utilisateur
CREATE TABLE user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'fr',
    theme VARCHAR(20) DEFAULT 'dark',
    notifications JSONB DEFAULT '{"email":true, "push":true, "marketing":false}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_settings_notifications_valid CHECK (jsonb_typeof(notifications) = 'object')
);

-- Progression de compte
CREATE TABLE user_progression (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    account_level SMALLINT NOT NULL DEFAULT 1 CHECK (account_level > 0),
    achievements_unlocked INTEGER NOT NULL DEFAULT 0 CHECK (achievements_unlocked >= 0),
    total_playtime INTEGER NOT NULL DEFAULT 0 CHECK (total_playtime >= 0), -- secondes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Portefeuille utilisateur
CREATE TABLE user_wallet (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    copper BIGINT NOT NULL DEFAULT 0 CHECK (copper >= 0),
    silver BIGINT NOT NULL DEFAULT 0 CHECK (silver >= 0),
    gold BIGINT NOT NULL DEFAULT 0 CHECK (gold >= 0),
    premium_currency BIGINT NOT NULL DEFAULT 0 CHECK (premium_currency >= 0),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Référentiel de stats
CREATE TABLE stats_definitions (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Stats détaillées de personnage
CREATE TABLE character_stats (
    character_id INTEGER PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    strength SMALLINT NOT NULL DEFAULT 10 CHECK (strength > 0 AND strength <= 1000),
    agility SMALLINT NOT NULL DEFAULT 10 CHECK (agility > 0 AND agility <= 1000),
    intelligence SMALLINT NOT NULL DEFAULT 10 CHECK (intelligence > 0 AND intelligence <= 1000),
    endurance SMALLINT NOT NULL DEFAULT 10 CHECK (endurance > 0 AND endurance <= 1000),
    dexterity SMALLINT NOT NULL DEFAULT 10 CHECK (dexterity > 0 AND dexterity <= 1000),
    vitality SMALLINT NOT NULL DEFAULT 10 CHECK (vitality > 0 AND vitality <= 1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courbes de croissance de stats
CREATE TABLE character_growth (
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    stat_id SMALLINT NOT NULL REFERENCES stats_definitions(id) ON DELETE CASCADE,
    rank VARCHAR(3) NOT NULL CHECK (rank IN ('E','D','C','B','A','S','SS','SSS')),
    scaling_factor DECIMAL(6,3) NOT NULL DEFAULT 1.000 CHECK (scaling_factor > 0),
    progression_curve VARCHAR(20) NOT NULL DEFAULT 'linear' CHECK (progression_curve IN ('linear','quadratic','exponential','logarithmic','custom')),
    PRIMARY KEY (character_id, stat_id)
);

-- Équipement par slot (accès direct)
CREATE TABLE character_equipment (
    character_id INTEGER PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    head INTEGER REFERENCES items(id),
    chest INTEGER REFERENCES items(id),
    legs INTEGER REFERENCES items(id),
    boots INTEGER REFERENCES items(id),
    gloves INTEGER REFERENCES items(id),
    weapon_main INTEGER REFERENCES items(id),
    weapon_off INTEGER REFERENCES items(id),
    accessory1 INTEGER REFERENCES items(id),
    accessory2 INTEGER REFERENCES items(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compétences
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    description TEXT,
    class_restriction SMALLINT REFERENCES character_classes(id) ON DELETE SET NULL,
    base_cooldown INTEGER DEFAULT 0,
    base_cost INTEGER DEFAULT 0,
    scaling JSONB DEFAULT '{}',
    icon VARCHAR(100),
    CONSTRAINT skills_scaling_valid CHECK (jsonb_typeof(scaling) = 'object')
);

CREATE TABLE character_skills (
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    level SMALLINT NOT NULL DEFAULT 1 CHECK (level > 0),
    cooldown_reduction DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (cooldown_reduction >= 0),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (character_id, skill_id)
);

-- Talents (arbre)
CREATE TABLE talents_tree (
    id SERIAL PRIMARY KEY,
    class_id SMALLINT REFERENCES character_classes(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    tier SMALLINT NOT NULL DEFAULT 1 CHECK (tier > 0),
    effect JSONB NOT NULL DEFAULT '{}',
    prereq_id INTEGER REFERENCES talents_tree(id) ON DELETE SET NULL,
    CONSTRAINT talents_effect_valid CHECK (jsonb_typeof(effect) = 'object')
);

CREATE TABLE character_talents (
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    talent_id INTEGER NOT NULL REFERENCES talents_tree(id) ON DELETE CASCADE,
    points_spent SMALLINT NOT NULL DEFAULT 0 CHECK (points_spent >= 0),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (character_id, talent_id)
);

-- Familiers
CREATE TABLE familiars (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    description TEXT,
    base_stats JSONB DEFAULT '{}',
    rarity_id SMALLINT REFERENCES rarities(id),
    icon VARCHAR(100),
    CONSTRAINT familiars_base_stats_valid CHECK (jsonb_typeof(base_stats) = 'object')
);

CREATE TABLE character_familiars (
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    familiar_id INTEGER NOT NULL REFERENCES familiars(id) ON DELETE CASCADE,
    level SMALLINT NOT NULL DEFAULT 1 CHECK (level > 0),
    exp INTEGER NOT NULL DEFAULT 0 CHECK (exp >= 0),
    bond_level SMALLINT NOT NULL DEFAULT 0 CHECK (bond_level >= 0),
    PRIMARY KEY (character_id, familiar_id)
);

-- Biomes
CREATE TABLE biomes (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    description TEXT,
    climate_type VARCHAR(30),
    modifiers JSONB DEFAULT '{}',
    CONSTRAINT biomes_modifiers_valid CHECK (jsonb_typeof(modifiers) = 'object')
);

-- Rattacher les biomes aux donjons
ALTER TABLE dungeons ADD COLUMN IF NOT EXISTS biome_id SMALLINT REFERENCES biomes(id);

-- Composition des donjons & récompenses
CREATE TABLE dungeon_enemies (
    dungeon_id SMALLINT NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE,
    enemy_id INTEGER NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
    spawn_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (spawn_rate >= 0),
    min_group SMALLINT NOT NULL DEFAULT 1 CHECK (min_group > 0),
    max_group SMALLINT NOT NULL DEFAULT 1 CHECK (max_group >= min_group),
    PRIMARY KEY (dungeon_id, enemy_id)
);

CREATE TABLE dungeon_rewards (
    dungeon_id SMALLINT NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
    drop_chance DECIMAL(5,4) NOT NULL DEFAULT 0.1000 CHECK (drop_chance >= 0 AND drop_chance <= 1),
    quantity_min SMALLINT NOT NULL DEFAULT 1 CHECK (quantity_min > 0),
    quantity_max SMALLINT NOT NULL DEFAULT 1 CHECK (quantity_max >= quantity_min),
    currency_range JSONB DEFAULT '{"gold_min":0, "gold_max":0}',
    CONSTRAINT dungeon_rewards_currency_valid CHECK (jsonb_typeof(currency_range) = 'object'),
    PRIMARY KEY (dungeon_id, item_id)
);

-- Événements monde
CREATE TABLE world_events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('raid','boss','invasion')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    rewards JSONB DEFAULT '[]',
    CONSTRAINT world_events_rewards_valid CHECK (jsonb_typeof(rewards) = 'array')
);

-- Archétypes & loots ennemis
CREATE TABLE enemy_archetypes (
    id SMALLSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('melee','ranged','mage','tank','support')),
    base_behavior JSONB DEFAULT '{}',
    weaknesses JSONB DEFAULT '[]',
    resistances JSONB DEFAULT '[]',
    CONSTRAINT archetypes_base_behavior_valid CHECK (jsonb_typeof(base_behavior) = 'object'),
    CONSTRAINT archetypes_weak_valid CHECK (jsonb_typeof(weaknesses) = 'array'),
    CONSTRAINT archetypes_res_valid CHECK (jsonb_typeof(resistances) = 'array')
);

ALTER TABLE enemies ADD COLUMN IF NOT EXISTS archetype_id SMALLINT REFERENCES enemy_archetypes(id);

CREATE TABLE enemy_loot_tables (
    enemy_id INTEGER NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
    drop_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1000 CHECK (drop_rate >= 0 AND drop_rate <= 1),
    min_qty SMALLINT NOT NULL DEFAULT 1 CHECK (min_qty > 0),
    max_qty SMALLINT NOT NULL DEFAULT 1 CHECK (max_qty >= min_qty),
    currency_min INTEGER NOT NULL DEFAULT 0 CHECK (currency_min >= 0),
    currency_max INTEGER NOT NULL DEFAULT 0 CHECK (currency_max >= currency_min),
    PRIMARY KEY (enemy_id, item_id)
);

-- Sets d'objets et affixes
CREATE TABLE item_sets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE item_set_members (
    set_id INTEGER NOT NULL REFERENCES item_sets(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    PRIMARY KEY (set_id, item_id)
);

CREATE TABLE set_bonuses (
    set_id INTEGER NOT NULL REFERENCES item_sets(id) ON DELETE CASCADE,
    pieces_required SMALLINT NOT NULL CHECK (pieces_required > 0),
    bonus_description TEXT,
    bonus_stats JSONB DEFAULT '{}',
    CONSTRAINT set_bonuses_stats_valid CHECK (jsonb_typeof(bonus_stats) = 'object'),
    PRIMARY KEY (set_id, pieces_required)
);

CREATE TABLE item_affixes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    effect_type VARCHAR(40) NOT NULL,
    min_value DECIMAL(10,2) NOT NULL,
    max_value DECIMAL(10,2) NOT NULL,
    rarity_id SMALLINT REFERENCES rarities(id)
);

CREATE TABLE item_enchantments (
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    affix_id INTEGER NOT NULL REFERENCES item_affixes(id) ON DELETE CASCADE,
    rolled_value DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (item_id, affix_id)
);

CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('craft','forge','transmute')),
    required_items JSONB NOT NULL DEFAULT '[]',
    result_item INTEGER NOT NULL REFERENCES items(id),
    craft_time INTEGER NOT NULL DEFAULT 0 CHECK (craft_time >= 0),
    CONSTRAINT recipes_required_items_valid CHECK (jsonb_typeof(required_items) = 'array')
);

-- Économie
CREATE TABLE currencies (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    conversion_rate DECIMAL(18,8) NOT NULL DEFAULT 1.0 CHECK (conversion_rate > 0)
);

CREATE TABLE auctions (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price BIGINT NOT NULL CHECK (price >= 0),
    currency_id SMALLINT NOT NULL REFERENCES currencies(id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('loot','trade','craft','shop')),
    currency_id SMALLINT NOT NULL REFERENCES currencies(id),
    amount BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    location VARCHAR(80),
    inventory JSONB NOT NULL DEFAULT '[]',
    refresh_timer INTEGER NOT NULL DEFAULT 3600,
    CONSTRAINT shops_inventory_valid CHECK (jsonb_typeof(inventory) = 'array')
);

-- Objectifs de quêtes & missions de guilde
CREATE TABLE quest_objectives (
    quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('kill','collect','explore')),
    target_id INTEGER,
    required_qty INTEGER NOT NULL DEFAULT 1 CHECK (required_qty > 0),
    PRIMARY KEY (quest_id, type, target_id)
);

CREATE TABLE guild_missions (
    id SERIAL PRIMARY KEY,
    guild_id INTEGER NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    objective TEXT NOT NULL,
    progress JSONB NOT NULL DEFAULT '{"current":0,"required":1}',
    reward JSONB DEFAULT '{}',
    CONSTRAINT guild_missions_progress_valid CHECK (jsonb_typeof(progress) = 'object'),
    CONSTRAINT guild_missions_reward_valid CHECK (jsonb_typeof(reward) = 'object')
);

-- Social
CREATE TABLE friends (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saisons & classements
CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    rewards_json JSONB DEFAULT '[]',
    CONSTRAINT seasons_rewards_valid CHECK (jsonb_typeof(rewards_json) = 'array')
);

CREATE TABLE season_progression (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    tier INTEGER NOT NULL DEFAULT 1 CHECK (tier > 0),
    exp INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, season_id)
);

CREATE TABLE leaderboards (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('dungeon','raid','guild')),
    season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL,
    ref_id INTEGER,
    score BIGINT NOT NULL DEFAULT 0,
    rank INTEGER
);

-- Logs & sécurité
CREATE TABLE combat_logs (
    id SERIAL PRIMARY KEY,
    char_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    dungeon_id SMALLINT REFERENCES dungeons(id) ON DELETE SET NULL,
    enemy_id INTEGER REFERENCES enemies(id) ON DELETE SET NULL,
    damage_dealt INTEGER NOT NULL DEFAULT 0,
    damage_taken INTEGER NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0,
    result VARCHAR(20) NOT NULL CHECK (result IN ('win','loss','escape')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE anti_cheat_flags (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL CHECK (type IN ('xp/min anomaly','gold exploit','suspicious drops')),
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
    flagged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details JSONB DEFAULT '{}',
    CONSTRAINT anti_cheat_details_valid CHECK (jsonb_typeof(details) = 'object')
);

CREATE TABLE audit_trail (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(60) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_trail_details_valid CHECK (jsonb_typeof(details) = 'object')
);

-- Monétisation
CREATE TABLE cosmetics (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('skin','pet','aura')),
    name VARCHAR(80) NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    price_premium_currency BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE shop_rotation (
    id SERIAL PRIMARY KEY,
    cosmetic_id INTEGER NOT NULL REFERENCES cosmetics(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL
);

CREATE TABLE purchases (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cosmetic_id INTEGER NOT NULL REFERENCES cosmetics(id) ON DELETE CASCADE,
    price BIGINT NOT NULL,
    purchased_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, cosmetic_id, purchased_at)
);

-- Table des membres de guilde
CREATE TABLE guild_members (
    id SERIAL PRIMARY KEY,
    guild_id INTEGER NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    rank VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (rank IN ('leader', 'officer', 'member', 'recruit')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contribution_points INTEGER NOT NULL DEFAULT 0 CHECK (contribution_points >= 0),
    weekly_contribution INTEGER NOT NULL DEFAULT 0 CHECK (weekly_contribution >= 0),
    permissions JSONB DEFAULT '{}',
    
    CONSTRAINT unique_guild_member UNIQUE (guild_id, character_id),
    CONSTRAINT guild_members_permissions_valid CHECK (jsonb_typeof(permissions) = 'object')
);

-- =====================================================
-- INDEX ULTRA-OPTIMISÉS
-- =====================================================

-- Index primaires et uniques (automatiques)
-- Index sur les clés étrangères
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_class_id ON characters(class_id);
CREATE INDEX idx_character_inventory_character_id ON character_inventory(character_id);
CREATE INDEX idx_character_inventory_item_id ON character_inventory(item_id);
CREATE INDEX idx_items_type_id ON items(type_id);
CREATE INDEX idx_items_rarity_id ON items(rarity_id);
CREATE INDEX idx_enemies_rarity_id ON enemies(rarity_id);
CREATE INDEX idx_dungeons_difficulty_id ON dungeons(difficulty_id);
CREATE INDEX IF NOT EXISTS idx_dungeons_biome_id ON dungeons(biome_id);
CREATE INDEX IF NOT EXISTS idx_combat_sessions_character_id ON combat_sessions(character_id);
CREATE INDEX IF NOT EXISTS idx_combat_sessions_created_at ON combat_sessions(created_at);

-- Index composites pour les requêtes fréquentes
CREATE INDEX idx_characters_user_level ON characters(user_id, level);
CREATE INDEX idx_character_inventory_character_equipped ON character_inventory(character_id, equipped);
CREATE INDEX idx_items_type_rarity_level ON items(type_id, rarity_id, level_requirement);
CREATE INDEX idx_enemies_type_level ON enemies(type, level);
CREATE INDEX idx_guild_members_guild_rank ON guild_members(guild_id, rank);

-- Index partiels pour les requêtes spécifiques
CREATE INDEX idx_characters_high_level ON characters(level) WHERE level > 50;
CREATE INDEX idx_character_inventory_equipped_items ON character_inventory(character_id) WHERE equipped = true;
CREATE INDEX idx_items_rare_items ON items(rarity_id) WHERE rarity_id > 3;
CREATE INDEX idx_enemies_boss_level ON enemies(level) WHERE level > 30;

-- Index pour les recherches textuelles (trigram)
CREATE INDEX idx_items_name_trgm ON items USING gin(name gin_trgm_ops);
CREATE INDEX idx_characters_name_trgm ON characters USING gin(name gin_trgm_ops);
CREATE INDEX idx_enemies_name_trgm ON enemies USING gin(name gin_trgm_ops);

-- Index GIN pour les colonnes JSONB
CREATE INDEX idx_characters_stats_gin ON characters USING gin(stats);
CREATE INDEX idx_items_base_stats_gin ON items USING gin(base_stats);
CREATE INDEX idx_items_effects_gin ON items USING gin(effects);
CREATE INDEX idx_enemies_abilities_gin ON enemies USING gin(abilities);
CREATE INDEX idx_enemies_loot_table_gin ON enemies USING gin(loot_table);

-- Index pour les timestamps (pour les requêtes temporelles)
CREATE INDEX idx_characters_updated_at ON characters(updated_at);
CREATE INDEX idx_guild_members_last_active ON guild_members(last_active);
CREATE INDEX idx_character_inventory_created_at ON character_inventory(created_at);

-- Index pour les contraintes de performance
CREATE INDEX idx_characters_level_experience ON characters(level, experience);
CREATE INDEX idx_items_level_requirement ON items(level_requirement);
CREATE INDEX idx_enemies_level_type ON enemies(level, type);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallet_user ON user_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progression_user ON user_progression(user_id);
CREATE INDEX IF NOT EXISTS idx_character_stats_id ON character_stats(character_id);
CREATE INDEX IF NOT EXISTS idx_character_equipment_id ON character_equipment(character_id);
CREATE INDEX IF NOT EXISTS idx_character_skills ON character_skills(character_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_character_talents ON character_talents(character_id, talent_id);
CREATE INDEX IF NOT EXISTS idx_dungeon_enemies ON dungeon_enemies(dungeon_id, enemy_id);
CREATE INDEX IF NOT EXISTS idx_enemy_loot_tables ON enemy_loot_tables(enemy_id);
CREATE INDEX IF NOT EXISTS idx_item_enchantments ON item_enchantments(item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_type ON recipes(type);
CREATE INDEX IF NOT EXISTS idx_auctions_expires ON auctions(expires_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_time ON transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_season_progression ON season_progression(user_id, season_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON leaderboards(type);

-- =====================================================
-- TRIGGERS POUR LES TIMESTAMPS
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Application des triggers sur toutes les tables
CREATE TRIGGER update_rarities_updated_at BEFORE UPDATE ON rarities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_types_updated_at BEFORE UPDATE ON item_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_character_classes_updated_at BEFORE UPDATE ON character_classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_difficulties_updated_at BEFORE UPDATE ON difficulties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_character_inventory_updated_at BEFORE UPDATE ON character_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dungeons_updated_at BEFORE UPDATE ON dungeons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quests_updated_at BEFORE UPDATE ON quests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enemies_updated_at BEFORE UPDATE ON enemies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_character_dungeons_updated_at BEFORE UPDATE ON character_dungeons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_character_quests_updated_at BEFORE UPDATE ON character_quests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guilds_updated_at BEFORE UPDATE ON guilds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guild_members_updated_at BEFORE UPDATE ON guild_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progression_updated_at BEFORE UPDATE ON user_progression FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_wallet_updated_at BEFORE UPDATE ON user_wallet FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_character_stats_updated_at BEFORE UPDATE ON character_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_character_equipment_updated_at BEFORE UPDATE ON character_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_character_skills_updated_at BEFORE UPDATE ON character_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_talents_tree_updated_at BEFORE UPDATE ON talents_tree FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_character_talents_updated_at BEFORE UPDATE ON character_talents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_familiars_updated_at BEFORE UPDATE ON familiars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_character_familiars_updated_at BEFORE UPDATE ON character_familiars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_biomes_updated_at BEFORE UPDATE ON biomes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dungeon_enemies_updated_at BEFORE UPDATE ON dungeon_enemies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dungeon_rewards_updated_at BEFORE UPDATE ON dungeon_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_world_events_updated_at BEFORE UPDATE ON world_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enemy_archetypes_updated_at BEFORE UPDATE ON enemy_archetypes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enemy_loot_tables_updated_at BEFORE UPDATE ON enemy_loot_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_sets_updated_at BEFORE UPDATE ON item_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_set_bonuses_updated_at BEFORE UPDATE ON set_bonuses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_affixes_updated_at BEFORE UPDATE ON item_affixes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_enchantments_updated_at BEFORE UPDATE ON item_enchantments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON currencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON auctions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quest_objectives_updated_at BEFORE UPDATE ON quest_objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guild_missions_updated_at BEFORE UPDATE ON guild_missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_season_progression_updated_at BEFORE UPDATE ON season_progression FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaderboards_updated_at BEFORE UPDATE ON leaderboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_combat_logs_updated_at BEFORE UPDATE ON combat_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anti_cheat_flags_updated_at BEFORE UPDATE ON anti_cheat_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_trail_updated_at BEFORE UPDATE ON audit_trail FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cosmetics_updated_at BEFORE UPDATE ON cosmetics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shop_rotation_updated_at BEFORE UPDATE ON shop_rotation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VUES OPTIMISÉES POUR LES REQUÊTES FRÉQUENTES
-- =====================================================

-- Vue pour les personnages complets
CREATE OR REPLACE VIEW characters_full AS
SELECT 
    c.id, c.user_id, c.name, c.level, c.experience, c.experience_to_next,
    c.health, c.max_health, c.mana, c.max_mana, c.attack, c.defense,
    c.magic_attack, c.magic_defense, c.critical_rate, c.critical_damage,
    c.vitality, c.strength, c.intelligence, c.agility, c.resistance,
    c.precision, c.endurance, c.wisdom, c.constitution, c.dexterity,
    c.health_regen, c.mana_regen, c.attack_speed, c.movement_speed,
    c.dodge_chance, c.block_chance, c.parry_chance, c.spell_power, c.physical_power,
    c.stats, c.created_at, c.updated_at,
    -- Informations de classe
    cc.name as class_name, cc.display_name as class_display_name,
    cc.description as class_description, cc.base_stats as class_base_stats,
    cc.stat_ranges as class_stat_ranges, cc.starting_equipment as class_starting_equipment,
    cc.icon as class_icon,
    r.name as class_rarity_name, r.color as class_rarity_color,
    -- Informations utilisateur
    u.username, u.email, u.last_login
FROM characters c
JOIN character_classes cc ON c.class_id = cc.id
JOIN rarities r ON cc.rarity_id = r.id
JOIN users u ON c.user_id = u.id;

-- Vue pour l'inventaire complet
CREATE OR REPLACE VIEW character_inventory_full AS
SELECT 
    ci.id, ci.character_id, ci.item_id, ci.quantity, ci.equipped, ci.equipped_slot,
    ci.created_at, ci.updated_at,
    -- Informations de l'objet
    i.name as item_name, i.display_name as item_display_name, i.description as item_description,
    i.level_requirement, i.base_stats as item_base_stats, i.stat_ranges as item_stat_ranges,
    i.effects as item_effects, i.icon as item_icon, i.image as item_image,
    -- Informations du type
    it.name as item_type, it.display_name as item_type_display_name, it.category as item_category,
    it.equip_slot as item_equip_slot, it.max_stack as item_max_stack,
    -- Informations de rareté
    r.name as rarity_name, r.display_name as rarity_display_name, r.color as rarity_color,
    r.probability as rarity_probability, r.stat_multiplier as rarity_stat_multiplier
FROM character_inventory ci
JOIN items i ON ci.item_id = i.id
JOIN item_types it ON i.type_id = it.id
JOIN rarities r ON i.rarity_id = r.id;

-- Vue pour les items avec statistiques
CREATE OR REPLACE VIEW items_with_stats AS
SELECT 
    i.id, i.name, i.display_name, i.description, i.level_requirement,
    i.base_stats, i.stat_ranges, i.effects, i.icon, i.image,
    i.created_at, i.updated_at,
    -- Informations du type
    it.name as type_name, it.display_name as type_display_name, it.category as type_category,
    it.equip_slot as type_equip_slot, it.max_stack as type_max_stack,
    -- Informations de rareté
    r.name as rarity_name, r.display_name as rarity_display_name, r.color as rarity_color,
    r.probability as rarity_probability, r.stat_multiplier as rarity_stat_multiplier,
    -- Statistiques d'utilisation
    (SELECT COUNT(*) FROM character_inventory WHERE item_id = i.id) as total_owned,
    (SELECT COUNT(*) FROM character_inventory WHERE item_id = i.id AND equipped = true) as total_equipped,
    (SELECT SUM(quantity) FROM character_inventory WHERE item_id = i.id) as total_quantity
FROM items i
JOIN item_types it ON i.type_id = it.id
JOIN rarities r ON i.rarity_id = r.id;

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer les stats d'un personnage avec équipement
CREATE OR REPLACE FUNCTION calculate_character_stats(character_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    char_stats JSONB;
    base_stats JSONB;
    equipment_bonus JSONB := '{}';
    final_stats JSONB;
    item_stats JSONB;
BEGIN
    -- Récupérer les stats de base du personnage
    SELECT stats INTO char_stats FROM characters WHERE id = character_id;
    
    -- Récupérer les stats de base de la classe
    SELECT cc.base_stats INTO base_stats 
    FROM characters c 
    JOIN character_classes cc ON c.class_id = cc.id 
    WHERE c.id = character_id;
    
    -- Calculer les bonus d'équipement
    SELECT jsonb_object_agg(key, value) INTO equipment_bonus
    FROM (
        SELECT key, SUM(value::numeric) as value
        FROM character_inventory ci
        JOIN items i ON ci.item_id = i.id
        CROSS JOIN LATERAL jsonb_each_text(i.base_stats)
        WHERE ci.character_id = character_id AND ci.equipped = true
        GROUP BY key
    ) equipment;
    
    -- Combiner les stats
    final_stats := COALESCE(char_stats, '{}') || COALESCE(base_stats, '{}') || COALESCE(equipment_bonus, '{}');
    
    RETURN final_stats;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier les contraintes d'équipement
CREATE OR REPLACE FUNCTION check_equipment_constraints(character_id INTEGER, item_id INTEGER, slot VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    item_type VARCHAR;
    item_equip_slot VARCHAR;
    character_level INTEGER;
    item_level_req INTEGER;
BEGIN
    -- Vérifier le type d'objet et le slot
    SELECT it.equip_slot, i.level_requirement INTO item_equip_slot, item_level_req
    FROM items i
    JOIN item_types it ON i.type_id = it.id
    WHERE i.id = item_id;
    
    -- Vérifier le niveau du personnage
    SELECT level INTO character_level FROM characters WHERE id = character_id;
    
    -- Vérifications
    IF item_equip_slot IS NULL OR item_equip_slot != slot THEN
        RETURN FALSE;
    END IF;
    
    IF character_level < item_level_req THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CONFIGURATION FINALE
-- =====================================================

-- Statistiques pour l'optimiseur de requêtes
ANALYZE;

-- Configuration des performances
VACUUM ANALYZE;

-- Commentaires pour la documentation
COMMENT ON SCHEMA public IS 'Schéma ultra-optimisé pour Eternal Ascent RPG';
COMMENT ON TABLE characters IS 'Table des personnages avec contraintes de performance';
COMMENT ON TABLE items IS 'Table des objets avec index GIN pour JSONB';
COMMENT ON TABLE character_inventory IS 'Table d''inventaire avec contraintes d''équipement';

