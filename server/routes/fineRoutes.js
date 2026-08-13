const express = require("express");
const router = express.Router();

const db = require("../database/db");

// ================= GET =================

router.get("/", (req, res) => {
  db.all(
    "SELECT * FROM fines ORDER BY id DESC",
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
  console.log(req.body);

  const {
  vehicleNo,
  projectCode,
  site,
  engineer,
  fineDate,
  fineReason,
  fineAmount,
  requireFund,
  remarks,
} = req.body;

  db.run(
    `INSERT INTO fines
    (
  vehicleNo,
  projectCode,
  site,
  engineer,
  fineDate,
  fineReason,
  fineAmount,
  requireFund,
  remarks
)
VALUES (?,?,?,?,?,?,?,?,?)`,
    [
  vehicleNo,
  projectCode,
  site,
  engineer,
  fineDate,
  fineReason,
  fineAmount,
  requireFund,
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
        message: "Fine Added Successfully",
      });
    }
  );
});

// ================= UPDATE =================

router.put("/:id", (req, res) => {
  const {
  vehicleNo,
  projectCode,
  site,
  engineer,
  fineDate,
  fineReason,
  fineAmount,
  requireFund,
  remarks,
} = req.body;
  db.run(
    `UPDATE fines SET
      vehicleNo=?,
        projectCode=?,
        site=?,
        engineer=?,
        fineDate=?,
        fineReason=?,
        fineAmount=?,
        requireFund=?,
        remarks=?
    WHERE id=?`,
    [
  vehicleNo,
  projectCode,
  site,
  engineer,
  fineDate,
  fineReason,
  fineAmount,
  requireFund,
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
        message: "Fine Updated Successfully",
      });
    }
  );
});

// ================= DELETE =================

router.delete("/:id", (req, res) => {
  db.run(
    "DELETE FROM fines WHERE id=?",
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
        message: "Fine Deleted Successfully",
      });
    }
  );
});

module.exports = router;