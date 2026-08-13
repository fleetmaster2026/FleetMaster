const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = path.join(__dirname, "../uploads/logos");

// Create folder if it doesn't exist
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        cb(
            null,
            "logo_" + Date.now() + path.extname(file.originalname)
        );
    }

});

const upload = multer({
    storage,

    fileFilter: (req, file, cb) => {

        const allowed = /jpg|jpeg|png|webp/i;

        const ext = path.extname(file.originalname);

        if (!allowed.test(ext)) {
            return cb(new Error("Only image files are allowed."));
        }

        cb(null, true);
    }
});

module.exports = upload;