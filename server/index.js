const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();

// ✅ Setup CORS middleware properly
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const proposalRoutes = require('./routes/proposals');
const messagesRouter = require('./routes/messages');

app.use('/api/messages', messagesRouter);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/proposals', proposalRoutes);

// Create HTTP server
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('New client connected');

    // Authenticate socket connection
    socket.on('authenticate', (token) => {
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.join(`user_${decoded.id}`); // Join user's personal room
            console.log(`User ${decoded.id} authenticated for sockets`);
        } catch (err) {
            console.log('Socket authentication failed');
        }
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`User joined conversation ${conversationId}`);
    });

    // Handle new messages
    socket.on('send_message', async (data) => {
        try {
            const pool = require('./config/db');

            // Save to database
            const result = await pool.query(
                `INSERT INTO messages (sender_id, receiver_id, content, subject)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [data.sender_id, data.receiver_id, data.content, data.subject || 'New message']
            );

            const message = result.rows[0];

            // Create notification
            await pool.query(
                `INSERT INTO notifications (user_id, message, type, link)
                 VALUES ($1, $2, 'new_message', $3)`,
                [data.receiver_id, `New message from ${data.sender_name}`, `/messages/${data.sender_id}`]
            );

            // Emit to both participants
            const conversationId = [data.sender_id, data.receiver_id].sort().join('_');
            io.to(`user_${data.sender_id}`)
                .to(`user_${data.receiver_id}`)
                .to(conversationId)
                .emit('new_message', message);

            // Emit notification
            io.to(`user_${data.receiver_id}`).emit('new_notification', {
                message: `New message from ${data.sender_name}`,
                link: `/messages/${data.sender_id}`
            });

        } catch (err) {
            console.error('Error handling message:', err);
        }
    });

    // Mark messages as read
    socket.on('mark_read', async ({ senderId, receiverId }) => {
        try {
            const pool = require('./config/db');
            await pool.query(
                'UPDATE messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false',
                [senderId, receiverId]
            );

            // Update unread count for receiver
            io.to(`user_${receiverId}`).emit('update_unread_count');
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Listen
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));