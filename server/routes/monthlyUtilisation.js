const express = require("express");
const router = express.Router();
const db = require("../database/db");

// =========================
// GET ALL MONTHLY UTILISATION
// =========================
router.get("/", (req, res) => {
  db.all(
    "SELECT * FROM monthly_utilisation ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json(rows);
    }
  );
});

// =========================
// ADD MONTHLY UTILISATION
// =========================
router.post("/", (req, res) => {
  const {
    utilisationMonth,

    vehicleNo,
    site,
    engineer,

    openingKm,
    closingKm,
    diffKm,
    targetKm,
    kmUtilisation,

    openingHours,
    closingHours,
    diffHours,
    targetHours,
    hoursUtilisation,

    remarks,
  } = req.body;

  db.run(
    `
    INSERT INTO monthly_utilisation
    (
      utilisationMonth,

      vehicleNo,
      site,
      engineer,

      openingKm,
      closingKm,
      diffKm,
      targetKm,
      kmUtilisation,

      openingHours,
      closingHours,
      diffHours,
      targetHours,
      hoursUtilisation,

      remarks
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      utilisationMonth,

      vehicleNo,
      site,
      engineer,

      openingKm,
      closingKm,
      diffKm,
      targetKm,
      kmUtilisation,

      openingHours,
      closingHours,
      diffHours,
      targetHours,
      hoursUtilisation,

      remarks,
    ],
    function (err) {
      if (err) {
        console.error(err);
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
// UPDATE MONTHLY UTILISATION
// =========================
router.put("/:id", (req, res) => {
  const {
    utilisationMonth,

    vehicleNo,
    site,
    engineer,

    openingKm,
    closingKm,
    diffKm,
    targetKm,
    kmUtilisation,

    openingHours,
    closingHours,
    diffHours,
    targetHours,
    hoursUtilisation,

    remarks,
  } = req.body;

  db.run(
    `
    UPDATE monthly_utilisation SET

      utilisationMonth=?,

      vehicleNo=?,
      site=?,
      engineer=?,

      openingKm=?,
      closingKm=?,
      diffKm=?,
      targetKm=?,
      kmUtilisation=?,

      openingHours=?,
      closingHours=?,
      diffHours=?,
      targetHours=?,
      hoursUtilisation=?,

      remarks=?

    WHERE id=?
    `,
    [
      utilisationMonth,

      vehicleNo,
      site,
      engineer,

      openingKm,
      closingKm,
      diffKm,
      targetKm,
      kmUtilisation,

      openingHours,
      closingHours,
      diffHours,
      targetHours,
      hoursUtilisation,

      remarks,

      req.params.id,
    ],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json({
        success: true,
      });
    }
  );
});

// =========================
// DELETE MONTHLY UTILISATION
// =========================
router.delete("/:id", (req, res) => {
  db.run(
    "DELETE FROM monthly_utilisation WHERE id=?",
    [req.params.id],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json({
        success: true,
      });
    }
  );
});

module.exports = router;