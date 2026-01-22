const db = require('../config/db');

// Get all FAQs for a website
exports.getFaqs = async (req, res) => {
    const { website_id } = req.query;
    if (!website_id) return res.status(400).json({ message: 'Website ID is required' });

    try {
        const [faqs] = await db.query('SELECT * FROM faqs WHERE website_id = ? ORDER BY created_at DESC', [website_id]);
        res.json(faqs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create FAQ
exports.createFaq = async (req, res) => {
    const { website_id, question, answer, meta_title, meta_description, meta_keywords } = req.body;
    try {
        await db.query(
            'INSERT INTO faqs (website_id, question, answer, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?, ?, ?)', 
            [website_id, question, answer, meta_title, meta_description, meta_keywords]
        );
        res.status(201).json({ message: 'FAQ created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update FAQ
exports.updateFaq = async (req, res) => {
    const { id } = req.params;
    const { question, answer, meta_title, meta_description, meta_keywords } = req.body;
    try {
        await db.query(
            'UPDATE faqs SET question = ?, answer = ?, meta_title = ?, meta_description = ?, meta_keywords = ? WHERE id = ?', 
            [question, answer, meta_title, meta_description, meta_keywords, id]
        );
        res.json({ message: 'FAQ updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete FAQ
exports.deleteFaq = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM faqs WHERE id = ?', [id]);
        res.json({ message: 'FAQ deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
