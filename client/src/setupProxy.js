/**
 * Configuration du proxy pour le serveur de développement
 * 
 * Ce fichier configure le serveur de développement pour servir
 * les assets statiques et gérer les requêtes API.
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Configuration du proxy pour l'API
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxy: ${req.method} ${req.url} -> ${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('❌ Erreur proxy:', err.message);
        res.status(500).json({ error: 'Erreur de proxy' });
      }
    })
  );

  // Configuration pour servir les assets statiques
  app.use(
    '/assets',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {
        '^/assets': '/assets'
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🎨 Asset: ${req.method} ${req.url} -> ${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('❌ Erreur asset:', err.message);
        // Fallback : servir depuis le dossier public
        res.status(404).json({ error: 'Asset non trouvé' });
      }
    })
  );

  // Configuration pour les sprites et images
  app.use(
    '/assets/images',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {
        '^/assets/images': '/assets/images'
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🖼️ Image: ${req.method} ${req.url} -> ${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('❌ Erreur image:', err.message);
        res.status(404).json({ error: 'Image non trouvée' });
      }
    })
  );

  // Configuration pour les icônes
  app.use(
    '/assets/icons',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {
        '^/assets/icons': '/assets/icons'
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🎯 Icône: ${req.method} ${req.url} -> ${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('❌ Erreur icône:', err.message);
        res.status(404).json({ error: 'Icône non trouvée' });
      }
    })
  );

  // Configuration pour l'audio
  app.use(
    '/assets/audio',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {
        '^/assets/audio': '/assets/audio'
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🎵 Audio: ${req.method} ${req.url} -> ${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('❌ Erreur audio:', err.message);
        res.status(404).json({ error: 'Audio non trouvé' });
      }
    })
  );

  // Middleware pour logger les requêtes
  app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
  });

  // Middleware pour gérer les erreurs 404
  app.use((req, res, next) => {
    if (req.path.startsWith('/assets/') && !req.path.includes('.')) {
      console.warn(`⚠️ Asset non trouvé: ${req.path}`);
      res.status(404).json({ 
        error: 'Asset non trouvé',
        path: req.path,
        suggestion: 'Vérifiez que le fichier existe dans le dossier public/assets'
      });
      return;
    }
    next();
  });

  console.log('🚀 Proxy configuré pour le serveur de développement');
  console.log('📁 Assets servis depuis /assets');
  console.log('🔌 API proxy configuré vers http://localhost:3001');
};


