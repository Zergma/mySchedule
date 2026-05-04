// server/server.js
const express = require("express");
const session = require("express-session");
const path = require("path");
const mysql = require("mysql2"); // assuming mySQL
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Connection ---
const db = mysql.createConnection({
    host: "localhost",
    user: "website_user",
    password: "StrongPassword123!",
    database: "myschedule"
});

db.connect(err => {
    if (err) {
        console.error("DB connection error", err);
    } else {
        console.log("Connected to MySQL");
    }
});

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({ // server can remember users
    secret: "myschedule_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, sameSite: "lax" } // set to true if using HTTPS
}));

app.use(express.static(path.join(__dirname, "../public"))); // serves your html/css/js files

// --- Routes ---

function requireAuthPage(req, res, next) {
    // If it's a page request, redirect to login
    if (!req.session.userId) {
        return res.redirect("/login.html");
    }

    next();
}
function requireAuthAPI(req, res, next) {
    // Otherwise it's an API request
    if (!req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            message: "Unauthorized" 
        });
    }

    next(); // allow request to continue
}

const eventRoutes = require("./routes/events");
const friendRoutes = require("./routes/friends");
const messageRoutes = require("./routes/messages");

app.use("/api/events", eventRoutes(db));
app.use("/api/friends", friendRoutes(db));
app.use("/api/messages", messageRoutes(db));

// ---Authentication Routes ---
app.post("/login", (req, res) => { // Login
    const { username, password } = req.body; // user enters a pass, form in login.html sends it here, express receives it, next line grabs the form data

    // query the database for the user
    db.query("SELECT * FROM users WHERE username = ?",
        [username],
        (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        const user = results[0];

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }

        const match = bcrypt.compareSync(password, user.password); // if user found, compare the hashed password in DB with the one provided

        if (match) {
            req.session.userId = user.id; // store user ID in session
            req.session.username = user.username; // store username in session
            return res.json({ success: true });
        } else {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    });
});

app.post("/register", (req, res) => { // Register
    const { username, password } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hashedPassword],
        (err) => {
            if (err) return res.json({ success: false, message: "Username already exists" });
            res.json({ success: true });
        }
    );
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});

app.get("/session", (req, res) => { // Session check (used by main.js)
    if (req.session.userId) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get("/api/friends-with-events", async (req, res) => {
    const userId = req.session.userId;

    try { // 1. Get all friends
        const [friends] = await db.promise().query(`
            SELECT
                f.id AS friendship_id, f.pinned,
                u.id AS user_id, u.username,

                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM events e
                        WHERE e.user_id = u.id
                        AND NOW() BETWEEN e.start_time AND e.end_time
                    )
                    THEN FALSE
                    ELSE TRUE
                END as available

            FROM friendships f
            JOIN users u
                ON u.id = IF(f.requester_id = ?, f.addressee_id, f.requester_id)
                
            WHERE
                (f.requester_id = ? OR f.addressee_id= ?)
                AND f.status = 'accepted'
        `, [userId, userId, userId]);
        
        res.json(friends);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// --- Serve HTML views ---
app.get("/main", requireAuthPage, (req, res) => {
    res.sendFile(path.join(__dirname, "../views/main.html")); // change to your main page
});

app.get("/friends", requireAuthPage, (req, res) => {
    res.sendFile(path.join(__dirname, "../views/friends.html")); // change to your friends page
})

app.get("/schedule", requireAuthPage, (req, res) => {
    res.sendFile(path.join(__dirname, "../views/schedule.html")); // change to your schedule page
})

app.get("/contact", requireAuthPage, (req, res) => {
    res.sendFile(path.join(__dirname, "../views/contact.html")); // change to your contact page
});

app.post("/create-event", requireAuthAPI, (req, res) => {
    // Only logged in users can create events
});

app.listen(PORT, () => { // Start server
    console.log(`Server running on http://localhost:${PORT}`);
});
