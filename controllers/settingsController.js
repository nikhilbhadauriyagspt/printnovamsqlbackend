const db = require('../config/db');

// Get all settings
exports.getSettings = async (req, res) => {
    try {
        const [settings] = await db.query('SELECT key_name, value, description FROM settings');
        // Convert array to object for easier use: { key: value }
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.key_name] = s.value;
        });
        res.json(settingsObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update multiple settings
exports.updateSettings = async (req, res) => {
    const settings = req.body; // Expecting { key: value, ... }
    try {
        for (let key in settings) {
            await db.query('UPDATE settings SET value = ? WHERE key_name = ?', [settings[key], key]);
        }
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Deal of the Day with Product Info
exports.getDealOfTheDay = async (req, res) => {
    try {
        const [settings] = await db.query('SELECT key_name, value FROM settings WHERE key_name IN ("deal_product_id", "deal_expiry")');
        const deal = {};
        settings.forEach(s => deal[s.key_name] = s.value);

        if (!deal.deal_product_id) return res.json(null);

        const [product] = await db.query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [deal.deal_product_id]);
        
        if (product.length === 0) return res.json(null);

        res.json({
            ...product[0],
            deal_expiry: deal.deal_expiry
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
