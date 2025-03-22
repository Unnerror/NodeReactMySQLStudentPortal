require("dotenv").config();

const secure = true;

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const db = require("./db");
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // email regex

const app = express();
app.use(cors());
app.use(express.json()); // Middleware for parsing JSON

// Testing email sender
/*
app.get('/test-email', async (req, res) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'danilasergienko@gmail.com', // or another test email
            subject: 'Test Email',
            text: 'Hello! This is a test email from Student Portal 🚀'
        });

        console.log('Email sent:', info.response);
        res.send('✅ Test email sent!');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('❌ Failed to send test email.');
    }
});
*/

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

        // Insert new user
        db.query("INSERT INTO users (email, password_hash) VALUES (?, ?)", [email, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });
            res.status(201).json({ message: "User registered successfully" });
        });
    });
});

// ✅ Login
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    // 🚨 Reject input that is not a valid email format
/*    if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }
*/
    console.log("🔍 Secure Mode:", secure);
    console.log("🔍 Query:", secure
        ? "SELECT * FROM users WHERE email = ?"
        : `SELECT * FROM users WHERE email = '${email}'`
    );

    const query = secure
        ? "SELECT * FROM users WHERE email = ?"  // ✅ SECURE Query
        : `SELECT * FROM users WHERE email = '${email}'`;  // ❌ VULNERABLE Query

    db.query(query, secure ? [email] : [], async (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.length === 0) return res.status(401).json({ error: "Invalid email or password" });

        const user = result[0];

        try {
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

            res.status(200).json({ message: "Login successful", safeMode: secure });

        } catch (error) {
            res.status(500).json({ error: "Server error" });
        }
    });
});

// ✅ Forgot Password
app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        // Find user by email
        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });
            if (result.length === 0) return res.status(404).json({ message: "User not found" });

            const userId = result[0].id;

            // Generate token and expiry
            const resetToken = uuidv4();
            const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            // Save token in DB
            db.query(
                `INSERT INTO password_reset_tokens (user_id, reset_token, reset_token_expires) VALUES (?, ?, ?)`,
                [userId, resetToken, resetTokenExpires],
                (err, result) => {
                    if (err) return res.status(500).json({ error: "Database error saving token" });

                    // Send reset email
                    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
                    transporter.sendMail({
                        from: 'your_email@gmail.com',
                        to: email,
                        subject: 'Password Reset',
                        html: `<p>You requested a password reset</p>
                               <p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`
                    }, (error, info) => {
                        if (error) {
                            console.error(error);
                            return res.status(500).json({ message: "Failed to send email" });
                        }
                        res.json({ message: "Password reset link sent to your email!" });
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

// Start Server
const PORT = process.env.PORT || 3001;

//app.listen(PORT, "localhost", () => console.log(`✅ Server running on port ${PORT}`));
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));



