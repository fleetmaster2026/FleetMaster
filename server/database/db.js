require("dotenv").config();
const { createClient } = require("@libsql/client");

// ---------------------------------------------------------------------
// Turso (libSQL) connection.
//
// TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set as environment
// variables (locally in server/.env, and on Render under
// Environment). Get both from the Turso dashboard after creating your
// database.
// ---------------------------------------------------------------------
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error(
    "Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables."
  );
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

console.log("DATABASE: connecting to Turso at", process.env.TURSO_DATABASE_URL);

// ---------------------------------------------------------------------
// Compatibility shim.
//
// Every route/controller in this project was written against the
// classic `sqlite3` package's callback API:
//
//   db.run(sql, params, function (err) { ... this.lastID ... })
//   db.all(sql, params, (err, rows) => { ... })
//   db.get(sql, params, (err, row) => { ... })
//
// Turso's client (@libsql/client) is promise-based instead, with a
// different result shape. Rather than rewrite every call site across
// the project, this shim re-implements run/all/get/serialize with the
// exact same signatures and callback behavior, backed by Turso under
// the hood. Existing route/controller files do not need to change.
// ---------------------------------------------------------------------

function normalizeArgs(params) {
  // sqlite3 call sites in this project always pass either an array of
  // positional "?" params, or omit params entirely.
  if (!params || typeof params === "function") return [];
  return params;
}

const db = {
  run(sql, params, callback) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }
    const args = normalizeArgs(params);

    client
      .execute({ sql, args })
      .then((result) => {
        if (!callback) return;
        const context = {
          lastID:
            result.lastInsertRowid !== undefined &&
            result.lastInsertRowid !== null
              ? Number(result.lastInsertRowid)
              : undefined,
          changes: result.rowsAffected,
        };
        callback.call(context, null);
      })
      .catch((err) => {
        if (callback) callback.call({}, err);
        else console.error("db.run error:", err.message);
      });
  },

  all(sql, params, callback) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }
    const args = normalizeArgs(params);

    client
      .execute({ sql, args })
      .then((result) => {
        if (callback) callback(null, result.rows);
      })
      .catch((err) => {
        if (callback) callback(err);
        else console.error("db.all error:", err.message);
      });
  },

  get(sql, params, callback) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }
    const args = normalizeArgs(params);

    client
      .execute({ sql, args })
      .then((result) => {
        if (callback) callback(null, result.rows[0]);
      })
      .catch((err) => {
        if (callback) callback(err);
        else console.error("db.get error:", err.message);
      });
  },

  // The original code only used db.serialize(fn) to group the startup
  // CREATE TABLE / ALTER TABLE statements. Real sequencing for those is
  // handled separately below (setupSchema), so here we just run the
  // callback as-is for compatibility with any other db.serialize(...)
  // call elsewhere in the project.
  serialize(fn) {
    fn();
  },
};

// ---------------------------------------------------------------------
// Schema setup - runs once at startup, awaited in order so an ALTER
// TABLE never races ahead of the CREATE TABLE it depends on.
// Uses the raw client directly (not the shim above) so it can be
// cleanly awaited step by step.
// ---------------------------------------------------------------------

async function runSql(sql) {
  try {
    await client.execute(sql);
  } catch (err) {
    // Many of these are intentionally "safe to fail" migrations
    // (duplicate column, etc.) - mirror the old code's behavior of
    // swallowing those errors, but log anything unexpected.
    if (!/duplicate column|already exists/i.test(err.message)) {
      console.error("Schema step failed:", err.message);
    }
  }
}

async function setupSchema() {
  await runSql(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Auto-seed a default admin account (admin / admin123) the very first
  // time this runs against an empty users table, so login always works out
  // of the box. Change the password from a real account after first login.
  try {
    const existing = await client.execute(`SELECT COUNT(*) as count FROM users`);
    const count = Number(existing.rows[0]?.count ?? 0);
    if (count === 0) {
      const bcrypt = require("bcryptjs");
      const hash = bcrypt.hashSync("admin123", 10);
      await client.execute({
        sql: `INSERT INTO users (username, passwordHash, role) VALUES ('admin', ?, 'admin')`,
        args: [hash],
      });
      console.log("✅ Default admin account created (admin / admin123) - please change this password.");
    }
  } catch (err) {
    console.error("Admin auto-seed check failed:", err.message);
  }

  await runSql(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      role TEXT,
      message TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runSql(`
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
  `);
  await runSql(`ALTER TABLE vehicles ADD COLUMN projectCode TEXT`);
  await runSql(`ALTER TABLE vehicles ADD COLUMN owner TEXT`);

  await runSql(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      siteName TEXT,
      location TEXT,
      projectCode TEXT,
      status TEXT
    )
  `);

  await runSql(`
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

  await runSql(`
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
  `);
  await runSql(`ALTER TABLE monthly_utilisation ADD COLUMN projectCode TEXT`);

  await runSql(`
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
  `);
  await runSql(
    `ALTER TABLE rta_documents RENAME COLUMN rcExpiry TO registrationDate`
  );
  await runSql(`ALTER TABLE rta_documents ADD COLUMN taxExpiry TEXT`);
  await runSql(`ALTER TABLE rta_documents ADD COLUMN registeringRTO TEXT`);

  await runSql(`
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

  // Upgrade path for older breakdowns tables missing newer columns.
  try {
    const info = await client.execute(`PRAGMA table_info(breakdowns)`);
    const existingColumns = info.rows.map((c) => c.name);
    const requiredColumns = [
      { name: "businessUnit", type: "TEXT" },
      { name: "projectCode", type: "TEXT" },
      { name: "vehicleName", type: "TEXT" },
      { name: "vehicleType", type: "TEXT" },
      { name: "breakdownDays", type: "REAL" },
      { name: "approvalStatus", type: "TEXT" },
    ];
    for (const { name, type } of requiredColumns) {
      if (!existingColumns.includes(name)) {
        await runSql(`ALTER TABLE breakdowns ADD COLUMN ${name} ${type}`);
        console.log(`Added missing column '${name}' to breakdowns table`);
      }
    }
  } catch (err) {
    console.error("Failed to read breakdowns table info:", err.message);
  }

  await runSql(`
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
  `);
  await runSql(`ALTER TABLE fines ADD COLUMN projectCode TEXT`);

  await runSql(`
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
  `);
  await runSql(
    `ALTER TABLE site_engineers ADD COLUMN projectManagerName TEXT`
  );
  await runSql(`ALTER TABLE site_engineers ADD COLUMN pmContact TEXT`);
  await runSql(`ALTER TABLE site_engineers ADD COLUMN pmEmail TEXT`);

  await runSql(`
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
  `);
  console.log("✅ email_logs table ready");

  await runSql(`
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

  await runSql(`
    INSERT OR IGNORE INTO settings (
      id, company_name, company_logo, address, phone, email, gst_number,
      theme, currency, date_format, rows_per_page
    )
    VALUES (
      1, '', '', '', '', '', '', 'Light', '₹', 'DD/MM/YYYY', 10
    )
  `);

  console.log("SQLite (Turso) Connected");
}

setupSchema().catch((err) => {
  console.error("Database setup failed:", err.message);
});

module.exports = db;