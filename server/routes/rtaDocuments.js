const express = require("express");
const router = express.Router();
const db = require("../database/db");
// =========================
// GET ALL RTA DOCUMENTS
// =========================

router.get("/", (req, res) => {
  db.all(
    "SELECT * FROM rta_documents ORDER BY vehicleNo ASC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.json(rows);
    }
  );
});

// =========================
// ADD RTA DOCUMENT
// =========================

router.post("/", (req, res) => {
  const {
    vehicleNo,
    site,
    engineer,

    rcExpiry,
    insuranceExpiry,
    fitnessExpiry,
    permitExpiry,
    pollutionExpiry,

    remarks,
  } = req.body;

  db.run(
    `INSERT INTO rta_documents
    (
      vehicleNo,
      site,
      engineer,

      rcExpiry,
      insuranceExpiry,
      fitnessExpiry,
      permitExpiry,
      pollutionExpiry,

      remarks
    )
    VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      vehicleNo,
      site,
      engineer,

      rcExpiry,
      insuranceExpiry,
      fitnessExpiry,
      permitExpiry,
      pollutionExpiry,

      remarks,
    ],
    function (err) {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        message: "RTA Document Added Successfully",
        id: this.lastID,
      });
    }
  );
});
// =========================
// UPDATE RTA DOCUMENT
// =========================

router.put("/:id", (req, res) => {
  const { id } = req.params;

  const {
    vehicleNo,
    site,
    engineer,

    rcExpiry,
    insuranceExpiry,
    fitnessExpiry,
    permitExpiry,
    pollutionExpiry,

    remarks,
  } = req.body;

  db.run(
    `UPDATE rta_documents
     SET
      vehicleNo=?,
      site=?,
      engineer=?,

      rcExpiry=?,
      insuranceExpiry=?,
      fitnessExpiry=?,
      permitExpiry=?,
      pollutionExpiry=?,

      remarks=?

     WHERE id=?`,
    [
      vehicleNo,
      site,
      engineer,

      rcExpiry,
      insuranceExpiry,
      fitnessExpiry,
      permitExpiry,
      pollutionExpiry,

      remarks,

      id,
    ],
    function (err) {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        message: "RTA Document Updated Successfully",
      });
    }
  );
});
// =========================
// DELETE RTA DOCUMENT
// =========================

router.delete("/:id", (req, res) => {
  db.run(
    "DELETE FROM rta_documents WHERE id=?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        message: "RTA Document Deleted Successfully",
      });
    }
  );
});

module.exports = router;