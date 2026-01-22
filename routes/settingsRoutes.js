const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyAdmin } = require('../middleware/auth');

// Get settings (Public needed for checkout to know client id)
router.get('/', settingsController.getSettings);
router.get('/deal', settingsController.getDealOfTheDay);

// Update settings (Admin Only)
router.post('/', verifyAdmin, settingsController.updateSettings);

module.exports = router;
