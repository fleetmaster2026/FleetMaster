const express = require("express");
const router = express.Router();

const db = require("../database/db");

// ================= GET =================

router.get("/", (req, res) => {
  db.all(
    "SELECT * FROM breakdowns ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: err.message,
          code: err.code,
        });
      }

      res.json(rows);
    }
  );
});

// ================= ADD =================

router.post("/", (req, res) => {
  console.log("POST HIT");
  console.log(req.body);

  const {
    businessUnit,
    projectCode,
    vehicleNo,
    vehicleName,
    vehicleType,
    site,
    engineer,
    breakdownDate,
    breakdownDays,
    breakdownType,
    breakdownDescription,
    requireFund,
    estimatedAmount,
    approvalStatus,
    remarks,
  } = req.body;

  db.run(
    `INSERT INTO breakdowns
    (
      businessUnit,
      projectCode,
      vehicleNo,
      vehicleName,
      vehicleType,
      site,
      engineer,
      breakdownDate,
      breakdownDays,
      breakdownType,
      breakdownDescription,
      requireFund,
      estimatedAmount,
      approvalStatus,
      remarks
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      businessUnit,
      projectCode,
      vehicleNo,
      vehicleName,
      vehicleType,
      site,
      engineer,
      breakdownDate,
      breakdownDays,
      breakdownType,
      breakdownDescription,
      requireFund,
      estimatedAmount,
      approvalStatus,
      remarks,
    ],
    function (err) {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: err.message,
          code: err.code,
          errno: err.errno,
        });
      }

      res.json({
        id: this.lastID,
        message: "Breakdown Added Successfully",
      });
    }
  );
});

// ================= UPDATE =================

router.put("/:id", (req, res) => {
  const {
    businessUnit,
    projectCode,
    vehicleNo,
    vehicleName,
    vehicleType,
    site,
    engineer,
    breakdownDate,
    breakdownDays,
    breakdownType,
    breakdownDescription,
    requireFund,
    estimatedAmount,
    approvalStatus,
    remarks,
  } = req.body;

  db.run(
    `UPDATE breakdowns SET
      businessUnit=?,
      projectCode=?,
      vehicleNo=?,
      vehicleName=?,
      vehicleType=?,
      site=?,
      engineer=?,
      breakdownDate=?,
      breakdownDays=?,
      breakdownType=?,
      breakdownDescription=?,
      requireFund=?,
      estimatedAmount=?,
      approvalStatus=?,
      remarks=?
    WHERE id=?`,
    [
      businessUnit,
      projectCode,
      vehicleNo,
      vehicleName,
      vehicleType,
      site,
      engineer,
      breakdownDate,
      breakdownDays,
      breakdownType,
      breakdownDescription,
      requireFund,
      estimatedAmount,
      approvalStatus,
      remarks,
      req.params.id,
    ],
    function (err) {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: err.message,
          code: err.code,
          errno: err.errno,
        });
      }

      res.json({
        message: "Breakdown Updated Successfully",
      });
    }
  );
});

// ================= DELETE =================

router.delete("/:id", (req, res) => {
  db.run(
    "DELETE FROM breakdowns WHERE id=?",
    [req.params.id],
    function (err) {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: err.message,
          code: err.code,
          errno: err.errno,
        });
      }

      res.json({
        message: "Breakdown Deleted Successfully",
      });
    }
  );
});

module.exports = router;