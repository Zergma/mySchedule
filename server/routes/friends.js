// server/routes/friends.js
const express = require("express");
const router = express.Router();
const { requireAuthAPI } = require("../middleware/auth");

module.exports = (db) => {

// Send Friend Request
router.post("/request", requireAuthAPI, (req, res) => {
    const { userId } = req.body;

    if (Number(userId) === req.session.userId) {
        return res.status(400).json({ success: false, message: "Cannot add yourself as a friend" });
    }

    // Check if a friendship or a pending request already exists in either direction
    db.query(
        `SELECT * FROM friendships
        WHERE (requester_id = ? AND addressee_id = ?)
            OR (requester_id = ? AND addressee_id = ?)`,
        [req.session.userId, userId, userId, req.session.userId],
        (err, results) => {
            if (err) return res.status(500).json({ success: false, message: "Database error" });

            if (results.length > 0) {
                return res.status(400).json({ success: false, message: "Friend request already exists or you are already friends" });
            }

            // Insert the new friend request
            db.query(
                "INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, 'pending')",
                [req.session.userId, userId],
                (err) => {
                    if (err) return res.status(400).json({ success: false, message: "Friend request already exists" });
                    res.json({ success: true });
                }
            );
        }
    ); 
});

// Get pending friend requests for current user
router.post("/pending", requireAuthAPI, (req, res) => {
    const userId = req.session.userId;
    const receivedQuery = `
        SELECT f.id AS requestId, u.id AS userId, u.username
        FROM friendships f
        JOIN users u ON f.requester_id = u.id
        WHERE f.addressee_id = ? AND f.status = 'pending'
    `;

    const sentQuery = `
        SELECT f.id AS requestId, u.id AS userId, u.username
        FROM friendships f
        JOIN users u ON f.addressee_id = u.id
        WHERE f.requester_id = ? AND f.status = 'pending'
    `;

    db.query(receivedQuery, [userId], (err, received) => {
        if (err) return res.status(500).json({ success: false });

        db.query(sentQuery, [userId], (err, sent) => {
            if (err) return res.status(500).json({ success: false });

            res.json({ received, sent });
        });
    });
    /*db.query(
        `SELECT f.id AS requestId, u.id AS userId, u.username
         FROM friendships f
         JOIN users u
         ON f.requester_id = u.id
         WHERE f.addressee_id = ? AND f.status = 'pending'`,
        [req.session.userId],
        (err, results) => {
            if (err) return res.status(500).json({ success: false, message: "DB error" });
            res.json(results); // returns array of pending requests
        }
    );*/
});

// Accept a friend request
router.post("/accept", requireAuthAPI, (req, res) => {
    const { requestId } = req.body;

    db.query(
        "UPDATE friendships SET status='accepted' WHERE id=? AND addressee_id=?",
        [requestId, req.session.userId],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: "Failed to accept friend request" });
            res.json({ success: true });
        }
    );
});

// Decline a friend request
router.post("/decline", requireAuthAPI, (req, res) => {
    const { requestId } = req.body;

    db.query(
        "DELETE FROM friendships WHERE id=? AND addressee_id=?",
        [requestId, req.session.userId],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: "Failed to decline friend request" });
            res.json({ success: true });
        }
    );
});

// GET /api/friends --> list accepted friends of current user
router.get("/", requireAuthAPI, (req, res) => {
    db.query(
        `SELECT u.id, u.username
        FROM friendships f
        JOIN users u
        ON (u.id = f.requester_id OR u.id = f.addressee_id)
        WHERE (f.requester_id = ? OR f.addressee_id = ?)
        AND f.status = 'accepted'
        AND u.id != ?`,
        [req.session.userId, req.session.userId, req.session.userId],
        (err, results) => {
            if (err) {
                console.error("DB ERROR:", err);
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json(results);
        }
    );
});

// Search users by username
router.get("/search", requireAuthAPI, (req, res) => {
    const { username } = req.query;

    db.query(
        "SELECT id, username FROM users WHERE username LIKE ? and id != ?",
        [`%${username}%`, req.session.userId],
        (err, results) => {
            if (err) return res.status(500).json({ success: false });
            res.json(results);
        }
    );
});

// GET /api/friends/online
router.get("/online", requireAuthAPI, (req, res) => {
    db.query(
        `SELECT u.id, u.username
        FROM friendships f
        JOIN users u
            on (u.id = f.requester_id OR u.id = f.addressee_id)
        WHERE (f.requester_id = ? OR f.addressee_id = ?)
            AND f.status = 'accepted'
            AND u.id != ?
            AND u.last_active >= NOW() - INTERVAL 2 MINUTE`,
        [req.session.userId, req.session.userId, req.session.userId],
        (err, results) => {
            if (err) return res.status(500).json({ success: false });
            res.json(results);
        }
    );
});

router.get("/ping", requireAuthAPI, (req, res) => {
    db.query(
        "UPDATE users SET last_active = NOW() WHERE id = ?",
        [req.session.userId],
        (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        }
    );
});

    return router;
};
