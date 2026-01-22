const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/auth');

// Admin Login Route
router.post('/login', adminController.adminLogin);

// Get Users List
router.get('/users', verifyAdmin, adminController.getUsers);

// Get Dashboard Stats
router.get('/stats', verifyAdmin, adminController.getDashboardStats);

// Low Stock Products
router.get('/low-stock', verifyAdmin, adminController.getLowStockProducts);

// Stock History
router.get('/stock-history', verifyAdmin, adminController.getStockHistory);

// Optional: Route to create a new admin (Should be protected in production)
router.post('/create', adminController.createAdmin);

module.exports = router;
