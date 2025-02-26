require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./db");
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // email regex
const secure = true;

const app = express();
app.use(cors());
app.use(express.json()); // Middleware for parsing JSON

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


// Start Server
const PORT = process.env.PORT || 3001;
//app.listen(PORT, "localhost", () => console.log(`✅ Server running on port ${PORT}`));
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));

