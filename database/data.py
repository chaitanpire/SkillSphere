import psycopg2
import random
import datetime
import json
import hashlib
from faker import Faker
import bcrypt
from decimal import Decimal

# Initialize Faker
fake = Faker()

# Database connection parameters
db_params = {
    'dbname': 'skillsphere',
    'user': 'test',
    'password': 'test',
    'host': 'localhost',
    'port': '5432'
}

# Create a connection to the database
try:
    conn = psycopg2.connect(**db_params)
    cursor = conn.cursor()
    print("Connected to the database successfully!")
except Exception as e:
    print(f"Error connecting to the database: {e}")
    exit(1)

# Helper function to hash passwords
def hash_password(password):
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

# Lists for sample data
skills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'UI/UX Design', 
    'Content Writing', 'Digital Marketing', 'SEO', 'Data Analysis', 
    'Machine Learning', 'PHP', 'Mobile Development', 'Graphic Design', 
    'Blockchain', 'DevOps', 'Technical Writing', 'Video Editing', 
    'WordPress', 'Database Design', 'Java', 'C#', 'Angular', 'Vue.js',
    'iOS Development', 'Android Development', 'Ruby on Rails', 'Docker',
    'Kubernetes', 'Cybersecurity'
]

project_statuses = ['open', 'in_progress', 'completed', 'cancelled']
proposal_statuses = ['pending', 'accepted', 'rejected']
notification_types = ['new_message', 'proposal_accepted', 'project_completed', 'payment_received']
event_types = ['login', 'search', 'view_profile', 'submit_proposal', 'complete_project']

categories = [
    'Web Development', 'Mobile App Development', 'Design', 'Writing', 
    'Marketing', 'Data Science', 'Business', 'Admin Support',
    'Customer Service', 'Sales', 'Accounting', 'Legal', 'Engineering',
    'IT & Networking', 'Translation'
]

# List of users with emails and passwords for testing
test_users = [
    {'name': 'John Client', 'email': 'john.client@example.com', 'password': 'Client123!', 'role': 'client'},
    {'name': 'Emily Client', 'email': 'emily.client@example.com', 'password': 'Emily456!', 'role': 'client'},
    {'name': 'Mike Freelancer', 'email': 'mike.freelancer@example.com', 'password': 'Mike789!', 'role': 'freelancer'},
    {'name': 'Sarah Freelancer', 'email': 'sarah.freelancer@example.com', 'password': 'Sarah123!', 'role': 'freelancer'},
    {'name': 'Admin User', 'email': 'admin@example.com', 'password': 'Admin123!', 'role': 'client'},
]

# List to store generated users, clients, and freelancers
users = []
client_ids = []
freelancer_ids = []

def generate_data():
    try:
        # Clear existing data
        print("Clearing existing data...")
        tables = [
            'analytics_events', 'ratings', 'notifications', 
            'messages', 'proposals', 'project_skills', 'projects', 'user_skills',
            'freelancer_preferences', 'project_applications_history', 'profiles', 'users', 'skills'
        ]
        
        for table in tables:
            cursor.execute(f"TRUNCATE TABLE {table} CASCADE;")
        
        # Reset sequences
        cursor.execute("SELECT setval('users_id_seq', 1, false);")
        cursor.execute("SELECT setval('skills_id_seq', 1, false);")
        cursor.execute("SELECT setval('projects_id_seq', 1, false);")
        cursor.execute("SELECT setval('proposals_id_seq', 1, false);")
        cursor.execute("SELECT setval('messages_id_seq', 1, false);")
        cursor.execute("SELECT setval('notifications_id_seq', 1, false);")
        cursor.execute("SELECT setval('ratings_id_seq', 1, false);")
        cursor.execute("SELECT setval('analytics_events_id_seq', 1, false);")
        
        # Insert skills
        print("Inserting skills...")
        for skill in skills:
            cursor.execute(
                "INSERT INTO skills (name) VALUES (%s) RETURNING id;",
                (skill,)
            )
        
        # Generate regular users
        print("Generating users...")
        # First insert test users
        for user in test_users:
            cursor.execute(
                "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s) RETURNING id;",
                (user['name'], user['email'], hash_password(user['password']), user['role'])
            )
            user_id = cursor.fetchone()[0]
            users.append({'id': user_id, 'role': user['role']})
            if user['role'] == 'client':
                client_ids.append(user_id)
            else:
                freelancer_ids.append(user_id)
        
        # Insert additional users (30 clients, 70 freelancers)
        for i in range(30):
            name = fake.name()
            email = fake.email()
            password = hash_password(fake.password(length=10, special_chars=True))
            role = 'client'
            
            cursor.execute(
                "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s) RETURNING id;",
                (name, email, password, role)
            )
            user_id = cursor.fetchone()[0]
            users.append({'id': user_id, 'role': role})
            client_ids.append(user_id)
        
        for i in range(70):
            name = fake.name()
            email = fake.email()
            password = hash_password(fake.password(length=10, special_chars=True))
            role = 'freelancer'
            
            cursor.execute(
                "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s) RETURNING id;",
                (name, email, password, role)
            )
            user_id = cursor.fetchone()[0]
            users.append({'id': user_id, 'role': role})
            freelancer_ids.append(user_id)
        
        # Create profiles
        print("Creating profiles...")
        for user in users:
            bio = fake.paragraph(nb_sentences=3)
            location = fake.city() + ", " + fake.country()
            experience = random.randint(0, 15)
            rating = round(random.uniform(3.0, 5.0), 2)
            profile_picture = f"https://randomuser.me/api/portraits/{'women' if random.random() > 0.5 else 'men'}/{random.randint(1, 99)}.jpg"
            
            cursor.execute(
                "INSERT INTO profiles (user_id, bio, location, experience, rating, profile_picture) VALUES (%s, %s, %s, %s, %s, %s);",
                (user['id'], bio, location, experience, rating, profile_picture)
            )
        
        # Assign skills to users
        print("Assigning skills to users...")
        for user_id in freelancer_ids:
            # Each freelancer gets 3-8 skills
            user_skills = random.sample(range(1, len(skills) + 1), random.randint(3, 8))
            for skill_id in user_skills:
                cursor.execute(
                    "INSERT INTO user_skills (user_id, skill_id) VALUES (%s, %s);",
                    (user_id, skill_id)
                )
        
        # Create projects
        print("Creating projects...")
        project_ids = []
        # Create 100 projects
        for i in range(1000):
            client_id = random.choice(client_ids)
            # 70% of projects have a freelancer assigned, 30% are open
            has_freelancer = random.random() < 0.7
            freelancer_id = random.choice(freelancer_ids) if has_freelancer else None
            
            title = fake.catch_phrase()
            description = fake.paragraph(nb_sentences=5)
            budget = round(random.uniform(100, 5000), 2)
            
            # Create a date between now and 3 months in the future
            days_ahead = random.randint(7, 90)
            deadline = (datetime.datetime.now() + datetime.timedelta(days=days_ahead)).date()
            
            expected_work_hours = random.randint(5, 100)
            
            # Status depends on whether a freelancer is assigned
            if not has_freelancer:
                status = 'open'
            else:
                status_weights = {'in_progress': 0.2, 'completed': 0.6, 'cancelled': 0.2}
                status = random.choices(list(status_weights.keys()), 
                                       weights=list(status_weights.values()))[0]
            
            # Random categories (1-3)
            project_categories = json.dumps(random.sample(categories, random.randint(1, 3)))
            
            cursor.execute(
                """
                INSERT INTO projects 
                (client_id, freelancer_id, title, description, budget, deadline, 
                expected_work_hours, status, categories) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
                """,
                (client_id, freelancer_id, title, description, budget, deadline,
                expected_work_hours, status, project_categories)
            )
            
            project_id = cursor.fetchone()[0]
            project_ids.append(project_id)
            
            # Add project skills (2-5 skills per project)
            project_skills = random.sample(range(1, len(skills) + 1), random.randint(2, 5))
            for skill_id in project_skills:
                cursor.execute(
                    "INSERT INTO project_skills (project_id, skill_id) VALUES (%s, %s);",
                    (project_id, skill_id)
                )
        
        # Create proposals
        print("Creating proposals...")
        for project_id in project_ids:
            # Get project details
            cursor.execute("SELECT client_id, freelancer_id, budget, status FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()
            client_id, current_freelancer_id, budget, status = project
            
            # If project is open, add 1-5 proposals
            if status == 'open':
                num_proposals = random.randint(1, 5)
                # Get random freelancers excluding any already assigned
                available_freelancers = [f for f in freelancer_ids if f != current_freelancer_id]
                proposal_freelancers = random.sample(available_freelancers, min(num_proposals, len(available_freelancers)))
                
                for freelancer_id in proposal_freelancers:
                    cover_letter = fake.paragraph(nb_sentences=4)
                    # Proposed amount usually around the budget, slightly above or below
                    proposed_amount = round(float(budget) * random.uniform(0.8, 1.2), 2)
                    
                    # Submissions between 1-30 days ago
                    days_ago = random.randint(1, 30)
                    submitted_at = datetime.datetime.now() - datetime.timedelta(days=days_ago)
                    
                    # Most proposals are pending
                    status = 'pending'
                    
                    cursor.execute(
                        """
                        INSERT INTO proposals 
                        (project_id, freelancer_id, cover_letter, proposed_amount, submitted_at, status) 
                        VALUES (%s, %s, %s, %s, %s, %s);
                        """,
                        (project_id, freelancer_id, cover_letter, proposed_amount, submitted_at, status)
                    )
            
            # If project is in progress or completed, add the winning proposal
            elif status in ['in_progress', 'completed']:
                cover_letter = fake.paragraph(nb_sentences=4)
                proposed_amount = round(float(budget) * random.uniform(0.9, 1.1), 2)
                days_ago = random.randint(30, 60)
                submitted_at = datetime.datetime.now() - datetime.timedelta(days=days_ago)
                
                cursor.execute(
                    """
                    INSERT INTO proposals 
                    (project_id, freelancer_id, cover_letter, proposed_amount, submitted_at, status) 
                    VALUES (%s, %s, %s, %s, %s, %s);
                    """,
                    (project_id, current_freelancer_id, cover_letter, proposed_amount, submitted_at, 'accepted')
                )
                
                # Also add 0-3 rejected proposals
                num_rejected = random.randint(0, 3)
                available_freelancers = [f for f in freelancer_ids if f != current_freelancer_id]
                if num_rejected > 0 and available_freelancers:
                    rejected_freelancers = random.sample(available_freelancers, min(num_rejected, len(available_freelancers)))
                    
                    for freelancer_id in rejected_freelancers:
                        cover_letter = fake.paragraph(nb_sentences=3)
                        proposed_amount = round(float(budget) * random.uniform(0.8, 1.3), 2)
                        days_ago = random.randint(30, 60)
                        submitted_at = datetime.datetime.now() - datetime.timedelta(days=days_ago)
                        
                        cursor.execute(
                            """
                            INSERT INTO proposals 
                            (project_id, freelancer_id, cover_letter, proposed_amount, submitted_at, status) 
                            VALUES (%s, %s, %s, %s, %s, %s);
                            """,
                            (project_id, freelancer_id, cover_letter, proposed_amount, submitted_at, 'rejected')
                        )
        
        # Create messages
        print("Creating messages...")
        # Generate 200 messages between random users
        for i in range(200):
            sender_id = random.choice([user['id'] for user in users])
            
            # Find a receiver that isn't the sender
            receiver_candidates = [user['id'] for user in users if user['id'] != sender_id]
            receiver_id = random.choice(receiver_candidates)
            
            content = fake.paragraph(nb_sentences=random.randint(1, 5))
            subject = fake.sentence(nb_words=6)[:-1]  # Remove trailing period
            is_read = random.random() < 0.7  # 70% chance message is read
            
            # Message sent between 0-60 days ago
            days_ago = random.randint(0, 60)
            sent_at = datetime.datetime.now() - datetime.timedelta(days=days_ago)
            
            cursor.execute(
                """
                INSERT INTO messages 
                (sender_id, receiver_id, content, sent_at, subject, is_read) 
                VALUES (%s, %s, %s, %s, %s, %s);
                """,
                (sender_id, receiver_id, content, sent_at, subject, is_read)
            )
        
        # Create notifications
        print("Creating notifications...")
        # Generate 300 notifications for random users
        for i in range(300):
            user_id = random.choice([user['id'] for user in users])
            notification_type = random.choice(notification_types)
            
            if notification_type == 'new_message':
                message = f"You have a new message from {fake.name()}"
                link = "/messages"
            elif notification_type == 'proposal_accepted':
                message = f"Your proposal for project '{fake.catch_phrase()}' has been accepted!"
                link = f"/projects/{random.choice(project_ids)}"
            elif notification_type == 'project_completed':
                message = f"Project '{fake.catch_phrase()}' has been marked as completed."
                link = f"/projects/{random.choice(project_ids)}"
            
            is_read = random.random() < 0.6  # 60% chance notification is read
            
            # Notification created between 0-30 days ago
            days_ago = random.randint(0, 30)
            created_at = datetime.datetime.now() - datetime.timedelta(days=days_ago)
            
            cursor.execute(
                """
                INSERT INTO notifications 
                (user_id, message, type, is_read, created_at, link) 
                VALUES (%s, %s, %s, %s, %s, %s);
                """,
                (user_id, message, notification_type, is_read, created_at, link)
            )
        
        # Create ratings
        print("Creating ratings...")
        # For completed projects, create ratings
        cursor.execute("SELECT id, client_id, freelancer_id FROM projects WHERE status = 'completed'")
        completed_projects = cursor.fetchall()
        
        for project in completed_projects:
            project_id, client_id, freelancer_id = project
            
            # Client rates freelancer
            if random.random() < 0.9:  # 90% chance client leaves a rating
                rating_score = random.randint(3, 5)  # Most ratings are positive
                review = fake.paragraph(nb_sentences=2)
                
                days_ago = random.randint(1, 15)
                created_at = datetime.datetime.now() - datetime.timedelta(days=days_ago)
                
                cursor.execute(
                    """
                    INSERT INTO ratings 
                    (rater_id, rated_id, project_id, rating, review, created_at) 
                    VALUES (%s, %s, %s, %s, %s, %s);
                    """,
                    (client_id, freelancer_id, project_id, rating_score, review, created_at)
                )
            
            # Freelancer rates client
            if random.random() < 0.7:  # 70% chance freelancer leaves a rating
                rating_score = random.randint(3, 5)
                review = fake.paragraph(nb_sentences=2)
                
                days_ago = random.randint(1, 15)
                created_at = datetime.datetime.now() - datetime.timedelta(days=days_ago)
                
                cursor.execute(
                    """
                    INSERT INTO ratings 
                    (rater_id, rated_id, project_id, rating, review, created_at) 
                    VALUES (%s, %s, %s, %s, %s, %s);
                    """,
                    (freelancer_id, client_id, project_id, rating_score, review, created_at)
                )
        
        # Update user profile ratings based on ratings received
        cursor.execute("""
            UPDATE profiles p
            SET rating = subquery.avg_rating
            FROM (
                SELECT rated_id, ROUND(AVG(rating)::numeric, 2) as avg_rating
                FROM ratings
                GROUP BY rated_id
            ) as subquery
            WHERE p.user_id = subquery.rated_id
            AND subquery.avg_rating IS NOT NULL
        """)
        
        # Create analytics events
        print("Creating analytics events...")
        # Generate 500 analytics events
        for i in range(500):
            user_id = random.choice([user['id'] for user in users])
            event_type = random.choice(event_types)
            
            # Create event-specific data
            if event_type == 'login':
                event_data = json.dumps({
                    'ip_address': fake.ipv4(),
                    'device': random.choice(['desktop', 'mobile', 'tablet']),
                    'browser': random.choice(['Chrome', 'Firefox', 'Safari', 'Edge'])
                })
            elif event_type == 'search':
                event_data = json.dumps({
                    'query': random.choice(['python developer', 'react frontend', 'logo design', 'content writer']),
                    'results_count': random.randint(5, 50)
                })
            elif event_type == 'view_profile':
                event_data = json.dumps({
                    'viewed_user_id': random.choice([user['id'] for user in users]),
                    'duration_seconds': random.randint(10, 300)
                })
            elif event_type == 'submit_proposal':
                event_data = json.dumps({
                    'project_id': random.choice(project_ids),
                    'proposed_amount': random.randint(100, 5000)
                })
            else:  # complete_project
                event_data = json.dumps({
                    'project_id': random.choice(project_ids),
                    'duration_days': random.randint(1, 60)
                })
            
            # Event occurred between 0-90 days ago
            days_ago = random.randint(0, 90)
            timestamp = datetime.datetime.now() - datetime.timedelta(days=days_ago)
            
            cursor.execute(
                """
                INSERT INTO analytics_events 
                (user_id, event_type, event_data, timestamp) 
                VALUES (%s, %s, %s, %s);
                """,
                (user_id, event_type, event_data, timestamp)
            )
        
        
        # Create freelancer preferences
        print("Creating freelancer preferences...")
        for freelancer_id in freelancer_ids:
            min_budget = round(random.uniform(100, 1000), 2)
            max_budget = round(min_budget * random.uniform(2, 5), 2)
            
            # 2-4 preferred categories
            preferred_categories = json.dumps(random.sample(categories, random.randint(2, 4)))
            
            cursor.execute(
                """
                INSERT INTO freelancer_preferences 
                (user_id, min_budget, max_budget, preferred_categories) 
                VALUES (%s, %s, %s, %s);
                """,
                (freelancer_id, min_budget, max_budget, preferred_categories)
            )
        
        # Create project applications history
        print("Creating project applications history...")
        # For each freelancer, add 5-15 project application history records
        for freelancer_id in freelancer_ids:
            num_applications = random.randint(5, 15)
            # Get random projects
            application_projects = random.sample(project_ids, min(num_applications, len(project_ids)))
            
            for project_id in application_projects:
                # Application happened between 30-180 days ago
                days_ago = random.randint(30, 180)
                applied_at = datetime.datetime.now() - datetime.timedelta(days=days_ago)
                
                # Success score between 1-10
                success_score = random.randint(1, 10)
                
                cursor.execute(
                    """
                    INSERT INTO project_applications_history 
                    (user_id, project_id, applied_at, success_score) 
                    VALUES (%s, %s, %s, %s);
                    """,
                    (freelancer_id, project_id, applied_at, success_score)
                )
        
        # Commit the changes
        conn.commit()
        print("Sample data generated successfully!")
        
        # Print test user credentials for reference
        print("\n=== Test User Credentials ===")
        for user in test_users:
            print(f"Name: {user['name']}")
            print(f"Email: {user['email']}")
            print(f"Password: {user['password']}")
            print(f"Role: {user['role']}")
            print("-" * 30)
        
        return True
    
    except Exception as e:
        conn.rollback()
        print(f"Error generating sample data: {e}")
        return False
    
# Run the data generation function
if __name__ == "__main__":
    generate_data()
    
    # Close the database connection
    cursor.close()
    conn.close()