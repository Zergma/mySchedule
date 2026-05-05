const express = require("express");
const router = express.Router();
const { requireAuthAPI } = require("../middleware/auth");

module.exports = (db) => {

// Create event
router.post("/", requireAuthAPI, async (req, res) => {
    const { title, description, start_time, end_time, visibility, recurrence, color } = req.body;

    db.query(
        `INSERT INTO events (user_id, title, description, start_time, end_time, visibility, recurrence, color)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [req.user.id, title, description, start_time, end_time, visibility, recurrence, color],
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
router.get("/", requireAuthAPI, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM events WHERE user_id = $1",
            [req.user.id]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({success: false });
    }
});
/*
// Backend route for dragging and dropping events
router.put("/:id", requireAuthAPI, (req, res) => {
    const { title, start_time } = req.body;

    db.query(
        "UPDATE events SET title = ?, start_time = ? WHERE id = ? AND user_id = ?",
        [title, start_time, req.params.id, req.user.id],
        (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        }
    );
});*/

// Backend routes for edit/delete
router.delete("/:id", requireAuthAPI, async (req, res) => {
    try {
        await db.query(
            "DELETE FROM events WHERE id = $1 AND user_id = $2",
            [req.params.id, req.user.id]
        );

        res.json({ success: true })
    } catch (err){
        res.status(500).json({ success: false });
    }
});

return router;
};
