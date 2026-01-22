const express = require('express');
const router = express.Router();
const { placeOrder, getAllOrders, getOrderById, updateOrderStatus, trackOrder, getUserOrders } = require('../controllers/orderController');
const { verifyAdmin, optionalAuth, verifyToken } = require('../middleware/auth');

// Public route (optional auth for guest checkout)
router.post('/', optionalAuth, placeOrder);
router.post('/track', trackOrder);
router.get('/user', verifyToken, getUserOrders); // New route for user history

// Success page fetch route (Public)
router.get('/public/:id', getOrderById);

// Admin routes (Protected by verifyAdmin)
router.get('/admin', verifyAdmin, getAllOrders);
router.get('/admin/:id', verifyAdmin, getOrderById);
router.put('/admin/:id/status', verifyAdmin, updateOrderStatus);

module.exports = router;
