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

db.run(`
CREATE TABLE IF NOT EXISTS monthly_utilisation (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    utilisationMonth TEXT,

    vehicleNo TEXT,
    site TEXT,
    engineer TEXT,

    openingKm REAL,
    closingKm REAL,
    differenceKm REAL,
    targetKm REAL,
    kmUtilisation REAL,

    openingHours REAL,
    closingHours REAL,
    differenceHours REAL,
    targetHours REAL,
    hoursUtilisation REAL,

    remarks TEXT
)
`);
// =========================
// RTA DOCUMENTS TABLE
// =========================

db.run(`
CREATE TABLE IF NOT EXISTS rta_documents (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    vehicleNo TEXT,
    site TEXT,
    engineer TEXT,

    rcExpiry TEXT,
    insuranceExpiry TEXT,
    fitnessExpiry TEXT,
    permitExpiry TEXT,
    pollutionExpiry TEXT,

    remarks TEXT
)
`);
});

module.exports = db;