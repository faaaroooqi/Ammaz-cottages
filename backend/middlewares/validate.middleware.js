const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query
    });
    next();
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(400).json({
      message: 'Validation error',
      errors: error.errors
    });
  }
};

module.exports = validate;
