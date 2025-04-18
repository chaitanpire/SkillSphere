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

    // Validate input
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Basic validation - adjust as needed
    if (hourly_rate && isNaN(parseFloat(hourly_rate))) {
        return res.status(400).json({ error: 'Hourly rate must be a number' });
    }

    if (experience && isNaN(parseInt(experience))) {
        return res.status(400).json({ error: 'Experience must be a number' });
    }

    try {
        // Verify user exists
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get current profile to compare changes
        const currentProfile = await pool.query(
            'SELECT * FROM profiles WHERE user_id = $1', 
            [userId]
        );

        // Prepare update data - only include fields that are provided
        const updateData = {
            bio: bio !== undefined ? bio : (currentProfile.rows[0]?.bio || null),
            location: location !== undefined ? location : (currentProfile.rows[0]?.location || null),
            hourly_rate: hourly_rate !== undefined ? parseFloat(hourly_rate) : (currentProfile.rows[0]?.hourly_rate || null),
            experience: experience !== undefined ? parseInt(experience) : (currentProfile.rows[0]?.experience || null),
            updated_at: new Date() // Always update the timestamp
        };

        if (currentProfile.rows.length > 0) {
            // Update existing profile
            const result = await pool.query(
                `UPDATE profiles 
                 SET bio = $1, location = $2, hourly_rate = $3, 
                     experience = $4, updated_at = $5
                 WHERE user_id = $6 
                 RETURNING *`,
                [
                    updateData.bio,
                    updateData.location,
                    updateData.hourly_rate,
                    updateData.experience,
                    updateData.updated_at,
                    userId
                ]
            );
            return res.json(result.rows[0]);
        } else {
            // Create new profile
            const result = await pool.query(
                `INSERT INTO profiles 
                 (user_id, bio, location, hourly_rate, experience, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $6)
                 RETURNING *`,
                [
                    userId,
                    updateData.bio,
                    updateData.location,
                    updateData.hourly_rate,
                    updateData.experience,
                    updateData.updated_at
                ]
            );
            return res.json(result.rows[0]);
        }
    } catch (err) {
        console.error('Error updating profile:', err.message);
        return res.status(500).json({ 
            error: 'Failed to update profile',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});




module.exports = router;
