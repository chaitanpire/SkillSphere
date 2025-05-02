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

router.get('/available', requireFreelancer,  async (req, res) => {
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

router.get('/:id/proposals', async (req, res) => {
    try {
        const { id } = req.params;
        const { sort } = req.query;
        console.log('Fetching proposals for project ID:', id);
        let orderBy = '';
        if (sort === 'price') {
            orderBy = 'ORDER BY p.proposed_amount ASC';
        } else {
            orderBy = 'ORDER BY pr.rating DESC';
        }

        const result = await pool.query(`
            SELECT 
                p.*,
                u.name as freelancer_name,
                COALESCE(pr.rating, 0) as freelancer_rating,
                pr.location as freelancer_location,
                (
                    SELECT string_agg(s.name, ',')
                    FROM user_skills us
                    JOIN skills s ON us.skill_id = s.id
                    WHERE us.user_id = p.freelancer_id
                ) as freelancer_skills
            FROM proposals p
            JOIN users u ON p.freelancer_id = u.id
            JOIN profiles pr ON u.id = pr.user_id
            WHERE p.project_id = $1
            ${orderBy}
        `, [id]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load proposals' });
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

router.get('/:id', async (req, res) => {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }

    try {
        const result = await pool.query(`
            SELECT projects.*, users.name AS client_name
            FROM projects
            JOIN users ON projects.client_id = users.id
            WHERE projects.id = $1
        `, [projectId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(result.rows[0]);
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
