const db = require('../config/db');

// Get all coupons (Admin)
exports.getCoupons = async (req, res) => {
    try {
        const [coupons] = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get active coupons for public view
exports.getPublicCoupons = async (req, res) => {
    try {
        const [coupons] = await db.query(
            'SELECT code, discount_type, discount_value, min_purchase, expiry_date FROM coupons WHERE is_active = 1 AND (expiry_date IS NULL OR expiry_date >= CURDATE())'
        );
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add coupon (Admin)
exports.addCoupon = async (req, res) => {
    const { code, discount_type, discount_value, min_purchase, expiry_date } = req.body;
    try {
        await db.query(
            'INSERT INTO coupons (code, discount_type, discount_value, min_purchase, expiry_date) VALUES (?, ?, ?, ?, ?)',
            [code.toUpperCase(), discount_type, discount_value, min_purchase, expiry_date]
        );
        res.status(201).json({ message: 'Coupon created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Validate coupon (User)
exports.validateCoupon = async (req, res) => {
    const { code, cartTotal } = req.body;
    try {
        const [coupons] = await db.query(
            'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expiry_date IS NULL OR expiry_date >= CURDATE())',
            [code.toUpperCase()]
        );

        if (coupons.length === 0) {
            return res.status(404).json({ message: 'Invalid or expired coupon' });
        }

        const coupon = coupons[0];

        if (cartTotal < coupon.min_purchase) {
            return res.status(400).json({ message: `Minimum purchase of ₹${coupon.min_purchase} required` });
        }

        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
            discountAmount = (cartTotal * coupon.discount_value) / 100;
        } else {
            discountAmount = coupon.discount_value;
        }

        res.json({
            message: 'Coupon applied',
            discountAmount,
            code: coupon.code
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete coupon (Admin)
exports.deleteCoupon = async (req, res) => {
    try {
        await db.query('DELETE FROM coupons WHERE id = ?', [req.params.id]);
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
