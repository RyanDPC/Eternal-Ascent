// Mock API functions for development
// In production, these would connect to a real backend

const MOCK_DELAY = 500; // Simulate network delay

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user data
const mockUsers = [
  {
    id: 1,
    username: 'Jin-Woo',
    email: 'jin-woo@example.com',
    level: 15,
    exp: 1250,
    gold: 5000
  }
];

// Mock authentication
export const login = async (email, password) => {
  await delay(MOCK_DELAY);
  
  // Simple mock validation
  if (email === 'test@example.com' && password === 'password') {
    const user = mockUsers[0];
    return {
      token: 'mock-jwt-token-' + Date.now(),
      user
    };
  }
  
  throw new Error('Invalid credentials');
};

export const register = async (username, email, password) => {
  await delay(MOCK_DELAY);
  
  // Check if user already exists
  if (mockUsers.find(u => u.email === email)) {
    throw new Error('User already exists');
  }
  
  const newUser = {
    id: mockUsers.length + 1,
    username,
    email,
    level: 1,
    exp: 0,
    gold: 100
  };
  
  mockUsers.push(newUser);
  
  return {
    token: 'mock-jwt-token-' + Date.now(),
    user: newUser
  };
};

export const checkAuth = async (token) => {
  await delay(MOCK_DELAY);
  
  // Simple token validation
  if (token && token.startsWith('mock-jwt-token-')) {
    return mockUsers[0]; // Return first user for demo
  }
  
  throw new Error('Invalid token');
};

// Mock game data
export const getCharacterData = async (userId) => {
  await delay(MOCK_DELAY);
  
  return {
    id: userId,
    name: 'Jin-Woo',
    class: 'Shadow Monarch',
    level: 15,
    exp: 1250,
    expToNext: 2000,
    stats: {
      strength: 25,
      agility: 20,
      intelligence: 18,
      vitality: 22
    },
    equipment: {
      weapon: { name: 'Iron Sword', attack: 15, rarity: 'common' },
      armor: { name: 'Leather Armor', defense: 10, rarity: 'common' },
      accessory: { name: 'Magic Ring', magic: 5, rarity: 'rare' }
    }
  };
};

export const getInventory = async (userId) => {
  await delay(MOCK_DELAY);
  
  return [
    { id: 1, name: 'Iron Sword', type: 'weapon', rarity: 'common', level: 10, attack: 15 },
    { id: 2, name: 'Leather Armor', type: 'armor', rarity: 'common', level: 8, defense: 10 },
    { id: 3, name: 'Health Potion', type: 'consumable', rarity: 'common', quantity: 3 },
    { id: 4, name: 'Magic Ring', type: 'accessory', rarity: 'rare', level: 12, magic: 5 },
    { id: 5, name: 'Copper Coin', type: 'currency', rarity: 'common', quantity: 100 },
    { id: 6, name: 'Iron Ore', type: 'material', rarity: 'common', quantity: 5 }
  ];
};

export const getQuests = async (userId) => {
  await delay(MOCK_DELAY);
  
  return [
    {
      id: 1,
      title: 'Clear the Goblin Cave',
      description: 'Eliminate all goblins in the nearby cave',
      type: 'hunt',
      status: 'active',
      reward: { exp: 100, gold: 50 },
      progress: { current: 0, required: 10 }
    },
    {
      id: 2,
      title: 'Collect Herbs',
      description: 'Gather healing herbs from the forest',
      type: 'gather',
      status: 'active',
      reward: { exp: 75, gold: 30 },
      progress: { current: 3, required: 5 }
    }
  ];
};

export const getDungeons = async (userId) => {
  await delay(MOCK_DELAY);
  
  return [
    {
      id: 1,
      name: 'Goblin Cave',
      level: 10,
      difficulty: 'easy',
      description: 'A small cave inhabited by goblins',
      status: 'available',
      rewards: { exp: 200, gold: 100 }
    },
    {
      id: 2,
      name: 'Dark Forest',
      level: 15,
      difficulty: 'medium',
      description: 'A mysterious forest with dangerous creatures',
      status: 'locked',
      rewards: { exp: 400, gold: 200 }
    }
  ];
};

export const getGuilds = async (userId) => {
  await delay(MOCK_DELAY);
  
  return [
    {
      id: 1,
      name: 'Shadow Hunters',
      level: 5,
      members: 12,
      maxMembers: 20,
      description: 'A guild focused on hunting powerful monsters',
      status: 'member'
    },
    {
      id: 2,
      name: 'Dragon Slayers',
      level: 8,
      members: 25,
      maxMembers: 30,
      description: 'Elite guild specializing in dragon hunting',
      status: 'available'
    }
  ];
};

// Save/Load game data (for desktop version)
export const saveGameData = async (data) => {
  await delay(MOCK_DELAY);
  
  try {
    localStorage.setItem('solo-leveling-save', JSON.stringify(data));
    return { success: true };
  } catch (error) {
    throw new Error('Failed to save game data');
  }
};

export const loadGameData = async () => {
  await delay(MOCK_DELAY);
  
  try {
    const data = localStorage.getItem('solo-leveling-save');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    throw new Error('Failed to load game data');
  }
};

// Export all functions
export default {
  login,
  register,
  checkAuth,
  getCharacterData,
  getInventory,
  getQuests,
  getDungeons,
  getGuilds,
  saveGameData,
  loadGameData
};


