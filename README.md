# NodeReactMySQLStudentPortal

## Description
NodeReactMySQLStudentPortal is a web application designed for students and teachers to register, log in, and manage course assignments. The platform serves as a **student portal**, allowing users to authenticate using secure credentials and participate in assigned courses.
This project is part of a **proof-of-concept** implementation to compare different web development stacks while incorporating **cybersecurity** best practices.


## Features
- **User Registration & Authentication**: Secure login and signup with hashed credentials.
- **Role-Based Access**: Users can be students or teachers, each with different permissions.
- **Course Management**: Teachers can assign students to courses, and students can view their enrolled courses.
- **Backend & Database**: Built with **Node.js (Express.js) and MySQL (AWS RDS for MySQL)**.
- **Frontend**: Developed using **React.js** for a responsive and dynamic user experience.

## Tech Stack
- **Backend**: Node.js (Express.js), MySQL (AWS RDS)
- **Frontend**: React.js
- **Security**: Password hashing (bcrypt), SQL injection testing
- **Hosting**: AWS

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/NodeReactMySQLStudentPortal.git
   cd NodeReactMySQLStudentPortal
   ```
2. Install Dependencies:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```
4. Set up environment variables (.env file in backend):
   ```bash
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   ```
5. Start the backend:
   ```bash
   cd backend
   node server.js
   ```
## Vulnerability Testing Instructions

   **SQL injection can be tested** by switching:
   ```bash
   const secure = false;  // Change to true for secure mode
   in the backend's server.js file.
   ```
   
**Testing SQL Injection**
Send an **HTTP POST request** to:
   ```bash
   const secure = false;  // Change to true for secure mode
   in the backend's server.js file.
   ```
With the following JSON payload:
   ```bash
   {
     "email": "' OR 1=1 --",
     "password": "randomtext"
   }
   ```
This simulates a SQL Injection attack when **secure = false** and should allow authentication **without** valid credentials.
