const { verifyToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or token invalid, please log in again' });
  }
}

// Used on routes that behave differently for logged in vs anonymous users
// (e.g. creating a link anonymously vs attaching it to an account) without
// blocking the request if there's no token at all.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next();

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email };
  } catch (err) {
    // invalid token on an optional route just means "treat as anonymous"
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
