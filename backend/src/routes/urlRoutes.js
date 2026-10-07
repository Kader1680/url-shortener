const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { shorten, listMine, getStats, remove, toggle } = require('../controllers/urlController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', optionalAuth, asyncHandler(shorten));
router.get('/', requireAuth, asyncHandler(listMine));
router.get('/:id/stats', requireAuth, asyncHandler(getStats));
router.patch('/:id', requireAuth, asyncHandler(toggle));
router.delete('/:id', requireAuth, asyncHandler(remove));

module.exports = router;
