const db = require('../config/db');

// Get all websites (Public - No sensitive data)
exports.getAllWebsites = async (req, res) => {
    try {
        const query = 'SELECT id, name, url, logo_url, contact_email, contact_address, phone, favicon_url, created_at FROM websites ORDER BY created_at ASC';
        const [websites] = await db.query(query);
        res.json(websites);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single website details (Public - No sensitive data)
exports.getWebsiteById = async (req, res) => {
    try {
        const query = 'SELECT id, name, url, logo_url, contact_email, contact_address, phone, favicon_url FROM websites WHERE id = ?';
        const [website] = await db.query(query, [req.params.id]);
        if (website.length === 0) return res.status(404).json({ message: 'Website not found' });
        res.json(website[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single website details for Admin (Includes SMTP)
exports.getAdminWebsiteById = async (req, res) => {
    try {
        const [website] = await db.query('SELECT * FROM websites WHERE id = ?', [req.params.id]);
        if (website.length === 0) return res.status(404).json({ message: 'Website not found' });
        res.json(website[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create initial website
exports.createWebsite = async (req, res) => {
    const { 
        name, url, logo_url, contact_email, contact_address, phone, 
        smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, from_email, favicon_url 
    } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO websites 
            (name, url, logo_url, contact_email, contact_address, phone, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, from_email, favicon_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, url, logo_url, contact_email, contact_address, phone, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure ? 1 : 0, from_email, favicon_url]
        );
        res.status(201).json({ id: result.insertId, name, url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update branding & SMTP details
exports.updateBranding = async (req, res) => {
    const { id } = req.params;
    const { 
        name, url, logo_url, contact_email, contact_address, phone, 
        smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, from_email, favicon_url 
    } = req.body;
    
    try {
        const query = `
            UPDATE websites SET 
            name = ?, 
            url = ?, 
            logo_url = ?, 
            contact_email = ?, 
            contact_address = ?, 
            phone = ?, 
            smtp_host = ?, 
            smtp_port = ?, 
            smtp_user = ?, 
            smtp_pass = ?, 
            smtp_secure = ?, 
            from_email = ?, 
            favicon_url = ? 
            WHERE id = ?`;

        await db.query(query, [
            name, url, logo_url, contact_email, contact_address, phone, 
            smtp_host, smtp_port, smtp_user, smtp_pass, 
            smtp_secure ? 1 : 0, 
            from_email, favicon_url, id
        ]);
        
        res.json({ message: 'Website branding and settings updated successfully' });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Delete website
exports.deleteWebsite = async (req, res) => {
    try {
        await db.query('DELETE FROM websites WHERE id = ?', [req.params.id]);
        res.json({ message: 'Website deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};