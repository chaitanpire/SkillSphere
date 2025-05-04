> 22B0979 | 22B1027 | 22B1031 | 22B1071

# **Skillsphere - Freelancing Platform**

This project is a freelancing platform that connects **clients** and **freelancers**. Clients can post projects, and freelancers can submit proposals for these projects. The platform includes features such as real-time messaging, project management, skill-based filtering, and notifications.


## **Installation**

### **Prerequisites**
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**
- **Docker** (optional, for containerized deployment)

### **Backend Setup**
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/freelancing-platform.git
   cd freelancing-platform/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the server directory:
     ```env
     DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<database_name>
     JWT_SECRET=your_jwt_secret
     PORT=4000
     ```
   - Replace `<username>`, `<password>`, and `<database_name>` with your PostgreSQL credentials.

4. Set up the database:
   ```bash
   psql -U <username> -d <database_name> -f database/schema.sql
   ```
5. [Optional] Generate testing data using `database/data.py`


6. Start the backend server:
   ```bash
   npm run dev
   ```

### **Frontend Setup**
1. Navigate to the client directory:
   ```bash
   cd ../client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the client directory:
     ```env
     REACT_APP_API_URL=http://localhost:4000/api
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## **Usage**

### **1. Running the Application**
- Open your browser and navigate to `http://localhost:5173` to access the frontend.
- The backend API will be available at `http://localhost:4000/api`.

### **2. User Roles**
- **Clients**:
  - Sign up as a client.
  - Post projects with details such as title, description, budget, and required skills.
  - View proposals submitted by freelancers and accept/reject them.
- **Freelancers**:
  - Sign up as a freelancer.
  - Browse available projects and submit proposals.
  - Manage submitted proposals and communicate with clients.

## **Acknowledgments**

- **React.js** for the frontend framework.
- **Node.js** and **Express.js** for the backend.
- **PostgreSQL** for the database.
- **Socket.IO** for real-time messaging.
- **Aixplain API** for AI-powered summarization.
