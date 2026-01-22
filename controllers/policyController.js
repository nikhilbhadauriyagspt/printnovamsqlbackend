const db = require('../config/db');

// Get all policies for a website
exports.getPolicies = async (req, res) => {
    const { website_id } = req.query;
    if (!website_id) return res.status(400).json({ message: 'Website ID is required' });

    try {
        const [policies] = await db.query('SELECT type, content, meta_title, meta_description, meta_keywords FROM policies WHERE website_id = ?', [website_id]);
        // Convert to object { privacy: { content: '...', meta_title: '...' }, terms: { ... } }
        const policyObj = {};
        policies.forEach(p => {
            policyObj[p.type] = {
                content: p.content,
                meta_title: p.meta_title,
                meta_description: p.meta_description,
                meta_keywords: p.meta_keywords
            };
        });
        res.json(policyObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update or Create a policy
exports.updatePolicy = async (req, res) => {
    const { website_id, type, content, meta_title, meta_description, meta_keywords } = req.body;
    if (!website_id || !type) return res.status(400).json({ message: 'Website ID and Type are required' });

    try {
        await db.query(
            'INSERT INTO policies (website_id, type, content, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content), meta_title = VALUES(meta_title), meta_description = VALUES(meta_description), meta_keywords = VALUES(meta_keywords)',
            [website_id, type, content, meta_title, meta_description, meta_keywords]
        );
        res.json({ message: 'Policy updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
