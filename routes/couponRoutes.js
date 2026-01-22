const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyAdmin, verifyToken } = require('../middleware/auth');

router.get('/', verifyAdmin, couponController.getCoupons);
router.get('/public', couponController.getPublicCoupons);
router.post('/', verifyAdmin, couponController.addCoupon);
router.post('/validate', couponController.validateCoupon);
router.delete('/:id', verifyAdmin, couponController.deleteCoupon);

module.exports = router;
