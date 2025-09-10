const { z } = require('zod');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_SSL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  ADMIN_TOKEN: z.string().optional()
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // Show minimal message to avoid leaking secrets
  console.error('Invalid environment configuration:', parsed.error.issues.map(i => i.path.join('.') + ' ' + i.message).join(', '));
  process.exit(1);
}

const env = parsed.data;

const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT || '3001', 10),
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'eterna_secret_key',
    refreshSecret: env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? process.env.JWT_SECRET + '_refresh' : 'eterna_refresh_secret_key'),
    accessTtl: env.JWT_ACCESS_TTL || (env.NODE_ENV === 'production' ? '10m' : '15m'),
    refreshTtl: env.JWT_REFRESH_TTL || '7d'
  },
  cors: {
    origins: env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://localhost:3001']
  },
  admin: { token: env.ADMIN_TOKEN }
};

module.exports = config;


