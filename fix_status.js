const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function updateStatusEnum() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Updating orders status enum...');
        await connection.query("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'shipped', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending'");
        console.log('Orders status enum updated successfully!');
    } catch (error) {
        console.error('Error updating status enum:', error);
    } finally {
        await connection.end();
    }
}

updateStatusEnum();
