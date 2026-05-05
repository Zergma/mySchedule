const express = require("express");
const router = express.Router();
const { requireAuthAPI } = require("../middleware/auth");

module.exports = (db) => {

    router.post("/send", requireAuthAPI, (req, res) => {
        const { receiverId, message } = req.body;

        db.query(
            "INSERT INTO messages (sender_id, receiver_id, message) VALUES ($1, $2, $3)",
            [req.user.id, receiverId, message],
            (err) => {
                /*console.log("Sending message:", req.user.id, receiverId, message);
                console.error(err);*/
                if (err) return res.status(500).json({ success: false });
                res.json({ success: true });
            }
        );
    });

    router.get("/:userId", requireAuthAPI, (req, res) => {
        const otherUserId = req.params.userId;
        const currentUserId = req.user.id;

        db.query(
            `SELECT * FROM messages
            WHERE (sender_id = $1 AND receiver_id = $2)
                OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC`,
            [currentUserId, otherUserId],
            (err, results) => {
                if (err) return res.status(500).json({ success: false });
                res.json(results);
            }
        );
    });

    return router;
}
