const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");

module.exports = (db) => {

// Create event
router.post("/", requireAuth, (req, res) => {
    const { title, description, start_time, end_time, visibility } = req.body;

    db.query(
        "INSERT INTO events (user_id, title, description, start_time, end_time, visibility) VALUES (?, ?, ?, ?, ?, ?)",
        [req.session.userId, title, description, start_time, end_time, visibility],
        (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        }
    );
});

// Get my events
router.get("/", requireAuth, (req, res) => {
    db.query(
        "SELECT * FROM events WHERE user_id = ?",
        [req.session.userId],
        (err, results) => {
            if (err) return res.status(500).json({ success: false });
            res.json(results);
        }
    );
});

return router;
};
