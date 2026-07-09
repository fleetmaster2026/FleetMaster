// src/routes/AppRoutes.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Dashboard from "../pages/Dashboard";
import VehicleMaster from "../pages/VehicleMaster";
import SiteMaster from "../pages/SiteMaster";
import EngineerMaster from "../pages/EngineerMaster";
import MonthlyUtilisation from "../pages/MonthlyUtilisation";
import UtilisationReport from "../pages/UtilisationReport";
import Settings from "../pages/Settings";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />

          {/* Masters */}
          <Route path="/vehicles" element={<VehicleMaster />} />
          <Route path="/sites" element={<SiteMaster />} />
          <Route path="/engineers" element={<EngineerMaster />} />

          {/* Utilisation */}
          <Route
            path="/utilisation"
            element={<MonthlyUtilisation />}
          />
          <Route
            path="/reports"
            element={<UtilisationReport />}
          />

          {/* Settings */}
          <Route path="/settings" element={<Settings />} />

          {/* Coming Soon */}
          <Route path="/documents" element={<h2>RTA Documents</h2>} />
          <Route path="/breakdowns" element={<h2>Breakdown Register</h2>} />
          <Route path="/fines" element={<h2>Fine Register</h2>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;