const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// GET user + profile by ID
router.get('/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const userResult = await pool.query(
            'SELECT id, name, email, role FROM users WHERE id = $1',
            [userId]
        );

        const profileResult = await pool.query(
            'SELECT bio, location, hourly_rate, experience, rating, profile_picture FROM profiles WHERE user_id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        res.json({
            ...userResult.rows[0],
            profile: profileResult.rows[0] || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load profile' });
    }
});

router.put('/:id/profile', async (req, res) => {
    const userId = parseInt(req.params.id);
    const { bio, location, hourly_rate, experience } = req.body;

    try {
        // Check if profile exists
        const check = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);

        if (check.rows.length > 0) {
            // Update existing profile
            const result = await pool.query(
                `UPDATE profiles SET bio = $1, location = $2, hourly_rate = $3, experience = $4
           WHERE user_id = $5 RETURNING *`,
                [bio, location, hourly_rate, experience, userId]
            );
            res.json(result.rows[0]);
        } else {
            // Create new profile
            const result = await pool.query(
                `INSERT INTO profiles (user_id, bio, location, hourly_rate, experience)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [userId, bio, location, hourly_rate, experience]
            );
            res.json(result.rows[0]);
        }
    } catch (err) {
        console.error('Error updating profile:', err.message);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});


module.exports = router;
