const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get("/dashboard", reportController.getDashboard);

/*
|--------------------------------------------------------------------------
| Vehicle Report
|--------------------------------------------------------------------------
*/

router.get("/vehicles", reportController.getVehicleReport);

/*
|--------------------------------------------------------------------------
| RTA Report
|--------------------------------------------------------------------------
*/

router.get("/rta", reportController.getRTAReport);

/*
|--------------------------------------------------------------------------
| Breakdown Report
|--------------------------------------------------------------------------
*/

router.get("/breakdowns", reportController.getBreakdownReport);

/*
|--------------------------------------------------------------------------
| Fine Report
|--------------------------------------------------------------------------
*/

router.get("/fines", reportController.getFineReport);

/*
|--------------------------------------------------------------------------
| Monthly Utilisation Report
|--------------------------------------------------------------------------
*/

router.get("/monthly-utilisation", reportController.getMonthlyUtilisationReport);

/*
|--------------------------------------------------------------------------
| Site Report
|--------------------------------------------------------------------------
*/

router.get("/sites", reportController.getSiteReport);

/*
|--------------------------------------------------------------------------
| Engineer Report
|--------------------------------------------------------------------------
*/

router.get("/engineers", reportController.getEngineerReport);

module.exports = router;