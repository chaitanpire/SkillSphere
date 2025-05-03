const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/roles');

router.use(authenticate);
requireClient = requireRole('client');
requireFreelancer = requireRole('freelancer');
// Accept a proposal
router.put('/:id/accept',requireClient,  async (req, res) => {
  try {
    const { id, project_id } = req.params;
    
    // Start transaction
    await pool.query('BEGIN');

    // 1. Update proposal status to 'accepted'
    const updateProposal = await pool.query(
        `UPDATE proposals 
         SET status = 'accepted', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      
      // Then if you want to delete other proposals for this project:
      
    if (updateProposal.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Proposal not found' });
    }
    await pool.query(
        `UPDATE proposals 
         SET status = 'rejected', updated_at = NOW()
         WHERE project_id = $1 AND id != $2 AND status = 'pending'`,
        [project_id, id]
      );


    const proposal = updateProposal.rows[0];

    // 2. Update project status to 'in_progress' and assign freelancer
    await pool.query(
      `UPDATE projects 
       SET status = 'in_progress', freelancer_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [proposal.freelancer_id, proposal.project_id]
    );

    // 3. Create notification for freelancer
    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, 'proposal_accepted')`,
      [proposal.freelancer_id, `Your proposal for project ${proposal.project_id} was accepted!`]
    );

    // Commit transaction
    await pool.query('COMMIT');

    res.json({ message: 'Proposal accepted successfully', proposal });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error accepting proposal:', err);
    res.status(500).json({ error: 'Failed to accept proposal' });
  }
});

// Reject a proposal
router.put('/:id/reject',requireClient, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Start transaction
    await pool.query('BEGIN');

    // 1. Update proposal status to 'rejected'
    const updateProposal = await pool.query(
      `UPDATE proposals 
       SET status = 'rejected', updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (updateProposal.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = updateProposal.rows[0];

    // 2. Create notification for freelancer
    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, 'proposal_rejected')`,
      [proposal.freelancer_id, `Your proposal for project ${proposal.project_id} was rejected. ${reason ? 'Reason: ' + reason : ''}`]
    );

    // Commit transaction
    await pool.query('COMMIT');

    res.json({ message: 'Proposal rejected successfully', proposal });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error rejecting proposal:', err);
    res.status(500).json({ error: 'Failed to reject proposal' });
  }
});


router.delete('/:id', requireFreelancer, async (req, res) => {
  const proposalId = parseInt(req.params.id);
  const freelancerId = req.user.id;

  if (isNaN(proposalId)) {
      return res.status(400).json({ error: 'Invalid proposal ID' });
  }

  try {
      // Begin transaction
      await pool.query('BEGIN');
      
      // Check if proposal exists and belongs to this freelancer
      const proposalCheck = await pool.query(
          'SELECT * FROM proposals WHERE id = $1 AND freelancer_id = $2',
          [proposalId, freelancerId]
      );
      
      if (proposalCheck.rows.length === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ error: 'Proposal not found or unauthorized' });
      }

      // Check if the proposal can be withdrawn (only pending proposals can be withdrawn)
      if (proposalCheck.rows[0].status !== 'pending') {
          await pool.query('ROLLBACK');
          return res.status(400).json({ error: 'Only pending proposals can be withdrawn' });
      }

      // Delete the proposal
      await pool.query(
          'DELETE FROM proposals WHERE id = $1',
          [proposalId]
      );
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.json({ message: 'Proposal withdrawn successfully' });
  } catch (err) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error withdrawing proposal:', err);
      res.status(500).json({ error: 'Failed to withdraw proposal' });
  }
});

router.get('/my', requireFreelancer, async (req, res) => {
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
module.exports = router;