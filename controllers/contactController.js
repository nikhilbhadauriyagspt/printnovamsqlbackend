const db = require('../config/db');

exports.submitQuery = async (req, res) => {
    const { website_id, name, email, phone, subject, message } = req.body;
    
    if (!website_id || !name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        await db.query(
            'INSERT INTO contact_queries (website_id, name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?, ?)',
            [website_id, name, email, phone || null, subject, message]
        );
        res.status(201).json({ message: 'Query submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error submitting query' });
    }
};

exports.getQueries = async (req, res) => {
    const { website_id } = req.query;
    let query = 'SELECT cq.*, w.name as website_name FROM contact_queries cq LEFT JOIN websites w ON cq.website_id = w.id';
    const params = [];

    if (website_id) {
        query += ' WHERE cq.website_id = ?';
        params.push(website_id);
    }

    query += ' ORDER BY cq.created_at DESC';

    try {
        const [queries] = await db.query(query, params);
        res.json(queries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching queries' });
    }
};