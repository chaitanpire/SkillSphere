const express = require('express');
const pool = require('../config/db');
const router = express.Router();

// Get all conversations
router.get('/conversations', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT DISTINCT ON (least(sender_id, receiver_id), greatest(sender_id, receiver_id))
        CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id,
        u.name as other_user_name,
        m.content as last_message,
        m.sent_at as last_message_time,
        SUM(CASE WHEN m.receiver_id = $1 AND m.is_read = false THEN 1 ELSE 0 END) as unread_count
      FROM messages m
      JOIN users u ON (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END) = u.id
      WHERE sender_id = $1 OR receiver_id = $1
      GROUP BY other_user_id, other_user_name, last_message, last_message_time
      ORDER BY last_message_time DESC
    `, [req.user.id]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching conversations:', err);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get messages between users
router.get('/:otherUserId', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY sent_at ASC
    `, [req.user.id, req.params.otherUserId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false',
            [req.user.id]
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Error fetching unread count:', err);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

module.exports = router;
