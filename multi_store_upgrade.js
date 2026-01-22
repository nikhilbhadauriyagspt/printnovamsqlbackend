const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function upgrade() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Upgrading database for Multi-Store support...');
        
        // 1. Add website_id to categories
        await connection.query('ALTER TABLE categories ADD COLUMN website_id INT DEFAULT 1');
        console.log('Added website_id to categories.');

        // 2. Add website_id to products
        await connection.query('ALTER TABLE products ADD COLUMN website_id INT DEFAULT 1');
        console.log('Added website_id to products.');

        // 3. Add website_id to reviews (optional but good)
        // await connection.query('ALTER TABLE reviews ADD COLUMN website_id INT DEFAULT 1');

        console.log('Database upgrade completed successfully!');
    } catch (error) {
        console.error('Upgrade Error:', error.message);
    } finally {
        await connection.end();
    }
}

upgrade();
