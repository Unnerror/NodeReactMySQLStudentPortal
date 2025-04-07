require("dotenv").config();
const https = require('https');
const fs = require('fs');
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const session = require("express-session");
const authRequired = require("./authMiddleware");
const db = require("./db");



//--------------------------------
// Email service
//--------------------------------
// nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});



//--------------------------------
// HTTPS
//--------------------------------
// certificates
const sslOptions = {
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.cert'),
};

const app = express();



//--------------------------------
// Session Manager
//--------------------------------
// Using cookies
app.use(cors({
    origin: process.env.REACT_APP_API_URL, // your frontend
    credentials: true, // ✅ enable sending cookies
}));
app.use(express.json());

// ✅ Sessions Hanlding
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,         // only over HTTPS
        httpOnly: true,       // JS can't access
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

// ✅ Route for fetching user info after login
app.get("/api/auth-user", authRequired([]), (req, res) => {
    if (!req.session.userId) {
        console.log("❌ No session found. Redirecting to login.");
        return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`✅ Session found for user ID: ${req.session.userId}`);

    // Continue fetching user data
    const userId = req.session.userId;
    db.query(
        "SELECT email, role_id FROM users WHERE id = ?",
        [userId],
        (err, result) => {
            if (err || result.length === 0) {
                console.log("❌ Failed to fetch user data.");
                return res.status(500).json({ error: "Failed to fetch user data" });
            }

            const { email, role_id } = result[0];
            console.log(`✅ User found. Role ID: ${role_id}`);
            res.json({
                message: "User authenticated successfully!",
                userId,
                email,
                role_id,
            });
        }
    );
});



//--------------------------------
// Register, Login, Logout
//--------------------------------
// ✅ Validating email format from input
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// ✅ Register New User
app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    // 🚨 Reject input that is not a valid email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if email already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.length > 0) return res.status(400).json({ error: "Email already in use" });

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user with default role_id = 3 (student)
        db.query("INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, 3)", [email, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });
            res.status(201).json({ message: "User registered successfully" });
        });
    });
});

// ✅ Login + Sending 2FA
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1️⃣ Verify user
        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });
            if (result.length === 0) return res.status(401).json({ error: "Invalid email or password" });

            const user = result[0];

            // 2️⃣ Verify password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

            // 3️⃣ Generate 2FA Code
            const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
            const twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            // 4️⃣ Save 2FA Code in DB
            db.query(
                "UPDATE users SET two_factor_code = ?, two_factor_expires = ? WHERE id = ?",
                [twoFactorCode, twoFactorExpires, user.id],
                (err, result) => {
                    if (err) return res.status(500).json({ error: "Database error updating 2FA" });

                    // 5️⃣ ✅ Respond Immediately!
                    res.status(200).json({ message: "2FA code generated", userId: user.id });

                    // 6️⃣ ✅ Send email AFTER response
                    transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: "Your 2FA Login Code",
                        html: `<p>Your login verification code is: <strong>${twoFactorCode}</strong></p>`
                    }, (error, info) => {
                        if (error) {
                            console.error("❌ Error sending 2FA email:", error);
                        } else {
                            console.log("✅ 2FA email sent:", info.response);
                        }
                    });
                }
            );
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// ⚠️ UNSAFE LOGIN - SQL Injection vulnerable
app.post("/api/vuln-login", (req, res) => {
    const { email, password } = req.body;

    const sql = `SELECT * FROM users WHERE email = '${email}' AND password_hash = '${password}'`;
    // SELECT * FROM users WHERE email = '' OR 1=1 --  AND password_hash = 'qwer'
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ SQL Error:", err);
            return res.status(500).json({ error: "Internal error" });
        }

        if (results.length > 0) {
            // Simulate login success by creating a session
            req.session.userId = results[0].id;
            req.session.roleId = results[0].role_id;
            return res.json({ message: "Vulnerable login success" });
        }

        res.status(401).json({ error: "Login failed" });
    });
});

/*
' OR 1=1 --
qwer
*/

// ✅ Verify 2FA
app.post("/verify-2fa", (req, res) => {
    const { userId, code } = req.body;

    db.query("SELECT * FROM users WHERE id = ?", [userId], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.length === 0) return res.status(404).json({ error: "User not found" });

        const user = result[0];
        const currentTime = new Date();

        if (
            user.two_factor_code === code &&
            currentTime <= user.two_factor_expires
        ) {
            // ✅ 2FA Success. Clear the code and log them in.
            db.query(
                "UPDATE users SET two_factor_code = NULL, two_factor_expires = NULL WHERE id = ?",
                [userId]
            );

            // ✅ Set the session
            req.session.userId = user.id;
            console.log(`✅ Session created for user ID: ${user.id}`);

            res.json({ message: "2FA verified. Login successful!" });
        } else {
            res.status(400).json({ error: "Invalid or expired verification code." });
        }
    });
});

// ✅ Resend 2FA Code
app.post("/resend-2fa", async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        // 1️⃣ Lookup the user to get their email
        db.query("SELECT email FROM users WHERE id = ?", [userId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Database error finding user" });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            const userEmail = result[0].email;

            // 2️⃣ Generate new code + expiry
            const code = Math.floor(100000 + Math.random() * 900000); // 6-digit
            const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

            // 3️⃣ Update DB with new code
            db.query(
                "UPDATE users SET two_factor_code = ?, two_factor_expires = ? WHERE id = ?",
                [code, expires, userId],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: "Database error updating 2FA" });
                    }

                    // 4️⃣ Send email
                    transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: userEmail, // ✅ pulled from DB!
                        subject: "Your Login Verification Code",
                        html: `<p>Your new login verification code is: <strong>${code}</strong></p>`,
                    }, (error, info) => {
                        if (error) {
                            console.error(error);
                            return res.status(500).json({ error: "Failed to send email" });
                        }

                        console.log("✅ Resent 2FA code to:", userEmail);
                        res.json({ message: "2FA code resent successfully!" });
                    });
                }
            );
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Forgot Password
app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        // Step 1: Find user by email
        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });
            if (result.length === 0) return res.status(404).json({ message: "User not found" });

            const userId = result[0].id;

            // Step 2: Generate token and expiry
            const resetToken = uuidv4();
            const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            // Step 3: Save token in DB
            db.query(
                `INSERT INTO password_reset_tokens (user_id, reset_token, reset_token_expires) VALUES (?, ?, ?)`,
                [userId, resetToken, resetTokenExpires],
                (err, result) => {
                    if (err) return res.status(500).json({ error: "Database error saving token" });

                    // ✅ Step 4: Send immediate response to client!
                    res.json({ message: "Password reset link is being sent to your email!" });

                    // Step 5: Send the email in the background (non-blocking)
                    const resetUrl = `https://localhost:3000/reset-password?token=${resetToken}`;

                    transporter.sendMail({
                        from: 'your_email@gmail.com',
                        to: email,
                        subject: 'Password Reset',
                        html: `<p>You requested a password reset</p>
                   <p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`
                    }, (error, info) => {
                        if (error) {
                            console.error("❌ Failed to send email:", error);
                        } else {
                            console.log("✅ Password reset email sent:", info.response);
                        }
                    });
                }
            );
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong" });
    }
});

// ✅ Reset Password
app.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
    }

    try {
        // 1️⃣ Validate the reset token
        const [tokenResult] = await db.promise().query(
            "SELECT * FROM password_reset_tokens WHERE reset_token = ?",
            [token]
        );

        if (tokenResult.length === 0) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const resetTokenData = tokenResult[0];

        // 2️⃣ Check if token has expired
        const currentTime = new Date();
        if (currentTime > resetTokenData.reset_token_expires) {
            return res.status(400).json({ message: "Token has expired" });
        }

        const userId = resetTokenData.user_id;

        // 3️⃣ Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 4️⃣ Update user's password
        await db.promise().query(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            [hashedPassword, userId]
        );

        // 5️⃣ Delete the token after successful reset
        await db.promise().query(
            "DELETE FROM password_reset_tokens WHERE reset_token = ?",
            [token]
        );

        res.json({ message: "Password has been reset successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong" });
    }
});

// ✅ Logout
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: "Logout failed" });
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out" });
    });
});



//--------------------------------
// Roots for Roles
//--------------------------------
// ✅ Protect /api/admin with Admin Role Only (role_id = 1)
app.get("/api/admin", authRequired([1]), (req, res) => {
    res.json({ message: "Welcome Admin!" });
});

// ✅ Protect /api/teacher with Teacher & Admin Roles (role_id = 2)
app.get("/api/teacher", authRequired([2]), (req, res) => {
    res.json({ message: "Welcome Teacher!" });
});

// ✅ Protect /api/student with All Roles (role_id = 3)
app.get("/api/student", authRequired([3]), (req, res) => {
    res.json({ message: "Welcome Student!" });
});



//--------------------------------
// Courses and Roles management
//--------------------------------
// Available for all users
// ✅ Get all available courses
app.get("/api/courses", authRequired([1, 2, 3]), (req, res) => {
    db.query("SELECT id, title, description FROM courses", (err, results) => {
        if (err) {
            console.error("❌ Error fetching courses:", err);
            return res.status(500).json({ error: "Failed to fetch courses" });
        }

        res.json({ courses: results });
    });
});

// ✅ Courses search
app.get("/api/courses/search", authRequired([1, 2, 3]), (req, res) => {
    const search = `%${req.query.query || ""}%`;

    const sql = `
        SELECT 
            c.id AS course_id,
            c.title AS course_name,
            c.description AS course_desc,
            u.email AS teacher_email,
            COUNT(e.student_id) AS enrolled_count
        FROM courses c
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.title LIKE ? OR u.email LIKE ?
        GROUP BY c.id
        ORDER BY c.id
    `;

    db.query(sql, [search, search], (err, results) => {
        if (err) {
            console.error("❌ Failed to search courses:", err);
            return res.status(500).json({ error: "Failed to fetch courses" });
        }
        res.json(results);
    });
});




// ⚠️ Search - fully injectable & renders raw output
app.get("/api/vuln-courses/search", (req, res) => {
    const query = req.query.q || '';

    // removed GROUP BY and COUNT for now (vulnerable version only)
    const sql = `
        SELECT 
            courses.id, 
            courses.title, 
            courses.description, 
            users.email AS teacher_email,
            0 AS enrolled_count
        FROM courses
        LEFT JOIN users ON users.id = courses.teacher_id
        WHERE courses.title LIKE '%${query}%' OR users.email LIKE '%${query}%'
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Vulnerable Search SQL Error:", err);
            return res.status(500).json({ error: "Query failed" });
        }
        res.json(results);
    });
});
/*
// https://localhost:3000/vuln-search
/*
' ORDER BY 1 --
' UNION SELECT 1,2,3,4,5 --
' UNION SELECT 0, 'text', 'text', 'text', 0 --
' UNION SELECT 0, email, password_hash, 'text', 0 FROM users --
*/
/*
// ⚠️ UNSAFE COURSE SEARCH - UNION SQL Injection vulnerable
app.get("/api/vuln-courses/search", (req, res) => {
    const { query } = req.query;

    // If no query provided, return all courses (safe)
    if (!query) {
        const sql = `
            SELECT c.id, c.title, c.description, u.email AS teacher_email,
                (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_students
            FROM courses c
            LEFT JOIN users u ON c.teacher_id = u.id
        `;
        return db.query(sql, (err, results) => {
            if (err) {
                console.error("❌ Error fetching courses:", err);
                return res.status(500).json({ error: "Failed to fetch courses" });
            }
            res.json(results);
        });
    }

    // ⚠️ UNSAFE version with direct interpolation into SQL (vulnerable to UNION attacks)
    const unsafeQuery = `
        SELECT c.id, c.title, c.description, u.email AS teacher_email,
               (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_students
        FROM courses c
                 LEFT JOIN users u ON c.teacher_id = u.id
        WHERE c.title LIKE '%${query}%' OR u.email LIKE '%${query}%'
    `;

    db.query(unsafeQuery, (err, results) => {
        if (err) {
            console.error("❌ Vulnerable Search Error:", err);
            return res.status(500).json({ error: "Internal error" });
        }
        res.json(results);
    });
});
*/




// ADMIN
// Courses management
// ✅ Get all courses with optional teacher name
app.get("/api/admin/courses", authRequired([1]), (req, res) => {
    const sql = `
        SELECT c.id, c.title, c.description, u.id AS teacher_id, u.email AS teacher_email
        FROM courses c
        LEFT JOIN users u ON c.teacher_id = u.id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch courses" });
        res.json(results);
    });
});

// ✅ Get all teachers (for dropdown)
app.get("/api/admin/teachers", authRequired([1]), (req, res) => {
    db.query("SELECT id, email FROM users WHERE role_id = 2", (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch teachers" });
        res.json(results);
    });
});

// ✅ Add or update course
app.post("/api/admin/courses", authRequired([1]), (req, res) => {
    const { title, description, teacher_id } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
    }

    const query = teacher_id
        ? "INSERT INTO courses (title, description, teacher_id) VALUES (?, ?, ?)"
        : "INSERT INTO courses (title, description) VALUES (?, ?)";

    const params = teacher_id ? [title, description, teacher_id] : [title, description];

    db.query(query, params, (err, result) => {
        if (err) {
            console.error("❌ Failed to insert course:", err);
            return res.status(500).json({ error: "Failed to add course" });
        }

        console.log("✅ Course added successfully");
        res.status(201).json({ message: "Course added" });
    });
});

// ✅ Update course
app.put("/api/admin/courses/:id", authRequired([1]), (req, res) => {
    const courseId = req.params.id;
    const { title, description, teacher_id } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
    }

    const query = teacher_id
        ? "UPDATE courses SET title = ?, description = ?, teacher_id = ? WHERE id = ?"
        : "UPDATE courses SET title = ?, description = ?, teacher_id = NULL WHERE id = ?";

    const params = teacher_id
        ? [title, description, teacher_id, courseId]
        : [title, description, courseId];

    db.query(query, params, (err, result) => {
        if (err) {
            console.error("❌ Failed to update course:", err);
            return res.status(500).json({ error: "Failed to update course" });
        }

        console.log(`✅ Course ${courseId} updated`);
        res.json({ message: "Course updated" });
    });
});

// ✅ Delete course (with cleanup)
app.delete("/api/admin/courses/:id", authRequired([1]), (req, res) => {
    const courseId = req.params.id;

    // First, remove all enrollments referencing the course
    db.query("DELETE FROM enrollments WHERE course_id = ?", [courseId], (err) => {
        if (err) {
            console.error("❌ Failed to delete enrollments for course:", err);
            return res.status(500).json({ error: "Failed to clean up enrollments" });
        }

        // Then delete the course
        db.query("DELETE FROM courses WHERE id = ?", [courseId], (err) => {
            if (err) {
                console.error("❌ Error deleting course:", err);
                return res.status(500).json({ error: "Failed to delete course" });
            }

            res.json({ message: "Course deleted successfully" });
        });
    });
});

// ✅ Get course enrollments count
app.get("/api/admin/course-enrollments-count", authRequired([1]), (req, res) => {
    const sql = `
        SELECT course_id, COUNT(*) AS count
        FROM enrollments
        GROUP BY course_id
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Failed to fetch enrollment counts", err);
            return res.status(500).json({ error: "Failed to fetch enrollments" });
        }
        res.json(results); // [{ course_id: 1, count: 5 }, ...]
    });
});

// Students management
// Get all students
app.get("/api/admin/students", authRequired([1]), (req, res) => {
    db.query("SELECT id, email FROM users WHERE role_id = 3", (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch students" });
        res.json(results);
    });
});

// Get enrolled students for a course
app.get("/api/admin/courses/:id/students", authRequired([1]), (req, res) => {
    const courseId = req.params.id;
    db.query(
        `SELECT u.id, u.email FROM users u
         JOIN enrollments ce ON u.id = ce.student_id
         WHERE ce.course_id = ?`,
        [courseId],
        (err, results) => {
            if (err) return res.status(500).json({ error: "Failed to fetch enrolled students" });
            res.json(results);
        }
    );
});

// Add student to course
app.post("/api/admin/courses/:id/students", authRequired([1]), (req, res) => {
    const courseId = req.params.id;
    const { studentId } = req.body;
    db.query(
        "INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)",
        [courseId, studentId],
        (err) => {
            if (err) return res.status(500).json({ error: "Failed to enroll student" });
            res.status(201).json({ message: "Student enrolled" });
        }
    );
});

// Remove student from course
app.delete("/api/admin/courses/:courseId/students/:studentId", authRequired([1]), (req, res) => {
    const { courseId, studentId } = req.params;
    db.query(
        "DELETE FROM enrollments WHERE course_id = ? AND student_id = ?",
        [courseId, studentId],
        (err) => {
            if (err) return res.status(500).json({ error: "Failed to remove student" });
            res.json({ message: "Student removed" });
        }
    );
});

// Users management
// Get all users with roles
app.get("/api/admin/users", authRequired([1]), (req, res) => {
    const sql = `
        SELECT u.id, u.email, u.role_id, r.role_name AS role_name
        FROM users u
                 LEFT JOIN roles r ON u.role_id = r.id
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Error fetching users:", err);
            return res.status(500).json({ error: "Failed to fetch users" });
        }
        res.json(results);
    });
});

// Get all roles
app.get("/api/admin/roles", authRequired([1]), (req, res) => {
    db.query("SELECT id, role_name FROM roles", (err, results) => {
        if (err) {
            console.error("❌ Failed to fetch roles:", err);
            return res.status(500).json({ error: "Failed to fetch roles" });
        }
        res.json(results);
    });
});

// Create user
/*
app.post("/api/admin/users", authRequired([1]), (req, res) => {
    const { email, role_id } = req.body;

    if (!email || !role_id) {
        return res.status(400).json({ error: "Email and role_id are required" });
    }

    db.query("INSERT INTO users (email, role_id) VALUES (?, ?)", [email, role_id], (err, result) => {
        if (err) {
            console.error("❌ Failed to create user:", err);
            return res.status(500).json({ error: "Failed to create user" });
        }
        res.status(201).json({ message: "User created", userId: result.insertId });
    });
});
*/

// Update user
app.put("/api/admin/users", authRequired([1]), (req, res) => {
    const { id, email, role_id } = req.body;

    if (!id || !email || !role_id) {
        return res.status(400).json({ error: "ID, email and role_id are required" });
    }

    db.query("UPDATE users SET email = ?, role_id = ? WHERE id = ?", [email, role_id, id], (err) => {
        if (err) {
            console.error("❌ Failed to update user:", err);
            return res.status(500).json({ error: "Failed to update user" });
        }
        res.json({ message: "User updated" });
    });
});

// Delete user
app.delete("/api/admin/users/:id", authRequired([1]), (req, res) => {
    const userId = req.params.id;

    db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
        if (err) {
            console.error("❌ Failed to delete user:", err);
            return res.status(500).json({ error: "Failed to delete user" });
        }
        res.json({ message: "User deleted" });
    });
});


// TEACHER
// ✅ Get courses where current teacher is assigned
app.get("/api/teacher/my-courses", authRequired([2]), (req, res) => {
    const teacherId = req.query.teacherId;

    const sql = `
        SELECT c.id, c.title, c.description,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_students
        FROM courses c
        WHERE c.teacher_id = ?
    `;

    db.query(sql, [teacherId], (err, results) => {
        if (err) {
            console.error("❌ Failed to fetch teacher's courses:", err);
            return res.status(500).json({ error: "Failed to fetch teacher's courses" });
        }
        res.json(results);
    });
});


// STUDENT
// ✅ Get courses where current student is enrolled
app.get("/api/student/enrollments", authRequired([3]), (req, res) => {
    const studentId = req.session.userId;

    const sql = `
        SELECT c.id, c.title, c.description, u.email AS teacher_email
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN users u ON c.teacher_id = u.id
        WHERE e.student_id = ?
    `;

    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("❌ Failed to fetch enrolled courses:", err);
            return res.status(500).json({ error: "Failed to fetch enrolled courses" });
        }
        res.json(results);
    });
});


//--------------------------------
// Start Server
//--------------------------------
https.createServer(sslOptions, app).listen(3443, () => {
    console.log('✅ HTTPS Server running on https://localhost:3443');
});