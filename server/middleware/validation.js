const { z } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.params) req.params = schema.params.parse(req.params);
      if (schema.query) req.query = schema.query.parse(req.query);
      return next();
    } catch (e) {
      return res.status(400).json({ error: 'Validation error', details: e.errors || e.message });
    }
  };
}

module.exports = { validate, z };
