const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

// Apply authentication to all message routes
router.use(authenticate);

// GET user + profile by ID
// In your GET /:id route
// Ensure your API always returns a profile object

router.get('/skills', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.id, s.name
            FROM skills s`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching skills:', err);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});


router.get('/:id', async (req, res) => {

    try {
        const userResult = await pool.query(
            'SELECT id, name, email, role FROM users WHERE id = $1',
            [req.params.id]
        );

        if (userResult.rows.length === 0) {
            console.log('User not found'); // Debug log
            return res.status(404).json({ error: 'User not found' });
        }

        const profileResult = await pool.query(
            'SELECT bio, location,experience, rating FROM profiles WHERE user_id = $1',
            [req.params.id]
        );


        const response = {
            ...userResult.rows[0],
            profile: profileResult.rows[0] || {
                bio: null,
                location: null,
                experience: null,
                rating: null
            }
        };

        res.json(response);

    } catch (err) {
        console.error('Error in user route:', err);
        res.status(500).json({ error: 'Failed to load profile' });
    }
});

// Helper function
function createEmptyProfile() {
    return {
        bio: null,
        location: null,
        experience: null,
        rating: null,
        profile_picture: null
    };
}

// Ensure userId is parsed to an integer properly before the query
router.get('/:id/skills', async (req, res) => {
    const userId = parseInt(req.params.id);  // Ensure it's an integer
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        // Check if the userId is being passed correctly in the query
        console.log(`Fetching skills for user with ID: ${userId}`); // Debugging log

        // Fetch user skills
        const result = await pool.query(
            `SELECT s.id, s.name
             FROM user_skills us
             JOIN skills s ON us.skill_id = s.id
             WHERE us.user_id = $1`,
            [userId]  // Pass the integer userId as the parameter
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user skills:', err);
        res.status(500).json({ error: 'Failed to fetch user skills' });
    }
});


router.put('/:id/profile', async (req, res) => {
    const userId = parseInt(req.params.id);
    const { bio, location, experience } = req.body;

    // Validate input
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Basic validation - adjust as needed

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
            experience: experience !== undefined ? parseInt(experience) : (currentProfile.rows[0]?.experience || null),
            updated_at: new Date() // Always update the timestamp
        };

        if (currentProfile.rows.length > 0) {
            // Update existing profile
            const result = await pool.query(
                `UPDATE profiles 
                 SET bio = $1, location = $2, 
                     experience = $3, updated_at = $4
                 WHERE user_id = $5 
                 RETURNING *`,
                [
                    updateData.bio,
                    updateData.location,
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
                 (user_id, bio, location, experience, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $5)
                 RETURNING *`,
                [
                    userId,
                    updateData.bio,
                    updateData.location,
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
