const db = require('../config/db');

exports.generateSitemap = async (req, res) => {
    try {
        const domain = 'https://printnova.shop';
        
        // Fetch All Products
        const [products] = await db.query('SELECT slug, created_at FROM products WHERE status = 1');
        
        // Fetch All Blogs
        const [blogs] = await db.query('SELECT slug, created_at FROM blogs');

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Static Pages
        const staticPages = ['', '/about', '/products', '/contact', '/faq'];
        staticPages.forEach(page => {
            xml += `  <url>\n    <loc>${domain}${page}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        });

        // Product Pages
        products.forEach(p => {
            if (p.slug) {
                xml += `  <url>\n    <loc>${domain}/product/${p.slug}</loc>\n    <lastmod>${new Date(p.created_at).toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
            }
        });

        // Blog Pages
        blogs.forEach(b => {
            xml += `  <url>\n    <loc>${domain}/blog/${b.slug}</loc>\n    <lastmod>${new Date(b.created_at).toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        });

        xml += `</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        res.status(500).send('Error generating sitemap');
    }
};

exports.getSEO = async (req, res) => {
    try {
        const [content] = await db.query('SELECT * FROM seo_content');
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSEOByPage = async (req, res) => {
    const page = req.params.page;
    try {
        let content = [];

        // 1. If it's a Product (e.g., prod_14)
        if (page.startsWith('prod_')) {
            const id = page.split('_')[1];
            [content] = await db.query('SELECT meta_title, meta_description, meta_keywords FROM products WHERE id = ?', [id]);
        } 
        // 2. If it's a Category (e.g., cat_5)
        else if (page.startsWith('cat_')) {
            const id = page.split('_')[1];
            [content] = await db.query('SELECT meta_title, meta_description, meta_keywords FROM categories WHERE id = ?', [id]);
        }
        // 3. If it's a Blog (e.g., blog_2)
        else if (page.startsWith('blog_')) {
            const id = page.split('_')[1];
            [content] = await db.query('SELECT meta_title, meta_description, meta_keywords FROM blogs WHERE id = ?', [id]);
        }
        // 4. Otherwise, it's a Static Page (home, about, etc.)
        else {
            [content] = await db.query('SELECT meta_title, meta_description, meta_keywords FROM seo_content WHERE page_name = ?', [page]);
        }

        if (content.length === 0) return res.status(404).json({ message: 'SEO data not found' });
        res.json(content[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateSEO = async (req, res) => {
    const { page_name, meta_title, meta_description, meta_keywords } = req.body;
    try {
        await db.query(
            'UPDATE seo_content SET meta_title = ?, meta_description = ?, meta_keywords = ? WHERE page_name = ?',
            [meta_title, meta_description, meta_keywords, page_name]
        );
        res.json({ message: 'SEO updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};