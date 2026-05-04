const express = require("express");
const router = express.Router();
const { requireAuthAPI } = require("../middleware/auth");

module.exports = (db) => {

// Create event
router.post("/", requireAuthAPI, (req, res) => {
    const { title, description, start_time, end_time, visibility, recurrence, color } = req.body;

    db.query(
        "INSERT INTO events (user_id, title, description, start_time, end_time, visibility, recurrence, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [req.session.userId, title, description, start_time, end_time, visibility, recurrence, color],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

// Get my events
router.get("/", requireAuthAPI, (req, res) => {
    db.query(
        "SELECT * FROM events WHERE user_id = ?",
        [req.session.userId],
        (err, results) => {
            if (err) return res.status(500).json({ success: false });
            res.json(results);
        }
    );
});
/*
// Backend route for dragging and dropping events
router.put("/:id", requireAuthAPI, (req, res) => {
    const { title, start_time } = req.body;

    db.query(
        "UPDATE events SET title = ?, start_time = ? WHERE id = ? AND user_id = ?",
        [title, start_time, req.params.id, req.session.userId],
        (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        }
    );
});*/

// Backend routes for edit/delete
router.delete("/:id", requireAuthAPI, (req, res) => {
    db.query(
        "DELETE FROM events WHERE id = ? AND user_id = ?",
        [req.params.id, req.session.userId],
        (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        }
    );
});

return router;
};
