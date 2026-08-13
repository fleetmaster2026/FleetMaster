const db = require("../database/db");

function logEmail(data) {
  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT INTO email_logs
      (
        reminderDate,
        site,
        engineer,
        engineerEmail,
        vehicles,
        alerts,
        status,
        sentAt
      )
      VALUES (?,?,?,?,?,?,?,?)
      `,
      [
        new Date().toISOString().slice(0, 10),
        data.site,
        data.engineer,
        data.email,
        data.vehicles,
        data.alerts,
        data.status,
        new Date().toLocaleString(),
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

module.exports = logEmail;