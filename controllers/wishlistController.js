const db = require('../config/db');

exports.getWishlist = async (req, res) => {
    try {
        const [wishlist] = await db.query(
            'SELECT w.id, p.* FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?',
            [req.user.id]
        );
        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addToWishlist = async (req, res) => {
    const { product_id } = req.body;
    try {
        await db.query(
            'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
            [req.user.id, product_id]
        );
        res.status(201).json({ message: 'Added to wishlist' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.removeFromWishlist = async (req, res) => {
    try {
        await db.query(
            'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
            [req.user.id, req.params.productId]
        );
        res.json({ message: 'Removed from wishlist' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
