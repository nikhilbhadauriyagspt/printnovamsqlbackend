const db = require('../config/db');

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, sort, search, status, stock } = req.query;
        let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
        const params = [];

        if (category) {
            query += ' AND (c.slug = ? OR p.category_id = ?)';
            params.push(category, category);
        }
        if (minPrice) {
            query += ' AND p.price >= ?';
            params.push(minPrice);
        }
        if (maxPrice) {
            query += ' AND p.price <= ?';
            params.push(maxPrice);
        }
        if (status !== undefined && status !== '') {
            query += ' AND p.status = ?';
            params.push(status);
        }
        if (stock === 'in-stock') {
            query += ' AND p.stock > 0';
        } else if (stock === 'out-of-stock') {
            query += ' AND p.stock <= 0';
        }
        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (sort) {
            if (sort === 'price-low') query += ' ORDER BY p.price ASC';
            else if (sort === 'price-high') query += ' ORDER BY p.price DESC';
            else if (sort === 'newest') query += ' ORDER BY p.created_at DESC';
            else if (sort === 'rating') query += ' ORDER BY p.rating DESC';
        } else {
            query += ' ORDER BY p.created_at DESC';
        }

        const [products] = await db.query(query, params);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
    try {
        const [product] = await db.query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [req.params.id]);
        if (product.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json(product[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get single product by Slug
exports.getProductBySlug = async (req, res) => {
    try {
        const [product] = await db.query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ?', [req.params.slug]);
        if (product.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json(product[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add product (Admin only)
exports.addProduct = async (req, res) => {
    try {
        const { 
            name, slug, description, price, mrp, stock, image_url, category_id, 
            is_featured, is_best_selling, status, low_stock_threshold,
            meta_title, meta_description, meta_keywords
        } = req.body;

        const finalSlug = slug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const [result] = await db.query(
            `INSERT INTO products 
            (name, slug, description, price, mrp, stock, image_url, category_id, is_featured, is_best_selling, status, low_stock_threshold, meta_title, meta_description, meta_keywords) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [name, finalSlug, description, price, mrp || 0, stock || 0, image_url, category_id, is_featured || 0, is_best_selling || 0, status || 1, low_stock_threshold || 10, meta_title, meta_description, meta_keywords]
        );

        const productId = result.insertId;
        if (stock > 0) {
            await db.query('INSERT INTO stock_history (product_id, change_amount, reason) VALUES (?, ?, ?)', [productId, stock, 'Initial Stock']);
        }

        res.status(201).json({ message: 'Product added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { 
            name, slug, description, price, mrp, stock, image_url, category_id, 
            is_featured, is_best_selling, status, low_stock_threshold,
            meta_title, meta_description, meta_keywords
        } = req.body;
        
        // Get old stock to log change
        const [oldProduct] = await db.query('SELECT stock FROM products WHERE id = ?', [req.params.id]);
        const oldStock = oldProduct[0].stock;

        await db.query(
            `UPDATE products SET 
            name=?, slug=?, description=?, price=?, mrp=?, stock=?, image_url=?, category_id=?, is_featured=?, is_best_selling=?, status=?, low_stock_threshold=?, meta_title=?, meta_description=?, meta_keywords=? 
            WHERE id=?`,
            [name, slug, description, price, mrp, stock, image_url, category_id, is_featured, is_best_selling, status, low_stock_threshold, meta_title, meta_description, meta_keywords, req.params.id]
        );

        if (stock !== oldStock) {
            await db.query('INSERT INTO stock_history (product_id, change_amount, reason) VALUES (?, ?, ?)', [req.params.id, stock - oldStock, 'Manual Update']);
        }

        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};