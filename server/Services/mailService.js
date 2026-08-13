const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify Gmail connection when server starts
transporter.verify((error) => {
  if (error) {
    console.log("❌ Email Error:", error);
  } else {
    console.log("✅ Gmail SMTP Connected");
  }
});

module.exports = transporter;