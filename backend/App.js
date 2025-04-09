// server.js

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");
const app = express();
const port = 4000;

// PostgreSQL connection - replace with your credentials and DB name
const pool = new Pool({
  user: 'test',        // your postgres username
  host: 'localhost',
  database: 'skillsphere',  // your SkillSphere database
  password: 'test',    // your postgres password
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Enable CORS for your React app on localhost:3000
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Session configuration
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// ---------------------------------------------------
// Authentication Middleware
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// ---------------------------------------------------
// AUTHENTICATION APIs

// Signup: expects { name, email, password, user_type }
// user_type should be either 'freelancer' or 'client'
app.post('/signup', async (req, res) => {
  const { name, email, password, user_type } = req.body;
  try {
    // Check if the email is already registered
    const existingUser = await pool.query("SELECT * FROM Users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Error: Email is already registered." });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert new user into Users table
    const result = await pool.query(
      "INSERT INTO Users (name, email, password_hash, user_type) VALUES ($1, $2, $3, $4) RETURNING user_id",
      [name, email, hashedPassword, user_type]
    );
    // Save user id in session
    req.session.userId = result.rows[0].user_id;
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Error signing up" });
  }
});

// Login: expects { email, password }
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query("SELECT * FROM Users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Save user id in session
    req.session.userId = user.user_id;
    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Error logging in" });
  }
});

// Check if logged in
app.get("/isLoggedIn", async (req, res) => {
  if (req.session.userId) {
    try {
      const userResult = await pool.query("SELECT name FROM Users WHERE user_id = $1", [req.session.userId]);
      if (userResult.rows.length > 0) {
        return res.status(200).json({ message: "Logged in", name: userResult.rows[0].name });
      } else {
        return res.status(400).json({ message: "Not logged in" });
      }
    } catch (error) {
      console.error("isLoggedIn error:", error);
      return res.status(500).json({ message: "Error checking login status" });
    }
  } else {
    return res.status(401).json({ message: "Not logged in" });
  }
});

// Logout API
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Failed to log out" });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: "Logged out successfully" });
  });
});

// ---------------------------------------------------
// SKILLSPHERE APIs

// Create new project (Clients only)
// Expects { client_id, title, description, budget, team_size, timeline, status }
// In a real-world app, the client_id would be derived from the session
app.post("/projects", isAuthenticated, async (req, res) => {
  const { title, description, budget, team_size, timeline, status } = req.body;
  // Using session user id as the client_id
  const client_id = req.session.userId;
  try {
    const result = await pool.query(
      "INSERT INTO Projects (client_id, title, description, budget, team_size, timeline, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING project_id",
      [client_id, title, description, budget, team_size, timeline, status]
    );
    return res.status(201).json({ message: "Project created successfully", project_id: result.rows[0].project_id });
  } catch (error) {
    console.error("Create project error:", error);
    return res.status(500).json({ message: "Error creating project" });
  }
});

// List all open projects
app.get("/projects", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Projects WHERE status = 'open' ORDER BY project_id ASC");
    return res.status(200).json({ message: "Projects fetched successfully", projects: result.rows });
  } catch (error) {
    console.error("List projects error:", error);
    return res.status(500).json({ message: "Error fetching projects" });
  }
});

// Submit a proposal for a project (Freelancers only)
// Expects { project_id, bid_amount, message, status }
app.post("/proposals", isAuthenticated, async (req, res) => {
  const { project_id, bid_amount, message, status } = req.body;
  // Using session user id as the freelancer_id
  const freelancer_id = req.session.userId;
  try {
    const result = await pool.query(
      "INSERT INTO Proposals (freelancer_id, project_id, bid_amount, message, status) VALUES ($1, $2, $3, $4, $5) RETURNING proposal_id",
      [freelancer_id, project_id, bid_amount, message, status]
    );
    return res.status(201).json({ message: "Proposal submitted successfully", proposal_id: result.rows[0].proposal_id });
  } catch (error) {
    console.error("Submit proposal error:", error);
    return res.status(500).json({ message: "Error submitting proposal" });
  }
});

// ---------------------------------------------------
// Additional endpoints such as fetching user profiles,
// messaging, connections, and ratings can be added similarly.

// Start the server
app.listen(port, () => {
  console.log(`SkillSphere backend server running at http://localhost:${port}`);
});
