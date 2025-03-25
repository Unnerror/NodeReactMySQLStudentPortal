require("dotenv").config();

const https = require('https');
const fs = require('fs');
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const db = require("./db");

//const secure = true;

// nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// certificats
const sslOptions = {
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.cert'),
};

const app = express();

app.use(cors());
app.use(express.json());

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

        // Insert new user
        db.query("INSERT INTO users (email, password_hash) VALUES (?, ?)", [email, hashedPassword], (err, result) => {
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
/*app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.length === 0) return res.status(401).json({ error: "Invalid email or password" });

        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

        // Step 2: Generate 6-digit OTP
        const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6 digits
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // expires in 10 mins

        // Step 3: Save OTP & expiry in DB (You can also use a `user_verification_codes` table)
        db.query(
            "UPDATE users SET two_factor_code = ?, two_factor_expires = ? WHERE id = ?",
            [verificationCode, expiresAt, user.id],
            (err) => {
                if (err) return res.status(500).json({ error: "Database error updating 2FA" });

                // Step 4: Send the OTP via email
                transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: "Your 2FA Login Code",
                    text: `Your login verification code is: ${verificationCode}`
                }, (error, info) => {
                    if (error) {
                        console.error("Error sending 2FA email:", error);
                        return res.status(500).json({ message: "Failed to send verification email" });
                    }

                    res.json({ message: "Verification code sent to your email.", userId: user.id });
                });
            }
        );
    });
});
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

// Start Server
//const PORT = process.env.PORT || 3001;
https.createServer(sslOptions, app).listen(3443, () => {
    console.log('✅ HTTPS Server running on https://localhost:3443');
});