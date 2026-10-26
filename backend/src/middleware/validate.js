const { badRequest } = require('../errors');

// validate(schema, 'body' | 'query') -> puts the cleaned, typed data on req.valid[source]
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.') || source, message: i.message }));
    throw badRequest('Validation failed', details);
  }
  req.valid = { ...req.valid, [source]: result.data };
  next();
};

module.exports = validate;
