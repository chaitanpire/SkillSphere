const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/roles');

router.use(authenticate);
requireClient = requireRole('client');
requireFreelancer = requireRole('freelancer');
// POST /api/projects/:id/proposals

// // GET /api/projects/:id/proposals - Get all proposals for a specific project with sorting
// GET /api/projects/:id/proposals - Get all proposals for a specific project with sorting
// GET /api/projects/:id/proposals - Get all proposals for a specific project with sorting
router.get('/:id/proposals', requireClient, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const sortBy = req.query.sort || 'rating'; // Default sort by rating
    
    if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }

    try {
        // Verify the project belongs to the requesting client
        const projectCheck = await pool.query(
            'SELECT * FROM projects WHERE id = $1 AND client_id = $2',
            [projectId, req.user.id]
        );
        
        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        // Fetch proposals with freelancer info and ratings
        let query = `
            SELECT 
                p.*,
                u.name AS freelancer_name,
                u.id AS freelancer_id,
                COALESCE(AVG(r.rating), 0) AS freelancer_rating,
                ARRAY_TO_STRING(ARRAY(
                    SELECT s.name 
                    FROM user_skills us
                    JOIN skills s ON us.skill_id = s.id
                    WHERE us.user_id = p.freelancer_id
                ), ', ') AS freelancer_skills
            FROM proposals p
            JOIN users u ON p.freelancer_id = u.id
            LEFT JOIN ratings r ON r.rated_id = p.freelancer_id
            WHERE p.project_id = $1
            GROUP BY p.id, u.name, u.id
        `;
        
        // Add ORDER BY clause based on sortBy parameter
        if (sortBy === 'rating') {
            query += ` ORDER BY freelancer_rating DESC`;
        } else if (sortBy === 'price') {
            query += ` ORDER BY p.proposed_amount ASC`;
        } else {
            query += ` ORDER BY p.submitted_at DESC`; // Default fallback
        }
        
        const result = await pool.query(query, [projectId]);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching proposals:', err);
        res.status(500).json({ error: 'Failed to fetch proposals' });
    }
});

router.post('/', requireClient, async (req, res) => {
    const { title, description, budget, deadline, expected_work_hours } = req.body;
    const clientId = req.user.id;
    console.log('Received project:', req.body);
    console.log('Authenticated client ID:', req.user.id);

    try {
        // Begin transaction
        await pool.query('BEGIN');
        
        const result = await pool.query(
            `INSERT INTO projects (client_id, title, description, budget, deadline, expected_work_hours)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [clientId, title, description, budget, deadline, expected_work_hours]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        console.error('Error inserting project:', err);
        res.status(500).json({ error: 'Failed to post project' });
    }
});

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT 
            projects.*, 
            users.name AS client_name,
            ARRAY_AGG(
                json_build_object('id', s.id, 'name', s.name)
            ) FILTER (WHERE s.id IS NOT NULL) AS skills
        FROM projects
        JOIN users ON projects.client_id = users.id
        LEFT JOIN project_skills ps ON projects.id = ps.project_id
        LEFT JOIN skills s ON ps.skill_id = s.id
        GROUP BY projects.id, users.name
        ORDER BY projects.created_at DESC
      `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});


router.get('/available', requireFreelancer, async (req, res) => {
    try {
        // Extract filter parameters from the query string
        const { 
            minBudget, 
            maxBudget, 
            minWorkHours, 
            maxWorkHours,
            skills 
        } = req.query;

        // Start building the query
        let query = `
            SELECT 
                projects.*,
                users.name AS client_name,
                ARRAY_AGG(
                    json_build_object('id', s.id, 'name', s.name)
                ) FILTER (WHERE s.id IS NOT NULL) AS skills
            FROM projects
            JOIN users ON projects.client_id = users.id
            LEFT JOIN project_skills ps ON projects.id = ps.project_id
            LEFT JOIN skills s ON ps.skill_id = s.id
            WHERE projects.status = 'open' 
            AND projects.id NOT IN (
                SELECT project_id FROM proposals WHERE freelancer_id = $1
            )
        `;

        // Parameters array starts with the user ID
        const params = [req.user.id];
        let paramCounter = 2; // Starting from $2

        // Add budget filters if provided
        if (minBudget) {
            query += ` AND projects.budget >= $${paramCounter}`;
            params.push(parseFloat(minBudget));
            paramCounter++;
        }
        
        if (maxBudget) {
            query += ` AND projects.budget <= $${paramCounter}`;
            params.push(parseFloat(maxBudget));
            paramCounter++;
        }

        // Add work hours filters if provided
        if (minWorkHours) {
            query += ` AND projects.expected_work_hours >= $${paramCounter}`;
            params.push(parseInt(minWorkHours));
            paramCounter++;
        }
        
        if (maxWorkHours) {
            query += ` AND projects.expected_work_hours <= $${paramCounter}`;
            params.push(parseInt(maxWorkHours));
            paramCounter++;
        }

        // Add skills filter if provided (comma-separated list of skill IDs)
        if (skills) {
            const skillIds = skills.split(',').map(id => parseInt(id.trim()));
            if (skillIds.length > 0 && !skillIds.some(isNaN)) {
                query += `
                    AND projects.id IN (
                        SELECT project_id 
                        FROM project_skills 
                        WHERE skill_id IN (${skillIds.map((_, i) => `$${paramCounter + i}`).join(',')})
                    )
                `;
                params.push(...skillIds);
                paramCounter += skillIds.length;
            }
        }

        // Add the grouping and final ordering
        query += ` GROUP BY projects.id, users.name ORDER BY projects.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching filtered projects:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});


// Update the route to handle an array of skills
router.post('/:id/skills', async (req, res) => {
    const projectId = parseInt(req.params.id);
    const { skills } = req.body; // Change from skillId to skills array

    if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Validate that skills is an array
    if (!Array.isArray(skills)) {
        return res.status(400).json({ error: 'Skills must be an array' });
    }

    try {
        // Begin transaction
        await pool.query('BEGIN');

        // First check if project exists and belongs to this client
        const projectCheck = await pool.query(
            'SELECT id FROM projects WHERE id = $1 AND client_id = $2',
            [projectId, req.user.id]
        );

        if (projectCheck.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        // If skills array is empty, just return success
        if (skills.length === 0) {
            await pool.query('COMMIT');
            return res.status(200).json({ message: 'No skills to add' });
        }

        // Insert each skill for the project
        const insertPromises = skills.map(skillId =>
            pool.query(
                `INSERT INTO project_skills (project_id, skill_id)
                 VALUES ($1, $2)
                 ON CONFLICT (project_id, skill_id) DO NOTHING`,
                [projectId, skillId]
            )
        );

        await Promise.all(insertPromises);

        // Get all skills for the project after updates
        const result = await pool.query(
            `SELECT ps.project_id, ps.skill_id, s.name as skill_name
             FROM project_skills ps
             JOIN skills s ON ps.skill_id = s.id
             WHERE ps.project_id = $1`,
            [projectId]
        );

        await pool.query('COMMIT');

        res.status(201).json({
            message: 'Skills added successfully',
            skills: result.rows
        });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error adding skills to project:', err);
        res.status(500).json({ error: 'Failed to add skills' });
    }
});

router.post('/:id/proposals', requireFreelancer, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const freelancerId = req.user.id;
    const { cover_letter, proposed_amount } = req.body;

    if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    try {
        // Begin transaction
        await pool.query('BEGIN');
        
        // Check if project exists
        const projectCheck = await pool.query(
            'SELECT * FROM projects WHERE id = $1',
            [projectId]
        );
        
        if (projectCheck.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if freelancer already submitted a proposal for this project
        const proposalCheck = await pool.query(
            'SELECT * FROM proposals WHERE project_id = $1 AND freelancer_id = $2',
            [projectId, freelancerId]
        );
        
        if (proposalCheck.rows.length > 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'You have already submitted a proposal for this project' });
        }

        // Insert proposal
        const result = await pool.query(
            `INSERT INTO proposals (project_id, freelancer_id, cover_letter, proposed_amount)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [projectId, freelancerId, cover_letter, proposed_amount]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        console.error('Error submitting proposal:', err);
        res.status(500).json({ error: 'Failed to submit proposal' });
    }
});
router.get('/client', requireClient, async (req, res) => {
    console.log('Fetching projects for client ID:', req.user.id);
    try {
        const result = await pool.query(`
            SELECT 
                p.*,
                COUNT(pr.id) as proposal_count
            FROM projects p
            LEFT JOIN proposals pr ON p.id = pr.project_id
            WHERE p.client_id = $1
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching client projects:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Add this to your GET project/:id route to include skills in the project details
router.get('/:id', async (req, res) => {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }

    try {
        // Get project details
        const projectResult = await pool.query(`
            SELECT projects.*, users.name AS client_name
            FROM projects
            JOIN users ON projects.client_id = users.id
            WHERE projects.id = $1
        `, [projectId]);

        if (projectResult.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get project skills
        const skillsResult = await pool.query(`
            SELECT s.id, s.name
            FROM project_skills ps
            JOIN skills s ON ps.skill_id = s.id
            WHERE ps.project_id = $1
        `, [projectId]);

        // Combine project with its skills
        const project = {
            ...projectResult.rows[0],
            skills: skillsResult.rows
        };

        res.json(project);
    } catch (err) {
        console.error('Error fetching project:', err);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

router.put('/:id/complete', requireClient, async (req, res) => {
    const projectId = req.params.id;

    try {
        console.log('✅ Marking project complete:', projectId);

        // Check if project exists and is in_progress
        const result = await pool.query(
            'SELECT status FROM projects WHERE id = $1',
            [projectId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const status = result.rows[0].status;

        if (status !== 'in_progress') {
            return res.status(400).json({ error: 'Only in-progress projects can be completed' });
        }

        // Update the project status to completed
        const updateResult = await pool.query(
            'UPDATE projects SET status = $1 WHERE id = $2 RETURNING *',
            ['completed', projectId]
        );

        return res.json({
            ok: true,
            success: true,
            project: updateResult.rows[0]
        });
    } catch (err) {
        console.error('Error completing project:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
