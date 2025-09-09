const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Services optimisés
const OptimizedDataService = require('./services/OptimizedDataService');
const CacheService = require('./services/CacheService');

// Routes optimisées
const optimizedCharacterRoutes = require('./routes/optimized-characters');
const optimizedItemRoutes = require('./routes/optimized-items');
const staticRoutes = require('./routes/static');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialisation des services
let dataService;
let cacheService;

// =====================================================
// MIDDLEWARE DE SÉCURITÉ ET PERFORMANCE
// =====================================================

// Helmet pour la sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  xFrameOptions: { action: 'deny' },
  xssFilter: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Compression
app.use(compression());

// Logging optimisé
app.use(morgan('combined'));

// Rate limiting adaptatif
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/api/health' || req.path === '/api/metrics';
  }
});

// Rate limiting général
app.use(createRateLimit(15 * 60 * 1000, 200, 'Trop de requêtes depuis cette IP'));

// Rate limiting pour l'authentification
app.use('/api/auth', createRateLimit(15 * 60 * 1000, 10, 'Trop de tentatives de connexion'));

// Rate limiting pour les recherches
app.use('/api/items/search', createRateLimit(5 * 60 * 1000, 50, 'Trop de recherches effectuées'));

// CORS optimisé
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parser JSON avec limite (laisser body-parser gérer les erreurs de parsing)
app.use(express.json({ 
  limit: '10mb'
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// MIDDLEWARE PERSONNALISÉS
// =====================================================

// Middleware pour injecter les services
app.use((req, res, next) => {
  req.dataService = dataService;
  req.cacheService = cacheService;
  next();
});

// Middleware simple pour extraire l'utilisateur depuis le JWT
function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
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
    
    // Vérifier le cache Redis
    const cacheCheck = await cacheService.getAsync('health_check');
    await cacheService.setAsync('health_check', 'ok', 'EX', 10);
    
    const responseTime = Date.now() - startTime;
    
    res.json({ 
      status: 'OK', 
      message: 'Serveur Eternal Ascent ultra-optimisé opérationnel',
      timestamp: new Date().toISOString(),
      performance: {
        response_time_ms: responseTime,
        database_time_ms: dbTime,
        cache_status: cacheCheck ? 'OK' : 'WARNING'
      },
      services: {
        database: 'Connected',
        cache: cacheCheck ? 'Connected' : 'Warning',
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

// Routes des personnages optimisées
app.use('/api/characters', optimizedCharacterRoutes);

// Routes des objets optimisées
app.use('/api/items', optimizedItemRoutes);

// Routes des données statiques
app.use('/api/static', staticRoutes);

// =====================================================
// ROUTES D'AUTHENTIFICATION (BASIQUES)
// =====================================================

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

    // Créer un personnage par défaut
    const characterResult = await dataService.pool.query(`
      INSERT INTO characters (
        user_id, name, class_id, level, experience, experience_to_next,
        health, max_health, mana, max_mana, attack, defense, 
        magic_attack, magic_defense, critical_rate, critical_damage,
        vitality, strength, intelligence, agility, resistance, precision,
        endurance, wisdom, constitution, dexterity,
        health_regen, mana_regen, attack_speed, movement_speed,
        dodge_chance, block_chance, parry_chance, spell_power, physical_power
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35)
      RETURNING id, name, level
    `, [
      user.id, username, 1, // Classe par défaut (warrior)
      1, 0, 100, // Level 1, 0 XP, 100 XP pour next level
      150, 150, 50, 50, // HP/MP
      25, 20, 8, 10, // Attack/Defense
      5.0, 150.0, // Crit
      10, 10, 10, 10, 10, 10, 10, 10, 10, 10, // Stats secondaires
      1.0, 0.5, 100.0, 100.0, 8.0, 5.0, 3.0, 100.0, 100.0 // Stats dérivées
    ]);

    const character = characterResult.rows[0];

    // Créer le token JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'eterna_secret_key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      character: {
        id: character.id,
        name: character.name,
        level: character.level
      }
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

    // Récupérer (ou créer) le personnage
    let characterResult = await dataService.pool.query(
      'SELECT id, name, level FROM characters WHERE user_id = $1',
      [user.id]
    );

    let character = characterResult.rows[0];
    if (!character) {
      // Créer un personnage par défaut si absent
      const defaultName = `${user.username}_hero`;
      const created = await dataService.pool.query(`
        INSERT INTO characters (
          user_id, name, class_id, level, experience, experience_to_next,
          health, max_health, mana, max_mana, attack, defense,
          magic_attack, magic_defense, critical_rate, critical_damage,
          vitality, strength, intelligence, agility, resistance, precision,
          endurance, wisdom, constitution, dexterity,
          health_regen, mana_regen, attack_speed, movement_speed,
          dodge_chance, block_chance, parry_chance, spell_power, physical_power
        ) VALUES (
          $1, $2, $3, 1, 0, 100,
          150, 150, 50, 50, 25, 20,
          8, 10, 5.0, 150.0,
          10, 10, 10, 10, 10, 10,
          10, 10, 10, 10,
          1.0, 0.5, 100.0, 100.0,
          8.0, 5.0, 3.0, 100.0, 100.0
        )
        RETURNING id, name, level
      `, [user.id, defaultName, 1]);
      character = created.rows[0];
    }

    // Créer le token JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'eterna_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      character: character ? {
        id: character.id,
        name: character.name,
        level: character.level
      } : null
    });

  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
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

// Liste des guildes (retourne vide pour l'instant)
app.get('/api/guilds', requireAuth, async (req, res) => {
  return res.json([]);
});

// Génération de guildes dynamiques (mock)
app.post('/api/guilds/generate-dynamic', requireAuth, async (req, res) => {
  const count = Math.max(1, Math.min(10, (req.body && req.body.count) || 3));
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: i + 1,
      name: `Guild_${Date.now()}_${i}`,
      level: 1 + (i % 5),
      members: 5 + i,
      maxMembers: 30,
      description: 'Generated guild',
      status: 'available'
    });
  }
  return res.json({ success: true, guilds: out });
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

