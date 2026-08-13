const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { normalizeObject } = require("../utility/textHelper");

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

  const data = normalizeObject(req.body);

  const {
    vehicleNo,
    vehicleName,
    vehicleType,
    owner,
    manufacturer,
    rcNumber,
    registeringRTO,
    registrationDate,
    chassisNo,
    engineNo,
    fuelType,
    projectCode,
    site,
    engineer,
    enableKm,
    enableHours,
    targetKm,
    targetHours,
  } = data;

  db.run(
    `INSERT INTO vehicles (
      vehicleNo,
      vehicleName,
      vehicleType,
      owner,
      manufacturer,
      rcNumber,
      registeringRTO,
      registrationDate,
      chassisNo,
      engineNo,
      fuelType,
      projectCode,
      site,
      engineer,
      enableKm,
      enableHours,
      targetKm,
      targetHours
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      vehicleNo,
      vehicleName,
      vehicleType,
      owner,
      manufacturer,
      rcNumber,
      registeringRTO,
      registrationDate,
      chassisNo,
      engineNo,
      fuelType,
      projectCode,
      site,
      engineer,
      enableKm,
      enableHours,
      targetKm,
      targetHours,
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

  const data = normalizeObject(req.body);

  const {
    vehicleNo,
    vehicleName,
    vehicleType,
    owner,
    manufacturer,
    rcNumber,
    registeringRTO,
    registrationDate,
    chassisNo,
    engineNo,
    fuelType,
    projectCode,
    site,
    engineer,
    enableKm,
    enableHours,
    targetKm,
    targetHours,
  } = data;

  db.run(
    `UPDATE vehicles SET
      vehicleNo=?,
      vehicleName=?,
      vehicleType=?,
      owner=?,
      manufacturer=?,
      rcNumber=?,
      registeringRTO=?,
      registrationDate=?,
      chassisNo=?,
      engineNo=?,
      fuelType=?,
      projectCode=?,
      site=?,
      engineer=?,
      enableKm=?,
      enableHours=?,
      targetKm=?,
      targetHours=?
    WHERE id=?`,
    [
      vehicleNo,
      vehicleName,
      vehicleType,
      owner,
      manufacturer,
      rcNumber,
      registeringRTO,
      registrationDate,
      chassisNo,
      engineNo,
      fuelType,
      projectCode,
      site,
      engineer,
      enableKm,
      enableHours,
      targetKm,
      targetHours,
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