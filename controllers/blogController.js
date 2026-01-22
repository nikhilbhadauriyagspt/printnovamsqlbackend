const db = require('../config/db');

exports.getBlogs = async (req, res) => {
    try {
        const [blogs] = await db.query('SELECT * FROM blogs ORDER BY created_at DESC');
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBlogBySlug = async (req, res) => {
    try {
        const [blog] = await db.query('SELECT * FROM blogs WHERE slug = ?', [req.params.slug]);
        if (blog.length === 0) return res.status(404).json({ message: 'Article not found' });
        res.json(blog[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addBlog = async (req, res) => {
    const { title, description, content, image_url, meta_title, meta_description, meta_keywords } = req.body;
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    try {
        await db.query(
            'INSERT INTO blogs (title, slug, description, content, image_url, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, slug, description, content, image_url, meta_title, meta_description, meta_keywords]
        );
        res.status(201).json({ message: 'Article created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateBlog = async (req, res) => {
    const { title, description, content, image_url, meta_title, meta_description, meta_keywords } = req.body;
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    try {
        await db.query(
            'UPDATE blogs SET title=?, slug=?, description=?, content=?, image_url=?, meta_title=?, meta_description=?, meta_keywords=? WHERE id=?',
            [title, slug, description, content, image_url, meta_title, meta_description, meta_keywords, req.params.id]
        );
        res.json({ message: 'Article updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteBlog = async (req, res) => {
    try {
        await db.query('DELETE FROM blogs WHERE id = ?', [req.params.id]);
        res.json({ message: 'Article deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
