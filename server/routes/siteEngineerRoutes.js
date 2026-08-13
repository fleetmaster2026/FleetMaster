const { normalizeObject } = require("../utility/textHelper");
const express = require("express");
const router = express.Router();

const db = require("../database/db");

// ======================
// GET ALL
// ======================

router.get("/", (req, res) => {
  db.all(
    `SELECT * FROM site_engineers ORDER BY siteLocation, engineerName`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.json(rows);
    }
  );
});

// ======================
// ADD
// ======================

router.post("/", (req, res) => {
  const data = normalizeObject(req.body, [
  "email",
  "pmEmail",
  "mobile",
  "pmContact",
]);

const {
  siteLocation,
  projectCode,
  businessUnit,
  engineerName,
  mobile,
  email,
  designation,
  projectManagerName,
  pmContact,
  pmEmail,
} = data;

  // Status is no longer collected from the UI - the column stays in the
  // database for backward compatibility, but every new record defaults
  // to "Active".
  const status = "Active";

  db.run(
    `INSERT INTO site_engineers
    (
      siteLocation,
      projectCode,
      businessUnit,
      engineerName,
      mobile,
      email,
      designation,
      projectManagerName,
      pmContact,
      pmEmail,
      status
    )

    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,

    [
      siteLocation,
      projectCode,
      businessUnit,
      engineerName,
      mobile,
      email,
      designation,
      projectManagerName,
      pmContact,
      pmEmail,
      status,
    ],

    function (err) {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        id: this.lastID,
        message: "Record Added Successfully",
      });
    }
  );
});

// ======================
// UPDATE
// ======================

router.put("/:id", (req, res) => {
  const data = normalizeObject(req.body, [
  "email",
  "pmEmail",
  "mobile",
  "pmContact",
]);

const {
  siteLocation,
  projectCode,
  businessUnit,
  engineerName,
  mobile,
  email,
  designation,
  projectManagerName,
  pmContact,
  pmEmail,
} = data;

  db.run(
    `UPDATE site_engineers

    SET

      siteLocation=?,
      projectCode=?,
      businessUnit=?,
      engineerName=?,
      mobile=?,
      email=?,
      designation=?,
      projectManagerName=?,
      pmContact=?,
      pmEmail=?

    WHERE id=?`,

    [
      siteLocation,
      projectCode,
      businessUnit,
      engineerName,
      mobile,
      email,
      designation,
      projectManagerName,
      pmContact,
      pmEmail,
      req.params.id,
    ],

    function (err) {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        message: "Record Updated Successfully",
      });
    }
  );
});

// ======================
// DELETE
// ======================

router.delete("/:id", (req, res) => {
  db.run(
    `DELETE FROM site_engineers WHERE id=?`,
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        message: "Record Deleted Successfully",
      });
    }
  );
});

module.exports = router;