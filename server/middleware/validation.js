// Middleware de validation pour les paramètres de requête

/**
 * Valide les paramètres de requête
 * Peut être utilisé comme middleware simple ou avec des paramètres spécifiques
 */
const validateParams = (requiredParams = null) => {
  return (req, res, next) => {
    // Si des paramètres spécifiques sont requis, les valider
    if (requiredParams && Array.isArray(requiredParams)) {
      for (const param of requiredParams) {
        const value = req.params[param] || req.body[param];
        if (!value) {
          return res.status(400).json({ 
            error: `Paramètre manquant: ${param}`,
            details: `Le paramètre ${param} est requis`
          });
        }
        
        // Valider que c'est un ID numérique si c'est un ID
        if (param.includes('Id') || param.includes('id')) {
          if (isNaN(parseInt(value)) || parseInt(value) <= 0) {
            return res.status(400).json({ 
              error: `${param} invalide`,
              details: `${param} doit être un nombre entier positif`
            });
          }
        }
      }
    } else {
      // Validation basique des paramètres communs
      const { id, characterId, questId, itemId } = req.params;
      
      // Valider l'ID de personnage
      if (characterId && (isNaN(parseInt(characterId)) || parseInt(characterId) <= 0)) {
        return res.status(400).json({ 
          error: 'ID de personnage invalide',
          details: 'L\'ID du personnage doit être un nombre entier positif'
        });
      }
      
      // Valider l'ID de quête
      if (questId && (isNaN(parseInt(questId)) || parseInt(questId) <= 0)) {
        return res.status(400).json({ 
          error: 'ID de quête invalide',
          details: 'L\'ID de la quête doit être un nombre entier positif'
        });
      }
      
      // Valider l'ID d'objet
      if (itemId && (isNaN(parseInt(itemId)) || parseInt(itemId) <= 0)) {
        return res.status(400).json({ 
          error: 'ID d\'objet invalide',
          details: 'L\'ID de l\'objet doit être un nombre entier positif'
        });
      }
      
      // Valider l'ID générique
      if (id && (isNaN(parseInt(id)) || parseInt(id) <= 0)) {
        return res.status(400).json({ 
          error: 'ID invalide',
          details: 'L\'ID doit être un nombre entier positif'
        });
      }
    }
    
    next();
  };
};

/**
 * Valide le corps de la requête pour les quêtes
 */
const validateQuestPayload = (req, res, next) => {
  const { characterId, questId, progress, status } = req.body;
  
  if (!characterId || isNaN(parseInt(characterId))) {
    return res.status(400).json({ 
      error: 'ID de personnage requis',
      details: 'L\'ID du personnage est obligatoire et doit être un nombre entier'
    });
  }
  
  if (!questId || isNaN(parseInt(questId))) {
    return res.status(400).json({ 
      error: 'ID de quête requis',
      details: 'L\'ID de la quête est obligatoire et doit être un nombre entier'
    });
  }
  
  if (progress !== undefined && (isNaN(parseInt(progress)) || parseInt(progress) < 0)) {
    return res.status(400).json({ 
      error: 'Progression invalide',
      details: 'La progression doit être un nombre entier positif ou zéro'
    });
  }
  
  if (status && !['not_started', 'in_progress', 'completed', 'abandoned'].includes(status)) {
    return res.status(400).json({ 
      error: 'Statut de quête invalide',
      details: 'Le statut doit être: not_started, in_progress, completed, ou abandoned'
    });
  }
  
  next();
};

/**
 * Valide les paramètres de pagination
 */
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ 
      error: 'Page invalide',
      details: 'Le numéro de page doit être un nombre entier positif'
    });
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({ 
      error: 'Limite invalide',
      details: 'La limite doit être un nombre entier entre 1 et 100'
    });
  }
  
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  };
  
  next();
};

/**
 * Valide les paramètres de recherche
 */
const validateSearch = (req, res, next) => {
  const { q, type, rarity, level } = req.query;
  
  if (q && typeof q !== 'string') {
    return res.status(400).json({ 
      error: 'Terme de recherche invalide',
      details: 'Le terme de recherche doit être une chaîne de caractères'
    });
  }
  
  if (q && q.length > 100) {
    return res.status(400).json({ 
      error: 'Terme de recherche trop long',
      details: 'Le terme de recherche ne peut pas dépasser 100 caractères'
    });
  }
  
  if (type && typeof type !== 'string') {
    return res.status(400).json({ 
      error: 'Type invalide',
      details: 'Le type doit être une chaîne de caractères'
    });
  }
  
  if (rarity && typeof rarity !== 'string') {
    return res.status(400).json({ 
      error: 'Rareté invalide',
      details: 'La rareté doit être une chaîne de caractères'
    });
  }
  
  if (level && (isNaN(parseInt(level)) || parseInt(level) < 1)) {
    return res.status(400).json({ 
      error: 'Niveau invalide',
      details: 'Le niveau doit être un nombre entier positif'
    });
  }
  
  next();
};

module.exports = {
  validateParams,
  validateQuestPayload,
  validatePagination,
  validateSearch
};
