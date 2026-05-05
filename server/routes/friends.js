// server/routes/friends.js
const express = require("express");
const router = express.Router();
const { requireAuthAPI } = require("../middleware/auth");

module.exports = (db) => {

// Send Friend Request
router.post("/request", requireAuthAPI, (req, res) => {
    const { userId } = req.body;

    if (Number(userId) === req.user.id) {
        return res.status(400).json({ success: false, message: "Cannot add yourself as a friend" });
    }

    // Check if a friendship or a pending request already exists in either direction
    db.query(
        `SELECT * FROM friendships
        WHERE (requester_id = $1 AND addressee_id = $2)
            OR (requester_id = $2 AND addressee_id = $1)`,
        [req.user.id, userId],
        (err, results) => {
            if (err) return res.status(500).json({ success: false, message: "Database error" });

            if (results.length > 0) {
                return res.status(400).json({ success: false, message: "Friend request already exists or you are already friends" });
            }

            // Insert the new friend request
            db.query(
                "INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'pending')",
                [req.user.id, userId],
                (err) => {
                    if (err) return res.status(400).json({ success: false, message: "Friend request already exists" });
                    res.json({ success: true });
                }
            );
        }
    ); 
});

// Get pending friend requests for current user
router.post("/pending", requireAuthAPI, async (req, res) => {
    const userId = req.user.id;

    try {
        const receieved = await db.query(`
            SELECT f.id AS requestId, u.id AS userId, u.username
            FROM friendships f
            JOIN users u ON f.requester_id = u.id
            WHERE f.addressee_id = $1 AND f.status = 'pending'
        `, [userId]);

        const sent = await db.query(`
            SELECT f.id AS requestId, u.id AS userId, u.username
            FROM friendships f
            JOIN users u ON f.addressee_id = u.id
            WHERE f.requester_id = $1 AND f.status = 'pending'
        `, [userId]);
    } catch (err) {
        res.status(500).json({ success: false });
    }

    res.json({ received: received.rows, sent: sent.rows });
});

// Accept a friend request
router.post("/accept", requireAuthAPI, (req, res) => {
    const { requestId } = req.body;

    db.query(
        "UPDATE friendships SET status = 'accepted' WHERE id = $1 AND addressee_id = $2",
        [requestId, req.user.id],
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
        "DELETE FROM friendships WHERE id = $1 AND addressee_id = $2",
        [requestId, req.user.id],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: "Failed to decline friend request" });
            res.json({ success: true });
        }
    );
});

// GET /api/friends --> list accepted friends of current user
router.get("/", requireAuthAPI, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT u.id, u.username
            FROM friendships f
            JOIN users u
            ON (u.id = f.requester_id OR u.id = f.addressee_id)
            WHERE (f.requester_id = $1 OR f.addressee_id = $2)
            AND f.status = 'accepted'
            AND u.id != $1`,
            [req.user.id, req.user.id],
        );

        res.json(result.rows);
    } catch (err) {
        console.error("DB ERROR:", err);
        res.status(500).json({ success: false });
    }
});

// Search users by username
router.get("/search", requireAuthAPI, (req, res) => {
    const { username } = req.query;

    db.query(
        "SELECT id, username FROM users WHERE username LIKE $1 and id != $2",
        [`%${username}%`, req.user.id],
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
        WHERE (f.requester_id = $1 OR f.addressee_id = $2)
            AND f.status = 'accepted'
            AND u.id != $1
            AND u.last_active >= NOW() - INTERVAL '2 minutes'`,
        [req.user.id, req.user.id, req.user.id],
        (err, results) => {
            if (err) return res.status(500).json({ success: false });
            res.json(results);
        }
    );
});

router.get("/ping", requireAuthAPI, (req, res) => {
    db.query(
        "UPDATE users SET last_active = NOW() WHERE id = $1",
        [req.user.id],
        (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        }
    );
});

    return router;
};
