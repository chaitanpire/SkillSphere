const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const router = express.Router();

// Middleware: Require JWT + Client role
function requireClient(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        if (decoded.role !== 'client') {
            return res.status(403).json({ error: 'Only clients can post projects' });
        }
        req.user = decoded; // attach user info
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// POST /api/projects
router.post('/', requireClient, async (req, res) => {
    const { title, description, budget, deadline } = req.body;
    const clientId = req.user.id;

    try {
        const result = await pool.query(
            `INSERT INTO projects (client_id, title, description, budget, deadline)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [clientId, title, description, budget, deadline]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inserting project:', err);
        res.status(500).json({ error: 'Failed to post project' });
    }
});

module.exports = router;
