const { z } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.params) req.params = schema.params.parse(req.params);
      if (schema.query) req.query = schema.query.parse(req.query);
      return next();
    } catch (e) {
      return res.status(400).json({ error: 'Validation error', details: e.errors || e.message });
    }
  };
}

<<<<<<< Current (Your changes)
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
=======
module.exports = { validate, z };
>>>>>>> Incoming (Background Agent changes)
