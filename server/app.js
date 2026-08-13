const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database/db");

// =========================
// Routes
// =========================
const vehicleRoutes = require("./routes/vehicles");
const siteEngineerRoutes = require("./routes/siteEngineerRoutes");
const monthlyUtilisationRoutes = require("./routes/monthlyUtilisation");
const rtaDocumentRoutes = require("./routes/rtaDocuments");
const breakdownRoutes = require("./routes/breakdownRoutes");
const fineRoutes = require("./routes/fineRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const databaseRoutes = require("./routes/databaseRoutes");
// =========================
// Services
// =========================
// Note: rtaReminderService is no longer required here since automatic
// (cron) reminders are disabled. It's still used directly in
// routes/rtaDocuments.js for the manual "Send Reminder Emails" button.

const app = express();

// =========================
// Middlewares
// =========================
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// =========================
// API Routes
// =========================
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/site-engineers", siteEngineerRoutes);
app.use("/api/monthly-utilisation", monthlyUtilisationRoutes);
app.use("/api/rta-documents", rtaDocumentRoutes);
app.use("/api/breakdowns", breakdownRoutes);
app.use("/api/fines", fineRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/database", databaseRoutes);
// =========================
// Root
// =========================
app.get("/", (req, res) => {
    res.send("FleetMaster API Running");
});

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`🚀 Server running on port ${PORT}`);

    // Automatic (cron-based) RTA reminder emails are disabled.
    // Reminders now only send when an admin clicks "Send Reminder Emails"
    // on the RTA Documents page, which calls rtaReminderService.runNow()
    // directly (see routes/rtaDocuments.js, POST /send-reminders).
    console.log(
        "ℹ️  Automatic RTA email scheduler is disabled - use the " +
        "'Send Reminder Emails' button on RTA Documents to send manually."
    );

});