# Configuration

## Variables d'environnement

- NODE_ENV: development | production | test
- PORT: Port de l'API (default 3001)
- DATABASE_URL: Connexion Postgres (recommandé sur Render)
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL: Alternative à DATABASE_URL
- JWT_ACCESS_SECRET: Secret JWT access
- JWT_REFRESH_SECRET: Secret JWT refresh
- JWT_ACCESS_TTL: ex: 15m
- JWT_REFRESH_TTL: ex: 7d
- REDIS_URL: redis://...
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM: Envoi d'emails
- LOG_LEVEL: debug | info | warn | error

## Profils

- development: CORS larges, logs pretty, CSP simplifiée
- production: CORS restreints, CSP stricte, HSTS, rate limit fort

## Commandes

- Reset: `npm run reset --prefix server`
- Seed: `npm run seed --prefix server`
- Tests: `npm run test --prefix server`
- E2E: `node server/scripts/e2e-flow.js`