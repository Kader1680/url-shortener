const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const { redirect } = require('./controllers/urlController');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const asyncHandler = require('./utils/asyncHandler');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use('/api/auth', authRoutes);
app.use('/api/urls', apiLimiter, urlRoutes);

// the redirect route lives at the root so short links stay short,
// e.g. shortly.app/abc123 instead of shortly.app/r/abc123
app.get('/:code', asyncHandler(redirect));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
