// An error that carries an HTTP status code. The error handler turns it into a JSON response.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const badRequest = (msg, details) => new HttpError(400, msg, details);
const unauthorized = (msg = 'Authentication required') => new HttpError(401, msg);
const forbidden = (msg = 'You do not have permission to do that') => new HttpError(403, msg);
const notFound = (msg = 'Not found') => new HttpError(404, msg);

// Route params arrive as strings. Reject anything that is not a positive integer.
function parseId(value, name = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw badRequest(`Invalid ${name}`);
  return n;
}

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, parseId };
