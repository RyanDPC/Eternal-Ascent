// Middleware de sécurité avancé pour l'API RPG Dungeon

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { ErrorHandler, LimitExceededError } = require('../utils/errors');

/**
 * Configuration du rate limiting par type de route
 */
const rateLimitConfigs = {
  // Rate limiting général
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par windowMs
    message: {
      error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const error = new LimitExceededError('Trop de requêtes depuis cette IP');
      res.status(429).json(ErrorHandler.formatError(error));
    }
  }),

  // Rate limiting pour l'authentification
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limite chaque IP à 5 tentatives de connexion par windowMs
    message: {
      error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const error = new LimitExceededError('Trop de tentatives de connexion');
      res.status(429).json(ErrorHandler.formatError(error));
    }
  }),

  // Rate limiting pour les actions sensibles
  sensitive: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // limite chaque IP à 10 actions sensibles par heure
    message: {
      error: 'Trop d\'actions sensibles, veuillez réessayer plus tard.',
      code: 'SENSITIVE_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const error = new LimitExceededError('Trop d\'actions sensibles');
      res.status(429).json(ErrorHandler.formatError(error));
    }
  }),

  // Rate limiting pour les requêtes de données
  data: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // limite chaque IP à 50 requêtes de données par 5 minutes
    message: {
      error: 'Trop de requêtes de données, veuillez réessayer plus tard.',
      code: 'DATA_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const error = new LimitExceededError('Trop de requêtes de données');
      res.status(429).json(ErrorHandler.formatError(error));
    }
  })
};

/**
 * Configuration Helmet pour la sécurité
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * Middleware de validation des headers
 */
const validateHeaders = (req, res, next) => {
  const requiredHeaders = ['content-type'];
  const missingHeaders = requiredHeaders.filter(header => !req.headers[header]);
  
  if (missingHeaders.length > 0) {
    return res.status(400).json({
      error: 'Headers requis manquants',
      missing: missingHeaders,
      code: 'MISSING_HEADERS'
    });
  }
  
  next();
};

/**
 * Middleware de validation de la taille des requêtes
 */
const validateRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length']);
    const maxSizeBytes = parseInt(maxSize) * 1024 * 1024; // Convertir en bytes
    
    if (contentLength && contentLength > maxSizeBytes) {
      return res.status(413).json({
        error: 'Requête trop volumineuse',
        maxSize: maxSize,
        code: 'REQUEST_TOO_LARGE'
      });
    }
    
    next();
  };
};

/**
 * Middleware de validation des paramètres de requête
 */
const validateQueryParams = (allowedParams) => {
  return (req, res, next) => {
    const queryParams = Object.keys(req.query);
    const invalidParams = queryParams.filter(param => !allowedParams.includes(param));
    
    if (invalidParams.length > 0) {
      return res.status(400).json({
        error: 'Paramètres de requête invalides',
        invalid: invalidParams,
        allowed: allowedParams,
        code: 'INVALID_QUERY_PARAMS'
      });
    }
    
    next();
  };
};

/**
 * Middleware de validation des types de contenu
 */
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return res.status(415).json({
        error: 'Type de contenu non supporté',
        allowed: allowedTypes,
        received: contentType,
        code: 'UNSUPPORTED_MEDIA_TYPE'
      });
    }
    
    next();
  };
};

/**
 * Middleware de protection contre les attaques par déni de service
 */
const dosProtection = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  // Vérifier les patterns suspects
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return res.status(403).json({
      error: 'Accès refusé',
      code: 'SUSPICIOUS_ACTIVITY'
    });
  }
  
  next();
};

/**
 * Middleware de protection contre les injections
 */
const injectionProtection = (req, res, next) => {
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);
  const params = JSON.stringify(req.params);
  
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /eval\s*\(/i
  ];
  
  const allData = body + query + params;
  
  if (injectionPatterns.some(pattern => pattern.test(allData))) {
    return res.status(400).json({
      error: 'Contenu suspect détecté',
      code: 'INJECTION_ATTEMPT'
    });
  }
  
  next();
};

/**
 * Middleware de logging des requêtes suspectes
 */
const suspiciousActivityLogger = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const url = req.originalUrl;
  const method = req.method;
  
  // Log des requêtes suspectes
  if (url.includes('..') || url.includes('//') || url.includes('\\')) {
    console.warn(`⚠️  Requête suspecte détectée: ${method} ${url} depuis ${clientIP}`);
  }
  
  // Log des user agents suspects
  if (userAgent && userAgent.length > 500) {
    console.warn(`⚠️  User-Agent suspect détecté depuis ${clientIP}: ${userAgent.substring(0, 100)}...`);
  }
  
  next();
};

/**
 * Middleware de protection contre les attaques par force brute
 */
const bruteForceProtection = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const key = `brute_force_${clientIP}`;
  
  // Simuler un système de comptage (en production, utiliser Redis)
  if (!global.bruteForceAttempts) {
    global.bruteForceAttempts = new Map();
  }
  
  const attempts = global.bruteForceAttempts.get(key) || 0;
  const maxAttempts = 10;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  if (attempts >= maxAttempts) {
    return res.status(429).json({
      error: 'Trop de tentatives échouées, veuillez réessayer plus tard',
      code: 'BRUTE_FORCE_BLOCKED'
    });
  }
  
  // Incrémenter le compteur
  global.bruteForceAttempts.set(key, attempts + 1);
  
  // Réinitialiser le compteur après la fenêtre de temps
  setTimeout(() => {
    global.bruteForceAttempts.delete(key);
  }, windowMs);
  
  next();
};

/**
 * Middleware de validation des tokens CSRF
 */
const csrfProtection = (req, res, next) => {
  // Vérifier le token CSRF pour les requêtes non-GET
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const csrfToken = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;
    
    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      return res.status(403).json({
        error: 'Token CSRF invalide',
        code: 'INVALID_CSRF_TOKEN'
      });
    }
  }
  
  next();
};

/**
 * Middleware de validation des origines
 */
const originValidation = (allowedOrigins) => {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({
        error: 'Origine non autorisée',
        code: 'INVALID_ORIGIN'
      });
    }
    
    next();
  };
};

/**
 * Middleware de protection contre les attaques par timing
 */
const timingAttackProtection = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log des requêtes lentes
    if (duration > 5000) { // Plus de 5 secondes
      console.warn(`⚠️  Requête lente détectée: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
  });
  
  next();
};

module.exports = {
  rateLimitConfigs,
  helmetConfig,
  validateHeaders,
  validateRequestSize,
  validateQueryParams,
  validateContentType,
  dosProtection,
  injectionProtection,
  suspiciousActivityLogger,
  bruteForceProtection,
  csrfProtection,
  originValidation,
  timingAttackProtection
};

