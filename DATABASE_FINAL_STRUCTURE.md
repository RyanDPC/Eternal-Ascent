# Base de Données Finale - Eternal Ascent RPG
## Structure Complète et Optimisée (Version Production)

Cette documentation présente la **version finale et obligatoire** de la base de données PostgreSQL d'Eternal Ascent. Toutes les tables présentées sont **OBLIGATOIRES** pour le fonctionnement complet du système RPG.

---

## 🎯 Vue d'Ensemble du Système

### **Architecture Complète (25 Tables Obligatoires)**
```
📊 CONFIGURATION (5 tables)     🎮 GAMEPLAY (6 tables)         👥 SOCIAL (4 tables)
├─ rarities                     ├─ skills                       ├─ friends
├─ item_types                   ├─ talents                      ├─ friend_requests  
├─ character_classes            ├─ dungeons                     ├─ guilds
├─ difficulties                 ├─ quests                       └─ guild_members
└─ achievements                 ├─ enemies                      
                               └─ events                        📈 PROGRESSION (3 tables)
🎒 OBJETS & INVENTAIRE (2)                                      ├─ character_achievements
├─ items                        🏛️ ÉCONOMIE (3 tables)          ├─ character_dungeons
└─ character_inventory          ├─ marketplace_listings         └─ character_quests
                               ├─ marketplace_transactions      
👤 UTILISATEURS (2 tables)      └─ character_currencies         📝 LOGS & ANALYTICS (2)
├─ users                                                        ├─ combat_sessions
└─ auth_codes                   🎭 PERSONNAGES (1 table)        └─ user_sessions
                               └─ characters                    
```

---

## 📊 TABLES DE CONFIGURATION (5 Tables Obligatoires)

### 1. `rarities` - Système de Raretés ⭐

**Structure SQL :**
```sql
CREATE TABLE rarities (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    probability DECIMAL(8,7) NOT NULL CHECK (probability > 0 AND probability <= 1),
    stat_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00 CHECK (stat_multiplier > 0),
    drop_rate_bonus DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL,
    sort_order SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Exemple JSON complet :**
```json
{
  "id": 1,
  "name": "common",
  "display_name": "Commun",
  "color": "#9CA3AF",
  "probability": 0.6000000,
  "stat_multiplier": 1.00,
  "drop_rate_bonus": 0.00,
  "description": "Objets et classes de base, facilement trouvables",
  "icon": "⚪",
  "sort_order": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 2. `item_types` - Types d'Objets 🎒

**Structure SQL :**
```sql
CREATE TABLE item_types (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    display_name VARCHAR(60) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('weapon', 'armor', 'consumable', 'material', 'currency', 'special', 'quest_item')),
    equip_slot VARCHAR(20) CHECK (equip_slot IN ('head', 'chest', 'legs', 'boots', 'gloves', 'weapon', 'shield', 'accessory', 'ring', 'necklace', 'trinket')),
    max_stack INTEGER NOT NULL DEFAULT 1 CHECK (max_stack > 0),
    is_tradeable BOOLEAN NOT NULL DEFAULT true,
    is_sellable BOOLEAN NOT NULL DEFAULT true,
    vendor_price INTEGER DEFAULT 0,
    description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Exemple JSON complet :**
```json
{
  "id": 1,
  "name": "sword",
  "display_name": "Épée",
  "category": "weapon",
  "equip_slot": "weapon",
  "max_stack": 1,
  "is_tradeable": true,
  "is_sellable": true,
  "vendor_price": 50,
  "description": "Arme de mêlée tranchante pour le combat rapproché",
  "icon": "⚔️",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 3. `character_classes` - Classes de Personnages 🛡️

**Structure SQL :**
```sql
CREATE TABLE character_classes (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    display_name VARCHAR(60) NOT NULL,
    description TEXT NOT NULL,
    rarity_id SMALLINT NOT NULL REFERENCES rarities(id),
    probability DECIMAL(5,4) NOT NULL DEFAULT 0.9800 CHECK (probability > 0 AND probability <= 1),
    base_stats JSONB NOT NULL DEFAULT '{}',
    stat_ranges JSONB NOT NULL DEFAULT '{}',
    starting_equipment JSONB NOT NULL DEFAULT '[]',
    available_skills JSONB NOT NULL DEFAULT '[]',
    class_bonuses JSONB NOT NULL DEFAULT '{}',
    unlock_requirements JSONB DEFAULT '{}',
    icon VARCHAR(100) NOT NULL,
    background_story TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT character_classes_base_stats_valid CHECK (jsonb_typeof(base_stats) = 'object'),
    CONSTRAINT character_classes_stat_ranges_valid CHECK (jsonb_typeof(stat_ranges) = 'object'),
    CONSTRAINT character_classes_starting_equipment_valid CHECK (jsonb_typeof(starting_equipment) = 'array'),
    CONSTRAINT character_classes_available_skills_valid CHECK (jsonb_typeof(available_skills) = 'array'),
    CONSTRAINT character_classes_class_bonuses_valid CHECK (jsonb_typeof(class_bonuses) = 'object')
);
```

**Structure JSON `class_bonuses` :**
```json
{
  "exp_bonus": 0.10,
  "gold_bonus": 0.05,
  "special_abilities": [
    {
      "name": "berserker_rage",
      "unlock_level": 10,
      "description": "Augmente l'attaque de 50% pendant 30 secondes"
    }
  ],
  "stat_growth_bonus": {
    "strength": 0.20,
    "vitality": 0.15
  }
}
```

### 4. `difficulties` - Niveaux de Difficulté 🎯

**Structure SQL :**
```sql
CREATE TABLE difficulties (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    display_name VARCHAR(40) NOT NULL,
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    stat_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00 CHECK (stat_multiplier > 0),
    exp_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00 CHECK (exp_multiplier > 0),
    gold_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00 CHECK (gold_multiplier > 0),
    drop_rate_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00 CHECK (drop_rate_multiplier > 0),
    unlock_level INTEGER NOT NULL DEFAULT 1,
    order_index SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. `achievements` - Système de Succès 🏆 *(NOUVELLE TABLE)*

**Structure SQL :**
```sql
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('combat', 'exploration', 'social', 'collection', 'progression', 'special')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('single', 'progressive', 'hidden', 'timed')),
    requirements JSONB NOT NULL DEFAULT '{}',
    rewards JSONB NOT NULL DEFAULT '{}',
    points INTEGER NOT NULL DEFAULT 0,
    rarity_id SMALLINT NOT NULL REFERENCES rarities(id),
    icon VARCHAR(100) NOT NULL,
    is_secret BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT achievements_requirements_valid CHECK (jsonb_typeof(requirements) = 'object'),
    CONSTRAINT achievements_rewards_valid CHECK (jsonb_typeof(rewards) = 'object')
);
```

**Structure JSON `requirements` :**
```json
{
  "type": "kill_enemies",
  "target": "dragons",
  "quantity": 100,
  "conditions": {
    "min_level": 20,
    "solo_only": true,
    "time_limit": 3600
  }
}
```

**Structure JSON `rewards` :**
```json
{
  "experience": 5000,
  "gold": 1000,
  "items": [
    {
      "name": "dragon_slayer_title",
      "quantity": 1
    }
  ],
  "titles": ["Dragon Slayer"],
  "permanent_bonuses": {
    "dragon_damage": 0.10
  }
}
```

---

## 🎒 TABLES D'OBJETS ET INVENTAIRE (2 Tables Obligatoires)

### 6. `items` - Objets du Jeu 📦

**Structure SQL Optimisée :**
```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type_id SMALLINT NOT NULL REFERENCES item_types(id),
    rarity_id SMALLINT NOT NULL REFERENCES rarities(id),
    level_requirement SMALLINT NOT NULL DEFAULT 1 CHECK (level_requirement > 0),
    base_stats JSONB NOT NULL DEFAULT '{}',
    stat_ranges JSONB NOT NULL DEFAULT '{}',
    effects JSONB NOT NULL DEFAULT '[]',
    set_bonus JSONB DEFAULT NULL,
    durability INTEGER DEFAULT NULL CHECK (durability > 0),
    market_value INTEGER NOT NULL DEFAULT 0,
    vendor_price INTEGER NOT NULL DEFAULT 0,
    icon VARCHAR(100) NOT NULL,
    image VARCHAR(200),
    flavor_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT items_base_stats_valid CHECK (jsonb_typeof(base_stats) = 'object'),
    CONSTRAINT items_stat_ranges_valid CHECK (jsonb_typeof(stat_ranges) = 'object'),
    CONSTRAINT items_effects_valid CHECK (jsonb_typeof(effects) = 'array'),
    CONSTRAINT items_set_bonus_valid CHECK (set_bonus IS NULL OR jsonb_typeof(set_bonus) = 'object')
);
```

**Structure JSON `set_bonus` :**
```json
{
  "set_name": "Dragon Slayer Set",
  "pieces_required": 3,
  "bonuses": {
    "2_pieces": {
      "fire_resistance": 25,
      "description": "+25% Résistance au Feu"
    },
    "3_pieces": {
      "dragon_damage": 50,
      "description": "+50% Dégâts contre les Dragons"
    }
  }
}
```

### 7. `character_inventory` - Inventaire des Personnages 🎒

**Structure SQL Optimisée :**
```sql
CREATE TABLE character_inventory (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    equipped BOOLEAN NOT NULL DEFAULT FALSE,
    equipped_slot VARCHAR(20),
    durability INTEGER DEFAULT NULL,
    enchantments JSONB DEFAULT '[]',
    socket_gems JSONB DEFAULT '[]',
    obtained_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_character_item UNIQUE (character_id, item_id),
    CONSTRAINT equipped_slot_required CHECK (NOT equipped OR equipped_slot IS NOT NULL),
    CONSTRAINT character_inventory_enchantments_valid CHECK (jsonb_typeof(enchantments) = 'array'),
    CONSTRAINT character_inventory_socket_gems_valid CHECK (jsonb_typeof(socket_gems) = 'array')
);
```

**Structure JSON `enchantments` :**
```json
[
  {
    "name": "sharpness_3",
    "display_name": "Tranchant III",
    "bonus": {
      "attack": 15,
      "critical_rate": 5.0
    },
    "applied_date": "2024-01-20T10:00:00Z"
  }
]
```

---

## 👤 TABLES UTILISATEURS (2 Tables Obligatoires)

### 8. `users` - Utilisateurs 👥

**Structure SQL Optimisée :**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE CHECK (length(username) >= 3 AND length(username) <= 30),
    email VARCHAR(100) NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash VARCHAR(255) NOT NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMP,
    last_login TIMESTAMP,
    login_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    premium_expires_at TIMESTAMP,
    profile_settings JSONB NOT NULL DEFAULT '{}',
    privacy_settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT users_profile_settings_valid CHECK (jsonb_typeof(profile_settings) = 'object'),
    CONSTRAINT users_privacy_settings_valid CHECK (jsonb_typeof(privacy_settings) = 'object')
);
```

**Structure JSON `profile_settings` :**
```json
{
  "avatar": "avatar_warrior_01.png",
  "title": "Dragon Slayer",
  "bio": "Chasseur de dragons légendaire",
  "show_online_status": true,
  "language": "fr",
  "timezone": "Europe/Paris",
  "theme": "dark"
}
```

### 9. `auth_codes` - Codes d'Authentification 🔐

**Structure SQL Optimisée :**
```sql
CREATE TABLE auth_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('register','login','verify','reset_password','change_email')),
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP,
    attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
    max_attempts SMALLINT NOT NULL DEFAULT 3,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT auth_codes_metadata_valid CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_auth_codes_email_purpose ON auth_codes(email, purpose);
CREATE INDEX idx_auth_codes_expires_at ON auth_codes(expires_at);
CREATE UNIQUE INDEX uq_auth_codes_email_purpose_active ON auth_codes (email, purpose) 
WHERE consumed_at IS NULL AND expires_at > NOW();
```

---

## 🎭 TABLE PERSONNAGES (1 Table Obligatoire)

### 10. `characters` - Personnages 🦸

**Structure SQL Ultra-Optimisée :**
```sql
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL UNIQUE CHECK (length(name) >= 3 AND length(name) <= 50),
    class_id SMALLINT NOT NULL REFERENCES character_classes(id),
    
    -- Stats de base
    level SMALLINT NOT NULL DEFAULT 1 CHECK (level > 0 AND level <= 100),
    experience BIGINT NOT NULL DEFAULT 0 CHECK (experience >= 0),
    experience_to_next INTEGER NOT NULL DEFAULT 100 CHECK (experience_to_next > 0),
    skill_points INTEGER NOT NULL DEFAULT 0 CHECK (skill_points >= 0),
    talent_points INTEGER NOT NULL DEFAULT 0 CHECK (talent_points >= 0),
    
    -- Stats de combat
    health INTEGER NOT NULL CHECK (health > 0),
    max_health INTEGER NOT NULL CHECK (max_health > 0 AND max_health >= health),
    mana INTEGER NOT NULL CHECK (mana >= 0),
    max_mana INTEGER NOT NULL CHECK (max_mana >= 0 AND max_mana >= mana),
    energy INTEGER NOT NULL DEFAULT 100 CHECK (energy >= 0 AND energy <= 100),
    
    -- Stats principales
    attack INTEGER NOT NULL CHECK (attack > 0),
    defense INTEGER NOT NULL CHECK (defense > 0),
    magic_attack INTEGER NOT NULL CHECK (magic_attack > 0),
    magic_defense INTEGER NOT NULL CHECK (magic_defense > 0),
    critical_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (critical_rate >= 0 AND critical_rate <= 100),
    critical_damage DECIMAL(5,2) NOT NULL DEFAULT 150.00 CHECK (critical_damage >= 100),
    
    -- Stats secondaires
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
    
    -- Stats dérivées
    health_regen DECIMAL(5,2) NOT NULL DEFAULT 1.00 CHECK (health_regen >= 0),
    mana_regen DECIMAL(5,2) NOT NULL DEFAULT 0.50 CHECK (mana_regen >= 0),
    attack_speed DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (attack_speed > 0),
    movement_speed DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (movement_speed > 0),
    dodge_chance DECIMAL(5,2) NOT NULL DEFAULT 8.00 CHECK (dodge_chance >= 0 AND dodge_chance <= 100),
    block_chance DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (block_chance >= 0 AND block_chance <= 100),
    parry_chance DECIMAL(5,2) NOT NULL DEFAULT 3.00 CHECK (parry_chance >= 0 AND parry_chance <= 100),
    spell_power DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (spell_power > 0),
    physical_power DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (physical_power > 0),
    
    -- Progression et métadonnées
    total_playtime INTEGER NOT NULL DEFAULT 0, -- en secondes
    last_location VARCHAR(50) DEFAULT 'starting_town',
    respawn_location VARCHAR(50) DEFAULT 'starting_town',
    pvp_enabled BOOLEAN NOT NULL DEFAULT false,
    stats JSONB NOT NULL DEFAULT '{}',
    active_buffs JSONB NOT NULL DEFAULT '[]',
    active_debuffs JSONB NOT NULL DEFAULT '[]',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    CONSTRAINT unique_user_character UNIQUE (user_id),
    CONSTRAINT characters_stats_valid CHECK (jsonb_typeof(stats) = 'object'),
    CONSTRAINT characters_active_buffs_valid CHECK (jsonb_typeof(active_buffs) = 'array'),
    CONSTRAINT characters_active_debuffs_valid CHECK (jsonb_typeof(active_debuffs) = 'array')
);
```

**Structure JSON `active_buffs` :**
```json
[
  {
    "name": "strength_potion",
    "display_name": "Potion de Force",
    "effect": {
      "strength": 20,
      "attack": 15
    },
    "duration_remaining": 1800,
    "applied_at": "2024-01-20T15:00:00Z"
  }
]
```

---

## 🎮 TABLES DE GAMEPLAY (6 Tables Obligatoires)

### 11. `skills` - Compétences ⚡

**Structure SQL Optimisée :**
```sql
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('offensive', 'healing', 'defensive', 'buff', 'debuff', 'utility', 'passive')),
    skill_tree VARCHAR(30) NOT NULL,
    available_classes JSONB NOT NULL DEFAULT '[]',
    level_requirement SMALLINT NOT NULL DEFAULT 1 CHECK (level_requirement > 0),
    skill_point_cost INTEGER NOT NULL DEFAULT 1 CHECK (skill_point_cost > 0),
    mana_cost INTEGER NOT NULL DEFAULT 0 CHECK (mana_cost >= 0),
    energy_cost INTEGER NOT NULL DEFAULT 0 CHECK (energy_cost >= 0),
    cooldown SMALLINT NOT NULL DEFAULT 0 CHECK (cooldown >= 0),
    cast_time DECIMAL(3,1) NOT NULL DEFAULT 0.0 CHECK (cast_time >= 0),
    range_meters SMALLINT DEFAULT 0 CHECK (range_meters >= 0),
    damage JSONB DEFAULT NULL,
    healing JSONB DEFAULT NULL,
    shield JSONB DEFAULT NULL,
    buffs JSONB DEFAULT NULL,
    debuffs JSONB DEFAULT NULL,
    effects JSONB NOT NULL DEFAULT '[]',
    duration SMALLINT DEFAULT NULL,
    max_level SMALLINT NOT NULL DEFAULT 1 CHECK (max_level > 0),
    prerequisites JSONB DEFAULT '[]',
    icon VARCHAR(100) NOT NULL,
    animation VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT skills_available_classes_valid CHECK (jsonb_typeof(available_classes) = 'array'),
    CONSTRAINT skills_damage_valid CHECK (damage IS NULL OR jsonb_typeof(damage) = 'object'),
    CONSTRAINT skills_healing_valid CHECK (healing IS NULL OR jsonb_typeof(healing) = 'object'),
    CONSTRAINT skills_prerequisites_valid CHECK (jsonb_typeof(prerequisites) = 'array'),
    CONSTRAINT skills_effects_valid CHECK (jsonb_typeof(effects) = 'array')
);
```

### 12. `talents` - Arbres de Talents 🌳 *(NOUVELLE TABLE)*

**Structure SQL :**
```sql
CREATE TABLE talents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    tree_name VARCHAR(30) NOT NULL,
    tier SMALLINT NOT NULL CHECK (tier >= 1 AND tier <= 10),
    position_x SMALLINT NOT NULL,
    position_y SMALLINT NOT NULL,
    talent_type VARCHAR(20) NOT NULL CHECK (talent_type IN ('passive', 'active', 'enhancement', 'mastery')),
    available_classes JSONB NOT NULL DEFAULT '[]',
    requirements JSONB NOT NULL DEFAULT '{}',
    effects JSONB NOT NULL DEFAULT '{}',
    max_points INTEGER NOT NULL DEFAULT 1 CHECK (max_points > 0 AND max_points <= 5),
    point_cost INTEGER NOT NULL DEFAULT 1 CHECK (point_cost > 0),
    icon VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT talents_available_classes_valid CHECK (jsonb_typeof(available_classes) = 'array'),
    CONSTRAINT talents_requirements_valid CHECK (jsonb_typeof(requirements) = 'object'),
    CONSTRAINT talents_effects_valid CHECK (jsonb_typeof(effects) = 'object'),
    CONSTRAINT unique_talent_position UNIQUE (tree_name, position_x, position_y)
);
```

### 13. `dungeons` - Donjons 🏰

**Structure SQL Optimisée :**
```sql
CREATE TABLE dungeons (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    level_requirement SMALLINT NOT NULL DEFAULT 1 CHECK (level_requirement > 0),
    max_level SMALLINT DEFAULT NULL CHECK (max_level IS NULL OR max_level >= level_requirement),
    difficulty_id SMALLINT NOT NULL REFERENCES difficulties(id),
    estimated_duration SMALLINT NOT NULL CHECK (estimated_duration > 0),
    max_players SMALLINT NOT NULL DEFAULT 1 CHECK (max_players > 0 AND max_players <= 8),
    entry_cost JSONB DEFAULT '[]',
    rewards JSONB NOT NULL DEFAULT '[]',
    requirements JSONB NOT NULL DEFAULT '[]',
    enemies JSONB NOT NULL DEFAULT '[]',
    boss_enemies JSONB NOT NULL DEFAULT '[]',
    environment_effects JSONB DEFAULT '[]',
    lore_text TEXT,
    icon VARCHAR(100) NOT NULL,
    theme VARCHAR(30) NOT NULL,
    background_music VARCHAR(100),
    is_repeatable BOOLEAN NOT NULL DEFAULT true,
    reset_interval INTEGER DEFAULT 86400, -- en secondes, 24h par défaut
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT dungeons_entry_cost_valid CHECK (jsonb_typeof(entry_cost) = 'array'),
    CONSTRAINT dungeons_rewards_valid CHECK (jsonb_typeof(rewards) = 'array'),
    CONSTRAINT dungeons_requirements_valid CHECK (jsonb_typeof(requirements) = 'array'),
    CONSTRAINT dungeons_enemies_valid CHECK (jsonb_typeof(enemies) = 'array'),
    CONSTRAINT dungeons_boss_enemies_valid CHECK (jsonb_typeof(boss_enemies) = 'array')
);
```

### 14. `quests` - Quêtes 📜

**Structure SQL Optimisée :**
```sql
CREATE TABLE quests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('main', 'side', 'daily', 'weekly', 'guild', 'event', 'chain', 'repeatable')),
    category VARCHAR(30) NOT NULL CHECK (category IN ('combat', 'exploration', 'collection', 'social', 'crafting', 'story')),
    level_requirement SMALLINT NOT NULL DEFAULT 1 CHECK (level_requirement > 0),
    max_level SMALLINT DEFAULT NULL CHECK (max_level IS NULL OR max_level >= level_requirement),
    quest_chain_id INTEGER DEFAULT NULL,
    chain_order SMALLINT DEFAULT NULL,
    prerequisites JSONB NOT NULL DEFAULT '[]',
    rewards JSONB NOT NULL DEFAULT '[]',
    requirements JSONB NOT NULL DEFAULT '[]',
    objectives JSONB NOT NULL DEFAULT '[]',
    time_limit INTEGER DEFAULT NULL CHECK (time_limit IS NULL OR time_limit > 0),
    is_repeatable BOOLEAN NOT NULL DEFAULT false,
    repeat_interval INTEGER DEFAULT NULL,
    auto_accept BOOLEAN NOT NULL DEFAULT false,
    auto_complete BOOLEAN NOT NULL DEFAULT false,
    npc_giver VARCHAR(50),
    location VARCHAR(50),
    icon VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT quests_prerequisites_valid CHECK (jsonb_typeof(prerequisites) = 'array'),
    CONSTRAINT quests_rewards_valid CHECK (jsonb_typeof(rewards) = 'array'),
    CONSTRAINT quests_requirements_valid CHECK (jsonb_typeof(requirements) = 'array'),
    CONSTRAINT quests_objectives_valid CHECK (jsonb_typeof(objectives) = 'array')
);
```

### 15. `enemies` - Ennemis 👹

**Structure SQL Optimisée :**
```sql
CREATE TABLE enemies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('humanoid', 'beast', 'undead', 'elemental', 'demon', 'dragon', 'construct', 'aberration')),
    subtype VARCHAR(30),
    level SMALLINT NOT NULL CHECK (level > 0 AND level <= 100),
    rarity_id SMALLINT NOT NULL REFERENCES rarities(id),
    is_boss BOOLEAN NOT NULL DEFAULT false,
    is_elite BOOLEAN NOT NULL DEFAULT false,
    
    -- Stats de combat
    health INTEGER NOT NULL CHECK (health > 0),
    mana INTEGER NOT NULL DEFAULT 0 CHECK (mana >= 0),
    attack INTEGER NOT NULL CHECK (attack > 0),
    defense INTEGER NOT NULL CHECK (defense > 0),
    magic_attack INTEGER NOT NULL DEFAULT 0 CHECK (magic_attack >= 0),
    magic_defense INTEGER NOT NULL DEFAULT 0 CHECK (magic_defense >= 0),
    speed SMALLINT NOT NULL DEFAULT 100 CHECK (speed > 0),
    critical_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (critical_rate >= 0 AND critical_rate <= 100),
    
    -- Récompenses
    experience_reward INTEGER NOT NULL DEFAULT 0 CHECK (experience_reward >= 0),
    gold_reward INTEGER NOT NULL DEFAULT 0 CHECK (gold_reward >= 0),
    
    -- Capacités et résistances
    abilities JSONB NOT NULL DEFAULT '[]',
    passive_abilities JSONB NOT NULL DEFAULT '[]',
    weaknesses JSONB NOT NULL DEFAULT '[]',
    resistances JSONB NOT NULL DEFAULT '[]',
    immunities JSONB NOT NULL DEFAULT '[]',
    loot_table JSONB NOT NULL DEFAULT '[]',
    
    -- Comportement IA
    ai_behavior JSONB NOT NULL DEFAULT '{}',
    aggro_range SMALLINT NOT NULL DEFAULT 10,
    respawn_time INTEGER NOT NULL DEFAULT 300, -- en secondes
    
    icon VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    sound_effects JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT enemies_abilities_valid CHECK (jsonb_typeof(abilities) = 'array'),
    CONSTRAINT enemies_passive_abilities_valid CHECK (jsonb_typeof(passive_abilities) = 'array'),
    CONSTRAINT enemies_weaknesses_valid CHECK (jsonb_typeof(weaknesses) = 'array'),
    CONSTRAINT enemies_resistances_valid CHECK (jsonb_typeof(resistances) = 'array'),
    CONSTRAINT enemies_immunities_valid CHECK (jsonb_typeof(immunities) = 'array'),
    CONSTRAINT enemies_loot_table_valid CHECK (jsonb_typeof(loot_table) = 'array'),
    CONSTRAINT enemies_ai_behavior_valid CHECK (jsonb_typeof(ai_behavior) = 'object')
);
```

### 16. `events` - Événements du Jeu 🎉 *(NOUVELLE TABLE)*

**Structure SQL :**
```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('seasonal', 'special', 'tournament', 'raid', 'community', 'maintenance')),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'paused', 'completed', 'cancelled')),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL CHECK (end_date > start_date),
    level_requirement SMALLINT DEFAULT 1,
    max_participants INTEGER DEFAULT NULL,
    current_participants INTEGER NOT NULL DEFAULT 0,
    rewards JSONB NOT NULL DEFAULT '[]',
    requirements JSONB DEFAULT '[]',
    special_rules JSONB DEFAULT '{}',
    leaderboard JSONB DEFAULT '[]',
    icon VARCHAR(100) NOT NULL,
    banner_image VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT events_rewards_valid CHECK (jsonb_typeof(rewards) = 'array'),
    CONSTRAINT events_requirements_valid CHECK (jsonb_typeof(requirements) = 'array'),
    CONSTRAINT events_special_rules_valid CHECK (jsonb_typeof(special_rules) = 'object'),
    CONSTRAINT events_leaderboard_valid CHECK (jsonb_typeof(leaderboard) = 'array')
);
```

---

## 🏛️ TABLES D'ÉCONOMIE (3 Tables Obligatoires)

### 17. `marketplace_listings` - Marché des Joueurs 🛒 *(NOUVELLE TABLE)*

**Structure SQL :**
```sql
CREATE TABLE marketplace_listings (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_per_unit INTEGER NOT NULL CHECK (price_per_unit > 0),
    total_price INTEGER GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
    currency_type VARCHAR(20) NOT NULL DEFAULT 'gold_coin',
    listing_fee INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
    expires_at TIMESTAMP NOT NULL,
    item_condition JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP,
    
    CONSTRAINT marketplace_listings_item_condition_valid CHECK (jsonb_typeof(item_condition) = 'object')
);

CREATE INDEX idx_marketplace_listings_item_price ON marketplace_listings(item_id, price_per_unit);
CREATE INDEX idx_marketplace_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_listings_status_expires ON marketplace_listings(status, expires_at);
```

### 18. `marketplace_transactions` - Transactions du Marché 💰 *(NOUVELLE TABLE)*

**Structure SQL :**
```sql
CREATE TABLE marketplace_transactions (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES marketplace_listings(id),
    buyer_id INTEGER NOT NULL REFERENCES characters(id),
    seller_id INTEGER NOT NULL REFERENCES characters(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL CHECK (unit_price > 0),
    total_price INTEGER NOT NULL CHECK (total_price > 0),
    currency_type VARCHAR(20) NOT NULL,
    marketplace_fee INTEGER NOT NULL DEFAULT 0,
    seller_receives INTEGER NOT NULL CHECK (seller_receives >= 0),
    transaction_status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (transaction_status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marketplace_transactions_buyer ON marketplace_transactions(buyer_id);
CREATE INDEX idx_marketplace_transactions_seller ON marketplace_transactions(seller_id);
CREATE INDEX idx_marketplace_transactions_item ON marketplace_transactions(item_id);
```

### 19. `character_currencies` - Monnaies des Personnages 💎 *(NOUVELLE TABLE)*

**Structure SQL :**
```sql
CREATE TABLE character_currencies (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    currency_name VARCHAR(30) NOT NULL,
    amount BIGINT NOT NULL DEFAULT 0 CHECK (amount >= 0),
    lifetime_earned BIGINT NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
    lifetime_spent BIGINT NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_character_currency UNIQUE (character_id, currency_name)
);

CREATE INDEX idx_character_currencies_character ON character_currencies(character_id);
CREATE INDEX idx_character_currencies_currency ON character_currencies(currency_name);
```

---

## 👥 TABLES SOCIALES (4 Tables Obligatoires)

### 20. `friends` - Liste d'Amis 👫 *(NOUVELLE TABLE)*

**Structure SQL :**
```sql
CREATE TABLE friends (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    friendship_level INTEGER NOT NULL DEFAULT 1 CHECK (friendship_level >= 1 AND friendship_level <= 10),
    total_interactions INTEGER NOT NULL DEFAULT 0,
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_friendship UNIQUE (character_id, friend_id),
    CONSTRAINT no_self_friendship CHECK (character_id != friend_id)
);

CREATE INDEX idx_friends_character ON friends(character_id);
CREATE INDEX idx_friends_friend ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);
```

### 21. `friend_requests` - Demandes d'Amitié 📨 *(NOUVELLE TABLE)*

**Structure SQL :**
```sql
CREATE TABLE friend_requests (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    
    CONSTRAINT unique_friend_request UNIQUE (sender_id, receiver_id),
    CONSTRAINT no_self_request CHECK (sender_id != receiver_id)
);

CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_id, status);
CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_id);
```

### 22. `guilds` - Guildes 🏰

**Structure SQL Optimisée :**
```sql
CREATE TABLE guilds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE CHECK (length(name) >= 3 AND length(name) <= 50),
    display_name VARCHAR(80) NOT NULL,
    description TEXT,
    motto VARCHAR(200),
    level SMALLINT NOT NULL DEFAULT 1 CHECK (level > 0 AND level <= 100),
    experience BIGINT NOT NULL DEFAULT 0 CHECK (experience >= 0),
    experience_to_next INTEGER NOT NULL DEFAULT 1000 CHECK (experience_to_next > 0),
    max_members SMALLINT NOT NULL DEFAULT 20 CHECK (max_members > 0 AND max_members <= 100),
    current_members SMALLINT NOT NULL DEFAULT 0 CHECK (current_members >= 0 AND current_members <= max_members),
    guild_coin BIGINT NOT NULL DEFAULT 0 CHECK (guild_coin >= 0),
    guild_honor INTEGER NOT NULL DEFAULT 0 CHECK (guild_honor >= 0),
    guild_type VARCHAR(20) NOT NULL DEFAULT 'casual' CHECK (guild_type IN ('casual', 'hardcore', 'roleplay', 'pvp', 'pve')),
    recruitment_status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (recruitment_status IN ('open', 'invite_only', 'closed')),
    min_level_requirement SMALLINT DEFAULT 1,
    emblem VARCHAR(200),
    banner VARCHAR(200),
    guild_hall_level SMALLINT NOT NULL DEFAULT 1 CHECK (guild_hall_level > 0),
    territory_count INTEGER NOT NULL DEFAULT 0 CHECK (territory_count >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disbanded')),
    settings JSONB NOT NULL DEFAULT '{}',
    created_by INTEGER NOT NULL REFERENCES characters(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT guilds_settings_valid CHECK (jsonb_typeof(settings) = 'object')
);
```

### 23. `guild_members` - Membres de Guilde 👥

**Structure SQL Optimisée :**
```sql
CREATE TABLE guild_members (
    id SERIAL PRIMARY KEY,
    guild_id INTEGER NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    rank VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (rank IN ('leader', 'officer', 'veteran', 'member', 'recruit')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contribution_points INTEGER NOT NULL DEFAULT 0 CHECK (contribution_points >= 0),
    weekly_contribution INTEGER NOT NULL DEFAULT 0 CHECK (weekly_contribution >= 0),
    monthly_contribution INTEGER NOT NULL DEFAULT 0 CHECK (monthly_contribution >= 0),
    total_contribution BIGINT NOT NULL DEFAULT 0 CHECK (total_contribution >= 0),
    permissions JSONB NOT NULL DEFAULT '{}',
    notes TEXT,
    promoted_at TIMESTAMP,
    promoted_by INTEGER REFERENCES characters(id),
    
    CONSTRAINT unique_guild_member UNIQUE (guild_id, character_id),
    CONSTRAINT guild_members_permissions_valid CHECK (jsonb_typeof(permissions) = 'object')
);
```

---

## 📈 TABLES DE PROGRESSION (3 Tables Obligatoires)

### 24. `character_achievements` - Succès des Personnages 🏆 *(NOUVELLE TABLE)*

**Structure SQL :**
```sql
CREATE TABLE character_achievements (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id),
    progress JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('locked', 'in_progress', 'completed')),
    completed_at TIMESTAMP,
    points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_character_achievement UNIQUE (character_id, achievement_id),
    CONSTRAINT character_achievements_progress_valid CHECK (jsonb_typeof(progress) = 'object')
);
```

### 25. `character_dungeons` - Progression des Donjons 🏰

**Structure SQL Optimisée :**
```sql
CREATE TABLE character_dungeons (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    dungeon_id SMALLINT NOT NULL REFERENCES dungeons(id),
    status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'completed', 'mastered')),
    difficulty_completed VARCHAR(20),
    best_time INTEGER CHECK (best_time > 0),
    best_score INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0 CHECK (completion_count >= 0),
    total_attempts INTEGER DEFAULT 0 CHECK (total_attempts >= 0),
    success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_attempts > 0 THEN (completion_count::decimal / total_attempts * 100) ELSE 0 END
    ) STORED,
    last_completed TIMESTAMP,
    last_attempted TIMESTAMP,
    rewards_claimed JSONB DEFAULT '[]',
    statistics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_character_dungeon UNIQUE (character_id, dungeon_id),
    CONSTRAINT character_dungeons_rewards_claimed_valid CHECK (jsonb_typeof(rewards_claimed) = 'array'),
    CONSTRAINT character_dungeons_statistics_valid CHECK (jsonb_typeof(statistics) = 'object')
);
```

### 26. `character_quests` - Progression des Quêtes 📜

**Structure SQL Optimisée :**
```sql
CREATE TABLE character_quests (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    quest_id INTEGER NOT NULL REFERENCES quests(id),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('locked', 'available', 'active', 'completed', 'failed', 'abandoned')),
    progress JSONB NOT NULL DEFAULT '{}',
    objectives_completed INTEGER NOT NULL DEFAULT 0,
    total_objectives INTEGER NOT NULL DEFAULT 1,
    completion_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_objectives > 0 THEN (objectives_completed::decimal / total_objectives * 100) ELSE 0 END
    ) STORED,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    expires_at TIMESTAMP,
    turn_in_npc VARCHAR(50),
    rewards_claimed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_character_quest UNIQUE (character_id, quest_id),
    CONSTRAINT character_quests_progress_valid CHECK (jsonb_typeof(progress) = 'object')
);
```

---

## 📝 TABLES DE LOGS ET ANALYTICS (3 Tables Obligatoires)

### 27. `combat_sessions` - Sessions de Combat ⚔️

**Structure SQL Optimisée :**
```sql
CREATE TABLE combat_sessions (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('dungeon', 'pvp', 'quest', 'event', 'training')),
    dungeon_id SMALLINT REFERENCES dungeons(id),
    quest_id INTEGER REFERENCES quests(id),
    result VARCHAR(20) NOT NULL CHECK (result IN ('victory', 'defeat', 'draw', 'abandoned')),
    duration INTEGER NOT NULL CHECK (duration > 0), -- en secondes
    experience_gained INTEGER DEFAULT 0,
    gold_gained INTEGER DEFAULT 0,
    damage_dealt BIGINT DEFAULT 0,
    damage_taken BIGINT DEFAULT 0,
    healing_done BIGINT DEFAULT 0,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    combat_stats JSONB NOT NULL DEFAULT '{}',
    log_gzip BYTEA NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT combat_sessions_combat_stats_valid CHECK (jsonb_typeof(combat_stats) = 'object')
);

CREATE INDEX idx_combat_sessions_character_type ON combat_sessions(character_id, session_type);
CREATE INDEX idx_combat_sessions_created_at ON combat_sessions(created_at);
CREATE INDEX idx_combat_sessions_dungeon ON combat_sessions(dungeon_id) WHERE dungeon_id IS NOT NULL;
```

### 28. `user_sessions` - Sessions Utilisateurs 📊 *(NOUVELLE TABLE)*

**Structure SQL :**
```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration INTEGER, -- en secondes
    is_active BOOLEAN NOT NULL DEFAULT true,
    logout_reason VARCHAR(30) DEFAULT 'manual' CHECK (logout_reason IN ('manual', 'timeout', 'forced', 'error')),
    
    CONSTRAINT user_sessions_device_info_valid CHECK (jsonb_typeof(device_info) = 'object'),
    CONSTRAINT user_sessions_location_info_valid CHECK (jsonb_typeof(location_info) = 'object')
);

CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);
```

---

## 🚀 INDEX ULTRA-OPTIMISÉS (Production Ready)

### Index Principaux
```sql
-- =====================================================
-- INDEX DE PERFORMANCE CRITIQUE
-- =====================================================

-- Characters - Index les plus utilisés
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_class_id ON characters(class_id);
CREATE INDEX idx_characters_level_exp ON characters(level, experience);
CREATE INDEX idx_characters_name_trgm ON characters USING gin(name gin_trgm_ops);
CREATE INDEX idx_characters_last_played ON characters(last_played);
CREATE INDEX idx_characters_location ON characters(last_location);

-- Inventory - Performance critique
CREATE INDEX idx_character_inventory_character_equipped ON character_inventory(character_id, equipped);
CREATE INDEX idx_character_inventory_item_id ON character_inventory(item_id);
CREATE INDEX idx_character_inventory_equipped_slot ON character_inventory(equipped_slot) WHERE equipped = true;

-- Items - Recherche et filtrage
CREATE INDEX idx_items_type_rarity_level ON items(type_id, rarity_id, level_requirement);
CREATE INDEX idx_items_name_trgm ON items USING gin(name gin_trgm_ops);
CREATE INDEX idx_items_market_value ON items(market_value);
CREATE INDEX idx_items_base_stats_gin ON items USING gin(base_stats);

-- Dungeons et Progression
CREATE INDEX idx_dungeons_level_difficulty ON dungeons(level_requirement, difficulty_id);
CREATE INDEX idx_character_dungeons_character_status ON character_dungeons(character_id, status);
CREATE INDEX idx_character_dungeons_completion ON character_dungeons(completion_count DESC, best_time ASC);

-- Quests
CREATE INDEX idx_quests_type_level ON quests(type, level_requirement);
CREATE INDEX idx_character_quests_character_status ON character_quests(character_id, status);
CREATE INDEX idx_character_quests_completion ON character_quests(completion_percentage DESC);

-- Social Features
CREATE INDEX idx_friends_character_status ON friends(character_id, status);
CREATE INDEX idx_friend_requests_receiver_status ON friend_requests(receiver_id, status);
CREATE INDEX idx_guild_members_guild_rank ON guild_members(guild_id, rank);
CREATE INDEX idx_guild_members_contribution ON guild_members(total_contribution DESC);

-- Marketplace
CREATE INDEX idx_marketplace_listings_item_price ON marketplace_listings(item_id, price_per_unit) WHERE status = 'active';
CREATE INDEX idx_marketplace_listings_expires ON marketplace_listings(expires_at) WHERE status = 'active';
CREATE INDEX idx_marketplace_transactions_created ON marketplace_transactions(created_at DESC);

-- Achievements
CREATE INDEX idx_character_achievements_character_status ON character_achievements(character_id, status);
CREATE INDEX idx_achievements_category_type ON achievements(category, type);

-- Performance Analytics
CREATE INDEX idx_combat_sessions_character_date ON combat_sessions(character_id, created_at DESC);
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active);

-- =====================================================
-- INDEX JSONB SPÉCIALISÉS
-- =====================================================

-- Recherche dans les stats et effets
CREATE INDEX idx_items_effects_gin ON items USING gin(effects);
CREATE INDEX idx_characters_stats_gin ON characters USING gin(stats);
CREATE INDEX idx_characters_buffs_gin ON characters USING gin(active_buffs);
CREATE INDEX idx_skills_available_classes_gin ON skills USING gin(available_classes);
CREATE INDEX idx_enemies_abilities_gin ON enemies USING gin(abilities);
CREATE INDEX idx_dungeons_rewards_gin ON dungeons USING gin(rewards);

-- =====================================================
-- INDEX PARTIELS POUR OPTIMISATION
-- =====================================================

-- Personnages actifs uniquement
CREATE INDEX idx_characters_active_high_level ON characters(level DESC, experience DESC) 
WHERE last_played > (CURRENT_TIMESTAMP - INTERVAL '30 days');

-- Items équipés seulement
CREATE INDEX idx_inventory_equipped_items ON character_inventory(character_id, equipped_slot) 
WHERE equipped = true;

-- Donjons disponibles
CREATE INDEX idx_dungeons_available ON dungeons(level_requirement, difficulty_id) 
WHERE level_requirement <= 50;

-- Quêtes actives
CREATE INDEX idx_character_quests_active ON character_quests(character_id, started_at) 
WHERE status IN ('active', 'available');

-- Marketplace actif
CREATE INDEX idx_marketplace_active_price ON marketplace_listings(item_id, price_per_unit ASC) 
WHERE status = 'active' AND expires_at > CURRENT_TIMESTAMP;
```

---

## 🔧 CONTRAINTES ET VALIDATIONS AVANCÉES

### Contraintes de Données
```sql
-- =====================================================
-- CONTRAINTES AVANCÉES DE VALIDATION
-- =====================================================

-- Validation des emails avec regex PostgreSQL
ALTER TABLE users ADD CONSTRAINT valid_email 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Validation des noms de personnages (pas de caractères spéciaux)
ALTER TABLE characters ADD CONSTRAINT valid_character_name 
CHECK (name ~* '^[A-Za-z0-9\s\-\_]+$');

-- Validation des prix du marketplace
ALTER TABLE marketplace_listings ADD CONSTRAINT reasonable_price 
CHECK (price_per_unit >= 1 AND price_per_unit <= 1000000);

-- Validation des niveaux de guilde cohérents
ALTER TABLE guilds ADD CONSTRAINT guild_level_experience_coherent 
CHECK (level = 1 OR experience >= (level - 1) * 1000);

-- Validation des stats de personnage cohérentes
ALTER TABLE characters ADD CONSTRAINT stats_coherent 
CHECK (health <= max_health AND mana <= max_mana);

-- Validation des durées de donjon
ALTER TABLE dungeons ADD CONSTRAINT reasonable_duration 
CHECK (estimated_duration >= 1 AND estimated_duration <= 300); -- 1 minute à 5 heures

-- Validation des dates d'événements
ALTER TABLE events ADD CONSTRAINT valid_event_dates 
CHECK (start_date < end_date AND start_date >= CURRENT_TIMESTAMP - INTERVAL '1 year');
```

---

## 🎯 TRIGGERS AUTOMATIQUES

### Triggers de Maintenance
```sql
-- =====================================================
-- TRIGGERS DE MAINTENANCE AUTOMATIQUE
-- =====================================================

-- Mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Application sur toutes les tables avec updated_at
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guilds_updated_at BEFORE UPDATE ON guilds 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour maintenir le nombre de membres de guilde
CREATE OR REPLACE FUNCTION update_guild_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE guilds SET current_members = current_members + 1 WHERE id = NEW.guild_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE guilds SET current_members = current_members - 1 WHERE id = OLD.guild_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guild_member_count_trigger
    AFTER INSERT OR DELETE ON guild_members
    FOR EACH ROW EXECUTE FUNCTION update_guild_member_count();

-- Trigger pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM user_sessions 
    WHERE last_activity < CURRENT_TIMESTAMP - INTERVAL '7 days' 
    AND is_active = false;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_sessions_trigger
    AFTER INSERT ON user_sessions
    EXECUTE FUNCTION cleanup_expired_sessions();
```

---

## 📊 VUES MATÉRIALISÉES OPTIMISÉES

### Vues pour Performance
```sql
-- =====================================================
-- VUES MATÉRIALISÉES POUR PERFORMANCE
-- =====================================================

-- Vue des statistiques de personnages avec équipement
CREATE MATERIALIZED VIEW character_stats_computed AS
SELECT 
    c.id,
    c.name,
    c.level,
    c.class_id,
    -- Stats de base
    c.attack + COALESCE(eq.total_attack, 0) as effective_attack,
    c.defense + COALESCE(eq.total_defense, 0) as effective_defense,
    c.magic_attack + COALESCE(eq.total_magic_attack, 0) as effective_magic_attack,
    c.magic_defense + COALESCE(eq.total_magic_defense, 0) as effective_magic_defense,
    -- Score de puissance total
    (c.attack + c.defense + c.magic_attack + c.magic_defense + 
     COALESCE(eq.total_attack + eq.total_defense + eq.total_magic_attack + eq.total_magic_defense, 0)) as power_score,
    c.updated_at
FROM characters c
LEFT JOIN (
    SELECT 
        ci.character_id,
        SUM(COALESCE((i.base_stats->>'attack')::integer, 0)) as total_attack,
        SUM(COALESCE((i.base_stats->>'defense')::integer, 0)) as total_defense,
        SUM(COALESCE((i.base_stats->>'magic_attack')::integer, 0)) as total_magic_attack,
        SUM(COALESCE((i.base_stats->>'magic_defense')::integer, 0)) as total_magic_defense
    FROM character_inventory ci
    JOIN items i ON ci.item_id = i.id
    WHERE ci.equipped = true
    GROUP BY ci.character_id
) eq ON c.id = eq.character_id;

CREATE UNIQUE INDEX idx_character_stats_computed_id ON character_stats_computed(id);
CREATE INDEX idx_character_stats_computed_power ON character_stats_computed(power_score DESC);

-- Vue du leaderboard global
CREATE MATERIALIZED VIEW global_leaderboard AS
SELECT 
    c.id,
    c.name,
    c.level,
    cc.display_name as class_name,
    csc.power_score,
    COALESCE(achievements.achievement_count, 0) as total_achievements,
    COALESCE(dungeons.completed_dungeons, 0) as completed_dungeons,
    ROW_NUMBER() OVER (ORDER BY c.level DESC, c.experience DESC, csc.power_score DESC) as rank
FROM characters c
JOIN character_classes cc ON c.class_id = cc.id
LEFT JOIN character_stats_computed csc ON c.id = csc.id
LEFT JOIN (
    SELECT character_id, COUNT(*) as achievement_count
    FROM character_achievements
    WHERE status = 'completed'
    GROUP BY character_id
) achievements ON c.id = achievements.character_id
LEFT JOIN (
    SELECT character_id, COUNT(*) as completed_dungeons
    FROM character_dungeons
    WHERE status IN ('completed', 'mastered')
    GROUP BY character_id
) dungeons ON c.id = dungeons.character_id
WHERE c.last_played > CURRENT_TIMESTAMP - INTERVAL '90 days';

CREATE UNIQUE INDEX idx_global_leaderboard_rank ON global_leaderboard(rank);
CREATE INDEX idx_global_leaderboard_character ON global_leaderboard(id);
```

---

## 🎮 EXEMPLE D'API RESPONSE COMPLÈTE

### GET /api/characters/:id (Response Finale)
```json
{
  "character": {
    "id": 1,
    "name": "Héros Légendaire",
    "level": 25,
    "experience": 125000,
    "experience_to_next": 15000,
    "skill_points": 5,
    "talent_points": 3,
    "health": 850,
    "max_health": 850,
    "mana": 320,
    "max_mana": 320,
    "energy": 100,
    "attack": 145,
    "defense": 98,
    "magic_attack": 67,
    "magic_defense": 78,
    "critical_rate": 18.50,
    "critical_damage": 195.00,
    "total_playtime": 172800,
    "last_location": "dragon_peak",
    "respawn_location": "capital_city",
    "pvp_enabled": false,
    "stats": {
      "total_dungeons_completed": 47,
      "total_achievements": 23,
      "total_experience_gained": 125000,
      "favorite_dungeon": "dragon_lair",
      "pvp_wins": 12,
      "pvp_losses": 3,
      "guild_contribution": 15000
    },
    "active_buffs": [
      {
        "name": "guild_experience_bonus",
        "display_name": "Bonus d'Expérience de Guilde",
        "effect": { "experience_multiplier": 1.15 },
        "duration_remaining": 7200,
        "applied_at": "2024-01-20T15:00:00Z"
      }
    ],
    "class": {
      "id": 1,
      "name": "dragon_knight",
      "display_name": "Chevalier Dragon",
      "description": "Un guerrier légendaire lié aux dragons",
      "rarity": {
        "name": "epic",
        "display_name": "Épique",
        "color": "#9333EA"
      },
      "class_bonuses": {
        "exp_bonus": 0.10,
        "dragon_damage": 0.25,
        "fire_resistance": 0.50
      }
    },
    "user": {
      "username": "DragonSlayer2024",
      "is_premium": true,
      "premium_expires_at": "2024-12-31T23:59:59Z"
    }
  },
  "computed_stats": {
    "effective_attack": 195,
    "effective_defense": 145,
    "effective_magic_attack": 92,
    "effective_magic_defense": 110,
    "power_score": 2847,
    "global_rank": 156,
    "class_rank": 23,
    "equipment_bonus": {
      "attack": 50,
      "defense": 47,
      "magic_attack": 25,
      "magic_defense": 32,
      "set_bonuses": [
        {
          "set_name": "Dragon Slayer Set",
          "pieces_equipped": 3,
          "active_bonuses": ["fire_resistance", "dragon_damage"]
        }
      ]
    }
  },
  "progression": {
    "achievements": {
      "completed": 23,
      "total": 150,
      "completion_percentage": 15.33,
      "points": 2450,
      "recent": [
        {
          "name": "dragon_slayer_master",
          "display_name": "Maître Tueur de Dragons",
          "completed_at": "2024-01-19T14:30:00Z"
        }
      ]
    },
    "dungeons": {
      "completed": 47,
      "mastered": 12,
      "available": 73,
      "total": 120,
      "favorite_difficulty": "nightmare",
      "best_completion_time": 245
    },
    "quests": {
      "completed": 89,
      "active": 3,
      "available": 15,
      "failed": 2
    }
  },
  "social": {
    "guild": {
      "id": 5,
      "name": "Les Gardiens Éternels",
      "rank": "officer",
      "contribution_points": 15000,
      "joined_at": "2024-01-10T09:00:00Z"
    },
    "friends": {
      "total": 28,
      "online": 7,
      "best_friend": "Mage Mystique"
    }
  },
  "economy": {
    "currencies": {
      "gold_coin": 125000,
      "platinum_coin": 450,
      "dragon_token": 12,
      "guild_coin": 2500
    },
    "marketplace": {
      "active_listings": 3,
      "total_sales": 47,
      "total_earned": 89000
    }
  }
}
```

---

## 🎯 CONCLUSION

Cette structure de base de données **finale et optimisée** pour Eternal Ascent comprend :

### ✅ **27 Tables Obligatoires** complètement optimisées
### ✅ **Index Ultra-Performants** pour toutes les requêtes critiques  
### ✅ **Contraintes Avancées** pour l'intégrité des données
### ✅ **Triggers Automatiques** pour la maintenance
### ✅ **Vues Matérialisées** pour les performances
### ✅ **Structures JSON Complètes** pour tous les champs JSONB
### ✅ **Relations Parfaitement Définies** entre toutes les tables
### ✅ **Système Complet** : Combat, Social, Économie, Progression

Cette architecture supporte un RPG moderne complet avec toutes les fonctionnalités attendues par les joueurs d'aujourd'hui, tout en étant optimisée pour les performances en production.

---

**🚀 Prêt pour la Production !**
