const express = require("express");
const cors = require("cors");
const db = require("./database/db");

const vehicleRoutes = require("./routes/vehicles");
const siteRoutes = require("./routes/sites");
const engineerRoutes = require("./routes/engineers");
const monthlyUtilisationRoutes = require("./routes/monthlyUtilisation");

console.log("✅ Engineer routes imported:", engineerRoutes);

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/vehicles", vehicleRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/engineers", engineerRoutes);
app.use("/api/monthly-utilisation", monthlyUtilisationRoutes);

app.get("/", (req, res) => {
  res.send("FleetMaster API Running");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});