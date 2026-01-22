const db = require('../config/db');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../utils/emailService');

// Place Order (Supports Guest & Registered)
exports.placeOrder = async (req, res) => {
    const { 
        total_amount, shipping_address, items, website_id, 
        guest_name, guest_email, guest_phone, payment_method 
    } = req.body;
    
    const user_id = req.user ? req.user.id : null;
    const final_website_id = website_id || 1;

    try {
        const [result] = await db.query(
            `INSERT INTO orders 
            (user_id, website_id, guest_name, guest_email, guest_phone, total_amount, shipping_address, payment_method, payment_status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, final_website_id, guest_name || null, guest_email || null, guest_phone, total_amount, shipping_address, payment_method || 'COD', payment_method === 'PayPal' ? 'completed' : 'pending']
        );
        const order_id = result.insertId;

        for (let item of items) {
            await db.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [order_id, item.product_id, item.quantity, item.price]
            );

            // Deduct Stock
            await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
            // Log Stock change
            await db.query('INSERT INTO stock_history (product_id, change_amount, reason) VALUES (?, ?, ?)', [item.product_id, -item.quantity, `Order #${order_id}`]);
        }

        if (user_id) {
            await db.query('DELETE FROM cart WHERE user_id = ?', [user_id]);
        }

        // Send Email
        const customer_email = guest_email || (await db.query('SELECT email FROM users WHERE id = ?', [user_id]))[0][0]?.email;
        if (customer_email) {
            sendOrderConfirmation(customer_email, { id: order_id, total_amount, status: 'pending' });
        }

        res.status(201).json({ message: 'Order placed successfully', order_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Admin Orders
exports.getAllOrders = async (req, res) => {
    const { website_id } = req.query;
    let query = `
        SELECT o.*, u.name as user_name, u.email as user_email, w.name as website_name 
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        LEFT JOIN websites w ON o.website_id = w.id`;
    
    const params = [];
    if (website_id && website_id !== '') {
        query += ' WHERE o.website_id = ?';
        params.push(website_id);
    }
    query += ' ORDER BY o.created_at DESC';

    try {
        const [orders] = await db.query(query, params);
        const mappedOrders = orders.map(o => ({
            ...o,
            display_name: o.user_id ? o.user_name : (o.guest_name ? `${o.guest_name} (Guest)` : 'Guest'),
            display_email: o.user_id ? o.user_email : o.guest_email
        }));
        res.json(mappedOrders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Single Order Details (Fixed for Registered Users)
exports.getOrderById = async (req, res) => {
    try {
        const [order] = await db.query(`
            SELECT o.*, u.name as reg_name, u.email as reg_email 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            WHERE o.id = ?`, [req.params.id]);

        if (order.length === 0) return res.status(404).json({ message: 'Order not found' });
        
        const mainOrder = order[0];
        // Combine names
        mainOrder.customer_name = mainOrder.user_id ? mainOrder.reg_name : mainOrder.guest_name;
        mainOrder.customer_email = mainOrder.user_id ? mainOrder.reg_email : mainOrder.guest_email;

        const [items] = await db.query(`
            SELECT oi.*, p.name as product_name, p.image_url 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = ?`, [req.params.id]);
            
        res.json({ ...mainOrder, items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Logged-in User Orders
exports.getUserOrders = async (req, res) => {
    const user_id = req.user.id;
    try {
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [user_id]
        );
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Track Order
exports.trackOrder = async (req, res) => {
    let { order_id, email } = req.body;
    
    // Extract numeric ID if user provided something like "#ORD-10" or "ORD-10"
    if (typeof order_id === 'string') {
        const numericMatch = order_id.match(/\d+/);
        if (numericMatch) {
            order_id = numericMatch[0];
        }
    }

    try {
        const [order] = await db.query(`
            SELECT o.*, u.name as reg_name, u.email as reg_email 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            WHERE o.id = ? AND (o.guest_email = ? OR u.email = ?)`,
            [order_id, email, email]
        );

        if (order.length === 0) return res.status(404).json({ message: 'Order not found' });

        const mainOrder = order[0];
        mainOrder.customer_name = mainOrder.user_id ? mainOrder.reg_name : mainOrder.guest_name;
        mainOrder.customer_email = mainOrder.user_id ? mainOrder.reg_email : mainOrder.guest_email;

        const [items] = await db.query(`
            SELECT oi.*, p.name as product_name, p.image_url 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = ?`, [order_id]);

        res.json({ ...mainOrder, items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Status
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

        // Get customer email for notification
        const [order] = await db.query(`
            SELECT o.*, u.email as reg_email 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            WHERE o.id = ?`, [id]);
        
        if (order.length > 0) {
            const customer_email = order[0].user_id ? order[0].reg_email : order[0].guest_email;
            if (customer_email) {
                sendOrderStatusUpdate(customer_email, id, status);
            }

            // If cancelled, restore stock
            if (status === 'cancelled') {
                const [items] = await db.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
                for (let item of items) {
                    await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
                    await db.query('INSERT INTO stock_history (product_id, change_amount, reason) VALUES (?, ?, ?)', [item.product_id, item.quantity, `Order #${id} Cancelled`]);
                }
            }
        }

        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
