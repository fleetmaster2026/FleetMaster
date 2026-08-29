const express = require("express");
const router = express.Router();
const db = require("../database/db");

// =========================
// GET recent messages (last 200, oldest first for display)
// =========================
router.get("/", (req, res) => {
  db.all(
    `SELECT id, username, role, message, createdAt
     FROM chat_messages
     ORDER BY id DESC
     LIMIT 200`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to load messages." });
      }
      res.json([...rows].reverse());
    }
  );
});

// =========================
// POST a new message - any logged-in user (admin or read-only) can chat
// =========================
router.post("/", (req, res) => {
  const { message } = req.body;
  const { username, role } = req.user;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  db.run(
    `INSERT INTO chat_messages (username, role, message) VALUES (?, ?, ?)`,
    [username, role, message.trim()],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to send message." });
      }
      res.json({ id: this.lastID, success: true });
    }
  );
});

// =========================
// DELETE a message - admin only (moderation)
// =========================
router.delete("/:id", (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only admins can delete messages." });
  }

  const { id } = req.params;

  db.run(`DELETE FROM chat_messages WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Failed to delete message." });
    }
    res.json({ success: true });
  });
});

module.exports = router;
