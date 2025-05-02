const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/roles');

router.use(authenticate);
requireClient = requireRole('client');
requireFreelancer = requireRole('freelancer');
// POST /api/projects/:id/proposals

router.post('/:id/proposals', requireFreelancer, async (req, res) => {
    const projectId = parseInt(req.params.id); // Ensure projectId is an integer
    const freelancerId = req.user.id; // From JWT token
    const { cover_letter, proposed_amount } = req.body;

    if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }
    try {
        // Check if project exists
        const projectCheck = await pool.query(
            'SELECT * FROM projects WHERE id = $1',
            [projectId]
        );
        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Insert proposal
        const result = await pool.query(
            `INSERT INTO proposals (project_id, freelancer_id, cover_letter, proposed_amount)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [projectId, freelancerId, cover_letter, proposed_amount]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error submitting proposal:', err);
        res.status(500).json({ error: 'Failed to submit proposal' });
    }
});


router.post('/', requireClient, async (req, res) => {
    const { title, description, budget, deadline } = req.body;
    const clientId = req.user.id;
    console.log('Received project:', req.body);
    console.log('Authenticated client ID:', req.user.id);

    try {
        // Begin transaction
        await pool.query('BEGIN');
        
        const result = await pool.query(
            `INSERT INTO projects (client_id, title, description, budget, deadline)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [clientId, title, description, budget, deadline]
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
        SELECT projects.*, users.name AS client_name
        FROM projects
        JOIN users ON projects.client_id = users.id
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
        const result = await pool.query(`
        SELECT projects.*, users.name AS client_name
        FROM projects
        JOIN users ON projects.client_id = users.id
        WHERE projects.status = 'open' 
        AND projects.id NOT IN (
            SELECT project_id FROM proposals WHERE freelancer_id = $1
        )
        ORDER BY projects.created_at DESC
      `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// GET /api/proposals/freelancer - Get all proposals by current freelancer
router.get('/proposals/my', requireFreelancer, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.*,
                pr.title AS project_title,
                pr.description AS project_description,
                pr.budget AS project_budget,
                pr.deadline AS project_deadline,
                u.name AS client_name
            FROM proposals p
            JOIN projects pr ON p.project_id = pr.id
            JOIN users u ON pr.client_id = u.id
            WHERE p.freelancer_id = $1
            ORDER BY p.submitted_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching proposals:', err);
        res.status(500).json({ error: 'Failed to fetch proposals' });
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
