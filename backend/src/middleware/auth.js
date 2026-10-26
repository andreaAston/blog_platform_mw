const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { unauthorized, forbidden } = require('../errors');

function signToken(user) {
  // The token only says WHO the user is. Role is re-read from the database on every
  // request, so a demoted admin loses power immediately instead of when the token expires.
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function readBearerToken(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

async function userFromToken(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const { rows } = await db.query('select id, name, email, role from users where id = $1', [payload.sub]);
    return rows[0] || null;
  } catch {
    return null; // bad signature, expired token, malformed token
  }
}

// Route needs a logged-in user.
async function authenticate(req, res, next) {
  const token = readBearerToken(req);
  if (!token) throw unauthorized();
  const user = await userFromToken(token);
  if (!user) throw unauthorized('Invalid or expired token');
  req.user = user;
  next();
}

// Route is public, but behaves differently for a logged-in user (e.g. "likedByMe", drafts).
async function optionalAuth(req, res, next) {
  const token = readBearerToken(req);
  req.user = token ? await userFromToken(token) : null;
  next();
}

// Use AFTER authenticate: requireRole('author', 'admin')
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw forbidden(`This action requires one of: ${roles.join(', ')}`);
  next();
};

module.exports = { signToken, authenticate, optionalAuth, requireRole };
