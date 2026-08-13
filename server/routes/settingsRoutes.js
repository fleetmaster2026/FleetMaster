const upload = require("../middleware/uploadLogo");
const express = require("express");

const router = express.Router();

const settingsController = require("../controllers/settingsController");

// GET Settings
router.get("/", settingsController.getSettings);

// UPDATE Settings
router.put("/", settingsController.updateSettings);
router.post(
    "/upload-logo",
    upload.single("logo"),
    settingsController.uploadLogo
);

module.exports = router;
