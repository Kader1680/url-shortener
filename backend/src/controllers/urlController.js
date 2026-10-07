const validator = require('validator');
const useragent = require('useragent');
const urlModel = require('../models/urlModel');
const clickModel = require('../models/clickModel');
const { generateShortCode } = require('../utils/shortCode');

const RESERVED_CODES = new Set(['api', 'health', 'login', 'register', 'dashboard', 'favicon.ico']);

async function shorten(req, res) {
  const { url, customCode, title, expiresAt } = req.body;

  if (!url || !validator.isURL(url, { require_protocol: true })) {
    return res.status(400).json({
      error: 'Please provide a valid URL, including http:// or https://',
    });
  }

  let shortCode = customCode ? customCode.trim() : generateShortCode();

  if (customCode) {
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(customCode)) {
      return res.status(400).json({
        error: 'Custom codes must be 3-20 characters, letters, numbers, - or _ only',
      });
    }
    if (RESERVED_CODES.has(customCode.toLowerCase())) {
      return res.status(400).json({ error: 'That code is reserved, please choose another' });
    }
    const existing = await urlModel.findByShortCode(shortCode);
    if (existing) {
      return res.status(409).json({ error: 'That custom code is already taken' });
    }
  } else {
    // extremely unlikely with a 7 char nanoid, but worth guarding against
    let attempts = 0;
    while (await urlModel.findByShortCode(shortCode)) {
      shortCode = generateShortCode();
      attempts += 1;
      if (attempts > 5) {
        return res.status(500).json({ error: 'Could not generate a unique code, please try again' });
      }
    }
  }

  const record = await urlModel.createUrl({
    userId: req.user ? req.user.id : null,
    shortCode,
    originalUrl: url,
    title,
    expiresAt: expiresAt || null,
  });

  res.status(201).json({
    id: record.id,
    shortCode: record.short_code,
    shortUrl: `${process.env.BASE_URL}/${record.short_code}`,
    originalUrl: record.original_url,
    createdAt: record.created_at,
  });
}

async function redirect(req, res) {
  const { code } = req.params;
  const record = await urlModel.findByShortCode(code);

  if (!record || !record.is_active) {
    return res.status(404).json({ error: 'This link does not exist or has been disabled' });
  }

  if (record.expires_at && new Date(record.expires_at) < new Date()) {
    return res.status(410).json({ error: 'This link has expired' });
  }

  const agent = useragent.parse(req.headers['user-agent'] || '');

  // fire and forget - we don't want analytics logging to slow down the redirect
  clickModel
    .recordClick({
      urlId: record.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      browser: agent.family,
      os: agent.os.family,
      referrer: req.headers.referer || req.headers.referrer || null,
    })
    .catch((err) => console.error('Failed to record click', err));

  urlModel.incrementClickCount(record.id).catch((err) =>
    console.error('Failed to bump click count', err)
  );

  res.redirect(302, record.original_url);
}

async function listMine(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const [urls, total] = await Promise.all([
    urlModel.listByUser(req.user.id, { limit, offset }),
    urlModel.countByUser(req.user.id),
  ]);

  res.json({
    urls: urls.map((u) => ({
      id: u.id,
      shortCode: u.short_code,
      shortUrl: `${process.env.BASE_URL}/${u.short_code}`,
      originalUrl: u.original_url,
      title: u.title,
      isActive: u.is_active,
      clickCount: Number(u.click_count),
      createdAt: u.created_at,
      expiresAt: u.expires_at,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

async function getStats(req, res) {
  const { id } = req.params;
  const record = await urlModel.findByIdForUser(id, req.user.id);

  if (!record) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const [recentClicks, dailyStats, browsers] = await Promise.all([
    clickModel.getClicksForUrl(id, { limit: 20 }),
    clickModel.getDailyClickStats(id, 14),
    clickModel.getBrowserBreakdown(id),
  ]);

  res.json({
    url: {
      shortCode: record.short_code,
      originalUrl: record.original_url,
      totalClicks: Number(record.click_count),
      createdAt: record.created_at,
    },
    recentClicks,
    dailyStats,
    browsers,
  });
}

async function remove(req, res) {
  const { id } = req.params;
  const deleted = await urlModel.deleteUrl(id, req.user.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Link not found' });
  }
  res.status(204).send();
}

async function toggle(req, res) {
  const { id } = req.params;
  const { isActive } = req.body;
  const updated = await urlModel.toggleActive(id, req.user.id, Boolean(isActive));
  if (!updated) {
    return res.status(404).json({ error: 'Link not found' });
  }
  res.json({ id: updated.id, isActive: updated.is_active });
}

module.exports = { shorten, redirect, listMine, getStats, remove, toggle };
