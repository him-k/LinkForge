const express = require('express');
const router = express.Router();
const { shortenUrl } = require('../controllers/url.controller');

// POST /api/shorten - Create short URL
router.post('/shorten', shortenUrl);

module.exports = router;