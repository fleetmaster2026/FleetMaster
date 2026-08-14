const sqlite3 = require("sqlite3").verbose();
const dbPath = process.argv[2];

if (!dbPath) {
  console.error("Usage: node prepare-for-turso.js path\\to\\fleetmaster.db");
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error("Failed to open:", err.message);

  db.run("PRAGMA journal_mode=WAL;", (err) => {
    if (err) return console.error(err.message);
    db.run("PRAGMA wal_checkpoint(TRUNCATE);", (err) => {
      if (err) return console.error(err.message);
      console.log("Database is now WAL mode and ready to upload.");
      db.close();
    });
  });
});