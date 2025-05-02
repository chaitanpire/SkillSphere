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

// Add a skill to user

// Add a skill to user with transaction
router.post('/:id/skills', async (req, res) => {
    const userId = parseInt(req.params.id);
    const { skillId } = req.body;

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        // Begin transaction
        await pool.query('BEGIN');
        
        // Check if skill exists
        const skillCheck = await pool.query(
            'SELECT id FROM skills WHERE id = $1',
            [skillId]
        );

        if (skillCheck.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Skill not found' });
        }

        // Add skill to user
        const result = await pool.query(
            `INSERT INTO user_skills (user_id, skill_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, skill_id) DO NOTHING
             RETURNING *`,
            [userId, skillId]
        );
        
        // Commit transaction
        await pool.query('COMMIT');

        res.status(201).json(result.rows[0]);
    } catch (err) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        console.error('Error adding skill:', err);
        res.status(500).json({ error: 'Failed to add skill' });
    }
});

router.delete('/:id/skills/:skillId', async (req, res) => {
    const userId = parseInt(req.params.id);
    const skillId = parseInt(req.params.skillId);

    if (isNaN(userId) || isNaN(skillId)) {
        return res.status(400).json({ error: 'Invalid ID parameters' });
    }

    try {
        // Begin transaction
        await pool.query('BEGIN');
        
        const result = await pool.query(
            `DELETE FROM user_skills
             WHERE user_id = $1 AND skill_id = $2
             RETURNING *`,
            [userId, skillId]
        );

        if (result.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Skill not found for this user' });
        }
        
        // Commit transaction
        await pool.query('COMMIT');

        res.json({ message: 'Skill removed successfully' });
    } catch (err) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        console.error('Error removing skill:', err);
        res.status(500).json({ error: 'Failed to remove skill' });
    }
});
// Bulk update user skills
router.put('/:id/skills', async (req, res) => {
    const userId = parseInt(req.params.id);
    const { skills } = req.body; // Array of skill IDs

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!Array.isArray(skills)) {
        return res.status(400).json({ error: 'Skills must be an array' });
    }

    try {
        // Begin transaction
        await pool.query('BEGIN');

        // Delete all existing skills for user
        await pool.query(
            'DELETE FROM user_skills WHERE user_id = $1',
            [userId]
        );

        // Insert new skills if array is not empty
        if (skills.length > 0) {
            // Create a query with multiple values
            const values = skills.map((skillId, index) =>
                `($${index * 2 + 1}, $${index * 2 + 2})`
            ).join(', ');

            const query = `
          INSERT INTO user_skills (user_id, skill_id)
          VALUES ${values}
          RETURNING *
        `;

            // Flatten the array of [userId, skillId] pairs
            const params = skills.flatMap(skillId => [userId, skillId]);

            await pool.query(query, params);
        }

        // Commit transaction
        await pool.query('COMMIT');

        res.json({ message: 'Skills updated successfully' });
    } catch (err) {
        // Rollback on error
        await pool.query('ROLLBACK');
        console.error('Error updating skills:', err);
        res.status(500).json({ error: 'Failed to update skills' });
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

        const skillsResult = await pool.query(
            `SELECT s.id, s.name
             FROM user_skills us
             JOIN skills s ON us.skill_id = s.id
             WHERE us.user_id = $1`,
            [req.params.id]
        );



        const response = {
            ...userResult.rows[0],
            profile: profileResult.rows[0] || {
                bio: null,
                location: null,
                experience: null,
                rating: null
            },
            skills: skillsResult.rows // This is already an array of {id, name} objects
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
