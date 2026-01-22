const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', policyController.getPolicies);
router.post('/', verifyAdmin, policyController.updatePolicy);

module.exports = router;
