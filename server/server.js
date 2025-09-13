const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const requestContext = require('./middleware/requestContext');
const logger = require('./services/Logger');
const { validate } = require('./middleware/validation');
const { z } = require('zod');
const cookieParser = require('cookie-parser');

// Services optimisés
const OptimizedDataService = require('./services/databaseService');
const CacheService = require('./services/CacheService');
const QuestSystem = require('./systems/quests');
const WebSocketManager = require('./websocket/WebSocketManager');
const RotationService = require('./services/RotationService');
const MailService = require('./services/MailService');
const CharacterProvisioningService = require('./services/CharacterProvisioningService');
const characterStatsUtil = require('./utils/characterStats');
const cookie = require('cookie');

// Routes consolidées
const staticRoutes = require('./routes/static');
const systemsRoutes = require('./routes/systems');
const talentsRoutes = require('./routes/talents');
const combatRoutes = require('./routes/combat');
const docsRoutes = require('./routes/docs');
const adminRoutes = require('./routes/admin');
const characterRoutes = require('./routes/optimized-characters');
const activityRoutes = require('./routes/activity');
const authenticateToken = require('./middleware/auth');
const GuildManager = require('./data/sid/guilds');

const config = require('./config');
const TokenService = require('./services/TokenService');
const app = express();
const PORT = config.port;

// Initialisation des services
let dataService;
let cacheService;
let systems;
let wsManager;
let rotationService;
let mailService;
let characterProvisioning;
let tokenService;

// =====================================================
// MIDDLEWARE DE SÉCURITÉ ET PERFORMANCE
// =====================================================

// Helmet pour la sécurité
app.use(helmet({
  contentSecurityPolicy: config.env === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'strict-dynamic'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  xFrameOptions: { action: 'deny' },
  xssFilter: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      camera: ["'none'"],
      microphone: ["'none'"],
      usb: ["'none'"],
    }
  }
}));

// Compression
app.use(compression());

// Logging optimisé
app.use(requestContext);
app.use(morgan('combined'));

// CORS optimisé
app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  const allowed = config.cors.origins;
  const isAllowed = !origin || allowed.includes(origin);
  callback(null, {
    origin: isAllowed,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  });
}));

// Rate limiting adaptatif
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.method === 'OPTIONS') return true;
    return req.path === '/api/health' || req.path === '/api/metrics';
  }
});

// Rate limiting général
app.use(createRateLimit(15 * 60 * 1000, 200, 'Trop de requêtes depuis cette IP'));

// Rate limiting pour l'authentification
app.use('/api/auth', createRateLimit(15 * 60 * 1000, 10, 'Trop de tentatives de connexion'));

// Rate limiting pour les recherches
app.use('/api/items/search', createRateLimit(5 * 60 * 1000, 50, 'Trop de recherches effectuées'));

 

// Parser JSON avec limite (laisser body-parser gérer les erreurs de parsing)
app.use(express.json({ 
  limit: '10mb'
}));
app.use(cookieParser());

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// MIDDLEWARE PERSONNALISÉS
// =====================================================

// Middleware pour injecter les services (sera configuré après l'initialisation)

// Middleware simple pour extraire l'utilisateur depuis le JWT
function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    const cookieToken = req.cookies && (req.cookies.token || req.cookies.jwt);
    const token = bearer || cookieToken;
    if (!token) return res.status(401).json({ error: 'Token manquant' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'eterna_secret_key');
    req.auth = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

// Middleware de gestion d'erreurs global
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error);
  
  if (error && (error.type === 'entity.parse.failed' || error.type === 'entity.verify.failed')) {
    return res.status(400).json({ error: 'Données JSON invalides' });
  }
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// =====================================================
// ROUTES DE SANTÉ ET MONITORING
// =====================================================

// Health check ultra-optimisé
app.get('/api/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Vérifier la base de données
    const dbCheck = await dataService.pool.query('SELECT NOW()');
    const dbTime = Date.now() - startTime;
    
    // Vérifier le cache (Redis)
    let cacheStatus = 'unavailable';
    try {
      await cacheService.cacheStaticData('health_check', 'ok', 10);
      const cacheCheck = await cacheService.getStaticData('health_check');
      cacheStatus = cacheCheck ? 'OK' : 'unavailable';
    } catch (e) {
      cacheStatus = 'unavailable';
    }
    
    const responseTime = Date.now() - startTime;
    
    res.json({ 
      status: 'OK', 
      message: 'Serveur Eternal Ascent ultra-optimisé opérationnel',
      timestamp: new Date().toISOString(),
      performance: {
        response_time_ms: responseTime,
        database_time_ms: dbTime,
        cache_status: cacheStatus
      },
      services: {
        database: 'Connected',
        cache: cacheStatus === 'OK' ? 'Connected' : cacheStatus,
        uptime: process.uptime()
      },
      optimization: {
        prepared_statements: dataService.preparedStatements.size,
        cache_enabled: true,
        compression_enabled: true,
        rate_limiting_enabled: true
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Erreur de santé du système',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de métriques avancées
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      database: {
        total_connections: dataService.pool.totalCount,
        idle_connections: dataService.pool.idleCount,
        waiting_connections: dataService.pool.waitingCount
      },
      cache: {
        status: 'active',
        // Ajouter des métriques Redis si disponibles
      },
      optimization: {
        prepared_statements: dataService.preparedStatements.size,
        cache_hit_ratio: 'N/A', // À implémenter avec Redis
        average_response_time: 'N/A' // À implémenter
      }
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des métriques' });
  }
});

// =====================================================
// ROUTES API ULTRA-OPTIMISÉES
// =====================================================

// Routes des données statiques et pages optimisées
app.use('/api/static', staticRoutes);
app.use('/api/talents', talentsRoutes);
app.use('/api', combatRoutes);
app.use('/api', docsRoutes);
app.use('/api', adminRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/activity', activityRoutes);

// Injecter et monter les systèmes avancés
app.use((req, res, next) => {
  req.app.locals.systems = systems;
  next();
});
app.use('/api/systems', systemsRoutes);

// Routes des systèmes (quêtes, pvp, events, etc.)
// (déjà monté au dessus)

// =====================================================
// ROUTES D'AUTHENTIFICATION (BASIQUES)
// =====================================================
// Demander un code de connexion par email
app.post('/api/auth/request-email-code', validate({ body: z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).optional()
}) }), async (req, res) => {
  try {
    const { email, username } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const userRes = await dataService.pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    const purpose = userRes.rows.length > 0 ? 'login' : 'register';

    // Cooldown par IP+email: 1 requête / 60s, max 5 / 15 min
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
    const recent = await dataService.pool.query(
      `SELECT COUNT(*)::int as c FROM auth_codes WHERE email = $1 AND ip = $2 AND created_at > NOW() - INTERVAL '60 seconds'`,
      [email, ip]
    );
    if (recent.rows[0].c > 0) {
      return res.status(429).json({ error: 'Veuillez patienter avant de redemander un code' });
    }
    const burst = await dataService.pool.query(
      `SELECT COUNT(*)::int as c FROM auth_codes WHERE email = $1 AND ip = $2 AND created_at > NOW() - INTERVAL '15 minutes'`,
      [email, ip]
    );
    if (burst.rows[0].c >= 5) {
      return res.status(429).json({ error: 'Trop de demandes récentes, réessayez plus tard' });
    }

    // Générer un code 6 chiffres
    const rawCode = (Math.floor(100000 + Math.random() * 900000)).toString();
    // Hacher le code
    const bcrypt = require('bcryptjs');
    const code = await bcrypt.hash(rawCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Supprimer les codes actifs existants pour cet email/purpose afin d'éviter les conflits
    await dataService.pool.query(`DELETE FROM auth_codes WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL`, [email, purpose]);
    await dataService.pool.query(
      `INSERT INTO auth_codes (email, code, purpose, expires_at, ip, user_agent) VALUES ($1,$2,$3,$4,$5,$6)`,
      [email, code, purpose, expiresAt, ip, req.headers['user-agent'] || null]
    );

    let mailSent = false;
    try {
      await mailService.sendVerificationCode(email, rawCode);
      mailSent = true;
    } catch (e) {
      console.warn('Mail send failed:', e.message);
    }

    return res.status(200).json({
      success: true,
      purpose,
      email,
      ...(process.env.NODE_ENV !== 'production' ? { code: rawCode, mailSent } : { mailSent })
    });
  } catch (e) {
    console.error('❌ request-email-code error:', e);
    return res.status(500).json({ error: 'Erreur lors de la demande de code' });
  }
});

// Vérifier le code et connecter / créer l'utilisateur + personnage
app.post('/api/auth/verify-email', validate({ body: z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
  username: z.string().min(3).max(30).optional(),
  characterName: z.string().min(3).max(50).optional(),
  className: z.string().min(3).max(30).optional()
}) }), async (req, res) => {
  try {
    const { email, code, username, characterName, className } = req.body || {};
    if (!email || !code) return res.status(400).json({ error: 'Email et code requis' });

    // Récupérer code valide
    const codeRes = await dataService.pool.query(
      `SELECT * FROM auth_codes WHERE email = $1 AND consumed_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [email]
    );
    if (codeRes.rows.length === 0) return res.status(401).json({ error: 'Code invalide ou expiré' });
    const bcrypt = require('bcryptjs');
    const authCode = codeRes.rows[0];
    const ok = await bcrypt.compare(String(code), authCode.code);
    if (!ok) {
      await dataService.pool.query('UPDATE auth_codes SET attempts = attempts + 1 WHERE id = $1', [authCode.id]);
      return res.status(401).json({ error: 'Code invalide' });
    }

    // Marquer comme consommé
    await dataService.pool.query('UPDATE auth_codes SET consumed_at = NOW() WHERE id = $1', [authCode.id]);

    // Trouver ou créer utilisateur
    let user;
    const u = await dataService.pool.query('SELECT id, username, email, is_email_verified FROM users WHERE email = $1', [email]);
    if (u.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const randomPass = await bcrypt.hash('email-code-' + Date.now() + '-' + Math.random(), 10);
      const uname = username && username.length >= 3 ? username : `user_${Math.random().toString(36).slice(2, 8)}`;
      const created = await dataService.pool.query(
        `INSERT INTO users (username, email, password_hash, is_email_verified, email_verified_at)
         VALUES ($1,$2,$3,true,NOW()) RETURNING id, username, email`,
        [uname, email, randomPass]
      );
      user = created.rows[0];
    } else {
      user = u.rows[0];
      if (!user.is_email_verified) {
        await dataService.pool.query('UPDATE users SET is_email_verified = true, email_verified_at = NOW() WHERE id = $1', [user.id]);
      }
    }

    // Provisionner le personnage s'il n'existe pas
    const charRes = await dataService.pool.query('SELECT id, name, level FROM characters WHERE user_id = $1', [user.id]);
    let character = charRes.rows[0];
    if (!character) {
      character = await characterProvisioning.provisionCharacterForUser(user.id, { characterName, className });
    }

    // Émettre tokens (access + refresh)
    const tokens = await tokenService.issueTokens({ userId: user.id, username: user.username });

    // Récupérer les données complètes du personnage pour le dashboard
    const dashboardQuery = `
      WITH character_data AS (
        SELECT 
          c.*,
          cc.display_name as class_name,
          cc.base_stats as class_base_stats,
          cc.description as class_description,
          u.email,
          u.username,
          u.created_at as user_created_at
        FROM characters c
        JOIN character_classes cc ON c.class_id = cc.id
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = $1
      ),
      character_stats AS (
        SELECT calculate_character_stats(c.id) as calculated_stats
        FROM characters c
        WHERE c.user_id = $1
      ),
      inventory_data AS (
        SELECT 
          ci.*,
          i.name as item_name,
          i.display_name as item_display_name,
          i.description as item_description,
          i.level_requirement,
          i.base_stats as item_base_stats,
          i.rarity_id,
          r.name as rarity_name,
          r.display_name as rarity_display_name,
          r.color as rarity_color,
          it.name as item_type_name,
          it.display_name as item_type_display_name,
          it.equip_slot
        FROM character_inventory ci
        JOIN items i ON ci.item_id = i.id
        JOIN rarities r ON i.rarity_id = r.id
        JOIN item_types it ON i.type_id = it.id
        WHERE ci.character_id = (SELECT id FROM characters WHERE user_id = $1)
      ),
      skills_data AS (
        SELECT NULL::int as dummy WHERE 1 = 0
      ),
      achievements_data AS (
        SELECT NULL::int as dummy WHERE 1 = 0
      ),
      dungeons_data AS (
        SELECT NULL::int as dummy WHERE 1 = 0
      ),
      quests_data AS (
        SELECT NULL::int as dummy WHERE 1 = 0
      )
      SELECT 
        (SELECT row_to_json(character_data) FROM character_data) as character,
        (SELECT calculated_stats FROM character_stats) as calculated_stats,
        (SELECT array_agg(row_to_json(inventory_data)) FROM inventory_data) as inventory,
        (SELECT array_agg(row_to_json(skills_data)) FROM skills_data) as skills,
        (SELECT array_agg(row_to_json(achievements_data)) FROM achievements_data) as achievements,
        (SELECT array_agg(row_to_json(dungeons_data)) FROM dungeons_data) as recommended_dungeons,
        (SELECT array_agg(row_to_json(quests_data)) FROM quests_data) as recommended_quests
    `;

    const dashboardResult = await dataService.pool.query(dashboardQuery, [user.id]);
    const dashboardData = dashboardResult.rows[0];

    // Consolidate stats in Node to avoid zeros
    const invRows = dashboardData.inventory || [];
    const equipped = Array.isArray(invRows) ? invRows.filter(it => it.equipped) : [];
    const consolidated = characterStatsUtil.calculateFinalStats(dashboardData.character || {}, equipped || []);

    const characterWithDetails = {
      ...dashboardData.character,
      stats: consolidated,
      inventory: invRows,
      skills: dashboardData.skills || [],
      achievements: dashboardData.achievements || [],
      recommended_dungeons: dashboardData.recommended_dungeons || [],
      recommended_quests: dashboardData.recommended_quests || []
    };

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token: tokens.access,
      refresh_token: tokens.refresh,
      user: { id: user.id, username: user.username, email },
      character: characterWithDetails
    });
  } catch (e) {
    console.error('❌ verify-email error:', e);
    return res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

// Renvoyer un code (respecte les mêmes cooldowns)
app.post('/api/auth/resend-email-code', async (req, res) => {
  try {
    req.url = '/api/auth/request-email-code';
    return app.handle(req, res);
  } catch (e) {
    return res.status(500).json({ error: 'Erreur lors du renvoi du code' });
  }
});

// Refresh token rotation
app.post('/api/auth/refresh', validate({ body: z.object({ refresh_token: z.string().min(10) }) }), async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const payload = await tokenService.verifyRefresh(refresh_token);
    const tokens = await tokenService.rotateRefreshToken(payload.sub, refresh_token);
    return res.json({ success: true, token: tokens.access, refresh_token: tokens.refresh });
  } catch (e) {
    return res.status(401).json({ error: 'Refresh invalide' });
  }
});

// Inscription (version simplifiée pour la démo)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation basique
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await dataService.pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Nom d\'utilisateur ou email déjà utilisé' });
    }

    // Hasher le mot de passe
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const userResult = await dataService.pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    const user = userResult.rows[0];

    // Créer un personnage par défaut en utilisant le service de provisioning
    const character = await characterProvisioning.provisionCharacterForUser(user.id, { characterName: username });

    // Créer le token JWT et poser en cookie httpOnly
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'eterna_secret_key',
      { expiresIn: '24h' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Récupérer les données complètes du personnage pour le dashboard
    const dashboardQuery = `
      WITH character_data AS (
        SELECT 
          c.*,
          cc.display_name as class_name,
          cc.base_stats as class_base_stats,
          cc.description as class_description,
          u.email,
          u.username,
          u.created_at as user_created_at
        FROM characters c
        JOIN character_classes cc ON c.class_id = cc.id
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = $1
      ),
      character_stats AS (
        SELECT calculate_character_stats(c.id) as calculated_stats
        FROM characters c
        WHERE c.user_id = $1
      ),
      inventory_data AS (
        SELECT 
          ci.*,
          i.name as item_name,
          i.display_name as item_display_name,
          i.description as item_description,
          i.level_requirement,
          i.base_stats as item_base_stats,
          i.rarity_id,
          r.name as rarity_name,
          r.display_name as rarity_display_name,
          r.color as rarity_color,
          it.name as item_type_name,
          it.display_name as item_type_display_name,
          it.equip_slot
        FROM character_inventory ci
        JOIN items i ON ci.item_id = i.id
        JOIN rarities r ON i.rarity_id = r.id
        JOIN item_types it ON i.type_id = it.id
        WHERE ci.character_id = (SELECT id FROM characters WHERE user_id = $1)
      ),
      skills_data AS (
        SELECT NULL::int as dummy WHERE 1 = 0
      )
      SELECT 
        (SELECT row_to_json(character_data) FROM character_data) as character,
        (SELECT calculated_stats FROM character_stats) as calculated_stats,
        (SELECT array_agg(row_to_json(inventory_data)) FROM inventory_data) as inventory,
        (SELECT array_agg(row_to_json(skills_data)) FROM skills_data) as skills
    `;

    const dashboardResult = await dataService.pool.query(dashboardQuery, [user.id]);
    const dashboardData = dashboardResult.rows[0];

    const characterWithDetails = {
      ...dashboardData.character,
      stats: dashboardData.calculated_stats,
      inventory: dashboardData.inventory || [],
      skills: dashboardData.skills || []
    };

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      character: characterWithDetails
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

// Connexion (version simplifiée pour la démo)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    // Récupérer l'utilisateur
    const userResult = await dataService.pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const user = userResult.rows[0];

    // Vérifier le mot de passe
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Vérifier si le personnage existe, sinon le créer
    let characterExists = await dataService.pool.query(
      'SELECT id FROM characters WHERE user_id = $1',
      [user.id]
    );

    if (characterExists.rows.length === 0) {
      // Créer un personnage par défaut avec le service de provisioning
      await characterProvisioning.provisionCharacterForUser(user.id, { characterName: `${user.username}_hero` });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'eterna_secret_key',
      { expiresIn: '24h' }
    );

    // Récupérer les données complètes du personnage pour le dashboard
    const dashboardQuery = `
      WITH character_data AS (
        SELECT 
          c.*,
          cc.display_name as class_name,
          cc.base_stats as class_base_stats,
          cc.description as class_description,
          u.email,
          u.username,
          u.created_at as user_created_at
        FROM characters c
        JOIN character_classes cc ON c.class_id = cc.id
        JOIN users u ON c.user_id = u.id
        WHERE c.user_id = $1
      ),
      character_stats AS (
        SELECT calculate_character_stats(c.id) as calculated_stats
        FROM characters c
        WHERE c.user_id = $1
      ),
      inventory_data AS (
        SELECT 
          ci.*,
          i.name as item_name,
          i.display_name as item_display_name,
          i.description as item_description,
          i.level_requirement,
          i.base_stats as item_base_stats,
          i.rarity_id,
          r.name as rarity_name,
          r.display_name as rarity_display_name,
          r.color as rarity_color,
          it.name as item_type_name,
          it.display_name as item_type_display_name,
          it.equip_slot
        FROM character_inventory ci
        JOIN items i ON ci.item_id = i.id
        JOIN rarities r ON i.rarity_id = r.id
        JOIN item_types it ON i.type_id = it.id
        WHERE ci.character_id = (SELECT id FROM characters WHERE user_id = $1)
      ),
      skills_data AS (
        SELECT 
          s.*
        FROM skills s
        WHERE 
          s.class = (
            SELECT cc.name 
            FROM characters c 
            JOIN character_classes cc ON c.class_id = cc.id 
            WHERE c.user_id = $1
          )
          OR s.available_classes @> jsonb_build_array((
            SELECT cc.name 
            FROM characters c 
            JOIN character_classes cc ON c.class_id = cc.id 
            WHERE c.user_id = $1
          ))
        ORDER BY s.level_requirement ASC
      ),
      achievements_data AS (
        SELECT NULL::int as dummy WHERE 1 = 0
      ),
      dungeons_data AS (
        SELECT 
          d.*,
          diff.display_name as difficulty_display_name,
          diff.exp_multiplier as difficulty_exp_multiplier,
          diff.gold_multiplier as difficulty_gold_multiplier
        FROM dungeons d
        JOIN difficulties diff ON d.difficulty_id = diff.id
        WHERE d.level_requirement <= (SELECT level FROM characters WHERE user_id = $1)
        ORDER BY d.level_requirement ASC
        LIMIT 10
      ),
      quests_data AS (
        SELECT 
          q.*
        FROM quests q
        WHERE q.level_requirement <= (SELECT level FROM characters WHERE user_id = $1)
        ORDER BY q.level_requirement ASC
        LIMIT 10
      )
      SELECT 
        (SELECT row_to_json(character_data) FROM character_data) as character,
        (SELECT calculated_stats FROM character_stats) as calculated_stats,
        (SELECT array_agg(row_to_json(inventory_data)) FROM inventory_data) as inventory,
        (SELECT array_agg(row_to_json(skills_data)) FROM skills_data) as skills,
        (SELECT array_agg(row_to_json(achievements_data)) FROM achievements_data) as achievements,
        (SELECT array_agg(row_to_json(dungeons_data)) FROM dungeons_data) as recommended_dungeons,
        (SELECT array_agg(row_to_json(quests_data)) FROM quests_data) as recommended_quests
    `;

    const dashboardResult = await dataService.pool.query(dashboardQuery, [user.id]);
    const dashboardData = dashboardResult.rows[0];

    // Consolidate stats in Node
    const invRows2 = dashboardData.inventory || [];
    const equipped2 = Array.isArray(invRows2) ? invRows2.filter(it => it.equipped) : [];
    const consolidated2 = characterStatsUtil.calculateFinalStats(dashboardData.character || {}, equipped2 || []);
    // À la connexion: remplir PV/Mana au maximum
    consolidated2.health = consolidated2.max_health;
    consolidated2.mana = consolidated2.max_mana;

    const characterWithDetails = {
      ...dashboardData.character,
      stats: consolidated2,
      inventory: invRows2,
      skills: dashboardData.skills || [],
      achievements: dashboardData.achievements || [],
      recommended_dungeons: dashboardData.recommended_dungeons || [],
      recommended_quests: dashboardData.recommended_quests || []
    };

    res.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      character: characterWithDetails
    });

  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Déconnexion: effacer le cookie httpOnly
app.post('/api/auth/logout', async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur de déconnexion' });
  }
});

// =====================================================
// ROUTES PROFIL / UTILISATEUR
// =====================================================

// Profil utilisateur courant
app.get('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const userResult = await dataService.pool.query(
      'SELECT id, username, email, last_login FROM users WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mettre à jour last_login
    await dataService.pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);

    // Renvoyer profil + personnage si présent
    const charResult = await dataService.pool.query(
      'SELECT id, name, level FROM characters WHERE user_id = $1',
      [userId]
    );

    return res.json({
      user: userResult.rows[0],
      character: charResult.rows[0] || null
    });
  } catch (e) {
    console.error('❌ Erreur profil:', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route utilitaire: récupérer personnage par id
app.get('/api/characters/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    // Compat: l'app frontend passe parfois userId au lieu de characterId
    let result = await dataService.pool.query(
      'SELECT id, user_id, name, level FROM characters WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      result = await dataService.pool.query(
        'SELECT id, user_id, name, level FROM characters WHERE user_id = $1',
        [id]
      );
    }
    if (result.rows.length === 0) return res.status(404).json({ error: 'Personnage non trouvé' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error('❌ Erreur get character:', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =====================================================
// ROUTES GUILDES (compat pour le frontend)
// =====================================================

// Liste des guildes (résumé)
app.get('/api/guilds', requireAuth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    const params = [];
    let where = `g.status <> 'disbanded'`;
    if (search && String(search).trim().length > 0) {
      const s = `%${String(search).trim()}%`;
      params.push(s);
      params.push(s);
      where += ` AND (g.display_name ILIKE $${params.length - 1} OR g.name ILIKE $${params.length})`;
    }

    params.push(Math.min(parseInt(limit, 10) || 50, 100));
    params.push(parseInt(offset, 10) || 0);

    const result = await dataService.pool.query(
      `SELECT 
         g.id,
         g.name,
         g.display_name,
         COALESCE(g.description, '') AS description,
         g.level,
         g.guild_coin,
         g.guild_honor,
         g.max_members,
         g.current_members,
         COALESCE(g.emblem, '') AS emblem,
         COALESCE(g.banner, '') AS banner,
         g.status,
         g.created_at,
         g.updated_at
       FROM guilds g
       WHERE ${where}
       ORDER BY g.level DESC, g.guild_honor DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return res.json(result.rows);
  } catch (e) {
    console.error('❌ Erreur liste guildes:', e);
    return res.status(500).json({ error: 'Erreur lors de la récupération des guildes' });
  }
});

// Détails complets d'une guilde (nested JSON)
app.get('/api/guilds/:guildId', requireAuth, async (req, res) => {
  try {
    const guildId = parseInt(req.params.guildId, 10);
    if (!Number.isFinite(guildId)) return res.status(400).json({ error: 'guildId invalide' });

    const base = await dataService.pool.query('SELECT * FROM guilds WHERE id = $1', [guildId]);
    if (base.rows.length === 0) return res.status(404).json({ error: 'Guilde non trouvée' });
    const guild = base.rows[0];

    const safeQuery = async (sql, params) => {
      try { return await dataService.pool.query(sql, params); } catch (e) { console.warn('Guild details subquery failed:', e.message); return { rows: [] }; }
    };

    const [membersRes, territoriesRes, projectsRes, raidsRes, eventsRes] = await Promise.all([
      safeQuery(
        `SELECT character_id, rank, joined_at, last_active, contribution_points, weekly_contribution
         FROM guild_members WHERE guild_id = $1 ORDER BY contribution_points DESC`,
        [guildId]
      ),
      safeQuery('SELECT * FROM guild_territories WHERE guild_id = $1 ORDER BY created_at DESC', [guildId]),
      safeQuery('SELECT * FROM guild_projects WHERE guild_id = $1 ORDER BY created_at DESC', [guildId]),
      safeQuery('SELECT * FROM guild_raids WHERE guild_id = $1 ORDER BY started_at DESC', [guildId]),
      safeQuery('SELECT * FROM guild_events WHERE guild_id = $1 ORDER BY start_time DESC', [guildId])
    ]);

    guild.members = membersRes.rows;
    guild.territories = territoriesRes.rows;
    guild.projects = projectsRes.rows;
    guild.raids = raidsRes.rows;
    guild.events = eventsRes.rows;

    // Nombre membres courant si manquant
    if (typeof guild.current_members !== 'number') guild.current_members = guild.members.length;

    return res.json(guild);
  } catch (e) {
    console.error('❌ Erreur détails guilde:', e);
    return res.status(500).json({ error: 'Erreur lors de la récupération des détails de la guilde' });
  }
});

// Récupérer la guilde d'un personnage
app.get('/api/characters/:characterId/guild', requireAuth, async (req, res) => {
  try {
    const characterId = parseInt(req.params.characterId, 10);
    if (!Number.isFinite(characterId)) return res.status(400).json({ error: 'characterId invalide' });
    const result = await dataService.pool.query(
      `SELECT g.*, gm.rank
       FROM guild_members gm
       JOIN guilds g ON g.id = gm.guild_id
       WHERE gm.character_id = $1 AND g.status <> 'disbanded'
       ORDER BY gm.joined_at DESC
       LIMIT 1`,
      [characterId]
    );
    if (result.rows.length === 0) return res.json(null);
    return res.json(result.rows[0]);
  } catch (e) {
    console.error('❌ Erreur guilde du personnage:', e);
    return res.status(500).json({ error: 'Erreur lors de la récupération de la guilde du personnage' });
  }
});

// Statistiques calculées d'une guilde (computed JSON)
app.get('/api/guilds/:guildId/computed', requireAuth, async (req, res) => {
  try {
    const guildId = parseInt(req.params.guildId, 10);
    const [agg] = (await dataService.pool.query(
      `WITH member_stats AS (
         SELECT COUNT(*)::int AS members,
                COALESCE(SUM(contribution_points),0)::int AS total_contrib,
                COALESCE(SUM(weekly_contribution),0)::int AS weekly_contrib
         FROM guild_members WHERE guild_id = $1
       ),
       raid_stats AS (
         SELECT COUNT(*) FILTER (WHERE status = 'active')::int AS active_raids,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_raids
         FROM guild_raids WHERE guild_id = $1
       ),
       project_stats AS (
         SELECT COUNT(*) FILTER (WHERE status = 'active')::int AS active_projects,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_projects
         FROM guild_projects WHERE guild_id = $1
       ),
       territory_stats AS (
         SELECT COUNT(*)::int AS territories
         FROM guild_territories WHERE guild_id = $1
       )
       SELECT * FROM member_stats, raid_stats, project_stats, territory_stats`,
      [guildId]
    )).rows;
    return res.json(agg || {});
  } catch (e) {
    console.error('❌ Erreur stats guilde:', e);
    return res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
  }
});

// Créer une guilde
app.post('/api/guilds', requireAuth, async (req, res) => {
  try {
    const { characterId, name, display_name, description, emblem, banner } = req.body || {};
    if (!characterId || !display_name) return res.status(400).json({ error: 'characterId et display_name requis' });
    const normalizedName = name && name.trim().length >= 3 ? name.trim().toLowerCase().replace(/\s+/g, '_') : display_name.trim().toLowerCase().replace(/\s+/g, '_');
    const guild = await GuildManager.createGuild({ name: normalizedName, display_name, description, emblem, banner }, characterId, dataService.pool);
    return res.status(201).json(guild);
  } catch (e) {
    console.error('❌ Erreur création guilde:', e);
    return res.status(500).json({ error: e.message || 'Erreur lors de la création de la guilde' });
  }
});

// Rejoindre une guilde
app.post('/api/guilds/:guildId/join', requireAuth, async (req, res) => {
  try {
    const guildId = parseInt(req.params.guildId, 10);
    const { characterId } = req.body || {};
    if (!characterId) return res.status(400).json({ error: 'characterId requis' });
    const out = await GuildManager.joinGuild(guildId, characterId, dataService.pool);
    return res.json(out);
  } catch (e) {
    console.error('❌ Erreur rejoindre guilde:', e);
    return res.status(500).json({ error: e.message || 'Erreur lors de la jonction de la guilde' });
  }
});

// Quitter une guilde
app.post('/api/guilds/:guildId/leave', requireAuth, async (req, res) => {
  try {
    const guildId = parseInt(req.params.guildId, 10);
    const { characterId } = req.body || {};
    if (!characterId) return res.status(400).json({ error: 'characterId requis' });
    const out = await GuildManager.leaveGuild(guildId, characterId, dataService.pool);
    return res.json(out);
  } catch (e) {
    console.error('❌ Erreur quitter guilde:', e);
    return res.status(500).json({ error: e.message || 'Erreur lors de la sortie de la guilde' });
  }
});

// Raids de guilde
app.get('/api/guilds/:guildId/raids', requireAuth, async (req, res) => {
  try {
    const guildId = parseInt(req.params.guildId, 10);
    const result = await dataService.pool.query('SELECT * FROM guild_raids WHERE guild_id = $1 ORDER BY started_at DESC', [guildId]);
    return res.json(result.rows);
  } catch (e) {
    console.error('❌ Erreur raids guilde:', e);
    return res.status(500).json({ error: 'Erreur lors de la récupération des raids' });
  }
});

app.post('/api/guilds/:guildId/raids', requireAuth, async (req, res) => {
  try {
    const guildId = parseInt(req.params.guildId, 10);
    const { raid_name, raid_type, boss_name, boss_level, difficulty = 'normal' } = req.body || {};
    const raid = await GuildManager.startGuildRaid(guildId, { raid_name, raid_type, boss_name, boss_level, difficulty }, dataService.pool);
    return res.status(201).json(raid);
  } catch (e) {
    console.error('❌ Erreur démarrage raid:', e);
    return res.status(500).json({ error: e.message || 'Erreur lors du démarrage du raid' });
  }
});

app.post('/api/raids/:raidId/join', requireAuth, async (req, res) => {
  try {
    const raidId = parseInt(req.params.raidId, 10);
    const { characterId } = req.body || {};
    if (!characterId) return res.status(400).json({ error: 'characterId requis' });
    const out = await GuildManager.joinGuildRaid(raidId, characterId, dataService.pool);
    return res.json(out);
  } catch (e) {
    console.error('❌ Erreur rejoindre raid:', e);
    return res.status(500).json({ error: e.message || 'Erreur lors de la participation au raid' });
  }
});

// Projets de guilde
app.get('/api/guilds/:guildId/projects', requireAuth, async (req, res) => {
  try {
    const guildId = parseInt(req.params.guildId, 10);
    const result = await dataService.pool.query('SELECT * FROM guild_projects WHERE guild_id = $1 ORDER BY created_at DESC', [guildId]);
    return res.json(result.rows);
  } catch (e) {
    console.error('❌ Erreur projets guilde:', e);
    return res.status(500).json({ error: 'Erreur lors de la récupération des projets' });
  }
});

app.post('/api/guilds/:guildId/projects', requireAuth, async (req, res) => {
  try {
    const guildId = parseInt(req.params.guildId, 10);
    const project = await GuildManager.startGuildProject(guildId, req.body || {}, dataService.pool);
    return res.status(201).json(project);
  } catch (e) {
    console.error('❌ Erreur démarrage projet:', e);
    return res.status(500).json({ error: e.message || 'Erreur lors du démarrage du projet' });
  }
});

app.post('/api/projects/:projectId/contribute', requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const { characterId, amount } = req.body || {};
    if (!characterId || !amount) return res.status(400).json({ error: 'characterId et amount requis' });
    const out = await GuildManager.contributeToProject(projectId, characterId, amount, dataService.pool);
    return res.json(out);
  } catch (e) {
    console.error('❌ Erreur contribution projet:', e);
    return res.status(500).json({ error: e.message || 'Erreur lors de la contribution au projet' });
  }
});

// Événements de guilde
app.get('/api/guilds/:guildId/events', requireAuth, async (req, res) => {
  try {
    const guildId = parseInt(req.params.guildId, 10);
    const result = await dataService.pool.query('SELECT * FROM guild_events WHERE guild_id = $1 ORDER BY start_time DESC', [guildId]);
    return res.json(result.rows);
  } catch (e) {
    console.error('❌ Erreur événements guilde:', e);
    return res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
  }
});

app.post('/api/guilds/:guildId/events', requireAuth, async (req, res) => {
  try {
    const guildId = parseInt(req.params.guildId, 10);
    const { createdBy } = req.body || {};
    if (!createdBy) return res.status(400).json({ error: 'createdBy requis' });
    const event = await GuildManager.createGuildEvent(guildId, req.body || {}, createdBy, dataService.pool);
    return res.status(201).json(event);
  } catch (e) {
    console.error('❌ Erreur création événement:', e);
    return res.status(500).json({ error: e.message || 'Erreur lors de la création de l\'événement' });
  }
});

// Génération de guildes dynamiques (mock)
app.post('/api/guilds/generate-dynamic', requireAuth, async (req, res) => {
  try {
    const count = Math.max(1, Math.min(5, (req.body && req.body.count) || 3));
    // Récupérer un créateur par défaut (premier personnage)
    const chr = await dataService.pool.query('SELECT id FROM characters ORDER BY id LIMIT 1');
    if (chr.rows.length === 0) return res.status(400).json({ error: 'Aucun personnage disponible pour créer des guildes de démonstration' });
    const creatorId = chr.rows[0].id;

    // Générer des guildes temporaires en base pour la démo
    const templates = GuildManager.getGuildTemplates();
    const created = [];
    for (let i = 0; i < count; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const data = GuildManager.generateGuildFromTemplate(template, i + 1);
      const guild = await GuildManager.createGuild({
        name: data.name,
        display_name: data.display_name,
        description: data.description,
        emblem: data.emblem,
        banner: data.banner
      }, creatorId, dataService.pool);
      created.push(guild);
    }
    return res.json({ success: true, guilds: created });
  } catch (e) {
    console.error('❌ Erreur génération guildes dynamiques:', e);
    return res.status(500).json({ error: 'Erreur lors de la génération de guildes dynamiques' });
  }
});

// =====================================================
// ROUTES POUR LES TALENTS
// =====================================================

// Récupérer tous les arbres de talents
app.get('/api/talents/trees', async (req, res) => {
  try {
    const talentsData = require('./data/sid/talents');
    const trees = talentsData.getTalentTrees();
    res.json({ success: true, trees });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des arbres de talents:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des arbres de talents' });
  }
});

// Récupérer l'arbre de talents par classe
app.get('/api/talents/trees/:className', async (req, res) => {
  try {
    const { className } = req.params;
    const talentsData = require('./data/sid/talents');
    const tree = talentsData.getTalentTreeByClass(className);
    
    if (!tree) {
      return res.status(404).json({ error: 'Arbre de talents non trouvé pour cette classe' });
    }
    
    res.json({ success: true, tree });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'arbre de talents:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'arbre de talents' });
  }
});

// =====================================================
// ROUTES DE FALLBACK ET GESTION D'ERREURS
// =====================================================

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
    available_endpoints: [
      'GET /api/health',
      'GET /api/metrics',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/characters/:id',
      'GET /api/characters/:id/stats',
      'GET /api/characters/:id/inventory',
      'GET /api/characters/:id/equipped',
      'PUT /api/characters/:id/equip',
      'PUT /api/characters/:id/unequip',
      'POST /api/characters/:id/level-up',
      'GET /api/items',
      'GET /api/items/:id',
      'GET /api/items/search/:query',
      'GET /api/items/type/:type',
      'GET /api/items/rarity/:rarity',
      'GET /api/items/popularity',
      'GET /api/items/random',
      'GET /api/static/classes',
      'GET /api/static/items',
      'GET /api/static/rarities',
      'GET /api/static/skills',
      'GET /api/static/dungeons',
      'GET /api/static/enemies'
    ]
  });
});

// =====================================================
// INITIALISATION DU SERVEUR
// =====================================================

async function startServer() {
  try {
    console.log('🚀 Démarrage du serveur Eternal Ascent ULTRA-OPTIMISÉ...');
    
    // Initialiser les services
    dataService = new OptimizedDataService();
    cacheService = new CacheService();
    
    // Injecter les services dans l'app
    app.locals.dataService = dataService;
    app.locals.cacheService = cacheService;
    
    // Initialiser les services
    await dataService.initialize();

    // Assurer la table d'activité
    await dataService.pool.query(`
      CREATE TABLE IF NOT EXISTS activity_events (
        id SERIAL PRIMARY KEY,
        character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
        type VARCHAR(40) NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_activity_events_character_id_created_at ON activity_events(character_id, created_at DESC);
    `);

    // Initialiser les systèmes (ex: quêtes)
    systems = new Map();
    systems.set('quests', new QuestSystem(dataService.pool));
    rotationService = new RotationService(dataService, cacheService, systems.get('quests'));
    systems.set('rotations', rotationService);
    tokenService = new TokenService(dataService.pool);
    
    // Mail & Provisioning services
    mailService = new MailService();
    characterProvisioning = new CharacterProvisioningService(dataService.pool);
    
    // Injecter les services dans le middleware après initialisation
    app.use((req, res, next) => {
      req.dataService = dataService;
      req.cacheService = cacheService;
      req.mailService = mailService;
      req.tokenService = tokenService;
      next();
    });
    
    // Démarrer le serveur
    const server = app.listen(PORT, () => {
      console.log(`✅ Serveur ULTRA-OPTIMISÉ démarré sur le port ${PORT}`);
      console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📈 Métriques: http://localhost:${PORT}/api/metrics`);
      console.log(`\n🎯 OPTIMISATIONS ACTIVÉES:`);
      console.log(`   ✅ Requêtes préparées: ${dataService.preparedStatements.size}`);
      console.log(`   ✅ Cache Redis: Activé`);
      console.log(`   ✅ Compression: Activée`);
      console.log(`   ✅ Rate Limiting: Activé`);
      console.log(`   ✅ Vues SQL optimisées: Activées`);
      console.log(`   ✅ Index composites: Activés`);
      console.log(`   ✅ Pagination intelligente: Activée`);
    });

    // WebSocket
    wsManager = new WebSocketManager(server);
    systems.set('websocket', wsManager);

    // Gestion gracieuse de l'arrêt
    process.on('SIGTERM', async () => {
      console.log('🛑 Signal SIGTERM reçu, arrêt gracieux...');
      
      server.close(async () => {
        console.log('🔌 Serveur fermé');
        
        try {
          await dataService.close();
          console.log('✅ Services fermés proprement');
          process.exit(0);
        } catch (error) {
          console.error('❌ Erreur lors de la fermeture des services:', error);
          process.exit(1);
        }
      });
    });

    process.on('SIGINT', async () => {
      console.log('🛑 Signal SIGINT reçu, arrêt gracieux...');
      
      server.close(async () => {
        console.log('🔌 Serveur fermé');
        
        try {
          await dataService.close();
          console.log('✅ Services fermés proprement');
          process.exit(0);
        } catch (error) {
          console.error('❌ Erreur lors de la fermeture des services:', error);
          process.exit(1);
        }
      });
    });

  } catch (error) {
    console.error('💥 Erreur fatale lors du démarrage:', error);
    process.exit(1);
  }
}

// Démarrer le serveur
if (require.main === module) {
  startServer();
}

module.exports = app;

