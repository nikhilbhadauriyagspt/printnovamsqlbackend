const db = require('../config/db');

// Add to Cart
exports.addToCart = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const user_id = req.user.id;
        
        // Check if item exists in cart
        const [exists] = await db.query('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [user_id, product_id]);
        
        if (exists.length > 0) {
            await db.query('UPDATE cart SET quantity = quantity + ? WHERE id = ?', [quantity, exists[0].id]);
        } else {
            await db.query('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [user_id, product_id, quantity]);
        }
        res.json({ message: 'Added to cart' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Cart Items
exports.getCart = async (req, res) => {
    try {
        const [items] = await db.query(
            'SELECT c.*, p.name, p.price, p.image_url FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?', 
            [req.user.id]
        );
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete from Cart
exports.removeFromCart = async (req, res) => {
    try {
        await db.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
