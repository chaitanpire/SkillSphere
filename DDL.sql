-- Table: Users
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_pic VARCHAR(255),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('freelancer', 'client')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Table: Skills
-- This table catalogs skills. Categorizing skills aids in searchability and navigation.
CREATE TABLE Skills (
    skill_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL
);


-- Table: UserSkills (Associative table between Users and Skills)
-- A many-to-many relationship that allows each user to have multiple skills with a defined proficiency level.
CREATE TABLE UserSkills (
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level VARCHAR(20) NOT NULL CHECK (proficiency_level IN ('Beginner', 'Intermediate', 'Expert')),
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES Skills(skill_id) ON DELETE CASCADE
);


-- Table: Projects
-- Stores project listings posted by clients. The foreign key enforces that each project has a valid client owner.
CREATE TABLE Projects (
    project_id SERIAL PRIMARY KEY,
    client_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    budget DECIMAL(10,2),
    team_size INT,
    timeline VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'closed', 'completed')),
    FOREIGN KEY (client_id) REFERENCES Users(user_id) ON DELETE CASCADE
);


-- Table: ProjectSkills (Associative table between Projects and Skills)
-- Links projects with the skills they require. This association facilitates accurate matchmaking.
CREATE TABLE ProjectSkills (
    project_id INT NOT NULL,
    skill_id INT NOT NULL,
    required_level VARCHAR(20) NOT NULL CHECK (required_level IN ('Beginner', 'Intermediate', 'Expert')),
    PRIMARY KEY (project_id, skill_id),
    FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES Skills(skill_id) ON DELETE CASCADE
);


-- Table: Proposals
-- Stores proposals submitted by freelancers. The status field helps track the proposal workflow.
CREATE TABLE Proposals (
    proposal_id SERIAL PRIMARY KEY,
    freelancer_id INT NOT NULL,
    project_id INT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (freelancer_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE CASCADE
);


-- Table: Messages
-- Enables direct messaging between users. Sender and receiver are both foreign keys to Users ensuring valid participants.
CREATE TABLE Messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(user_id) ON DELETE CASCADE
);


-- Table: Connections
-- Manages connection requests between users. The UNIQUE constraint prevents duplicate connection records.
CREATE TABLE Connections (
    connection_id SERIAL PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    FOREIGN KEY (user1_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE (user1_id, user2_id)
);


-- Table: Ratings
-- Stores feedback after project completion. The optional project_id links feedback to a specific project and ensures ratings are associated with real engagements.
CREATE TABLE Ratings (
    rating_id SERIAL PRIMARY KEY,
    rater_id INT NOT NULL,
    rated_id INT NOT NULL,
    project_id INT,
    rating DECIMAL(2,1) NOT NULL CHECK (rating BETWEEN 0 AND 5),
    review TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rater_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (rated_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES Projects(project_id) ON DELETE SET NULL
);


-- Table: Leaderboard
-- Provides a precomputed ranking for top freelancers, which is useful for fast retrieval of leader information.
CREATE TABLE Leaderboard (
    user_id INT PRIMARY KEY,
    total_projects INT DEFAULT 0,
    total_ratings INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
