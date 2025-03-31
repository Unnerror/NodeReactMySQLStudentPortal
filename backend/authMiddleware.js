const db = require("./db"); // ✅ Import your database connection

// ✅ Role-Based Middleware
const authRequired = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Check user's role from the database
        db.query(
            "SELECT role_id FROM users WHERE id = ?",
            [req.session.userId],
            (err, result) => {
                if (err || result.length === 0) {
                    return res.status(403).json({ error: "Forbidden" });
                }

                const userRole = result[0].role_id;

                // Check if the user's role is allowed
                if (requiredRoles.length === 0 || requiredRoles.includes(userRole)) {
                    next(); // ✅ Proceed to next middleware or route
                } else {
                    return res.status(403).json({ error: "Access Denied" });
                }
            }
        );
    };
};

module.exports = authRequired;
