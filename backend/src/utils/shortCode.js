const { nanoid } = require('nanoid');

// 7 chars from nanoid's default alphabet gives us well over 3 trillion
// combinations, which is more than enough headroom before collisions
// become a real concern at any realistic scale for a project like this.
function generateShortCode(length = 7) {
  return nanoid(length);
}

module.exports = { generateShortCode };
