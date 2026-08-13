const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "fleetmaster.db");

console.log("DATABASE PATH:", dbPath);

const db = new sqlite3.Database(dbPath,
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
      owner TEXT,

      manufacturer TEXT,
      model TEXT,

      rcNumber TEXT,
      registeringRTO TEXT,
      registrationDate TEXT,

      chassisNo TEXT,
      engineNo TEXT,
      fuelType TEXT,

      projectCode TEXT,
      site TEXT,
      engineer TEXT,

      targetKm INTEGER,
      targetHours INTEGER,

      status TEXT
    )
  `, () => {
    // Upgrade path for databases created before Project Code existed on
    // vehicles. sqlite has no "ADD COLUMN IF NOT EXISTS", so we just run
    // it and ignore the "duplicate column name" error on a
    // fresh/already-migrated database.
    db.run(`ALTER TABLE vehicles ADD COLUMN projectCode TEXT`, () => {});
    // Same upgrade path for the newer "owner" column.
    db.run(`ALTER TABLE vehicles ADD COLUMN owner TEXT`, () => {});
  });

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
    projectCode TEXT,
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
`, () => {
  // Upgrade path for databases created before Project Code existed on
  // monthly utilisation records. sqlite has no "ADD COLUMN IF NOT
  // EXISTS", so we just run it and ignore the "duplicate column name"
  // error on a fresh/already-migrated database.
  db.run(
    `ALTER TABLE monthly_utilisation ADD COLUMN projectCode TEXT`,
    () => {}
  );
});
// =========================
// RTA DOCUMENTS TABLE
// =========================

db.run(`
CREATE TABLE IF NOT EXISTS rta_documents (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    vehicleNo TEXT,
    registeringRTO TEXT,
    site TEXT,
    engineer TEXT,

    registrationDate TEXT,
    insuranceExpiry TEXT,
    fitnessExpiry TEXT,
    permitExpiry TEXT,
    pollutionExpiry TEXT,
    taxExpiry TEXT,
    remarks TEXT
)
`, () => {
  // Migration for existing databases created before this change:
  // "rcExpiry" (RC Expiry) is being repurposed into "registrationDate"
  // (Registration Date), which is now used to auto-calculate vehicle age.
  // sqlite has no "RENAME COLUMN IF EXISTS", so we just attempt it and
  // silently ignore the error on databases that are already migrated or
  // were freshly created with the new column name above.
  db.run(
    `ALTER TABLE rta_documents RENAME COLUMN rcExpiry TO registrationDate`,
    () => {}
  );
  // Older databases may also be missing the taxExpiry column entirely.
  db.run(`ALTER TABLE rta_documents ADD COLUMN taxExpiry TEXT`, () => {});
  // Older databases may also be missing the registeringRTO column,
  // which is now auto-fetched from Vehicle Master and stored alongside
  // each RTA record.
  db.run(`ALTER TABLE rta_documents ADD COLUMN registeringRTO TEXT`, () => {});
});
// ================= Breakdown Register =================

db.run(`
CREATE TABLE IF NOT EXISTS breakdowns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    businessUnit TEXT,
    projectCode TEXT,

    vehicleNo TEXT NOT NULL,
    vehicleName TEXT,
    vehicleType TEXT,

    site TEXT,
    engineer TEXT,

    breakdownDate TEXT,
    breakdownDays REAL,
    breakdownType TEXT,
    breakdownDescription TEXT,

    requireFund TEXT,
    estimatedAmount REAL,
    approvalStatus TEXT,

    remarks TEXT
)
`);

// Upgrade path for databases created before these columns existed.
// SQLite's CREATE TABLE IF NOT EXISTS above won't add columns to an
// already-existing table, so we add them here if missing. Each ALTER
// is safe to attempt repeatedly - errors (column already exists) are
// swallowed on purpose.
db.all(`PRAGMA table_info(breakdowns)`, [], (err, columns) => {
  if (err) {
    console.error("Failed to read breakdowns table info:", err.message);
    return;
  }

  const existingColumns = columns.map((c) => c.name);

  const requiredColumns = [
    { name: "businessUnit", type: "TEXT" },
    { name: "projectCode", type: "TEXT" },
    { name: "vehicleName", type: "TEXT" },
    { name: "vehicleType", type: "TEXT" },
    { name: "breakdownDays", type: "REAL" },
    { name: "approvalStatus", type: "TEXT" },
  ];

  requiredColumns.forEach(({ name, type }) => {
    if (!existingColumns.includes(name)) {
      db.run(
        `ALTER TABLE breakdowns ADD COLUMN ${name} ${type}`,
        (alterErr) => {
          if (alterErr) {
            console.error(
              `Failed to add column ${name} to breakdowns:`,
              alterErr.message
            );
          } else {
            console.log(`Added missing column '${name}' to breakdowns table`);
          }
        }
      );
    }
  });
});
db.run(`
CREATE TABLE IF NOT EXISTS fines (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    vehicleNo TEXT NOT NULL,

    projectCode TEXT,

    site TEXT,

    engineer TEXT,

    fineDate TEXT,

    fineReason TEXT,

    fineAmount REAL,

    requireFund TEXT,

    remarks TEXT

)
`, () => {
  // Upgrade path for databases created before Project Code existed on
  // fines. sqlite has no "ADD COLUMN IF NOT EXISTS", so we just run it
  // and ignore the "duplicate column name" error on a fresh/already-
  // migrated database.
  db.run(`ALTER TABLE fines ADD COLUMN projectCode TEXT`, () => {});
});
// =========================
// SITE & ENGINEER MASTER
// =========================

db.run(`
CREATE TABLE IF NOT EXISTS site_engineers (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    siteLocation TEXT,
    projectCode TEXT,
    businessUnit TEXT,

    engineerName TEXT,
    mobile TEXT,
    email TEXT,
    designation TEXT,

    projectManagerName TEXT,
    pmContact TEXT,
    pmEmail TEXT,

    status TEXT

)
`, () => {
  // These ALTER TABLE calls only matter for existing databases created
  // before the PM columns were added above. sqlite has no
  // "ADD COLUMN IF NOT EXISTS", so we just run them and ignore the
  // "duplicate column name" error on a fresh/already-migrated database.
  db.run(`ALTER TABLE site_engineers ADD COLUMN projectManagerName TEXT`, () => {});
  db.run(`ALTER TABLE site_engineers ADD COLUMN pmContact TEXT`, () => {});
  db.run(`ALTER TABLE site_engineers ADD COLUMN pmEmail TEXT`, () => {});
});
// EMAIL LOGS
// ====================================

db.run(`
CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reminderDate TEXT,
    site TEXT,
    engineer TEXT,
    engineerEmail TEXT,
    vehicles INTEGER,
    alerts INTEGER,
    status TEXT,
    sentAt TEXT
)
`, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("✅ email_logs table ready");
    }
});
db.run(`
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),

    company_name TEXT,
    company_logo TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    gst_number TEXT,

    theme TEXT DEFAULT 'Light',
    currency TEXT DEFAULT '₹',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    rows_per_page INTEGER DEFAULT 10,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);
db.run(`
INSERT OR IGNORE INTO settings (
    id,
    company_name,
    company_logo,
    address,
    phone,
    email,
    gst_number,
    theme,
    currency,
    date_format,
    rows_per_page
)
VALUES (
    1,
    '',
    '',
    '',
    '',
    '',
    '',
    'Light',
    '₹',
    'DD/MM/YYYY',
    10
)
`);
});

module.exports = db;