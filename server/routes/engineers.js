const express = require("express");
const router = express.Router();
const db = require("../database/db");

// =========================
// GET ALL ENGINEERS
// =========================
router.get("/", (req, res) => {
  db.all(
    "SELECT * FROM engineers ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error("GET ERROR:", err);
        return res.status(500).json(err);
      }

      res.json(rows);
    }
  );
});

// =========================
// ADD ENGINEER
// =========================
router.post("/", (req, res) => {
  const {
    engineerName,
    employeeCode,
    mobile,
    email,
    designation,
    site,
    status,
  } = req.body;

  db.run(
    `INSERT INTO engineers
    (engineerName, employeeCode, mobile, email, designation, site, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      engineerName,
      employeeCode,
      mobile,
      email,
      designation,
      site,
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
// UPDATE ENGINEER
// =========================
router.put("/:id", (req, res) => {
  const {
    engineerName,
    employeeCode,
    mobile,
    email,
    designation,
    site,
    status,
  } = req.body;

  db.run(
    `UPDATE engineers SET
      engineerName = ?,
      employeeCode = ?,
      mobile = ?,
      email = ?,
      designation = ?,
      site = ?,
      status = ?
    WHERE id = ?`,
    [
      engineerName,
      employeeCode,
      mobile,
      email,
      designation,
      site,
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
// DELETE ENGINEER
// =========================
router.delete("/:id", (req, res) => {
  db.run(
    "DELETE FROM engineers WHERE id = ?",
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