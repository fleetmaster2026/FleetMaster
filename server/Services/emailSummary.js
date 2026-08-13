/**
 * ============================================================================
 * FleetMaster Daily Admin Summary Email Builder
 * ============================================================================
 * generateSummary(rows, totals)
 *   rows   -> array of { site, engineer, vehicles, alerts, status }
 *             one row per site/engineer combination processed that day
 *   totals -> the RTAReminderService.summary object
 *             { totalVehicles, totalAlerts, emailsSent, failedEmails, skipped, errors }
 * ============================================================================
 */

const STATUS_STYLES = {
  "Success": { bg: "#e6f4ea", color: "#1e7e34" },
  "Failed": { bg: "#fdecea", color: "#c0392b" },
  "Mail Not Found": { bg: "#fff3cd", color: "#8a6d3b" },
  "Already Sent Today": { bg: "#e8eaf6", color: "#3949ab" }
};

function statusBadge(status) {
  const style = STATUS_STYLES[status] || { bg: "#eee", color: "#555" };
  return `<span style="background:${style.bg};color:${style.color};padding:4px 10px;border-radius:12px;font-size:12px;font-weight:bold;">${status}</span>`;
}

function buildRows(rows) {
  if (!rows || !rows.length) {
    return `
      <tr>
        <td colspan="5" style="text-align:center;color:#777;padding:20px;">
          No RTA document alerts were due today.
        </td>
      </tr>
    `;
  }

  return rows
    .map(
      (item) => `
      <tr>
        <td>${item.site || "-"}</td>
        <td>${item.engineer || "-"}</td>
        <td>${item.vehicles}</td>
        <td>${item.alerts}</td>
        <td>${statusBadge(item.status)}</td>
      </tr>
    `
    )
    .join("");
}

function buildTotalsBlock(totals) {
  if (!totals) return "";

  const cards = [
    { label: "Vehicles Scanned", value: totals.totalVehicles || 0 },
    { label: "Total Alerts", value: totals.totalAlerts || 0 },
    { label: "Emails Sent", value: totals.emailsSent || 0 },
    { label: "Failed", value: totals.failedEmails || 0 },
    { label: "Skipped", value: totals.skipped || 0 }
  ];

  return `
    <div class="stats">
      ${cards
        .map(
          (c) => `
        <div class="stat-card">
          <div class="stat-value">${c.value}</div>
          <div class="stat-label">${c.label}</div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function generateSummary(rows, totals) {
  return `
<!DOCTYPE html>
<html>

<head>

<style>

body{
font-family:Arial;
background:#f4f6f9;
padding:20px;
}

.container{
background:white;
padding:20px;
border-radius:8px;
}

.stats{
display:flex;
gap:10px;
margin-top:15px;
flex-wrap:wrap;
}

.stat-card{
flex:1;
min-width:100px;
background:#f0f3f8;
border-radius:8px;
padding:12px;
text-align:center;
}

.stat-value{
font-size:20px;
font-weight:bold;
color:#1f4e78;
}

.stat-label{
font-size:12px;
color:#666;
margin-top:4px;
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
}

td{
border:1px solid #ddd;
padding:10px;
text-align:center;
}

.footer{
margin-top:20px;
font-size:13px;
color:#777;
}

</style>

</head>

<body>

<div class="container">

<h2>📊 FleetMaster Daily RTA Summary</h2>

<p>The following is today's reminder summary across all sites.</p>

${buildTotalsBlock(totals)}

<table>

<tr>

<th>Site</th>

<th>Engineer</th>

<th>Vehicles</th>

<th>Alerts</th>

<th>Email Status</th>

</tr>

${buildRows(rows)}

</table>

<div class="footer">

Generated Automatically by FleetMaster

<br>

Daily RTA Monitoring System

</div>

</div>

</body>
</html>

`;
}

module.exports = { generateSummary };
