const { query } = require('../config/db');

async function createUrl({ userId, shortCode, originalUrl, title, expiresAt }) {
  const result = await query(
    `INSERT INTO urls (user_id, short_code, original_url, title, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId || null, shortCode, originalUrl, title || null, expiresAt || null]
  );
  return result.rows[0];
}

async function findByShortCode(shortCode) {
  const result = await query('SELECT * FROM urls WHERE short_code = $1', [shortCode]);
  return result.rows[0];
}

async function findByIdForUser(id, userId) {
  const result = await query(
    'SELECT * FROM urls WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0];
}

async function listByUser(userId, { limit = 20, offset = 0 } = {}) {
  const result = await query(
    `SELECT * FROM urls
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

async function countByUser(userId) {
  const result = await query('SELECT COUNT(*) FROM urls WHERE user_id = $1', [userId]);
  return Number(result.rows[0].count);
}

async function incrementClickCount(urlId) {
  await query('UPDATE urls SET click_count = click_count + 1 WHERE id = $1', [urlId]);
}

async function deleteUrl(id, userId) {
  const result = await query(
    'DELETE FROM urls WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rowCount > 0;
}

async function toggleActive(id, userId, isActive) {
  const result = await query(
    'UPDATE urls SET is_active = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [isActive, id, userId]
  );
  return result.rows[0];
}

module.exports = {
  createUrl,
  findByShortCode,
  findByIdForUser,
  listByUser,
  countByUser,
  incrementClickCount,
  deleteUrl,
  toggleActive,
};
