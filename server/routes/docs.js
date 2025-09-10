const express = require('express');
const router = express.Router();

// Expanded OpenAPI JSON
const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Eternal Ascent API',
    version: '1.0.0'
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' }
        }
      },
      Character: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          level: { type: 'integer' }
        }
      },
      AuthRequestEmailCode: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string' }
        }
      },
      AuthVerify: {
        type: 'object',
        required: ['email','code'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string' },
          username: { type: 'string' },
          characterName: { type: 'string' },
          className: { type: 'string' }
        }
      },
      AuthRefresh: {
        type: 'object',
        required: ['refresh_token'],
        properties: { refresh_token: { type: 'string' } }
      }
    }
  },
  paths: {
    '/api/health': { get: { summary: 'Health check', responses: { '200': { description: 'OK' } } } },
    '/api/auth/request-email-code': { post: { summary: 'Request email code', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRequestEmailCode' } } } }, responses: { '200': { description: 'Code sent' }, '429': { description: 'Rate limited' } } } },
    '/api/auth/verify-email': { post: { summary: 'Verify email with code', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthVerify' } } } }, responses: { '200': { description: 'Tokens issued' }, '401': { description: 'Invalid code' } } } },
    '/api/auth/refresh': { post: { summary: 'Rotate refresh token', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRefresh' } } } }, responses: { '200': { description: 'New tokens' }, '401': { description: 'Invalid refresh' } } } },
    '/api/user/profile': { get: { summary: 'Current user profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'User profile' }, '401': { description: 'Unauthorized' } } } },
    '/api/characters/current': { get: { summary: 'Current character', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Character' }, '401': { description: 'Unauthorized' } } } },
    '/api/characters/{id}': { get: { summary: 'Character by id', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Character' }, '404': { description: 'Not found' } } } }
  }
};

router.get('/docs.json', (req, res) => res.json(spec));
router.get('/docs', (req, res) => res.json({ docs: '/api/docs.json' }));

module.exports = router;

