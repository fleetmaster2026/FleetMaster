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
// BULK REPLACE VEHICLES (Excel import)
// Wipes every existing vehicle and inserts the given list, all as ONE
// atomic transaction in a single round trip to the database - instead
// of the old approach of the frontend awaiting one delete/insert HTTP
// request per row, which took minutes and could freeze the browser tab
// on a large fleet, and left data half-imported if it failed partway.
// =========================
router.post("/bulk-replace", async (req, res) => {
  const incoming = Array.isArray(req.body.vehicles) ? req.body.vehicles : [];

  if (incoming.length === 0) {
    return res.status(400).json({ error: "No vehicles provided." });
  }

  try {
    const statements = [
      { sql: "DELETE FROM vehicles", args: [] },
      ...incoming.map((row) => {
        const data = normalizeObject(row);

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

        return {
          sql: `INSERT INTO vehicles (
            vehicleNo, vehicleName, vehicleType, owner, manufacturer,
            rcNumber, registeringRTO, registrationDate, chassisNo,
            engineNo, fuelType, projectCode, site, engineer,
            enableKm, enableHours, targetKm, targetHours
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [
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
        };
      }),
    ];

    await db.batch(statements);

    res.json({ success: true, added: incoming.length });
  } catch (err) {
    console.error("BULK REPLACE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
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