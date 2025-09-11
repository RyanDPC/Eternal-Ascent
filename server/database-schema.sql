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
    stat_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00 CHECK (stat_multiplier > 0),
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
    stat_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00 CHECK (stat_multiplier > 0),
    exp_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00 CHECK (exp_multiplier > 0),
    gold_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00 CHECK (gold_multiplier > 0),
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
    name VARCHAR(80) NOT NULL UNIQUE,
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
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des codes d'authentification par email (passwordless / vérification)
CREATE TABLE IF NOT EXISTS auth_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('register','login','verify')),
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP,
    attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    ip VARCHAR(64),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_codes_email ON auth_codes(email);
CREATE INDEX IF NOT EXISTS idx_auth_codes_expires ON auth_codes(expires_at);
-- Permet d'avoir au plus un code actif par email/purpose
CREATE UNIQUE INDEX IF NOT EXISTS uq_auth_codes_email_purpose_active ON auth_codes (email, purpose) WHERE consumed_at IS NULL;

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
    critical_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (critical_rate >= 0 AND critical_rate <= 100),
    critical_damage DECIMAL(5,2) NOT NULL DEFAULT 150.00 CHECK (critical_damage >= 100),
    
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
    dodge_chance DECIMAL(5,2) NOT NULL DEFAULT 8.00 CHECK (dodge_chance >= 0 AND dodge_chance <= 100),
    block_chance DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (block_chance >= 0 AND block_chance <= 100),
    parry_chance DECIMAL(5,2) NOT NULL DEFAULT 3.00 CHECK (parry_chance >= 0 AND parry_chance <= 100),
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

-- Table des compétences (skills)
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('offensive', 'healing', 'defensive', 'buff', 'debuff')),
    class VARCHAR(20) NOT NULL,
    available_classes JSONB NOT NULL DEFAULT '[]',
    level_requirement SMALLINT NOT NULL DEFAULT 1 CHECK (level_requirement > 0),
    mana_cost INTEGER NOT NULL DEFAULT 0 CHECK (mana_cost >= 0),
    cooldown SMALLINT NOT NULL DEFAULT 0 CHECK (cooldown >= 0),
    damage JSONB DEFAULT NULL,
    healing JSONB DEFAULT NULL,
    shield JSONB DEFAULT NULL,
    buffs JSONB DEFAULT NULL,
    debuffs JSONB DEFAULT NULL,
    effects JSONB DEFAULT '[]',
    duration SMALLINT DEFAULT NULL,
    icon VARCHAR(10),
    animation VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT skills_available_classes_valid CHECK (jsonb_typeof(available_classes) = 'array'),
    CONSTRAINT skills_damage_valid CHECK (damage IS NULL OR jsonb_typeof(damage) = 'object'),
    CONSTRAINT skills_healing_valid CHECK (healing IS NULL OR jsonb_typeof(healing) = 'object'),
    CONSTRAINT skills_shield_valid CHECK (shield IS NULL OR jsonb_typeof(shield) = 'object'),
    CONSTRAINT skills_buffs_valid CHECK (buffs IS NULL OR jsonb_typeof(buffs) = 'object'),
    CONSTRAINT skills_debuffs_valid CHECK (debuffs IS NULL OR jsonb_typeof(debuffs) = 'object'),
    CONSTRAINT skills_effects_valid CHECK (jsonb_typeof(effects) = 'array')
);

-- Table des compétences apprises par personnage (manquante)
CREATE TABLE IF NOT EXISTS character_skills (
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    level SMALLINT NOT NULL DEFAULT 1 CHECK (level > 0),
    learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upgraded_at TIMESTAMP,
    PRIMARY KEY (character_id, skill_id)
);

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
CREATE INDEX idx_skills_class ON skills(class);
CREATE INDEX idx_skills_type ON skills(type);
CREATE INDEX idx_skills_level_requirement ON skills(level_requirement);
CREATE INDEX idx_skills_available_classes_gin ON skills USING gin(available_classes);
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
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VUES OPTIMISÉES POUR LES REQUÊTES FRÉQUENTES
-- =====================================================
-- (Déplacé vers server/database-views.sql)

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer les stats d'un personnage avec équipement
CREATE OR REPLACE FUNCTION calculate_character_stats(p_character_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    char_stats JSONB;
    base_stats JSONB;
    equipment_bonus JSONB := '{}';
    final_stats JSONB;
    item_stats JSONB;
BEGIN
    -- Récupérer les stats de base du personnage
    SELECT stats INTO char_stats FROM characters WHERE id = p_character_id;
    
    -- Récupérer les stats de base de la classe
    SELECT cc.base_stats INTO base_stats 
    FROM characters c 
    JOIN character_classes cc ON c.class_id = cc.id 
    WHERE c.id = p_character_id;
    
    -- Calculer les bonus d'équipement
    SELECT jsonb_object_agg(key, value) INTO equipment_bonus
    FROM (
        SELECT key, SUM(value::numeric) as value
        FROM character_inventory ci
        JOIN items i ON ci.item_id = i.id
        CROSS JOIN LATERAL jsonb_each_text(i.base_stats)
        WHERE ci.character_id = p_character_id AND ci.equipped = true
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

