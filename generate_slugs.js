const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function generateSlugs() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Generating slugs for products...');
        const [products] = await connection.query('SELECT id, name, slug FROM products');
        
        for (let product of products) {
            const slug = product.name.toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '')
                .replace(/--+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
            
            await connection.query('UPDATE products SET slug = ? WHERE id = ?', [slug, product.id]);
            console.log(`Updated: ${product.name} -> ${slug}`);
        }

        console.log('Slugs generated successfully!');
    } catch (error) {
        console.error('Error generating slugs:', error);
    } finally {
        await connection.end();
    }
}

generateSlugs();
