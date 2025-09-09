/**
 * Configuration des assets pour l'application React
 * 
 * Ce fichier gère les chemins et la configuration des assets
 * utilisés par les composants de l'application.
 */

// Configuration des chemins d'assets
export const ASSET_PATHS = {
  // Sprites des personnages
  sprites: {
    swordsman: {
      idle: '/assets/images/Idle.png',
      walk: '/assets/images/Walk.png',
      run: '/assets/images/Run.png',
      attack: '/assets/images/Attack.png'
    },
    wizard: {
      idle: '/assets/images/Idle.png',
      walk: '/assets/images/Walk.png',
      run: '/assets/images/Run.png',
      attack: '/assets/images/Attack.png'
    },
    archer: {
      idle: '/assets/images/Idle.png',
      walk: '/assets/images/Walk.png',
      run: '/assets/images/Run.png',
      attack: '/assets/images/Attack.png'
    }
  },
  
  // Icônes et UI
  icons: {
    weapons: '/assets/icons/weapons/',
    armor: '/assets/icons/armor/',
    items: '/assets/icons/items/',
    magic: '/assets/icons/magic/'
  },
  
  // Sons et musique
  audio: {
    music: '/assets/audio/music/',
    sfx: '/assets/audio/sfx/',
    ambient: '/assets/audio/ambient/'
  }
};

// Configuration des sprites par défaut
export const DEFAULT_SPRITE_CONFIG = {
  frameWidth: 64,
  frameHeight: 64,
  totalFrames: 8,
  defaultFrame: 3,
  displayScale: 2
};

// Fonction pour obtenir le chemin d'un asset
export const getAssetPath = (category, subcategory, filename) => {
  if (ASSET_PATHS[category] && ASSET_PATHS[category][subcategory]) {
    return `${ASSET_PATHS[category][subcategory]}${filename}`;
  }
  return null;
};

// Fonction pour vérifier si un asset existe
export const assetExists = async (path) => {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn(`Asset non trouvé: ${path}`, error);
    return false;
  }
};

// Fonction pour précharger un asset
export const preloadAsset = (path) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Impossible de charger l'asset: ${path}`));
    img.src = path;
  });
};

// Configuration des fallbacks
export const FALLBACK_ASSETS = {
  character: {
    idle: '/assets/images/fallback-character.png',
    placeholder: '/assets/images/character-placeholder.png'
  }
};

export default {
  ASSET_PATHS,
  DEFAULT_SPRITE_CONFIG,
  getAssetPath,
  assetExists,
  preloadAsset,
  FALLBACK_ASSETS
};


