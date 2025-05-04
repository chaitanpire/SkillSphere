-- =============================================
-- DATABASE SCHEMA FOR FREELANCER PLATFORM
-- =============================================

-- DROP TABLES IN CORRECT DEPENDENCY ORDER
DROP TABLE IF EXISTS project_applications_history CASCADE;
DROP TABLE IF EXISTS freelancer_preferences CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS project_skills CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- CORE TABLES
-- =============================================

-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('client', 'freelancer')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROFILES
CREATE TABLE profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    location VARCHAR(100),
    experience INTEGER,
    rating DECIMAL(3,2) DEFAULT 0.0,
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SKILLS
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- USER SKILLS (MANY-TO-MANY)
CREATE TABLE user_skills (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skill_id)
);

-- PROJECTS
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    freelancer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10,2),
    deadline DATE,
    expected_work_hours INTEGER,
    status VARCHAR(20) CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
    categories JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROJECT SKILLS (MANY-TO-MANY)
CREATE TABLE project_skills (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, skill_id)
);

-- PROPOSALS
CREATE TABLE proposals (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    proposed_amount DECIMAL(10,2),
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, freelancer_id)
);

-- =============================================
-- COMMUNICATION TABLES
-- =============================================

-- MESSAGES
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    subject TEXT,
    content TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- RATING AND FEEDBACK TABLES
-- =============================================

-- RATINGS
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    rater_id INTEGER REFERENCES users(id),
    rated_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ANALYTICS AND PREFERENCES TABLES
-- =============================================

-- ANALYTICS EVENTS
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    event_type VARCHAR(100),
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FREELANCER PREFERENCES
CREATE TABLE freelancer_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    min_budget DECIMAL(10,2),
    max_budget DECIMAL(10,2),
    preferred_categories JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROJECT APPLICATIONS HISTORY
CREATE TABLE project_applications_history (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success_score INTEGER,
    PRIMARY KEY (user_id, project_id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Indexes for users table
CREATE INDEX idx_users_id ON users (id);
CREATE UNIQUE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);

-- Indexes for profiles table
CREATE INDEX idx_profiles_user_id ON profiles (user_id);

-- Indexes for skills table
CREATE INDEX idx_skills_id ON skills (id);
CREATE UNIQUE INDEX idx_skills_name ON skills (name);

-- Indexes for user_skills table
CREATE INDEX idx_user_skills_user_id ON user_skills (user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills (skill_id);

-- Indexes for projects table
CREATE INDEX idx_projects_id ON projects (id);
CREATE INDEX idx_projects_client_id ON projects (client_id);
CREATE INDEX idx_projects_freelancer_id ON projects (freelancer_id);
CREATE INDEX idx_projects_status ON projects (status);

-- Indexes for project_skills table
CREATE INDEX idx_project_skills_project_id ON project_skills (project_id);
CREATE INDEX idx_project_skills_skill_id ON project_skills (skill_id);

-- Indexes for proposals table
CREATE INDEX idx_proposals_id ON proposals (id);
CREATE INDEX idx_proposals_project_id ON proposals (project_id);
CREATE INDEX idx_proposals_freelancer_id ON proposals (freelancer_id);
CREATE INDEX idx_proposals_status ON proposals (status);

-- Indexes for messages table
CREATE INDEX idx_messages_sender_id ON messages (sender_id);
CREATE INDEX idx_messages_receiver_id ON messages (receiver_id);
CREATE INDEX idx_messages_is_read ON messages (is_read);

-- Indexes for notifications table
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_is_read ON notifications (is_read);

-- Indexes for ratings table
CREATE INDEX idx_ratings_rater_id ON ratings (rater_id);
CREATE INDEX idx_ratings_rated_id ON ratings (rated_id);
CREATE INDEX idx_ratings_project_id ON ratings (project_id);

-- Indexes for freelancer_preferences table
CREATE INDEX idx_freelancer_preferences_user_id ON freelancer_preferences (user_id);

-- Indexes for project_applications_history table
CREATE INDEX idx_project_applications_history_user_id ON project_applications_history (user_id);
CREATE INDEX idx_project_applications_history_project_id ON project_applications_history (project_id);
CREATE INDEX project_apps_history_user_id_idx ON project_applications_history(user_id);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- 1. Function and trigger to update profile rating
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the profile rating based on the average rating
    -- for the user who was rated (rated_id)
    UPDATE profiles
    SET 
        rating = (SELECT COALESCE(AVG(rating), 0.0) FROM ratings WHERE rated_id = NEW.rated_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.rated_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to execute after INSERT, UPDATE, or DELETE on ratings table
CREATE TRIGGER update_rating_after_insert_update
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_profile_rating();

CREATE TRIGGER update_rating_after_delete
AFTER DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_profile_rating();

-- 2. Function and trigger to update project_applications_history when a proposal is submitted
CREATE OR REPLACE FUNCTION update_project_applications_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a new record into project_applications_history
    INSERT INTO project_applications_history (user_id, project_id, applied_at, success_score)
    VALUES (NEW.freelancer_id, NEW.project_id, NEW.submitted_at, 
            CASE 
                WHEN NEW.status = 'pending' THEN 1  -- Initial score for new proposal
                WHEN NEW.status = 'accepted' THEN 8 -- Higher score for accepted proposals
                ELSE 0
            END)
    ON CONFLICT (user_id, project_id) 
    DO UPDATE SET 
        applied_at = NEW.submitted_at,
        success_score = 
            CASE 
                WHEN NEW.status = 'accepted' THEN 8
                WHEN NEW.status = 'rejected' THEN 0
                ELSE 1
            END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_proposal_submission
AFTER INSERT OR UPDATE ON proposals
FOR EACH ROW
EXECUTE FUNCTION update_project_applications_history();

-- 3. Function and trigger to update project_applications_history when a project is completed
CREATE OR REPLACE FUNCTION update_history_on_project_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update the success score for the freelancer who completed the project
        UPDATE project_applications_history
        SET success_score = 10  -- Highest score for completed projects
        WHERE project_id = NEW.id AND user_id = NEW.freelancer_id;
        
        -- Also update freelancer's preferences based on this project
        UPDATE freelancer_preferences
        SET 
            -- Adjust min_budget/max_budget based on successful project budgets
            min_budget = CASE 
                WHEN min_budget IS NULL THEN NEW.budget * 0.8
                WHEN min_budget > NEW.budget * 0.8 THEN NEW.budget * 0.8
                ELSE min_budget
            END,
            max_budget = CASE
                WHEN max_budget IS NULL THEN NEW.budget * 1.2
                WHEN max_budget < NEW.budget * 1.2 THEN NEW.budget * 1.2
                ELSE max_budget
            END,
            -- Add this project's categories to preferred_categories if not already there
            preferred_categories = CASE
                WHEN preferred_categories IS NULL THEN NEW.categories
                ELSE preferred_categories || NEW.categories
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.freelancer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_on_project_completion
AFTER UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_history_on_project_completion();

-- 4. Function and trigger to update freelancer preferences when a proposal is submitted
CREATE OR REPLACE FUNCTION update_preferences_on_proposal()
RETURNS TRIGGER AS $$
DECLARE
    project_budget DECIMAL;
    project_categories JSONB;
BEGIN
    -- Get the project information
    SELECT budget, categories INTO project_budget, project_categories
    FROM projects WHERE id = NEW.project_id;
    
    -- Upsert into freelancer_preferences
    INSERT INTO freelancer_preferences (
        user_id, 
        min_budget, 
        max_budget, 
        preferred_categories,
        created_at,
        updated_at
    )
    VALUES (
        NEW.freelancer_id,
        COALESCE((SELECT min_budget FROM freelancer_preferences WHERE user_id = NEW.freelancer_id), project_budget * 0.8),
        COALESCE((SELECT max_budget FROM freelancer_preferences WHERE user_id = NEW.freelancer_id), project_budget * 1.2),
        COALESCE((SELECT preferred_categories FROM freelancer_preferences WHERE user_id = NEW.freelancer_id), '[]'::jsonb) || 
            COALESCE(project_categories, '[]'::jsonb),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        min_budget = LEAST(freelancer_preferences.min_budget, project_budget * 0.8),
        max_budget = GREATEST(freelancer_preferences.max_budget, project_budget * 1.2),
        preferred_categories = freelancer_preferences.preferred_categories || 
            COALESCE(project_categories, '[]'::jsonb),
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_preferences_on_proposal_submission
AFTER INSERT ON proposals
FOR EACH ROW
EXECUTE FUNCTION update_preferences_on_proposal();