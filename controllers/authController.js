const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { sendPasswordResetEmail } = require('../utils/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
    try {
        const { name, email, password, website_id } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await db.query('INSERT INTO users (name, email, password, website_id) VALUES (?, ?, ?, ?)', 
            [name, email, hashedPassword, website_id || 1]);
            
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.googleLogin = async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: google_id, email, name } = payload;

        let [users] = await db.query('SELECT * FROM users WHERE google_id = ?', [google_id]);

        if (users.length === 0) {
            [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

            if (users.length > 0) {
                await db.query('UPDATE users SET google_id = ? WHERE id = ?', [google_id, users[0].id]);
            } else {
                const randomPassword = crypto.randomBytes(16).toString('hex');
                const hashedPassword = await bcrypt.hash(randomPassword, 10);
                await db.query('INSERT INTO users (name, email, password, google_id, website_id) VALUES (?, ?, ?, ?, ?)', 
                    [name, email, hashedPassword, google_id, 1]);
                
                [users] = await db.query('SELECT * FROM users WHERE google_id = ?', [google_id]);
            }
        }

        const user = users[0];
        const authToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ 
            token: authToken, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                website_id: user.website_id 
            } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'User with this email not found' });

        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        await db.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?', [hashedToken, expiry, users[0].id]);

        await sendPasswordResetEmail(email, token);

        res.json({ message: 'Password reset link sent to your email' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    try {
        const [users] = await db.query('SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()', [hashedToken]);
        if (users.length === 0) return res.status(400).json({ message: 'Invalid or expired token' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', [hashedPassword, users[0].id]);

        res.json({ message: 'Password reset successful. You can now login.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const validPass = await bcrypt.compare(password, users[0].password);
        if (!validPass) return res.status(401).json({ message: 'Invalid password' });
        
        const token = jwt.sign({ id: users[0].id, role: users[0].role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.json({ 
            token, 
            user: { 
                id: users[0].id, 
                name: users[0].name, 
                email: users[0].email, 
                role: users[0].role,
                website_id: users[0].website_id
            } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};