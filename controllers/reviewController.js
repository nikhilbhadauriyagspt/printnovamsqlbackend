const db = require('../config/db');

exports.getReviewsByProduct = async (req, res) => {
    try {
        const [reviews] = await db.query(
            'SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC',
            [req.params.productId]
        );
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error });
    }
};

exports.addReview = async (req, res) => {
    const { product_id, rating, comment } = req.body;
    const user_id = req.user.id;

    try {
        // Verify user exists
        const [user] = await db.query('SELECT id FROM users WHERE id = ?', [user_id]);
        if (user.length === 0) {
            return res.status(401).json({ message: 'User account no longer exists. Please re-login.' });
        }

        // Check if user already reviewed
        const [existing] = await db.query('SELECT * FROM reviews WHERE product_id = ? AND user_id = ?', [product_id, user_id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        await db.query(
            'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
            [product_id, user_id, rating, comment]
        );

        // Update product rating and review count
        const [reviews] = await db.query('SELECT rating FROM reviews WHERE product_id = ?', [product_id]);
        const count = reviews.length;
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / count;

        await db.query(
            'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
            [avgRating, count, product_id]
        );

        res.status(201).json({ message: 'Review added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding review', error });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const [review] = await db.query('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
        if (review.length === 0) return res.status(404).json({ message: 'Review not found' });

        const { product_id } = review[0];

        await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);

        // Update product rating and review count
        const [reviews] = await db.query('SELECT rating FROM reviews WHERE product_id = ?', [product_id]);
        const count = reviews.length;
        const avgRating = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

        await db.query(
            'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
            [avgRating, count, product_id]
        );

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting review', error });
    }
};
