const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', categoryController.getAllCategories);

// Admin only routes
router.post('/', verifyAdmin, categoryController.createCategory);
router.put('/:id', verifyAdmin, categoryController.updateCategory);
router.delete('/:id', verifyAdmin, categoryController.deleteCategory);

module.exports = router;
