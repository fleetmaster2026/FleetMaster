/**
 * One-off helper - run this once from the `server` folder:
 *
 *   node cleanupDuplicates.js
 *
 * What it does:
 *   1. Prints how many rows are currently in `vehicles` and
 *      `rta_documents`, and how many distinct Vehicle Numbers exist.
 *   2. Shows you the top duplicated Vehicle Numbers (if any).
 *   3. Asks for confirmation, then removes duplicate rows in both
 *      tables - keeping only the newest row per Vehicle No (matched
 *      case/whitespace-insensitively) - everything else is deleted.
 *
 * This does NOT touch Site & Engineer, Breakdown, Fine, or Monthly
 * Utilisation records - only `vehicles` and `rta_documents`.
 *
 * Safe to delete this file afterwards.
 */

const readline = require("readline");
const db = require("./database/db");

function all(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function run(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, [], function (err) {
      err ? reject(err) : resolve(this.changes);
    });
  });
}

async function report(table) {
  const [{ total }] = await all(`SELECT COUNT(*) AS total FROM ${table}`);
  const [{ distinctCount }] = await all(
    `SELECT COUNT(DISTINCT LOWER(TRIM(vehicleNo))) AS distinctCount FROM ${table}`
  );

  console.log(`\n${table}:`);
  console.log(`  Total rows:            ${total}`);
  console.log(`  Distinct Vehicle Nos:  ${distinctCount}`);
  console.log(`  Duplicate rows:        ${total - distinctCount}`);

  const dupes = await all(`
    SELECT LOWER(TRIM(vehicleNo)) AS vno, COUNT(*) AS c
    FROM ${table}
    WHERE vehicleNo IS NOT NULL AND TRIM(vehicleNo) != ''
    GROUP BY LOWER(TRIM(vehicleNo))
    HAVING c > 1
    ORDER BY c DESC
    LIMIT 10
  `);

  if (dupes.length) {
    console.log(`  Most duplicated Vehicle Nos:`);
    dupes.forEach((d) => console.log(`    "${d.vno}" -> ${d.c} rows`));
  }

  return total - distinctCount;
}

async function cleanup(table) {
  // Keep only the row with the highest id per (case/whitespace
  // normalized) Vehicle No; delete everything else.
  const deleted = await run(`
    DELETE FROM ${table}
    WHERE id NOT IN (
      SELECT MAX(id)
      FROM ${table}
      GROUP BY LOWER(TRIM(vehicleNo))
    )
  `);
  console.log(`  Deleted ${deleted} duplicate row(s) from ${table}.`);
}

async function main() {
  console.log("=== FleetMaster duplicate check ===");

  const vehicleDupes = await report("vehicles");
  const docDupes = await report("rta_documents");

  if (vehicleDupes === 0 && docDupes === 0) {
    console.log("\nNo duplicates found - nothing to clean up.");
    process.exit(0);
  }

  console.log(
    `\nThis will permanently delete ${vehicleDupes} duplicate vehicle row(s) ` +
      `and ${docDupes} duplicate RTA document row(s), keeping only the ` +
      `most recently added row for each Vehicle No.`
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("\nType YES to proceed: ", async (answer) => {
    rl.close();

    if (answer.trim().toUpperCase() !== "YES") {
      console.log("Cancelled - no changes made.");
      process.exit(0);
    }

    await cleanup("vehicles");
    await cleanup("rta_documents");

    console.log("\nDone. Re-run this script anytime to verify - it should now report 0 duplicates.");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
