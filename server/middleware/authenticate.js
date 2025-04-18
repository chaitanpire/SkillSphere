const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = async (req, res, next) => {
    try {
        // 1. Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Find user in database
        const user = await pool.query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [decoded.id]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        // 4. Attach user to request
        req.user = user.rows[0];
        next();
    } catch (err) {
        console.error('Authentication error:', err);
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Session expired, please login again' });
        }
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.status(500).json({ error: 'Authentication failed' });
    }
};