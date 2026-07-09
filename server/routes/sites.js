const express = require("express");
const router = express.Router();
const db = require("../database/db");

// =========================
// GET ALL SITES
// =========================
router.get("/", (req, res) => {
  db.all("SELECT * FROM sites ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error("GET ERROR:", err);
      return res.status(500).json(err);
    }

    res.json(rows);
  });
});

// =========================
// ADD SITE
// =========================
router.post("/", (req, res) => {
  const {
    siteName,
    location,
    projectCode,
    status,
  } = req.body;

  db.run(
    `INSERT INTO sites
    (
      siteName,
      location,
      projectCode,
      status
    )
    VALUES (?,?,?,?)`,
    [
      siteName,
      location,
      projectCode,
      status,
    ],
    function (err) {
      if (err) {
        console.error("INSERT ERROR:", err);
        return res.status(500).json(err);
      }

      res.json({
        success: true,
        id: this.lastID,
      });
    }
  );
});

// =========================
// UPDATE SITE
// =========================
router.put("/:id", (req, res) => {
  const {
    siteName,
    location,
    projectCode,
    status,
  } = req.body;

  db.run(
    `UPDATE sites SET
      siteName=?,
      location=?,
      projectCode=?,
      status=?
    WHERE id=?`,
    [
      siteName,
      location,
      projectCode,
      status,
      req.params.id,
    ],
    function (err) {
      if (err) {
        console.error("UPDATE ERROR:", err);
        return res.status(500).json(err);
      }

      res.json({
        success: true,
      });
    }
  );
});

// =========================
// DELETE SITE
// =========================
router.delete("/:id", (req, res) => {
  db.run(
    "DELETE FROM sites WHERE id=?",
    [req.params.id],
    function (err) {
      if (err) {
        console.error("DELETE ERROR:", err);
        return res.status(500).json(err);
      }

      res.json({
        success: true,
      });
    }
  );
});

module.exports = router;