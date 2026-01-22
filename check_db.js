const db = require('./config/db');

async function checkWebsite() {
    try {
        const [rows] = await db.query('SELECT id, name, favicon_url, logo_url FROM websites WHERE id = 1');
        console.log('Website Data:', JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkWebsite();