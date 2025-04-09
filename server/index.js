const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const projectRoutes = require('./routes/projects');
app.use('/api/projects', projectRoutes);

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
