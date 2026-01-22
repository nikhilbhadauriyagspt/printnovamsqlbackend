const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/sitemap.xml', seoController.generateSitemap);
router.get('/', seoController.getSEO);
router.get('/:page', seoController.getSEOByPage);
router.put('/', verifyAdmin, seoController.updateSEO);

module.exports = router;
