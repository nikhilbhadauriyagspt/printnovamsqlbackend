const db = require('./config/db');

const migrate = async () => {
    try {
        console.log('Starting migration...');

        // Reviews Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                user_id INT NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Reviews table created/verified.');

        // Wishlist Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS wishlist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                UNIQUE KEY (user_id, product_id)
            )
        `);
        console.log('Wishlist table created/verified.');

        // Coupons Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS coupons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                discount_type ENUM('percentage', 'fixed') NOT NULL,
                discount_value DECIMAL(10, 2) NOT NULL,
                min_purchase DECIMAL(10, 2) DEFAULT 0.00,
                expiry_date DATE,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Coupons table created/verified.');

        // Stock History Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS stock_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                change_amount INT NOT NULL,
                reason VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('Stock history table created/verified.');

        // SEO Content table for static pages
        await db.query(`
            CREATE TABLE IF NOT EXISTS seo_content (
                id INT AUTO_INCREMENT PRIMARY KEY,
                page_name VARCHAR(50) UNIQUE NOT NULL,
                meta_title VARCHAR(255),
                meta_description TEXT,
                meta_keywords TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('seo_content table created/verified.');

        // Insert default pages with content
        const defaultSEO = [
            { name: 'home', title: 'Best Printer Store | High Quality Printers & Ink', desc: 'Shop the best printers, ink cartridges, and 3D printing supplies at unbeatable prices.', keywords: 'printers, ink, 3d printing' },
            { name: 'shop', title: 'Shop All Printers & Accessories', desc: 'Explore our wide range of printers. Genuine accessories and ink available.', keywords: 'buy printers, online printer store' },
            { name: 'about', title: 'About Us | Our Story & Mission', desc: 'Learn more about our journey to provide the best printing solutions.', keywords: 'about printer store, mission' },
            { name: 'contact', title: 'Contact Us | Customer Support', desc: 'Our support team is here to help you with orders and technical issues.', keywords: 'contact support, printer help' },
            { name: 'faq', title: 'FAQ | Common Questions', desc: 'Find answers to frequently asked questions about shipping and returns.', keywords: 'printer faq, help center' },
            { name: 'track_order', title: 'Track Your Order', desc: 'Track your order status in real-time.', keywords: 'track order, shipping status' },
            { name: 'wishlist', title: 'My Wishlist | Saved Items', desc: 'View the items you\'ve saved for later.', keywords: 'saved items, shopping list' },
            { name: 'cart', title: 'Shopping Cart | Review Order', desc: 'Review the items in your cart.', keywords: 'shopping cart, checkout' }
        ];

        for (const page of defaultSEO) {
            try {
                await db.query(`
                    INSERT INTO seo_content (page_name, meta_title, meta_description, meta_keywords) 
                    VALUES (?, ?, ?, ?) 
                    ON DUPLICATE KEY UPDATE 
                    meta_title = VALUES(meta_title), 
                    meta_description = VALUES(meta_description), 
                    meta_keywords = VALUES(meta_keywords)`, 
                    [page.name, page.title, page.desc, page.keywords]
                );
            } catch (err) {}
        }
        console.log('SEO content populated.');

        // Category SEO
        const categorySEO = [
            { name: 'Laser', title: 'High-Performance Laser Printers', desc: 'Shop top-rated laser printers for crisp text.' },
            { name: 'Inkjet', title: 'Vibrant Inkjet Printers', desc: 'Get stunning photo quality with inkjet printers.' }
        ];

        for (const cat of categorySEO) {
            try {
                await db.query(`UPDATE categories SET meta_title = ?, meta_description = ? WHERE name LIKE ?`, [cat.title, cat.desc, `%${cat.name}%`]);
            } catch (err) {}
        }

        // Product mass update
        try {
            await db.query(`UPDATE products SET meta_title = CONCAT(name, " | Buy Online"), meta_description = CONCAT("Get the best deals on ", name) WHERE meta_title IS NULL OR meta_title = ""`);
        } catch (err) {}

        // Deal of the Day
        const dealSettings = [
            { key: 'deal_product_id', value: '1', desc: 'Product ID for Deal of the Day' },
            { key: 'deal_expiry', value: new Date(Date.now() + 86400000).toISOString(), desc: 'Expiry time for Deal of the Day' }
        ];

        for (const s of dealSettings) {
            try {
                await db.query('INSERT IGNORE INTO settings (key_name, value, description) VALUES (?, ?, ?)', [s.key, s.value, s.desc]);
            } catch (err) {}
        }
        console.log('Deal settings initialized.');

        // Blogs Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS blogs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE,
                description TEXT,
                content LONGTEXT,
                image_url VARCHAR(255),
                author VARCHAR(100) DEFAULT 'Admin',
                meta_title VARCHAR(255),
                meta_description TEXT,
                meta_keywords TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Blogs table created/verified.');

        // Insert dummy blogs
        const dummyBlogs = [
            { 
                title: 'Top 5 All-in-One Printers for Small Offices in 2026', 
                desc: 'Finding the perfect balance between speed, cost, and functionality for your startup.',
                content: '<h1>Choosing the Right Office Printer</h1><p>In 2026, the office landscape has changed, but the need for high-quality physical documents remains. We reviewed over 50 models to bring you the top 5 printers that handle scanning, copying, and high-volume printing without breaking the bank.</p><h3>1. Epson EcoTank Pro</h3><p>Leading the pack with its cartridge-free system...</p>',
                image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&q=80&w=800'
            },
            { 
                title: 'How to Extend the Life of Your Ink Cartridges', 
                desc: 'Stop wasting money! Learn these 5 simple tricks to make your ink last 2x longer.',
                content: '<h1>Save Money on Ink</h1><p>Ink can be more expensive than vintage wine. To help you save, we have compiled a list of maintenance routines. From choosing the right font to keeping your printer heads clean, these tips are essential for every home user.</p>',
                image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=800'
            },
            { 
                title: 'The Future of 3D Printing in Home Decor', 
                desc: 'From custom vases to furniture parts, see how 3D printing is revolutionizing interior design.',
                content: '<h1>3D Printing at Home</h1><p>3D printing is no longer just for engineers. Creative homeowners are using precision printers to create bespoke decor items that were previously impossible to manufacture at home.</p>',
                image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800'
            },
            { 
                title: 'Troubleshooting Common Laser Printer Issues', 
                desc: 'Paper jams? Streaky lines? Here is a quick guide to fixing the most annoying printer problems.',
                content: '<h1>Laser Printer Repair Guide</h1><p>Most laser printer issues can be fixed without a technician. This guide covers how to clear deep paper jams, clean the fuser unit, and reset toner chips for emergency printing.</p>',
                image: 'https://images.unsplash.com/photo-1563163447-109126677373?auto=format&fit=crop&q=80&w=800'
            }
        ];
        for (const b of dummyBlogs) {
            try {
                await db.query(`
                    INSERT INTO blogs (title, description, content, image_url, slug, meta_title) 
                    VALUES (?, ?, ?, ?, ?, ?) 
                    ON DUPLICATE KEY UPDATE content = VALUES(content)`, 
                    [b.title, b.desc, b.content, b.image, b.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''), b.title]
                );
            } catch (err) {}
        }

        // Deal settings initialized.
        const printerFaqs = [
            { q: 'What is the average delivery time?', a: 'Orders within the city are delivered in 24 hours. Nationwide shipping typically takes 3-5 business days.' },
            { q: 'Do you provide installation services?', a: 'Yes! We offer free remote installation for all printers. On-site installation is available for corporate orders.' },
            { q: 'Are your ink cartridges genuine?', a: 'We only sell 100% genuine and original equipment manufacturer (OEM) cartridges with brand warranty.' },
            { q: 'What is your return policy?', a: 'Items can be returned within 7 days of delivery if they are in original packaging and unused condition.' },
            { q: 'Do printers come with a warranty?', a: 'All our printers come with a standard 1-year manufacturer warranty unless specified otherwise.' },
            { q: 'Which is better for home use: Laser or Inkjet?', a: 'Inkjet is best for high-quality photos, while Laser is more cost-effective for document printing.' },
            { q: 'How can I track my order?', a: 'You can use the "Track Order" link in the top bar. Just enter your Order ID and Email address.' },
            { q: 'Do you offer bulk discounts for offices?', a: 'Yes, we have special pricing for orders of 5 or more units. Contact our sales team for a quote.' },
            { q: 'What payment methods do you accept?', a: 'We accept all major Credit/Debit cards, Net Banking, UPI, and Cash on Delivery (COD).' },
            { q: 'Can I use third-party ink in my printer?', a: 'While possible, we recommend genuine ink to maintain print quality and avoid voiding your warranty.' },
            { q: 'What should I do if my paper is jamming?', a: 'Check our "Troubleshooting" article in Tech Insights or call our support line for step-by-step help.' },
            { q: 'Do you sell 3D printing filaments?', a: 'Yes, we stock high-quality PLA, ABS, and PETG filaments in various colors for 3D enthusiasts.' }
        ];

        for (const faq of printerFaqs) {
            try {
                await db.query(`
                    INSERT INTO faqs (website_id, question, answer, meta_title) 
                    VALUES (1, ?, ?, ?) 
                    ON DUPLICATE KEY UPDATE answer = VALUES(answer)`, 
                    [faq.q, faq.a, faq.q]
                );
            } catch (err) {}
        }
        console.log('12 FAQs added.');

        // Deal settings initialized.
        const themeSettings = [
            { key: 'primary_color', value: '#0d9488', desc: 'Primary brand color (Hex)' },
            { key: 'primary_font', value: 'font-sans', desc: 'Primary website font family' }
        ];

        for (const s of themeSettings) {
            try {
                await db.query('INSERT IGNORE INTO settings (key_name, value, description) VALUES (?, ?, ?)', [s.key, s.value, s.desc]);
            } catch (err) {}
        }
        // Theme settings initialized.
        const paypalAdvancedSettings = [
            { key: 'paypal_mode', value: 'sandbox', desc: 'PayPal Environment (sandbox/live)' },
            { key: 'paypal_sandbox_client_id', value: '', desc: 'PayPal Sandbox Client ID' },
            { key: 'paypal_sandbox_secret', value: '', desc: 'PayPal Sandbox Secret' },
            { key: 'paypal_live_client_id', value: '', desc: 'PayPal Live Client ID' },
            { key: 'paypal_live_secret', value: '', desc: 'PayPal Live Secret' }
        ];

        for (const s of paypalAdvancedSettings) {
            try {
                await db.query('INSERT IGNORE INTO settings (key_name, value, description) VALUES (?, ?, ?)', [s.key, s.value, s.desc]);
            } catch (err) {}
        }
        console.log('Advanced PayPal settings initialized.');

        try {
            await db.query('ALTER TABLE websites ADD COLUMN phone VARCHAR(20)');
            console.log('Phone column added to websites.');
        } catch (err) {}

        // Add reset token and google columns
        try {
            await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255), ADD COLUMN IF NOT EXISTS reset_token_expiry DATETIME, ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE, ADD COLUMN IF NOT EXISTS website_id INT DEFAULT 1');
            console.log('User table columns updated.');
        } catch (err) {
            console.log('Error updating users table:', err.message);
        }

        try {
            await db.query(`ALTER TABLE websites 
                ADD COLUMN smtp_host VARCHAR(255), 
                ADD COLUMN smtp_port INT, 
                ADD COLUMN smtp_user VARCHAR(255), 
                ADD COLUMN smtp_pass VARCHAR(255), 
                ADD COLUMN smtp_secure BOOLEAN DEFAULT 1,
                ADD COLUMN from_email VARCHAR(255),
                ADD COLUMN favicon_url VARCHAR(255)`);
            console.log('SMTP and Favicon columns added to websites.');
        } catch (err) {}

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();