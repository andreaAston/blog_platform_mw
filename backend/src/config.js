require('dotenv').config({ quiet: true });

const env = process.env;
const isTest = env.NODE_ENV === 'test';
const isProd = env.NODE_ENV === 'production';

const config = {
  isTest,
  isProd,
  port: Number(env.PORT) || 4000,
  databaseUrl: (isTest && env.TEST_DATABASE_URL) || env.DATABASE_URL,
  databaseSsl: env.DATABASE_SSL === 'true',
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN || '1d',
  clientOrigins: (env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  loginRateLimit: Number(env.LOGIN_RATE_LIMIT) || 10,
  bcryptCost: isTest ? 4 : 12, // low cost in tests only, to keep them fast
  supabaseUrl: env.SUPABASE_URL,
  supabaseServiceKey: env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseBucket: env.SUPABASE_BUCKET || 'covers',
};

// Fail fast: a server that boots with a missing secret is worse than one that refuses to start.
if (!config.databaseUrl) throw new Error('DATABASE_URL is not set (see .env.example)');
if (!config.jwtSecret || config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

module.exports = config;
