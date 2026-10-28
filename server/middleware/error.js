const mongoose = require('mongoose');

exports.notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });

// Central error handler: always returns consistent JSON
exports.errorHandler = (err, req, res, _next) => {
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.values(err.errors).forEach((e) => (errors[e.path] = e.message));
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.', errors: { email: 'Email already registered.' } });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid value for ${err.path}.` });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Malformed JSON body.' });
  }
  console.error(err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong on the server.' : err.message,
  });
};

// Returns 503 while MongoDB is not connected instead of hanging or faking data
exports.requireDb = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Check that MongoDB is running and MONGODB_URI in server/.env is correct.',
    });
  }
  next();
};
