const { normalizeObject } = require("../utility/textHelper");
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

  const data = normalizeObject(req.body);

  const {
    utilisationMonth,

    vehicleNo,
    projectCode,
    site,
    engineer,

    openingKm,
    closingKm,
    differenceKm,
    targetKm,
    kmUtilisation,

    openingHours,
    closingHours,
    differenceHours,
    targetHours,
    hoursUtilisation,

    remarks,
  } = data;

  db.run(
    `INSERT INTO monthly_utilisation
    (
      utilisationMonth,

      vehicleNo,
      projectCode,
      site,
      engineer,

      openingKm,
      closingKm,
      differenceKm,
      targetKm,
      kmUtilisation,

      openingHours,
      closingHours,
      differenceHours,
      targetHours,
      hoursUtilisation,

      remarks
    )
    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      utilisationMonth,

      vehicleNo,
      projectCode,
      site,
      engineer,

      openingKm,
      closingKm,
      differenceKm,
      targetKm,
      kmUtilisation,

      openingHours,
      closingHours,
      differenceHours,
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

  const data = normalizeObject(req.body);

  const {
    utilisationMonth,

    vehicleNo,
    projectCode,
    site,
    engineer,

    openingKm,
    closingKm,
    differenceKm,
    targetKm,
    kmUtilisation,

    openingHours,
    closingHours,
    differenceHours,
    targetHours,
    hoursUtilisation,

    remarks,
  } = data;

  db.run(
    `UPDATE monthly_utilisation SET

      utilisationMonth=?,

      vehicleNo=?,
      projectCode=?,
      site=?,
      engineer=?,

      openingKm=?,
      closingKm=?,
      differenceKm=?,
      targetKm=?,
      kmUtilisation=?,

      openingHours=?,
      closingHours=?,
      differenceHours=?,
      targetHours=?,
      hoursUtilisation=?,

      remarks=?

      WHERE id=?`,
    [
      utilisationMonth,

      vehicleNo,
      projectCode,
      site,
      engineer,

      openingKm,
      closingKm,
      differenceKm,
      targetKm,
      kmUtilisation,

      openingHours,
      closingHours,
      differenceHours,
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