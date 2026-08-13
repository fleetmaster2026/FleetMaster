const db = require("../database/db");

// ============================
// Get Settings
// ============================
exports.getSettings = (req, res) => {
    db.get(
        "SELECT * FROM settings WHERE id = 1",
        [],
        (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to fetch settings"
                });
            }

            res.json(row);
        }
    );
};

// ============================
// Update Settings
// ============================
exports.updateSettings = (req, res) => {

    const {
        company_name,
        address,
        phone,
        email,
        gst_number,
        theme,
        currency,
        date_format,
        rows_per_page
    } = req.body;

    db.run(
        `UPDATE settings SET
            company_name=?,
            address=?,
            phone=?,
            email=?,
            gst_number=?,
            theme=?,
            currency=?,
            date_format=?,
            rows_per_page=?,
            updated_at=CURRENT_TIMESTAMP
        WHERE id=1`,
        [
            company_name,
            address,
            phone,
            email,
            gst_number,
            theme,
            currency,
            date_format,
            rows_per_page
        ],
        function (err) {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to update settings"
                });
            }

            res.json({
                success: true,
                message: "Settings updated successfully"
            });

        }
    );
};

// ============================
// Upload Company Logo
// ============================
exports.uploadLogo = (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded."
        });
    }

    const logoPath = `/uploads/logos/${req.file.filename}`;

    db.run(
        "UPDATE settings SET company_logo=? WHERE id=1",
        [logoPath],
        function (err) {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to save logo."
                });
            }

            res.json({
                success: true,
                logo: logoPath
            });

        }
    );
};