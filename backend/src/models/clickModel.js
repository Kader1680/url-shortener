const { query } = require('../config/db');

async function recordClick({ urlId, ipAddress, userAgent, browser, os, referrer }) {
  await query(
    `INSERT INTO clicks (url_id, ip_address, user_agent, browser, os, referrer)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [urlId, ipAddress, userAgent, browser, os, referrer]
  );
}

async function getClicksForUrl(urlId, { limit = 50 } = {}) {
  const result = await query(
    `SELECT ip_address, browser, os, referrer, clicked_at
     FROM clicks
     WHERE url_id = $1
     ORDER BY clicked_at DESC
     LIMIT $2`,
    [urlId, limit]
  );
  return result.rows;
}

async function getDailyClickStats(urlId, days = 14) {
  const result = await query(
    `SELECT date_trunc('day', clicked_at) AS day, COUNT(*) AS clicks
     FROM clicks
     WHERE url_id = $1 AND clicked_at >= now() - ($2 || ' days')::interval
     GROUP BY day
     ORDER BY day ASC`,
    [urlId, days]
  );
  return result.rows;
}

async function getBrowserBreakdown(urlId) {
  const result = await query(
    `SELECT browser, COUNT(*) AS count
     FROM clicks
     WHERE url_id = $1
     GROUP BY browser
     ORDER BY count DESC`,
    [urlId]
  );
  return result.rows;
}

module.exports = {
  recordClick,
  getClicksForUrl,
  getDailyClickStats,
  getBrowserBreakdown,
};
