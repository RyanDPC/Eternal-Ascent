const express = require('express');
const router = express.Router();

// Minimal OpenAPI JSON (expand later)
const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Eternal Ascent API',
    version: '1.0.0'
  },
  paths: {
    '/api/health': { get: { summary: 'Health check', responses: { '200': { description: 'OK' } } } },
    '/api/auth/request-email-code': { post: { summary: 'Request email code' } },
    '/api/auth/verify-email': { post: { summary: 'Verify email with code' } },
    '/api/auth/refresh': { post: { summary: 'Rotate refresh token' } },
    '/api/user/profile': { get: { summary: 'Current user profile' } },
    '/api/characters/current': { get: { summary: 'Current character' } },
    '/api/characters/{id}': { get: { summary: 'Character by id' } }
  }
};

router.get('/docs.json', (req, res) => res.json(spec));
router.get('/docs', (req, res) => res.json({ docs: '/api/docs.json' }));

module.exports = router;

