const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.adminLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check in 'admins' table ONLY
        const [admins] = await db.execute('SELECT * FROM admins WHERE username = ?', [username]);

        if (admins.length === 0) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        const admin = admins[0];

        // Verify Password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: admin.id, role: 'admin' }, 
            process.env.JWT_SECRET || 'secret', 
            { expiresIn: '12h' }
        );

        res.json({
            message: 'Admin login successful',
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                role: 'admin'
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to create initial admin (can be called via a route or script)
exports.createAdmin = async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO admins (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating admin' });
    }
};

// Get all users with website filtering
exports.getUsers = async (req, res) => {
    const { website_id } = req.query;
    let query = 'SELECT u.id, u.name, u.email, u.role, u.created_at, w.name as website_name FROM users u LEFT JOIN websites w ON u.website_id = w.id';
    const params = [];

    if (website_id && website_id !== '') {
        query += ' WHERE u.website_id = ?';
        params.push(website_id);
    }

    query += ' ORDER BY u.created_at DESC';

    try {
        const [users] = await db.query(query, params);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Low Stock Products
exports.getLowStockProducts = async (req, res) => {
    try {
        const [products] = await db.query(
            'SELECT * FROM products WHERE stock <= low_stock_threshold ORDER BY stock ASC'
        );
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Stock History
exports.getStockHistory = async (req, res) => {
    try {
        const [history] = await db.query(
            'SELECT sh.*, p.name as product_name FROM stock_history sh JOIN products p ON sh.product_id = p.id ORDER BY sh.created_at DESC LIMIT 100'
        );
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Dashboard Stats (Enhanced)
exports.getDashboardStats = async (req, res) => {
    const { website_id } = req.query;
    let whereClause = '';
    const params = [];

    if (website_id && website_id !== '') {
        whereClause = ' WHERE website_id = ?';
        params.push(website_id);
    }

    try {
        // 1. Total Revenue
        const [revenue] = await db.query(`SELECT SUM(total_amount) as total FROM orders ${whereClause.replace('WHERE', 'WHERE status != "cancelled" AND') || 'WHERE status != "cancelled"'}`, params);
        
        // 2. Total Orders
        const [ordersCount] = await db.query(`SELECT COUNT(*) as total FROM orders ${whereClause}`, params);
        
        // 3. New Customers
        const [customersCount] = await db.query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);

        // 4. Low Stock Count
        const [lowStockCount] = await db.query('SELECT COUNT(*) as total FROM products WHERE stock <= low_stock_threshold');

        // 5. Sales Analytics (Daily Sales for last 7 days)
        const [salesAnalytics] = await db.query(`
            SELECT DATE(created_at) as date, SUM(total_amount) as amount 
            FROM orders 
            WHERE status != 'cancelled' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        `);

        // 6. Top 5 Products
        const [topProducts] = await db.query(`
            SELECT p.name, SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 5
        `);

        // 7. Recent Orders
        let recentQuery = `
            SELECT o.*, u.name as user_name, w.name as website_name 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            LEFT JOIN websites w ON o.website_id = w.id
            ${whereClause}
            ORDER BY o.created_at DESC LIMIT 5`;
        
        const [recentOrders] = await db.query(recentQuery, params);

        res.json({
            revenue: revenue[0].total || 0,
            orders: ordersCount[0].total || 0,
            customers: customersCount[0].total || 0,
            lowStock: lowStockCount[0].total || 0,
            salesAnalytics,
            topProducts,
            recentOrders: recentOrders.map(o => ({
                ...o,
                user_name: o.user_id ? o.user_name : (o.guest_name ? `${o.guest_name} (Guest)` : 'Guest')
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
