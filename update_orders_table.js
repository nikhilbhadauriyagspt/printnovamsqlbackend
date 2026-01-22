const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function updateTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Updating orders table...');
        
        // 1. Drop foreign key first if it exists (usually named orders_ibfk_1)
        // But better to just modify column if possible
        await connection.query('ALTER TABLE orders MODIFY user_id INT DEFAULT NULL');
        
        // 2. Add new columns if they don't exist
        const columns = [
            "ADD COLUMN guest_name VARCHAR(255) AFTER website_id",
            "ADD COLUMN guest_email VARCHAR(255) AFTER guest_name",
            "ADD COLUMN guest_phone VARCHAR(20) AFTER guest_email",
            "ADD COLUMN payment_method ENUM('COD', 'PayPal') DEFAULT 'COD' AFTER total_amount",
            "ADD COLUMN payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending' AFTER payment_method"
        ];

        for (let col of columns) {
            try {
                await connection.query(`ALTER TABLE orders ${col}`);
            } catch (e) {
                console.log(`Column might already exist or error: ${e.message}`);
            }
        }

        console.log('Orders table updated successfully!');
    } catch (error) {
        console.error('Error updating table:', error);
    } finally {
        await connection.end();
    }
}

updateTable();
