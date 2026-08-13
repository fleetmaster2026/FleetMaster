const fs = require("fs");
const path = require("path");

exports.backupDatabase = (req, res) => {

    const dbPath = path.join(__dirname, "../database/fleetmaster.db");
    const backupDir = path.join(__dirname, "../backups");

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

    const backupFile = path.join(
        backupDir,
        `fleetmaster_backup_${timestamp}.db`
    );

    fs.copyFile(dbPath, backupFile, (err) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Backup failed.",
            });
        }

        res.json({
            success: true,
            message: "Database backed up successfully.",
            file: backupFile,
        });

    });

};
// ===============================
// Get All Backups
// ===============================

exports.getBackups = (req, res) => {

    const fs = require("fs");
    const path = require("path");

    const backupDir = path.join(__dirname, "../backups");

    if (!fs.existsSync(backupDir)) {

        return res.json([]);

    }

    const backups = fs.readdirSync(backupDir)
        .filter(file => file.endsWith(".db"))
        .map(file => {

            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);

            return {

                name: file,
                size: (stats.size / 1024).toFixed(2) + " KB",
                created: stats.birthtime

            };

        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json(backups);

};
// ===============================
// Download Backup
// ===============================

exports.downloadBackup = (req, res) => {

    const fs = require("fs");
    const path = require("path");

    const fileName = req.params.fileName;

    const filePath = path.join(
        __dirname,
        "../backups",
        fileName
    );

    if (!fs.existsSync(filePath)) {

        return res.status(404).json({
            success: false,
            message: "Backup file not found."
        });

    }

    res.download(filePath);

};
// ===============================
// Delete Backup
// ===============================

exports.deleteBackup = (req, res) => {

    const fs = require("fs");
    const path = require("path");

    const fileName = req.params.fileName;

    const filePath = path.join(
        __dirname,
        "../backups",
        fileName
    );

    if (!fs.existsSync(filePath)) {

        return res.status(404).json({
            success: false,
            message: "Backup file not found."
        });

    }

    fs.unlink(filePath, (err) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: "Unable to delete backup."
            });

        }

        res.json({
            success: true,
            message: "Backup deleted successfully."
        });

    });

};
// ===============================
// Restore Backup
// ===============================

exports.restoreBackup = (req, res) => {

    const fs = require("fs");
    const path = require("path");

    const fileName = req.params.fileName;

    const backupPath = path.join(
        __dirname,
        "../backups",
        fileName
    );

    const dbPath = path.join(
        __dirname,
        "../database",
        "fleetmaster.db"
    );

    if (!fs.existsSync(backupPath)) {

        return res.status(404).json({
            success: false,
            message: "Backup file not found."
        });

    }

    fs.copyFile(backupPath, dbPath, (err) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: "Restore failed."
            });

        }

        res.json({
            success: true,
            message: "Database restored successfully."
        });

    });

};