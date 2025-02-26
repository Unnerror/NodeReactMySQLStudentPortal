CREATE DATABASE student_portal;

USE student_portal;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique user ID
    emailusers VARCHAR(100) UNIQUE NOT NULL,  -- User login (email)
    password_hash VARCHAR(255) NOT NULL,  -- Hashed password
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Timestamp of account creation
);

SELECT * FROM student_portal.users;

SELECT * FROM users WHERE email = '' OR 1=1 -- ';
