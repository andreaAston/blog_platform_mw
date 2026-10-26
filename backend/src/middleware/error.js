const { HttpError } = require('../errors');

const send = (res, status, message, details) =>
  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });

function notFoundHandler(req, res) {
  send(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

// Express recognises an error handler by its 4 arguments.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) return send(res, err.status, err.message, err.details);
  if (err.type === 'entity.parse.failed') return send(res, 400, 'Request body is not valid JSON');
  if (err.type === 'entity.too.large') return send(res, 413, 'Request body is too large');
  if (err.code === 'LIMIT_FILE_SIZE') return send(res, 413, 'Image is too large (max 5 MB)');
  if (err.name === 'MulterError') return send(res, 400, err.message);
  if (err.code === '23505') return send(res, 409, 'That value already exists'); // unique violation
  if (err.code === 'P0001') return send(res, 400, err.message); // RAISE EXCEPTION from our SQL triggers
  console.error(err);
  return send(res, 500, 'Something went wrong on the server');
}

module.exports = { notFoundHandler, errorHandler };
