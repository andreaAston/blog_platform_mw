const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');

const config = require('./config');
const db = require('./db');
const { notFoundHandler, errorHandler } = require('./middleware/error');
const { UPLOAD_DIR } = require('./utils/storage');

const app = express();

// Behind Render/Vercel/etc. there is a proxy: trust it so req.ip and req.protocol are the real client's.
if (config.isProd) app.set('trust proxy', 1);

app.use(
  helmet({
    // The React app lives on another origin and must be allowed to display our images.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors({ origin: config.clientOrigins }));
app.use(express.json({ limit: '200kb' }));

// Generous global limit; the login route has its own much stricter one.
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', async (req, res) => {
  await db.query('select 1');
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' })); // local-dev image fallback

// Swagger UI built from openapi.yaml -> http://localhost:4000/api/docs
const specPath = path.join(__dirname, '..', 'openapi.yaml');
if (fs.existsSync(specPath)) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(YAML.parse(fs.readFileSync(specPath, 'utf8'))));
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
