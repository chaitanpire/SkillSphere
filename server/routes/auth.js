const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const router = express.Router();

// SIGNUP
router.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, role]
        );

        const r = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = r.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        // Return token and user details
        res.status(201).json({
            token,
            user
        });
    } catch (err) {
        res.status(400).json({ error: 'Email already exists or bad request.' });
    }
});

// In your auth.js routes file
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name  // Include name if needed
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// PROTECTED ROUTE
router.get('/dashboard', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token' });

    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        const result = await pool.query(
            'SELECT id, name, email, role FROM users WHERE id = $1',
            [decoded.id]
        );
        res.json({ user: result.rows[0] }); // ← make sure you're returning this!
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});


module.exports = router;
