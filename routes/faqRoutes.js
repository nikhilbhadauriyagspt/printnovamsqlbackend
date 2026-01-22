const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', faqController.getFaqs);
router.post('/', verifyAdmin, faqController.createFaq);
router.put('/:id', verifyAdmin, faqController.updateFaq);
router.delete('/:id', verifyAdmin, faqController.deleteFaq);

module.exports = router;
