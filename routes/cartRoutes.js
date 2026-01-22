const express = require('express');
const router = express.Router();
const { addToCart, getCart, removeFromCart } = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, addToCart);
router.get('/', verifyToken, getCart);
router.delete('/:id', verifyToken, removeFromCart);

module.exports = router;
