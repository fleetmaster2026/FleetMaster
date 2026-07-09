const express = require("express");
const router = express.Router();
const db = require("../database/db");

// =========================
// GET ALL VEHICLES
// =========================
router.get("/", (req, res) => {
  db.all("SELECT * FROM vehicles ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error("GET ERROR:", err);
      return res.status(500).json(err);
    }

    res.json(rows);
  });
});

// =========================
// ADD VEHICLE
// =========================
router.post("/", (req, res) => {
  const {
    vehicleNo,
    vehicleName,
    vehicleType,
    manufacturer,
    model,
    rcNumber,
    registeringRTO,
    registrationDate,
    chassisNo,
    engineNo,
    fuelType,
    site,
    engineer,
    targetKm,
    targetHours,
    status,
  } = req.body;

  db.run(
    `INSERT INTO vehicles
    (
      vehicleNo,
      vehicleName,
      vehicleType,
      manufacturer,
      model,
      rcNumber,
      registeringRTO,
      registrationDate,
      chassisNo,
      engineNo,
      fuelType,
      site,
      engineer,
      targetKm,
      targetHours,
      status
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      vehicleNo,
      vehicleName,
      vehicleType,
      manufacturer,
      model,
      rcNumber,
      registeringRTO,
      registrationDate,
      chassisNo,
      engineNo,
      fuelType,
      site,
      engineer,
      targetKm,
      targetHours,
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
// UPDATE VEHICLE
// =========================
router.put("/:id", (req, res) => {
  const {
    vehicleNo,
    vehicleName,
    vehicleType,
    manufacturer,
    model,
    rcNumber,
    registeringRTO,
    registrationDate,
    chassisNo,
    engineNo,
    fuelType,
    site,
    engineer,
    targetKm,
    targetHours,
    status,
  } = req.body;

  db.run(
    `UPDATE vehicles SET
      vehicleNo=?,
      vehicleName=?,
      vehicleType=?,
      manufacturer=?,
      model=?,
      rcNumber=?,
      registeringRTO=?,
      registrationDate=?,
      chassisNo=?,
      engineNo=?,
      fuelType=?,
      site=?,
      engineer=?,
      targetKm=?,
      targetHours=?,
      status=?
    WHERE id=?`,
    [
      vehicleNo,
      vehicleName,
      vehicleType,
      manufacturer,
      model,
      rcNumber,
      registeringRTO,
      registrationDate,
      chassisNo,
      engineNo,
      fuelType,
      site,
      engineer,
      targetKm,
      targetHours,
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
// DELETE VEHICLE
// =========================
router.delete("/:id", (req, res) => {
  db.run(
    "DELETE FROM vehicles WHERE id=?",
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