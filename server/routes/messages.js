const express = require("express");
const router = express.Router();
const { requireAuthAPI } = require("../middleware/auth");

module.exports = (db) => {

    router.post("/send", requireAuthAPI, (req, res) => {
        const { receiverId, message } = req.body;

        db.query(
            "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
            [req.session.userId, receiverId, message],
            (err) => {
                /*console.log("Sending message:", req.session.userId, receiverId, message);
                console.error(err);*/
                if (err) return res.status(500).json({ success: false });
                res.json({ success: true });
            }
        );
    });

    router.get("/:userId", requireAuthAPI, (req, res) => {
        const otherUserId = req.params.userId;
        const currentUserId = req.session.userId;

        db.query(
            `SELECT * FROM messages
            WHERE (sender_id = ? AND receiver_id = ?)
                OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC`,
            [currentUserId, otherUserId, otherUserId, currentUserId],
            (err, results) => {
                if (err) return res.status(500).json({ success: false });
                res.json(results);
            }
        );
    });

    return router;
}
