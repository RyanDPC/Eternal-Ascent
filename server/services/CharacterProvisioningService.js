const StartingInventory = require('../utils/startingInventory');
const CharacterStats = require('../utils/characterStats');

class CharacterProvisioningService {
  constructor(pool) {
    this.pool = pool;
  }

  async resolveClassId(className = 'warrior') {
    const res = await this.pool.query('SELECT id, name, base_stats FROM character_classes WHERE name = $1', [className]);
    if (res.rows.length > 0) return { id: res.rows[0].id, base_stats: res.rows[0].base_stats };
    const fallback = await this.pool.query('SELECT id, name, base_stats FROM character_classes ORDER BY id LIMIT 1');
    return { id: fallback.rows[0].id, base_stats: fallback.rows[0].base_stats };
  }

  buildInitialStats(base) {
    const bs = base || {};
    const health = Math.max(100, parseInt(bs.health || 100, 10));
    const mana = Math.max(50, parseInt(bs.mana || 50, 10));
    return {
      level: 1,
      experience: 0,
      experience_to_next: 100,
      health,
      max_health: health,
      mana,
      max_mana: mana,
      attack: parseInt(bs.attack || 10, 10),
      defense: parseInt(bs.defense || 10, 10),
      magic_attack: parseInt(bs.magic_attack || 5, 10),
      magic_defense: parseInt(bs.magic_defense || 5, 10),
      critical_rate: 5.0,
      critical_damage: 150.0,
      vitality: 10,
      strength: 10,
      intelligence: 10,
      agility: 10,
      resistance: 10,
      precision: 10,
      endurance: 10,
      wisdom: 10,
      constitution: 10,
      dexterity: 10,
      health_regen: 1.0,
      mana_regen: 0.5,
      attack_speed: 100.0,
      movement_speed: 100.0,
      dodge_chance: 8.0,
      block_chance: 5.0,
      parry_chance: 3.0,
      spell_power: 100.0,
      physical_power: 100.0
    };
  }

  async provisionCharacterForUser(userId, options = {}) {
    const { className = 'warrior', characterName } = options;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Enforce single character per user
      const existing = await client.query('SELECT id, name FROM characters WHERE user_id = $1', [userId]);
      if (existing.rows.length > 0) {
        await client.query('COMMIT');
        return existing.rows[0];
      }

      const { id: classId, base_stats } = await this.resolveClassId(className);
      const initial = this.buildInitialStats(base_stats);
      const name = characterName && characterName.length >= 3 ? characterName : `hero_${userId}`;

      const charInsert = await client.query(`
        INSERT INTO characters (
          user_id, name, class_id, level, experience, experience_to_next,
          health, max_health, mana, max_mana, attack, defense,
          magic_attack, magic_defense, critical_rate, critical_damage,
          vitality, strength, intelligence, agility, resistance, precision,
          endurance, wisdom, constitution, dexterity,
          health_regen, mana_regen, attack_speed, movement_speed,
          dodge_chance, block_chance, parry_chance, spell_power, physical_power
        ) VALUES (
          $1,$2,$3,$4,$5,$6,
          $7,$8,$9,$10,$11,$12,
          $13,$14,$15,$16,
          $17,$18,$19,$20,$21,$22,
          $23,$24,$25,$26,
          $27,$28,$29,$30,
          $31,$32,$33,$34,$35
        ) RETURNING id, name, level
      `, [
        userId, name, classId, initial.level, initial.experience, initial.experience_to_next,
        initial.health, initial.max_health, initial.mana, initial.max_mana, initial.attack, initial.defense,
        initial.magic_attack, initial.magic_defense, initial.critical_rate, initial.critical_damage,
        initial.vitality, initial.strength, initial.intelligence, initial.agility, initial.resistance, initial.precision,
        initial.endurance, initial.wisdom, initial.constitution, initial.dexterity,
        initial.health_regen, initial.mana_regen, initial.attack_speed, initial.movement_speed,
        initial.dodge_chance, initial.block_chance, initial.parry_chance, initial.spell_power, initial.physical_power
      ]);

      const character = charInsert.rows[0];

      // Build starting inventory (IDs)
      const classRow = await client.query('SELECT name FROM character_classes WHERE id = $1', [classId]);
      const classKey = classRow.rows[0]?.name || className;
      const inventory = await StartingInventory.createStartingInventory(classKey, client);

      for (const it of inventory) {
        await client.query(
          `INSERT INTO character_inventory (character_id, item_id, quantity, equipped, equipped_slot)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (character_id, item_id) DO UPDATE SET quantity = character_inventory.quantity + EXCLUDED.quantity`,
          [character.id, it.id, it.quantity || 1, Boolean(it.equipped), it.slot || null]
        );
      }

      // Optional: recalc final stats including equipment
      const equipped = await client.query(
        `SELECT i.* FROM character_inventory ci JOIN items i ON ci.item_id = i.id WHERE ci.character_id = $1 AND ci.equipped = true`,
        [character.id]
      );
      const finalStats = CharacterStats.calculateFinalStats(initial, equipped.rows || []);
      await CharacterStats.updateCharacterStats(client, character.id, finalStats);

      await client.query('COMMIT');
      return character;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

module.exports = CharacterProvisioningService;

