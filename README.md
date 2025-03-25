# NodeReactMySQLStudentPortal

## Description
NodeReactMySQLStudentPortal is a secure student portal built with a modern web development stack. It allows students and teachers to register, log in, and manage course participation. This project serves as a **proof-of-concept** for comparing Node.js + React vs. Django + Angular stacks, with a strong emphasis on **cybersecurity** practices such as session management, 2FA, and secure password handling.


## ✅ Features
- 🔐 Secure Login & Registration with bcrypt-hashed passwords

- 🔁 Two-Factor Authentication (2FA) via email

- 🔑 Session-Based Authentication using express-session

- 🔄 Password Reset Flow with secure tokens and expiration

- 🧪 SQL Injection Testing Mode

- 🧾 Role-Based Structure for future Student/Teacher access

- 🌐 HTTPS Enabled using custom SSL certificates

- 📦 Modular architecture with React frontend + Node/Express backend + MySQL

## 🛠️ Tech Stack
- Backend:	Node.js, Express.js
  
- Frontend:	React.js
  
- Database:	MySQL (AWS RDS ready)
  
- Security:	bcrypt, express-session
  
- Email:	Nodemailer + Gmail
  
- Protocol:	HTTPS with SSL certs

## ⚙️ Installation
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
3. Environment Variables:
   backend/.env
   ```bash
   DB_HOST=your_database_host
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_database
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_gmail_app_password
   SESSION_SECRET=thisisaverysecretkey
   REACT_APP_API_URL=https://localhost:3000
   ```
   frontend/.env
      ```bash
   SKIP_PREFLIGHT_CHECK=true
   HTTPS=true
   PORT=3000
   SSL_CRT_FILE=../backend/ssl/server.cert
   SSL_KEY_FILE=../backend/ssl/server.key
   REACT_APP_BACKEND_URL=https://localhost:3443
   ```
4. Start backend:
   ```bash
   cd backend
   node server.js
   ```
5. Start frontend:
   ```bash
   cd frontend
   npm start
   ```
## 🔐 Security Features

- ✅ 2FA via Email
   When a user logs in successfully with email & password, a 6-digit verification code is sent to their email.
   
   The code expires after 10 minutes.
   
   The code is verified on /verify-2fa before allowing access.

- 🔁 Password Reset with Tokens
   Users can request a password reset via /forgot-password.
   
   A secure UUID token is generated and stored with a 1-hour expiry.
   
   A reset link is emailed with a ?token=... parameter.
   
   Upon submission of a new password, the token is validated and deleted to prevent reuse.

- 🧠 Sessions with express-session
   User sessions are managed using express-session.
   
   Session cookies are:
   
   HttpOnly: inaccessible to JS
   
   Secure: sent only over HTTPS
   
   Expire after 1 hour
   
   Sessions are checked on /api/dashboard-data for route protection.

- 🌐 HTTPS + SSL
   The app runs both frontend and backend over HTTPS using custom SSL certificates stored in backend/ssl.
   
   You must accept the self-signed certificate in your browser.
<!--   
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
-->
