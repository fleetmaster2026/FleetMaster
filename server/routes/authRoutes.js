const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/db");
const { JWT_SECRET, authenticate } = require("../middleware/auth");

// =========================
// LOGIN
// =========================
router.post("/login", (req, res) => {

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    (err, user) => {

      if (err) {
        return res.status(500).json({ error: "Server error." });
      }

      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ error: "Invalid username or password." });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      res.json({
        token,
        username: user.username,
        role: user.role
      });

    }
  );

});

// =========================
// CURRENT USER (used to validate a stored token on app load)
// =========================
router.get("/me", authenticate, (req, res) => {
  res.json(req.user);
});

module.exports = router;
