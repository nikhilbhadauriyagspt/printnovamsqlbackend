const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.post('/', contactController.submitQuery);
router.get('/', contactController.getQueries); // Add protect/admin middleware if needed for viewing

module.exports = router;
