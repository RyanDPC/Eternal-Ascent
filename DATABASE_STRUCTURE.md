# Documentation de la Base de Données - Eternal Ascent

## Vue d'ensemble

Cette documentation présente la structure complète de la base de données PostgreSQL d'Eternal Ascent, incluant toutes les tables, leurs colonnes, types de données, et les structures JSON utilisées dans les champs JSONB.

---

## Tables de Configuration Statiques

### 1. `rarities` - Système de Raretés

**Structure de table :**
```sql
CREATE TABLE rarities (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    probability DECIMAL(8,7) NOT NULL,
    stat_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    description TEXT,
    icon VARCHAR(100),
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
  "description": "Objets et classes de base",
  "icon": "common_icon",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 2. `item_types` - Types d'Objets

**Structure de table :**
```sql
CREATE TABLE item_types (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    display_name VARCHAR(60) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('weapon', 'armor', 'consumable', 'material', 'currency', 'special')),
    equip_slot VARCHAR(20) CHECK (equip_slot IN ('head', 'chest', 'legs', 'boots', 'gloves', 'weapon', 'accessory', 'ring', 'necklace')),
    max_stack INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    icon VARCHAR(100),
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
  "description": "Arme de mêlée tranchante",
  "icon": "sword_icon",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 3. `character_classes` - Classes de Personnages

**Structure de table :**
```sql
CREATE TABLE character_classes (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    display_name VARCHAR(60) NOT NULL,
    description TEXT,
    rarity_id SMALLINT NOT NULL REFERENCES rarities(id),
    probability DECIMAL(5,4) NOT NULL DEFAULT 0.9800,
    base_stats JSONB NOT NULL DEFAULT '{}',
    stat_ranges JSONB NOT NULL DEFAULT '{}',
    starting_equipment JSONB DEFAULT '[]',
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Structure JSON `base_stats` :**
```json
{
  "health": 150,
  "mana": 50,
  "attack": 25,
  "defense": 20,
  "magic_attack": 8,
  "magic_defense": 10
}
```

**Structure JSON `stat_ranges` :**
```json
{
  "health": [140, 160],
  "mana": [45, 55],
  "attack": [23, 27],
  "defense": [18, 22],
  "magic_attack": [6, 10],
  "magic_defense": [8, 12]
}
```

**Structure JSON `starting_equipment` :**
```json
["Épée de Fer", "Armure de Cuir", "Bottes de Cuir"]
```

**Exemple JSON complet :**
```json
{
  "id": 1,
  "name": "warrior",
  "display_name": "Guerrier",
  "description": "Un combattant robuste spécialisé dans le combat au corps à corps",
  "rarity_id": 1,
  "probability": 0.3000,
  "base_stats": {
    "health": 150,
    "mana": 50,
    "attack": 25,
    "defense": 20,
    "magic_attack": 8,
    "magic_defense": 10
  },
  "stat_ranges": {
    "health": [140, 160],
    "mana": [45, 55],
    "attack": [23, 27],
    "defense": [18, 22],
    "magic_attack": [6, 10],
    "magic_defense": [8, 12]
  },
  "starting_equipment": ["Épée de Fer", "Armure de Cuir", "Bottes de Cuir"],
  "icon": "warrior_icon",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "_embedded": {
    "rarity": {
      "id": 1,
      "name": "common",
      "display_name": "Commun",
      "color": "#9CA3AF"
    }
  }
}
```

### 4. `difficulties` - Niveaux de Difficulté

**Structure de table :**
```sql
CREATE TABLE difficulties (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    display_name VARCHAR(40) NOT NULL,
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    description TEXT,
    stat_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    exp_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    gold_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    order_index SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Exemple JSON complet :**
```json
{
  "id": 1,
  "name": "easy",
  "display_name": "Facile",
  "color": "#10B981",
  "icon": "⭐",
  "description": "Difficulté pour débutants",
  "stat_multiplier": 1.00,
  "exp_multiplier": 1.00,
  "gold_multiplier": 1.00,
  "order_index": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

## Tables d'Objets et Équipements

### 5. `items` - Objets du Jeu

**Structure de table :**
```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    type_id SMALLINT NOT NULL REFERENCES item_types(id),
    rarity_id SMALLINT NOT NULL REFERENCES rarities(id),
    level_requirement SMALLINT NOT NULL DEFAULT 1,
    base_stats JSONB DEFAULT '{}',
    stat_ranges JSONB DEFAULT '{}',
    effects JSONB DEFAULT '[]',
    icon VARCHAR(100),
    image VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Structure JSON `base_stats` :**
```json
{
  "attack": 25,
  "defense": 15,
  "magic_attack": 10,
  "magic_defense": 8,
  "critical_rate": 5.0,
  "durability": 100,
  "speed": 12
}
```

**Structure JSON `stat_ranges` :**
```json
{
  "attack": [23, 27],
  "defense": [13, 17],
  "magic_attack": [8, 12],
  "magic_defense": [6, 10],
  "critical_rate": [4.0, 6.0],
  "durability": [90, 110],
  "speed": [10, 14]
}
```

**Structure JSON `effects` :**
```json
[
  {
    "type": "passive",
    "name": "fire_resistance",
    "value": 15,
    "description": "Résistance au feu +15%"
  },
  {
    "type": "on_hit",
    "name": "poison_chance",
    "value": 10,
    "duration": 5,
    "description": "10% de chance d'empoisonner pendant 5 secondes"
  }
]
```

**Exemple JSON complet :**
```json
{
  "id": 1,
  "name": "iron_sword",
  "display_name": "Épée de Fer",
  "description": "Une épée basique en fer forgé",
  "type_id": 1,
  "rarity_id": 1,
  "level_requirement": 1,
  "base_stats": {
    "attack": 25,
    "defense": 5,
    "durability": 100,
    "speed": 12
  },
  "stat_ranges": {
    "attack": [23, 27],
    "defense": [3, 7],
    "durability": [90, 110],
    "speed": [10, 14]
  },
  "effects": [
    {
      "type": "passive",
      "name": "sharpness",
      "value": 5,
      "description": "Tranchant +5%"
    }
  ],
  "icon": "iron_sword_icon",
  "image": "iron_sword.png",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "_embedded": {
    "type": {
      "id": 1,
      "name": "sword",
      "display_name": "Épée",
      "category": "weapon",
      "equip_slot": "weapon"
    },
    "rarity": {
      "id": 1,
      "name": "common",
      "display_name": "Commun",
      "color": "#9CA3AF"
    }
  }
}
```

---

## Tables Utilisateurs et Personnages

### 6. `users` - Utilisateurs

**Structure de table :**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Exemple JSON complet :**
```json
{
  "id": 1,
  "username": "player1",
  "email": "player1@example.com",
  "password_hash": "$2b$10$...",
  "is_email_verified": true,
  "email_verified_at": "2024-01-15T11:00:00Z",
  "last_login": "2024-01-20T15:30:00Z",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:30:00Z"
}
```

### 7. `auth_codes` - Codes d'Authentification

**Structure de table :**
```sql
CREATE TABLE auth_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('register','login','verify')),
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP,
    attempts SMALLINT NOT NULL DEFAULT 0,
    ip VARCHAR(64),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Exemple JSON complet :**
```json
{
  "id": 1,
  "email": "player1@example.com",
  "code": "ABC123",
  "purpose": "verify",
  "expires_at": "2024-01-15T11:30:00Z",
  "consumed_at": "2024-01-15T11:15:00Z",
  "attempts": 1,
  "ip": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 8. `characters` - Personnages

**Structure de table :**
```sql
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL UNIQUE,
    class_id SMALLINT NOT NULL REFERENCES character_classes(id),
    
    -- Stats de base
    level SMALLINT NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    experience_to_next INTEGER NOT NULL DEFAULT 100,
    
    -- Stats de combat
    health INTEGER NOT NULL,
    max_health INTEGER NOT NULL,
    mana INTEGER NOT NULL,
    max_mana INTEGER NOT NULL,
    
    -- Stats principales
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    magic_attack INTEGER NOT NULL,
    magic_defense INTEGER NOT NULL,
    critical_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    critical_damage DECIMAL(5,2) NOT NULL DEFAULT 150.00,
    
    -- Stats secondaires
    vitality SMALLINT NOT NULL DEFAULT 10,
    strength SMALLINT NOT NULL DEFAULT 10,
    intelligence SMALLINT NOT NULL DEFAULT 10,
    agility SMALLINT NOT NULL DEFAULT 10,
    resistance SMALLINT NOT NULL DEFAULT 10,
    precision SMALLINT NOT NULL DEFAULT 10,
    endurance SMALLINT NOT NULL DEFAULT 10,
    wisdom SMALLINT NOT NULL DEFAULT 10,
    constitution SMALLINT NOT NULL DEFAULT 10,
    dexterity SMALLINT NOT NULL DEFAULT 10,
    
    -- Stats dérivées
    health_regen DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    mana_regen DECIMAL(5,2) NOT NULL DEFAULT 0.50,
    attack_speed DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    movement_speed DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    dodge_chance DECIMAL(5,2) NOT NULL DEFAULT 8.00,
    block_chance DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    parry_chance DECIMAL(5,2) NOT NULL DEFAULT 3.00,
    spell_power DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    physical_power DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    
    -- Métadonnées
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Structure JSON `stats` (métadonnées additionnelles) :**
```json
{
  "total_dungeons_completed": 25,
  "total_experience_gained": 15000,
  "favorite_dungeon": "dragon_lair",
  "achievements": ["first_kill", "level_10", "dungeon_master"],
  "playtime_hours": 48.5,
  "last_dungeon_completed": "2024-01-20T14:30:00Z",
  "combat_stats": {
    "total_kills": 150,
    "deaths": 3,
    "damage_dealt": 50000,
    "damage_taken": 12000,
    "healing_done": 8000
  }
}
```

**Exemple JSON complet avec imbrications :**
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Héros Légendaire",
  "class_id": 1,
  "level": 15,
  "experience": 2500,
  "experience_to_next": 3200,
  "health": 450,
  "max_health": 450,
  "mana": 180,
  "max_mana": 180,
  "attack": 85,
  "defense": 65,
  "magic_attack": 35,
  "magic_defense": 45,
  "critical_rate": 12.50,
  "critical_damage": 175.00,
  "vitality": 25,
  "strength": 30,
  "intelligence": 15,
  "agility": 20,
  "resistance": 18,
  "precision": 22,
  "endurance": 28,
  "wisdom": 12,
  "constitution": 26,
  "dexterity": 19,
  "health_regen": 4.50,
  "mana_regen": 2.25,
  "attack_speed": 115.00,
  "movement_speed": 110.00,
  "dodge_chance": 15.00,
  "block_chance": 12.00,
  "parry_chance": 8.00,
  "spell_power": 125.00,
  "physical_power": 140.00,
  "stats": {
    "total_dungeons_completed": 25,
    "total_experience_gained": 15000,
    "favorite_dungeon": "dragon_lair",
    "achievements": ["first_kill", "level_10", "dungeon_master"],
    "playtime_hours": 48.5
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:30:00Z",
  "_embedded": {
    "user": {
      "id": 1,
      "username": "player1",
      "email": "player1@example.com"
    },
    "class": {
      "id": 1,
      "name": "warrior",
      "display_name": "Guerrier",
      "description": "Un combattant robuste spécialisé dans le combat au corps à corps",
      "rarity": {
        "name": "common",
        "display_name": "Commun",
        "color": "#9CA3AF"
      }
    }
  }
}
```

---

## Tables d'Inventaire et Équipement

### 9. `character_inventory` - Inventaire des Personnages

**Structure de table :**
```sql
CREATE TABLE character_inventory (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    equipped BOOLEAN NOT NULL DEFAULT FALSE,
    equipped_slot VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Exemple JSON complet avec imbrications :**
```json
{
  "id": 1,
  "character_id": 1,
  "item_id": 1,
  "quantity": 1,
  "equipped": true,
  "equipped_slot": "weapon",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:30:00Z",
  "_embedded": {
    "item": {
      "id": 1,
      "name": "iron_sword",
      "display_name": "Épée de Fer",
      "description": "Une épée basique en fer forgé",
      "level_requirement": 1,
      "base_stats": {
        "attack": 25,
        "defense": 5,
        "durability": 100
      },
      "effects": [
        {
          "type": "passive",
          "name": "sharpness",
          "value": 5,
          "description": "Tranchant +5%"
        }
      ],
      "type": {
        "name": "sword",
        "display_name": "Épée",
        "category": "weapon",
        "equip_slot": "weapon"
      },
      "rarity": {
        "name": "common",
        "display_name": "Commun",
        "color": "#9CA3AF",
        "stat_multiplier": 1.00
      }
    }
  }
}
```

---

## Tables de Gameplay

### 10. `skills` - Compétences

**Structure de table :**
```sql
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('offensive', 'healing', 'defensive', 'buff', 'debuff')),
    class VARCHAR(20) NOT NULL,
    available_classes JSONB NOT NULL DEFAULT '[]',
    level_requirement SMALLINT NOT NULL DEFAULT 1,
    mana_cost INTEGER NOT NULL DEFAULT 0,
    cooldown SMALLINT NOT NULL DEFAULT 0,
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Structure JSON `available_classes` :**
```json
["warrior", "paladin", "berserker"]
```

**Structure JSON `damage` :**
```json
{
  "base": 50,
  "scaling": "attack",
  "multiplier": 1.2,
  "type": "physical",
  "min": 45,
  "max": 65
}
```

**Structure JSON `healing` :**
```json
{
  "base": 75,
  "scaling": "magic_attack",
  "multiplier": 0.8,
  "type": "direct",
  "over_time": false
}
```

**Structure JSON `buffs` :**
```json
{
  "attack_boost": {
    "value": 20,
    "duration": 30,
    "type": "percentage"
  },
  "speed_boost": {
    "value": 15,
    "duration": 20,
    "type": "flat"
  }
}
```

**Structure JSON `effects` :**
```json
[
  {
    "type": "animation",
    "name": "sword_slash",
    "duration": 0.5
  },
  {
    "type": "sound",
    "name": "metal_clang",
    "volume": 0.8
  }
]
```

**Exemple JSON complet :**
```json
{
  "id": 1,
  "name": "sword_strike",
  "display_name": "Frappe d'Épée",
  "description": "Une attaque puissante avec l'épée",
  "type": "offensive",
  "class": "warrior",
  "available_classes": ["warrior", "paladin", "berserker"],
  "level_requirement": 1,
  "mana_cost": 10,
  "cooldown": 3,
  "damage": {
    "base": 50,
    "scaling": "attack",
    "multiplier": 1.2,
    "type": "physical",
    "min": 45,
    "max": 65
  },
  "healing": null,
  "shield": null,
  "buffs": null,
  "debuffs": null,
  "effects": [
    {
      "type": "animation",
      "name": "sword_slash",
      "duration": 0.5
    }
  ],
  "duration": null,
  "icon": "⚔️",
  "animation": "sword_attack",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 11. `dungeons` - Donjons

**Structure de table :**
```sql
CREATE TABLE dungeons (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    description TEXT,
    level_requirement SMALLINT NOT NULL DEFAULT 1,
    difficulty_id SMALLINT NOT NULL REFERENCES difficulties(id),
    estimated_duration SMALLINT,
    rewards JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '[]',
    enemies JSONB DEFAULT '[]',
    icon VARCHAR(100),
    theme VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Structure JSON `rewards` :**
```json
[
  {
    "type": "experience",
    "min": 100,
    "max": 200
  },
  {
    "type": "currency",
    "currency_type": "gold_coin",
    "min": 50,
    "max": 100
  },
  {
    "type": "item",
    "item_name": "magic_sword",
    "chance": 0.15
  }
]
```

**Structure JSON `requirements` :**
```json
[
  {
    "type": "level",
    "value": 10
  },
  {
    "type": "item",
    "item_name": "dungeon_key",
    "quantity": 1
  },
  {
    "type": "quest",
    "quest_name": "dragon_slayer",
    "status": "completed"
  }
]
```

**Structure JSON `enemies` :**
```json
[
  {
    "name": "goblin_warrior",
    "level": 5,
    "quantity": 3
  },
  {
    "name": "goblin_shaman",
    "level": 6,
    "quantity": 1
  },
  {
    "name": "goblin_chief",
    "level": 8,
    "quantity": 1,
    "is_boss": true
  }
]
```

**Exemple JSON complet avec imbrications :**
```json
{
  "id": 1,
  "name": "goblin_cave",
  "display_name": "Grotte des Gobelins",
  "description": "Une grotte sombre peuplée de gobelins agressifs",
  "level_requirement": 3,
  "difficulty_id": 1,
  "estimated_duration": 5,
  "rewards": [
    {
      "type": "experience",
      "min": 150,
      "max": 250
    },
    {
      "type": "currency",
      "currency_type": "copper_coin",
      "min": 20,
      "max": 35
    }
  ],
  "requirements": [
    {
      "type": "level",
      "value": 3
    }
  ],
  "enemies": [
    {
      "name": "goblin_warrior",
      "level": 3,
      "quantity": 2
    },
    {
      "name": "goblin_shaman",
      "level": 4,
      "quantity": 1
    }
  ],
  "icon": "cave_icon",
  "theme": "cave",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "_embedded": {
    "difficulty": {
      "id": 1,
      "name": "easy",
      "display_name": "Facile",
      "color": "#10B981",
      "stat_multiplier": 1.00,
      "exp_multiplier": 1.00,
      "gold_multiplier": 1.00
    }
  }
}
```

### 12. `quests` - Quêtes

**Structure de table :**
```sql
CREATE TABLE quests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('main', 'side', 'daily', 'weekly', 'guild', 'event')),
    level_requirement SMALLINT NOT NULL DEFAULT 1,
    rewards JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '[]',
    objectives JSONB DEFAULT '[]',
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Structure JSON `rewards` :**
```json
[
  {
    "type": "experience",
    "value": 500
  },
  {
    "type": "gold",
    "value": 250
  },
  {
    "type": "item",
    "item_name": "elemental_staff",
    "quantity": 1
  }
]
```

**Structure JSON `requirements` :**
```json
[
  {
    "type": "level",
    "value": 5
  },
  {
    "type": "skills",
    "skills": ["fireball", "heal", "shield"]
  },
  {
    "type": "completed_quests",
    "quests": ["Premiers Pas"]
  }
]
```

**Structure JSON `objectives` :**
```json
[
  {
    "type": "kill",
    "target": "goblins",
    "quantity": 5,
    "current": 0
  },
  {
    "type": "collect",
    "target": "magic_crystals",
    "quantity": 3,
    "current": 0
  },
  {
    "type": "reach_location",
    "target": "ancient_temple",
    "completed": false
  }
]
```

**Exemple JSON complet :**
```json
{
  "id": 1,
  "title": "Premiers Pas",
  "description": "Tuez 5 gobelins pour prouver votre valeur",
  "type": "main",
  "level_requirement": 1,
  "rewards": [
    {
      "type": "experience",
      "value": 100
    },
    {
      "type": "gold",
      "value": 50
    },
    {
      "type": "item",
      "item_name": "health_potion",
      "quantity": 2
    }
  ],
  "requirements": [
    {
      "type": "level",
      "value": 1
    }
  ],
  "objectives": [
    {
      "type": "kill",
      "target": "goblins",
      "quantity": 5,
      "current": 0
    }
  ],
  "icon": "first_steps_icon",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 13. `enemies` - Ennemis

**Structure de table :**
```sql
CREATE TABLE enemies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL,
    level SMALLINT NOT NULL,
    rarity_id SMALLINT NOT NULL REFERENCES rarities(id),
    health INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    magic_attack INTEGER DEFAULT 0,
    magic_defense INTEGER DEFAULT 0,
    speed SMALLINT DEFAULT 100,
    experience_reward INTEGER NOT NULL DEFAULT 0,
    gold_reward INTEGER NOT NULL DEFAULT 0,
    abilities JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    resistances JSONB DEFAULT '[]',
    loot_table JSONB DEFAULT '[]',
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Structure JSON `abilities` :**
```json
[
  {
    "name": "war_cry",
    "display_name": "Cri de Guerre",
    "type": "buff",
    "effect": "attack_boost",
    "value": 20,
    "duration": 10
  },
  {
    "name": "basic_attack",
    "display_name": "Attaque Basique",
    "type": "attack",
    "damage_multiplier": 1.0
  }
]
```

**Structure JSON `weaknesses` :**
```json
[
  {
    "element": "fire",
    "multiplier": 1.5
  },
  {
    "element": "light",
    "multiplier": 1.3
  }
]
```

**Structure JSON `resistances` :**
```json
[
  {
    "element": "poison",
    "multiplier": 0.5
  },
  {
    "element": "dark",
    "multiplier": 0.7
  }
]
```

**Structure JSON `loot_table` :**
```json
[
  {
    "item_name": "iron_sword",
    "chance": 0.10,
    "quantity_min": 1,
    "quantity_max": 1
  },
  {
    "item_name": "health_potion",
    "chance": 0.30,
    "quantity_min": 1,
    "quantity_max": 3
  },
  {
    "item_name": "goblin_leather",
    "chance": 0.60,
    "quantity_min": 1,
    "quantity_max": 2
  }
]
```

**Exemple JSON complet avec imbrications :**
```json
{
  "id": 1,
  "name": "goblin_warrior",
  "display_name": "Gobelin Guerrier",
  "description": "Gobelin armé d'une épée rouillée - Un défi mortel pour un débutant",
  "type": "humanoid",
  "level": 1,
  "rarity_id": 1,
  "health": 120,
  "attack": 25,
  "defense": 18,
  "magic_attack": 8,
  "magic_defense": 12,
  "speed": 20,
  "experience_reward": 8,
  "gold_reward": 5,
  "abilities": [
    {
      "name": "basic_attack",
      "display_name": "Attaque Basique",
      "type": "attack",
      "damage_multiplier": 1.0
    },
    {
      "name": "war_cry",
      "display_name": "Cri de Guerre",
      "type": "buff",
      "effect": "attack_boost",
      "value": 20,
      "duration": 10
    }
  ],
  "weaknesses": [
    {
      "element": "fire",
      "multiplier": 1.5
    },
    {
      "element": "light",
      "multiplier": 1.3
    }
  ],
  "resistances": [
    {
      "element": "poison",
      "multiplier": 0.5
    }
  ],
  "loot_table": [
    {
      "item_name": "iron_sword",
      "chance": 0.10,
      "quantity_min": 1,
      "quantity_max": 1
    },
    {
      "item_name": "health_potion",
      "chance": 0.30,
      "quantity_min": 1,
      "quantity_max": 3
    }
  ],
  "icon": "👹",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "_embedded": {
    "rarity": {
      "id": 1,
      "name": "common",
      "display_name": "Commun",
      "color": "#9CA3AF",
      "stat_multiplier": 1.00
    }
  }
}
```

---

## Tables de Logs de Combat

### 14. `combat_sessions` - Sessions de Combat

**Structure de table :**
```sql
CREATE TABLE combat_sessions (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    dungeon_id SMALLINT NOT NULL REFERENCES dungeons(id),
    result TEXT NOT NULL,
    log_gzip BYTEA NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Exemple JSON complet :**
```json
{
  "id": 1,
  "character_id": 1,
  "dungeon_id": 1,
  "result": "victory",
  "log_gzip": "H4sIAAAAAAAAA...", 
  "created_at": "2024-01-20T15:30:00Z",
  "_embedded": {
    "character": {
      "id": 1,
      "name": "Héros Légendaire",
      "level": 15
    },
    "dungeon": {
      "id": 1,
      "name": "goblin_cave",
      "display_name": "Grotte des Gobelins"
    }
  }
}
```

---

## Tables de Progression

### 15. `character_dungeons` - Progression des Donjons

**Structure de table :**
```sql
CREATE TABLE character_dungeons (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    dungeon_id SMALLINT NOT NULL REFERENCES dungeons(id),
    status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'completed', 'mastered')),
    best_time INTEGER,
    completion_count INTEGER DEFAULT 0,
    last_completed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Exemple JSON complet avec imbrications :**
```json
{
  "id": 1,
  "character_id": 1,
  "dungeon_id": 1,
  "status": "completed",
  "best_time": 245,
  "completion_count": 3,
  "last_completed": "2024-01-20T14:30:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:30:00Z",
  "_embedded": {
    "character": {
      "id": 1,
      "name": "Héros Légendaire",
      "level": 15
    },
    "dungeon": {
      "id": 1,
      "name": "goblin_cave",
      "display_name": "Grotte des Gobelins",
      "level_requirement": 3,
      "difficulty": {
        "name": "easy",
        "display_name": "Facile"
      }
    }
  }
}
```

### 16. `character_quests` - Progression des Quêtes

**Structure de table :**
```sql
CREATE TABLE character_quests (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    quest_id INTEGER NOT NULL REFERENCES quests(id),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'active', 'completed', 'failed')),
    progress JSONB DEFAULT '{}',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Structure JSON `progress` :**
```json
{
  "objectives": {
    "kill_goblins": {
      "current": 3,
      "target": 5,
      "completed": false
    },
    "collect_crystals": {
      "current": 1,
      "target": 3,
      "completed": false
    }
  },
  "completion_percentage": 60.0,
  "notes": "Progression rapide sur les gobelins"
}
```

**Exemple JSON complet avec imbrications :**
```json
{
  "id": 1,
  "character_id": 1,
  "quest_id": 1,
  "status": "active",
  "progress": {
    "objectives": {
      "kill_goblins": {
        "current": 3,
        "target": 5,
        "completed": false
      }
    },
    "completion_percentage": 60.0
  },
  "started_at": "2024-01-18T10:00:00Z",
  "completed_at": null,
  "created_at": "2024-01-18T10:00:00Z",
  "updated_at": "2024-01-20T15:30:00Z",
  "_embedded": {
    "character": {
      "id": 1,
      "name": "Héros Légendaire",
      "level": 15
    },
    "quest": {
      "id": 1,
      "title": "Premiers Pas",
      "description": "Tuez 5 gobelins pour prouver votre valeur",
      "type": "main",
      "level_requirement": 1
    }
  }
}
```

---

## Tables de Guildes

### 17. `guilds` - Guildes

**Structure de table :**
```sql
CREATE TABLE guilds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    description TEXT,
    level SMALLINT NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    experience_to_next INTEGER NOT NULL DEFAULT 1000,
    max_members SMALLINT NOT NULL DEFAULT 20,
    current_members SMALLINT NOT NULL DEFAULT 0,
    guild_coin INTEGER NOT NULL DEFAULT 0,
    guild_honor INTEGER NOT NULL DEFAULT 0,
    emblem VARCHAR(200),
    banner VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disbanded')),
    created_by INTEGER NOT NULL REFERENCES characters(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Exemple JSON complet avec imbrications :**
```json
{
  "id": 1,
  "name": "dragon_slayers",
  "display_name": "Les Tueurs de Dragons",
  "description": "Une guilde d'élite spécialisée dans la chasse aux dragons",
  "level": 5,
  "experience": 2500,
  "experience_to_next": 5000,
  "max_members": 25,
  "current_members": 12,
  "guild_coin": 15000,
  "guild_honor": 850,
  "emblem": "dragon_emblem.png",
  "banner": "red_dragon_banner.png",
  "status": "active",
  "created_by": 1,
  "created_at": "2024-01-10T09:00:00Z",
  "updated_at": "2024-01-20T15:30:00Z",
  "_embedded": {
    "creator": {
      "id": 1,
      "name": "Héros Légendaire",
      "level": 15,
      "class": {
        "display_name": "Guerrier"
      }
    },
    "statistics": {
      "total_members": 12,
      "total_territories": 3,
      "active_projects": 2,
      "active_raids": 1
    }
  }
}
```

### 18. `guild_members` - Membres de Guilde

**Structure de table :**
```sql
CREATE TABLE guild_members (
    id SERIAL PRIMARY KEY,
    guild_id INTEGER NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    rank VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (rank IN ('leader', 'officer', 'member', 'recruit')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contribution_points INTEGER NOT NULL DEFAULT 0,
    weekly_contribution INTEGER NOT NULL DEFAULT 0,
    permissions JSONB DEFAULT '{}',
    CONSTRAINT unique_guild_member UNIQUE (guild_id, character_id)
);
```

**Structure JSON `permissions` :**
```json
{
  "can_invite": true,
  "can_kick": false,
  "can_promote": false,
  "can_manage_bank": false,
  "can_start_raids": true,
  "can_edit_description": false,
  "can_manage_alliances": false
}
```

**Exemple JSON complet avec imbrications :**
```json
{
  "id": 1,
  "guild_id": 1,
  "character_id": 1,
  "rank": "leader",
  "joined_at": "2024-01-10T09:00:00Z",
  "last_active": "2024-01-20T15:30:00Z",
  "contribution_points": 1250,
  "weekly_contribution": 350,
  "permissions": {
    "can_invite": true,
    "can_kick": true,
    "can_promote": true,
    "can_manage_bank": true,
    "can_start_raids": true,
    "can_edit_description": true,
    "can_manage_alliances": true
  },
  "_embedded": {
    "guild": {
      "id": 1,
      "name": "dragon_slayers",
      "display_name": "Les Tueurs de Dragons",
      "level": 5
    },
    "character": {
      "id": 1,
      "name": "Héros Légendaire",
      "level": 15,
      "health": 450,
      "max_health": 450,
      "attack": 85,
      "defense": 65,
      "class": {
        "name": "warrior",
        "display_name": "Guerrier",
        "rarity": "common"
      },
      "user": {
        "username": "player1",
        "last_login": "2024-01-20T15:30:00Z"
      }
    },
    "activity": {
      "seconds_since_active": 0,
      "seconds_since_joined": 864000
    }
  }
}
```

---

## Vues Optimisées

### Vue `characters_full` - Personnages Complets

**Exemple JSON de la vue avec toutes les imbrications :**
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Héros Légendaire",
  "level": 15,
  "experience": 2500,
  "experience_to_next": 3200,
  "health": 450,
  "max_health": 450,
  "mana": 180,
  "max_mana": 180,
  "attack": 85,
  "defense": 65,
  "magic_attack": 35,
  "magic_defense": 45,
  "critical_rate": 12.50,
  "critical_damage": 175.00,
  "vitality": 25,
  "strength": 30,
  "intelligence": 15,
  "agility": 20,
  "resistance": 18,
  "precision": 22,
  "endurance": 28,
  "wisdom": 12,
  "constitution": 26,
  "dexterity": 19,
  "health_regen": 4.50,
  "mana_regen": 2.25,
  "attack_speed": 115.00,
  "movement_speed": 110.00,
  "dodge_chance": 15.00,
  "block_chance": 12.00,
  "parry_chance": 8.00,
  "spell_power": 125.00,
  "physical_power": 140.00,
  "stats": {
    "total_dungeons_completed": 25,
    "achievements": ["first_kill", "level_10", "dungeon_master"]
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:30:00Z",
  "class_name": "warrior",
  "class_display_name": "Guerrier",
  "class_description": "Un combattant robuste spécialisé dans le combat au corps à corps",
  "class_rarity_name": "common",
  "class_rarity_color": "#9CA3AF",
  "class_base_stats": {
    "health": 150,
    "mana": 50,
    "attack": 25,
    "defense": 20,
    "magic_attack": 8,
    "magic_defense": 10
  },
  "class_stat_ranges": {
    "health": [140, 160],
    "mana": [45, 55],
    "attack": [23, 27],
    "defense": [18, 22],
    "magic_attack": [6, 10],
    "magic_defense": [8, 12]
  },
  "class_starting_equipment": ["Épée de Fer", "Armure de Cuir", "Bottes de Cuir"],
  "class_icon": "warrior_icon",
  "username": "player1",
  "email": "player1@example.com",
  "last_login": "2024-01-20T15:30:00Z"
}
```

### Vue `character_inventory_full` - Inventaire Complet

**Exemple JSON de la vue avec toutes les imbrications :**
```json
{
  "id": 1,
  "character_id": 1,
  "item_id": 1,
  "quantity": 1,
  "equipped": true,
  "equipped_slot": "weapon",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:30:00Z",
  "item_name": "iron_sword",
  "item_display_name": "Épée de Fer",
  "item_description": "Une épée basique en fer forgé",
  "level_requirement": 1,
  "item_base_stats": {
    "attack": 25,
    "defense": 5,
    "durability": 100
  },
  "item_stat_ranges": {
    "attack": [23, 27],
    "defense": [3, 7],
    "durability": [90, 110]
  },
  "item_effects": [
    {
      "type": "passive",
      "name": "sharpness",
      "value": 5,
      "description": "Tranchant +5%"
    }
  ],
  "item_icon": "iron_sword_icon",
  "item_image": "iron_sword.png",
  "item_type": "sword",
  "item_type_display_name": "Épée",
  "item_category": "weapon",
  "item_equip_slot": "weapon",
  "item_max_stack": 1,
  "item_type_description": "Arme de mêlée tranchante",
  "item_type_icon": "sword_icon",
  "rarity_name": "common",
  "rarity_display_name": "Commun",
  "rarity_color": "#9CA3AF",
  "rarity_probability": 0.6000000,
  "rarity_stat_multiplier": 1.00,
  "rarity_description": "Objets et classes de base",
  "rarity_icon": "common_icon"
}
```

---

## Relations et Imbrications

### Diagramme des Relations Principales

```
users (1) ←→ (1) characters ←→ (*) character_inventory ←→ (1) items
  ↓                ↓                                        ↓
  └─ auth_codes    ├─ character_dungeons ←→ dungeons       ├─ item_types
                   ├─ character_quests ←→ quests           └─ rarities
                   ├─ guild_members ←→ guilds                    ↑
                   ├─ combat_sessions                            │
                   └─ character_classes ←─────────────────────────┘

skills ←→ character_classes (via available_classes)
enemies ←→ rarities
dungeons ←→ difficulties
```

### Exemples d'API Response avec Imbrications Complètes

#### GET /api/characters/:id (Response complète)
```json
{
  "character": {
    "id": 1,
    "name": "Héros Légendaire",
    "level": 15,
    "experience": 2500,
    "experience_to_next": 3200,
    "health": 450,
    "max_health": 450,
    "mana": 180,
    "max_mana": 180,
    "attack": 85,
    "defense": 65,
    "stats": {
      "total_dungeons_completed": 25,
      "achievements": ["first_kill", "level_10", "dungeon_master"]
    },
    "class": {
      "id": 1,
      "name": "warrior",
      "display_name": "Guerrier",
      "description": "Un combattant robuste spécialisé dans le combat au corps à corps",
      "base_stats": {
        "health": 150,
        "mana": 50,
        "attack": 25,
        "defense": 20
      },
      "rarity": {
        "name": "common",
        "display_name": "Commun",
        "color": "#9CA3AF"
      }
    },
    "user": {
      "username": "player1",
      "email": "player1@example.com"
    }
  },
  "computed_stats": {
    "total_attack": 110,
    "total_defense": 85,
    "effective_health": 450,
    "combat_power": 1250,
    "equipment_bonus": {
      "attack": 25,
      "defense": 20
    }
  }
}
```

#### GET /api/characters/:id/inventory (Response complète)
```json
{
  "inventory": [
    {
      "id": 1,
      "quantity": 1,
      "equipped": true,
      "equipped_slot": "weapon",
      "item": {
        "id": 1,
        "name": "iron_sword",
        "display_name": "Épée de Fer",
        "description": "Une épée basique en fer forgé",
        "level_requirement": 1,
        "base_stats": {
          "attack": 25,
          "defense": 5
        },
        "effects": [
          {
            "type": "passive",
            "name": "sharpness",
            "value": 5,
            "description": "Tranchant +5%"
          }
        ],
        "type": {
          "name": "sword",
          "display_name": "Épée",
          "category": "weapon",
          "equip_slot": "weapon"
        },
        "rarity": {
          "name": "common",
          "display_name": "Commun",
          "color": "#9CA3AF",
          "stat_multiplier": 1.00
        }
      }
    }
  ],
  "equipped_items": {
    "weapon": {
      "item_id": 1,
      "name": "iron_sword",
      "display_name": "Épée de Fer",
      "stats_bonus": {
        "attack": 25,
        "defense": 5
      }
    }
  },
  "total_stats_bonus": {
    "attack": 25,
    "defense": 5,
    "total_value": 750
  }
}
```

---

## Contraintes et Validations

### Contraintes de Données

1. **Contraintes de Check** :
   - `level` : Entre 1 et 100
   - `experience` : >= 0
   - `health` : <= `max_health`
   - `mana` : <= `max_mana`
   - `critical_rate` : Entre 0 et 100
   - `probability` : Entre 0 et 1

2. **Contraintes d'Unicité** :
   - Un utilisateur = un personnage (`unique_user_character`)
   - Un personnage ne peut avoir qu'un objet par slot équipé
   - Email et username uniques

3. **Contraintes de Clés Étrangères** :
   - Suppression en cascade pour les relations personnage-dépendantes
   - Références obligatoires vers les tables de configuration

### Validations JSONB

1. **Types de Validation** :
   - `jsonb_typeof(stats) = 'object'`
   - `jsonb_typeof(effects) = 'array'`
   - `jsonb_typeof(available_classes) = 'array'`

2. **Structures Attendues** :
   - Objets pour les stats et configurations
   - Tableaux pour les listes et effets
   - Validation côté application pour la structure interne

---

Cette documentation présente la structure complète de la base de données avec tous les formats JSON utilisés et leurs imbrications. Elle peut servir de référence pour le développement frontend et backend, ainsi que pour la documentation API.
