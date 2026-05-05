require("dotenv").config();

// server/server.js
const express = require("express");
const path = require("path");
const { Pool } = require("pg"); // assuming Postgre
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

console.log("DATABASE_URL =", process.env.DATABASE_URL);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Connection ---
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

console.log("Postgres pool initialized");

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../public"))); // serves your html/css/js files

const eventRoutes = require("./routes/events");
const friendRoutes = require("./routes/friends");
const messageRoutes = require("./routes/messages");

app.use("/api/events", eventRoutes(db));
app.use("/api/friends", friendRoutes(db));
app.use("/api/messages", messageRoutes(db));

// ---Authentication Routes ---
app.post("/login", async (req, res) => { // Login
    const { username, password } = req.body; // user enters a pass, form in login.html sends it here, express receives it, next line grabs the form data

    const result = await db.query(
        "SELECT * FROM users WHERE username = $1",
        [username]
    );

    const user = result.rows[0];
    
    if (!user) {
        return res.status(401).json({ success: false });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return res.status(401).json({ success: false });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({ success: true, token, username: user.username });
});

app.post("/register", (req, res) => { // Register
    const { username, password } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query(
        "INSERT INTO users (username, password) VALUES ($1, $2)",
        [username, hashedPassword],
        (err) => {
            if (err) return res.json({ success: false, message: "Username already exists" });
            res.json({ success: true });
        }
    );
});

// --- Serve HTML views ---
app.get("/main", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/main.html")); // change to your main page
});

app.get("/friends", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/friends.html")); // change to your friends page
})

app.get("/schedule", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/schedule.html")); // change to your schedule page
})

app.get("/contact", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/contact.html")); // change to your contact page
});

app.listen(PORT, () => { // Start server
    console.log(`Server running on http://localhost:${PORT}`);
});
