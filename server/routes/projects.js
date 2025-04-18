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

// Middleware: Require Freelancer role
function requireFreelancer(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        if (decoded.role !== 'freelancer') {
            return res.status(403).json({ error: 'Only freelancers can submit proposals' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// GET /api/projects/:id/proposals - Get proposals for a specific project
// router.get('/:id/proposals', async (req, res) => {
//     const projectId = parseInt(req.params.id);

//     try {
//         const result = await pool.query(`
//             SELECT proposals.*, users.name AS freelancer_name
//             FROM proposals
//             JOIN users ON proposals.freelancer_id = users.id
//             WHERE project_id = $1
//             ORDER BY submitted_at DESC
//         `, [projectId]);

//         res.json(result.rows);
//     } catch (err) {
//         console.error('Error fetching proposals:', err);
//         res.status(500).json({ error: 'Failed to fetch proposals' });
//     }
// });

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

router.get('/:id/proposals', async (req, res) => {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }

    try {
        const result = await pool.query(`
            SELECT proposals.*, users.name AS freelancer_name
            FROM proposals
            JOIN users ON proposals.freelancer_id = users.id
            WHERE project_id = $1
            ORDER BY submitted_at DESC
        `, [projectId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching proposals:', err);
        res.status(500).json({ error: 'Failed to fetch proposals' });
    }
});
// POST /api/projects
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

// GET /api/proposals/freelancer - Get all proposals by current freelancer
router.get('/proposals/my', requireFreelancer, async (req, res) => {
    try {
        console.log('Fetching proposals for freelancer ID:', req.user.id);
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

router.delete('/proposals/:proposalId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const proposalId = parseInt(req.params.proposalId);

        // Verify proposal ownership
        const proposal = await pool.query(
            'SELECT * FROM proposals WHERE id = $1 AND freelancer_id = $2',
            [proposalId, decoded.id]
        );

        if (proposal.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found or not yours' });
        }

        await pool.query('DELETE FROM proposals WHERE id = $1', [proposalId]);
        res.status(204).end();
    } catch (err) {
        console.error('Error withdrawing proposal:', err);
        res.status(500).json({ error: 'Failed to withdraw proposal' });
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
// GET /api/projects/:id/proposals - Get proposals for a specific project


// PUT /api/proposals/:id/accept - Accept a proposal
router.put('/proposals/:id/accept', requireClient, async (req, res) => {
    try {
        const proposalId = parseInt(req.params.id);

        // 1. Verify the proposal exists and belongs to client's project
        const proposal = await pool.query(`
            SELECT p.* FROM proposals p
            JOIN projects pr ON p.project_id = pr.id
            WHERE p.id = $1 AND pr.client_id = $2
        `, [proposalId, req.user.id]);

        if (proposal.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found or unauthorized' });
        }

        // 2. Update proposal status and project status
        await pool.query('BEGIN');

        // Accept the proposal
        await pool.query(
            'UPDATE proposals SET status = $1 WHERE id = $2',
            ['accepted', proposalId]
        );

        // Mark project as assigned
        await pool.query(
            'UPDATE projects SET status = $1 WHERE id = $2',
            ['assigned', proposal.rows[0].project_id]
        );

        // Reject all other proposals for this project
        await pool.query(
            'UPDATE proposals SET status = $1 WHERE project_id = $2 AND id != $3',
            ['rejected', proposal.rows[0].project_id, proposalId]
        );

        await pool.query('COMMIT');

        res.json({ message: 'Proposal accepted successfully' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error accepting proposal:', err);
        res.status(500).json({ error: 'Failed to accept proposal' });
    }
});

// PUT /api/proposals/:id/reject - Reject a proposal
router.put('/proposals/:id/reject', requireClient, async (req, res) => {
    try {
        const proposalId = parseInt(req.params.id);

        // Verify ownership
        const proposal = await pool.query(`
            SELECT p.* FROM proposals p
            JOIN projects pr ON p.project_id = pr.id
            WHERE p.id = $1 AND pr.client_id = $2
        `, [proposalId, req.user.id]);

        if (proposal.rows.length === 0) {
            return res.status(404).json({ error: 'Proposal not found or unauthorized' });
        }

        await pool.query(
            'UPDATE proposals SET status = $1 WHERE id = $2',
            ['rejected', proposalId]
        );

        res.json({ message: 'Proposal rejected successfully' });
    } catch (err) {
        console.error('Error rejecting proposal:', err);
        res.status(500).json({ error: 'Failed to reject proposal' });
    }
});


module.exports = router;
