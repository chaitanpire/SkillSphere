const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// Accept a proposal
router.put('/:id/accept', async (req, res) => {
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
router.put('/:id/reject', async (req, res) => {
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

module.exports = router;