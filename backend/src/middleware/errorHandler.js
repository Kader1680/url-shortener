function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} does not exist` });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'That resource already exists' });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Something went wrong on our end',
  });
}

module.exports = { notFound, errorHandler };
