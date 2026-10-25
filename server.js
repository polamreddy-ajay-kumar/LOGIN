require("dotenv").config();

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("Set SESSION_SECRET in your production environment.");
}

const db = new Database(path.join(__dirname, "users.db"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:"],
      scriptSrc: ["'self'"]
    }
  }
}));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));
app.use(session({
  name: "a4mp.sid",
  secret: process.env.SESSION_SECRET || "dev-only-change-this-session-secret-before-deploying",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8
  }
}));
app.use(express.static(path.join(__dirname, "public")));

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Please sign in first." });
  next();
}

app.post("/api/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: "Name must be between 2 and 80 characters." });
    }
    if (!emailPattern.test(email) || email.length > 254) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: "Password must be 8–128 characters long." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const insert = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
    let info;
    try {
      info = insert.run(name, email, passwordHash);
    } catch (e) {
      if (String(e.code).includes("SQLITE_CONSTRAINT")) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }
      throw e;
    }

    req.session.userId = Number(info.lastInsertRowid);
    res.status(201).json({ user: { id: Number(info.lastInsertRowid), name, email } });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ error: "Could not create your account. Please try again." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!emailPattern.test(email) || !password) {
      return res.status(400).json({ error: "Enter your email and password." });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    const valid = user && await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Email or password is incorrect." });

    req.session.userId = user.id;
    res.json({ user: safeUser(user) });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Sign in failed. Please try again." });
  }
});

app.get("/api/me", (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.json({ user: null });
  }
  res.json({ user });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) return res.status(500).json({ error: "Could not sign out." });
    res.clearCookie("a4mp.sid", { httpOnly: true, sameSite: "lax", secure: isProduction });
    res.json({ ok: true });
  });
});

app.get("/api/dashboard", requireAuth, (req, res) => {
  const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(req.session.userId);
  if (!user) return res.status(401).json({ error: "Please sign in again." });
  res.json({
    user,
    message: "Welcome to A4MP RAG Systems.",
    features: ["Private knowledge workspace", "Project files", "RAG assistant"]
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`A4MP RAG Systems running at http://localhost:${PORT}`);
});
