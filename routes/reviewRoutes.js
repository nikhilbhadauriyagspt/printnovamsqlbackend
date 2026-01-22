const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');

router.get('/product/:productId', reviewController.getReviewsByProduct);
router.post('/', verifyToken, reviewController.addReview);
router.delete('/:id', verifyToken, reviewController.deleteReview);

module.exports = router;
