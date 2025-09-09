/**
 * Configuration des assets pour l'application React
 * 
 * Ce fichier centralise la configuration des chemins et des paramètres
 * des assets utilisés dans l'application.
 */

// Configuration de l'environnement
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Configuration des chemins de base
const BASE_URL = isDevelopment ? 'http://localhost:3001' : '';
const ASSETS_BASE = isDevelopment ? '/assets' : '/assets';

// Configuration des sprites
export const SPRITE_CONFIG = {
  // Chemin vers le sprite sheet
  path: `${ASSETS_BASE}/images/Idle.png`,
  
  // Dimensions d'une frame
  frameWidth: 64,   // Largeur d'une frame en pixels
  frameHeight: 64,  // Hauteur d'une frame en pixels
  
  // Configuration des frames
  totalFrames: 8,   // Nombre total de frames dans le sprite sheet
  defaultFrame: 3,  // Frame par défaut à afficher (4ème frame, index 3)
  
  // Configuration de l'affichage
  displayScale: 2,  // Facteur d'agrandissement pour l'affichage
};

// Configuration des chemins d'assets
export const ASSET_PATHS = {
  // Sprites des personnages
  sprites: {
    swordsman: {
      idle: `${ASSETS_BASE}/images/Idle.png`,
      walk: `${ASSETS_BASE}/images/Walk.png`,
      run: `${ASSETS_BASE}/images/Run.png`,
      attack: `${ASSETS_BASE}/images/Attack.png`
    },
    wizard: {
      idle: `${ASSETS_BASE}/images/Idle.png`,
      walk: `${ASSETS_BASE}/images/Walk.png`,
      run: `${ASSETS_BASE}/images/Run.png`,
      attack: `${ASSETS_BASE}/images/Attack.png`
    },
    archer: {
      idle: `${ASSETS_BASE}/images/Idle.png`,
      walk: `${ASSETS_BASE}/images/Walk.png`,
      run: `${ASSETS_BASE}/images/Run.png`,
      attack: `${ASSETS_BASE}/images/Attack.png`
    }
  },
  
  // Icônes et UI
  icons: {
    weapons: `${ASSETS_BASE}/icons/weapons/`,
    armor: `${ASSETS_BASE}/icons/armor/`,
    items: `${ASSETS_BASE}/icons/items/`,
    magic: `${ASSETS_BASE}/icons/magic/`
  },
  
  // Sons et musique
  audio: {
    music: `${ASSETS_BASE}/audio/music/`,
    sfx: `${ASSETS_BASE}/audio/sfx/`,
    ambient: `${ASSETS_BASE}/audio/ambient/`
  }
};

// Configuration de l'API
export const API_CONFIG = {
  baseURL: isDevelopment ? 'http://localhost:3001' : '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Configuration de l'application
export const APP_CONFIG = {
  name: 'Eternal Ascent',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  debug: isDevelopment,
  
  // Configuration des assets
  assets: {
    basePath: ASSETS_BASE,
    sprites: SPRITE_CONFIG,
    paths: ASSET_PATHS
  },
  
  // Configuration de l'API
  api: API_CONFIG
};

// Fonctions utilitaires
export const getAssetUrl = (path) => {
  return `${ASSETS_BASE}${path}`;
};

export const getSpriteUrl = (characterType, animation) => {
  return ASSET_PATHS.sprites[characterType]?.[animation] || ASSET_PATHS.sprites.swordsman.idle;
};

export const isAssetLoaded = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

export default APP_CONFIG;


