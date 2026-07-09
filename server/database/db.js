const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
  path.join(__dirname, "fleetmaster.db"),
  (err) => {
    if (err) {
      console.error("Database Error:", err.message);
    } else {
      console.log("SQLite Connected");
    }
  }
);

db.serialize(() => {
  // =========================
  // VEHICLES TABLE
  // =========================
  db.run(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      vehicleNo TEXT,
      vehicleName TEXT,
      vehicleType TEXT,

      manufacturer TEXT,
      model TEXT,

      rcNumber TEXT,
      registeringRTO TEXT,
      registrationDate TEXT,

      chassisNo TEXT,
      engineNo TEXT,
      fuelType TEXT,

      site TEXT,
      engineer TEXT,

      targetKm INTEGER,
      targetHours INTEGER,

      status TEXT
    )
  `);

  // =========================
  // SITES TABLE
  // =========================
  db.run(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      siteName TEXT,
      location TEXT,
      projectCode TEXT,

      status TEXT
    )
  `);
  // =========================
// ENGINEERS TABLE
// =========================
db.run(`
  CREATE TABLE IF NOT EXISTS engineers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    engineerName TEXT NOT NULL,
    employeeCode TEXT,
    mobile TEXT,
    email TEXT,
    designation TEXT,
    site TEXT,
    status TEXT
  )
`);
// =========================
// MONTHLY UTILISATION TABLE
// =========================
// =========================
// MONTHLY UTILISATION TABLE
// =========================
db.run(`
  CREATE TABLE IF NOT EXISTS monthly_utilisation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    utilisationMonth TEXT,

    vehicleNo TEXT,
    site TEXT,
    engineer TEXT,

    openingKm INTEGER,
    closingKm INTEGER,
    diffKm INTEGER,
    targetKm INTEGER,
    kmUtilisation REAL,

    openingHours INTEGER,
    closingHours INTEGER,
    diffHours INTEGER,
    targetHours INTEGER,
    hoursUtilisation REAL,

    remarks TEXT
  )
`);
});

module.exports = db;