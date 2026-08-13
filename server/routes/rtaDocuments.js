const { normalizeObject } = require("../utility/textHelper");
const express = require("express");
const router = express.Router();
const db = require("../database/db");
const rtaReminderService = require("../Services/rtaReminderService");

// =========================
// SEND RTA REMINDER EMAILS NOW
// Runs the same scan the 8 AM cron job runs: emails every engineer who
// has documents due/overdue, then emails the admin a summary. Any
// engineer with no email on file is reported back as "Mail Not Found"
// instead of being sent anything.
// =========================

router.post("/send-reminders", async (req, res) => {
  try {
    const summary = await rtaReminderService.runNow();
    res.json({
      message: "Reminder run complete",
      summary,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to run RTA reminders",
      error: err.message,
    });
  }
});

// =========================
// GET ALL RTA DOCUMENTS
// =========================

// =========================
// GET ALL RTA DOCUMENTS
// =========================

router.get("/", (req, res) => {
  db.all(
    `
    SELECT
      r.*,
      s.email,
      s.engineerName
    FROM rta_documents r
    LEFT JOIN site_engineers s
      ON CAST(r.site AS TEXT) = CAST(s.projectCode AS TEXT)
      AND LOWER(TRIM(r.engineer)) = LOWER(TRIM(s.engineerName))
    ORDER BY r.vehicleNo ASC
    `,
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

  const data = normalizeObject(req.body);

  const {
    vehicleNo,
    registeringRTO,
    site,
    engineer,
    registrationDate,
    insuranceExpiry,
    fitnessExpiry,
    permitExpiry,
    pollutionExpiry,
    taxExpiry,
    remarks,
  } = data;

  db.run(
    `INSERT INTO rta_documents
    (
      vehicleNo,
      registeringRTO,
      site,
      engineer,
      registrationDate,
      insuranceExpiry,
      fitnessExpiry,
      permitExpiry,
      pollutionExpiry,
      taxExpiry,
      remarks
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      vehicleNo,
      registeringRTO,
      site,
      engineer,
      registrationDate,
      insuranceExpiry,
      fitnessExpiry,
      permitExpiry,
      pollutionExpiry,
      taxExpiry,
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

  const data = normalizeObject(req.body);

  const {
    vehicleNo,
    registeringRTO,
    site,
    engineer,
    registrationDate,
    insuranceExpiry,
    fitnessExpiry,
    permitExpiry,
    pollutionExpiry,
    taxExpiry,
    remarks,
  } = data;

  db.run(
    `UPDATE rta_documents
     SET
      vehicleNo=?,
      registeringRTO=?,
      site=?,
      engineer=?,
      registrationDate=?,
      insuranceExpiry=?,
      fitnessExpiry=?,
      permitExpiry=?,
      pollutionExpiry=?,
      taxExpiry=?,
      remarks=?
     WHERE id=?`,
    [
      vehicleNo,
      registeringRTO,
      site,
      engineer,
      registrationDate,
      insuranceExpiry,
      fitnessExpiry,
      permitExpiry,
      pollutionExpiry,
      taxExpiry,
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