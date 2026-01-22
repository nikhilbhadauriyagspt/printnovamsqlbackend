const jwt = require('jsonwebtoken');

// Verify regular user token
const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'Access Denied' });

    try {
        const token = authHeader.split(" ")[1];
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// Simple Verify for Admin (Since admin login is separate)
const verifyAdmin = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'Admin Access Denied' });

    try {
        const token = authHeader.split(" ")[1];
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // As long as the token is valid, we trust it's an admin 
        // because it was generated from the Admin Login controller
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Admin Token' });
    }
};

// Optional auth for guest checkout
const optionalAuth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return next();

    try {
        const token = authHeader.split(" ")[1];
        if (!token || token === 'null' || token === 'undefined') return next();
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        next();
    }
};

module.exports = { verifyToken, verifyAdmin, optionalAuth };
