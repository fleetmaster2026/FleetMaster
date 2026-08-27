/**
 * One-off helper to create (or update) a login account from the command
 * line - since there's no in-app "manage users" screen yet.
 *
 * Usage (run from the `server` folder):
 *
 *   node createUser.js <username> <password> <role>
 *
 * <role> must be either "admin" (full add/edit/delete access) or
 * "user" (read-only: can view, search, filter, export & print, and use
 * Chat, but every Save/Update/Delete/Import button is hidden and the
 * server rejects any write attempt regardless).
 *
 * Example - create a read-only account for your friends:
 *   node createUser.js raviv secretpass123 user
 *
 * Safe to run again any time to change a password or role.
 */

const bcrypt = require("bcryptjs");
const db = require("./database/db");

const [, , username, password, role] = process.argv;

if (!username || !password || !role) {
  console.log("\nUsage: node createUser.js <username> <password> <role: admin|user>\n");
  process.exit(1);
}

if (role !== "admin" && role !== "user") {
  console.log('\nRole must be exactly "admin" or "user".\n');
  process.exit(1);
}

setTimeout(() => {
  const hash = bcrypt.hashSync(password, 10);

  db.get(`SELECT id FROM users WHERE username = ?`, [username], (err, existing) => {
    if (err) {
      console.error("Lookup failed:", err.message);
      process.exit(1);
    }

    if (existing) {
      db.run(
        `UPDATE users SET passwordHash = ?, role = ? WHERE username = ?`,
        [hash, role, username],
        (updateErr) => {
          if (updateErr) {
            console.error("Update failed:", updateErr.message);
          } else {
            console.log(`✅ Updated account "${username}" - role: ${role}`);
          }
          process.exit(0);
        }
      );
    } else {
      db.run(
        `INSERT INTO users (username, passwordHash, role) VALUES (?, ?, ?)`,
        [username, hash, role],
        (insertErr) => {
          if (insertErr) {
            console.error("Creation failed:", insertErr.message);
          } else {
            console.log(`✅ Created account "${username}" - role: ${role}`);
          }
          process.exit(0);
        }
      );
    }
  });
}, 800); // small delay to let db.js finish its own table setup first
