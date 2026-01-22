const db = require('../config/db');

// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching categories' });
    }
};

// Add category
exports.createCategory = async (req, res) => {
    const { name, image, meta_title, meta_description, meta_keywords } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    try {
        const [result] = await db.query(
            'INSERT INTO categories (name, slug, image, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?, ?, ?)',
            [name, slug, image || null, meta_title, meta_description, meta_keywords]
        );
        res.status(201).json({ id: result.insertId, name, slug, image });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating category' });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, image, meta_title, meta_description, meta_keywords } = req.body;
    
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    try {
        await db.query(
            'UPDATE categories SET name = ?, slug = ?, image = ?, meta_title = ?, meta_description = ?, meta_keywords = ? WHERE id = ?',
            [name, slug, image, meta_title, meta_description, meta_keywords, id]
        );
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating category' });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting category' });
    }
};