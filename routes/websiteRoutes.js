const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/websiteController');
const { verifyAdmin } = require('../middleware/auth');

console.log('Website routes loaded');

// Public routes (No verifyAdmin here)
router.get('/', websiteController.getAllWebsites);
router.get('/:id', websiteController.getWebsiteById);

// Protected routes (Admin Only)
router.get('/admin/:id', verifyAdmin, websiteController.getAdminWebsiteById);
router.post('/', verifyAdmin, websiteController.createWebsite);
router.put('/:id', verifyAdmin, websiteController.updateBranding);
router.delete('/:id', verifyAdmin, websiteController.deleteWebsite);

module.exports = router;