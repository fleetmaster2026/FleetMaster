const express = require("express");

const router = express.Router();

const databaseController = require("../controllers/databaseController");

// Backup Database
router.get("/backup", databaseController.backupDatabase);
router.get("/backups", databaseController.getBackups);
router.get(
    "/download/:fileName",
    databaseController.downloadBackup
);
router.delete(
    "/delete/:fileName",
    databaseController.deleteBackup
);
router.post(
    "/restore/:fileName",
    databaseController.restoreBackup
);
module.exports = router;