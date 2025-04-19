const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// Get dashboard stats
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { rows: user } = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        console.log( user ); // Debug log
        if (user[0].role === 'client') {
            const stats = await pool.query(`
        SELECT 
          coalesce(COUNT(*) FILTER (WHERE status = 'open') , 0) AS open_projects,
          COUNT(*) FILTER (WHERE status = 'in_progress') AS pending_projects,
          COUNT(*) FILTER (WHERE status = 'completed') AS completed_projects
        FROM projects
        WHERE client_id = $1
      `, [userId]);

            res.json({

                your_projects: stats.rows[0].open_projects,
                pending: stats.rows[0].pending_projects,
                completed: stats.rows[0].completed_projects
            });

        } else { // Freelancer
            const stats = await pool.query(`
        SELECT 
          COUNT(*) AS available_projects,
          COUNT(*) FILTER (WHERE p.status = 'open') AS new_this_week,
          COUNT(*) FILTER (WHERE pr.status = 'pending') AS pending_proposals,
          COUNT(*) FILTER (WHERE p.status = 'completed') AS completed_projects,
          COALESCE(SUM(t.amount), 0) AS earnings
        FROM projects p
        LEFT JOIN proposals pr ON p.id = pr.project_id AND pr.freelancer_id = $1
        LEFT JOIN transactions t ON t.freelancer_id = $1
        WHERE p.status = 'open' OR pr.freelancer_id = $1
      `, [userId]);
            const stats2 = await pool.query(`
        SELECT
            COUNT(*) AS available_projects
            FROM projects
            `);

            res.json({
                available_projects: stats2.rows[0].available_projects,
                earnings: stats.rows[0].earnings,
                pending: stats.rows[0].pending_proposals,
                completed: stats.rows[0].completed_projects
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load dashboard stats' });
    }
});

// Get recent activity
router.get('/activity/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { rows: user } = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        if (user[0].role === 'client') {
            const activity = await pool.query(`
        SELECT 
          'proposal' AS type,
          p.title,
          pr.status,
          pr.updated_at AS date
        FROM proposals pr
        JOIN projects p ON pr.project_id = p.id
        where p.client_id = $1
        UNION ALL
        SELECT
            'project' AS type,
            p.title,
            p.status,
            p.updated_at AS date
        FROM projects p
        WHERE p.client_id = $1
        UNION ALL
        SELECT 
          'message' AS type,
          m.subject AS title,
          'unread' AS status,
          m.sent_at AS date
        FROM messages m
        WHERE m.receiver_id = $1 AND m.is_read = false
        ORDER BY date DESC
        LIMIT 5
      `, [userId]);

            res.json(activity.rows);
        } else { // Freelancer
            const activity = await pool.query(`
        SELECT 
          'proposal' AS type,
          p.title,
          pr.status,
          pr.updated_at AS date
        FROM proposals pr
        JOIN projects p ON pr.project_id = p.id
        WHERE pr.freelancer_id = $1
        UNION ALL
        SELECT 
          'message' AS type,
          m.subject AS title,
          'unread' AS status,
          m.sent_at AS date
        FROM messages m
        WHERE m.receiver_id = $1 AND m.is_read = false
        ORDER BY date DESC
        LIMIT 5
      `, [userId]);

            res.json(activity.rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load activity' });
    }
});

module.exports = router;