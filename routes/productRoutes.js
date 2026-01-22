const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getProductBySlug, addProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

// Admin only routes
router.post('/', verifyAdmin, addProduct);
router.put('/:id', verifyAdmin, updateProduct);
router.delete('/:id', verifyAdmin, deleteProduct);

module.exports = router;
