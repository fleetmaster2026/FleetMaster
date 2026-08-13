/**
 * ============================================================================
 * FleetMaster Engineer Reminder Email Builder
 * ============================================================================
 * generateReminderEmail(vehicle, reminders)
 *   vehicle   -> the vehicle/engineer row from RTAReminderService.getVehicles()
 *                { vehicleNo, vehicleName, vehicleType, site, engineer, email, ... }
 *   reminders -> array of reminder objects built by RTAReminderService.createReminder()
 *                { vehicleNo, vehicleName, vehicleType, site, engineer, document,
 *                  expiryDate, remaining }
 * ============================================================================
 */

function statusLabel(remaining) {
  if (remaining < 0) {
    const days = Math.abs(remaining);
    return `Expired ${days} day${days === 1 ? "" : "s"} ago`;
  }

  if (remaining === 0) return "Expires today";

  return `Expires in ${remaining} day${remaining === 1 ? "" : "s"}`;
}

function statusStyle(remaining) {
  if (remaining <= 0) return { bg: "#fdecea", color: "#c0392b" }; // expired / today - red
  if (remaining <= 7) return { bg: "#fff3cd", color: "#8a6d3b" }; // urgent - amber
  return { bg: "#e6f4ea", color: "#1e7e34" }; // upcoming - green
}

function statusBadge(remaining) {
  const style = statusStyle(remaining);
  return `<span style="background:${style.bg};color:${style.color};padding:4px 10px;border-radius:12px;font-size:12px;font-weight:bold;white-space:nowrap;">${statusLabel(
    remaining
  )}</span>`;
}

function buildRows(reminders) {
  if (!reminders || !reminders.length) {
    return `
      <tr>
        <td colspan="5" style="text-align:center;color:#777;padding:20px;">
          No document alerts for this vehicle.
        </td>
      </tr>
    `;
  }

  return reminders
    .map(
      (r) => `
      <tr>
        <td>${r.vehicleNo || "-"}</td>
        <td>${r.vehicleName || "-"}</td>
        <td>${r.document}</td>
        <td>${r.expiryDate || "-"}</td>
        <td>${statusBadge(r.remaining)}</td>
      </tr>
    `
    )
    .join("");
}

function generateReminderEmail(vehicle, reminders) {
  const engineerName = vehicle.engineer || "Engineer";
  const site = vehicle.site || "-";

  // Count unique vehicles in this batch
  const uniqueVehicles = [
    ...new Set(reminders.map(r => r.vehicleNo))
  ];

  const vehicleSummary =
    uniqueVehicles.length === 1
      ? `vehicle <b>${uniqueVehicles[0]}</b>`
      : `<b>${uniqueVehicles.length} vehicles</b>`;

  return `
<!DOCTYPE html>
<html>

<head>

<style>

body{
font-family:Arial;
background:#f5f5f5;
padding:20px;
}

.container{
background:white;
padding:20px;
border-radius:10px;
}

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}

th{
background:#1f4e78;
color:white;
padding:10px;
text-align:left;
}

td{
padding:10px;
border:1px solid #ddd;
}

.footer{
margin-top:25px;
font-size:13px;
color:#777;
}

</style>

</head>

<body>

<div class="container">

<h2>🚛 FleetMaster - RTA Document Reminder</h2>

<p>Dear <b>${engineerName}</b>,</p>

<p>The following RTA documents for ${vehicleSummary} need your attention.</p>

<p><b>Site:</b> ${site}</p>

<table>

<tr>
<th>Vehicle</th>
<th>Vehicle Name</th>
<th>Document</th>
<th>Expiry Date</th>
<th>Status</th>
</tr>

${buildRows(reminders)}

</table>

<div class="footer">

This is an automatically generated email from FleetMaster.
<br><br>
Regards,
<br>
FleetMaster

</div>

</div>

</body>

</html>
`;
}

module.exports = { generateReminderEmail };