/**
 * One-off helper - run this once from the `server` folder:
 *
 *   node resetAdminPassword.js
 *
 * It will:
 *   1. Print every account currently in the `users` table (username + role)
 *      so you can see exactly what exists - no guessing.
 *   2. Force-reset the `admin` account's password to: admin123
 *      (creates the account if it's somehow missing instead of just failing).
 *
 * Safe to delete this file afterwards.
 */

const bcrypt = require("bcryptjs");
const db = require("./database/db");

const NEW_PASSWORD = "admin123";

setTimeout(() => {

  db.all(`SELECT id, username, role, createdAt FROM users`, [], (err, rows) => {

    if (err) {
      console.error("Could not read users table:", err.message);
      process.exit(1);
    }

    console.log("\n--- Current accounts in fleetmaster.db ---");
    if (!rows.length) {
      console.log("(none found - users table is empty)");
    } else {
      rows.forEach((r) =>
        console.log(`  id=${r.id}  username="${r.username}"  role=${r.role}`)
      );
    }
    console.log("-------------------------------------------\n");

    const hash = bcrypt.hashSync(NEW_PASSWORD, 10);

    db.get(`SELECT id FROM users WHERE username = 'admin'`, [], (err2, existing) => {

      if (err2) {
        console.error("Lookup failed:", err2.message);
        process.exit(1);
      }

      if (existing) {
        db.run(
          `UPDATE users SET passwordHash = ? WHERE username = 'admin'`,
          [hash],
          (updateErr) => {
            if (updateErr) {
              console.error("Reset failed:", updateErr.message);
            } else {
              console.log(`✅ 'admin' password has been reset to: ${NEW_PASSWORD}`);
            }
            process.exit(0);
          }
        );
      } else {
        db.run(
          `INSERT INTO users (username, passwordHash, role) VALUES ('admin', ?, 'admin')`,
          [hash],
          (insertErr) => {
            if (insertErr) {
              console.error("Creation failed:", insertErr.message);
            } else {
              console.log(`✅ 'admin' account created with password: ${NEW_PASSWORD}`);
            }
            process.exit(0);
          }
        );
      }

    });

  });

}, 800); // small delay to let db.js finish its own table setup first
