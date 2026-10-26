const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const db = require('../db');
const schemas = require('../schemas');
const validate = require('../middleware/validate');
const { signToken, authenticate } = require('../middleware/auth');
const { HttpError } = require('../errors');

const router = express.Router();

// Brute-force protection: only FAILED logins count (skipSuccessfulRequests).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.loginRateLimit,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many failed login attempts. Try again in 15 minutes.' } },
});

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

// A real bcrypt hash of a random string. Used so "unknown email" takes as long as "wrong password".
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', config.bcryptCost);

// POST /api/auth/register
router.post('/register', validate(schemas.register), async (req, res) => {
  const { name, email, password, role } = req.valid.body;
  const passwordHash = await bcrypt.hash(password, config.bcryptCost);
  try {
    const { rows } = await db.query(
      'insert into users (name, email, password_hash, role) values ($1, $2, $3, $4) returning id, name, email, role',
      [name, email, passwordHash, role]
    );
    res.status(201).json({ user: publicUser(rows[0]), token: signToken(rows[0]) });
  } catch (err) {
    if (err.code === '23505') throw new HttpError(409, 'An account with that email already exists');
    throw err;
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, validate(schemas.login), async (req, res) => {
  const { email, password } = req.valid.body;
  const { rows } = await db.query('select id, name, email, role, password_hash from users where email = $1', [email]);
  const user = rows[0];
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  // Same message for "no such email" and "wrong password" so attackers cannot probe which emails exist.
  if (!user || !ok) throw new HttpError(401, 'Invalid email or password');
  res.json({ user: publicUser(user), token: signToken(user) });
});

// GET /api/auth/me - who am I? (used by the React app on page load)
router.get('/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
