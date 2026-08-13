import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Dashboard from "../pages/Dashboard";
import VehicleMaster from "../pages/VehicleMaster";
import SiteEngineerMaster from "../pages/SiteEngineerMaster";
import MonthlyUtilisation from "../pages/MonthlyUtilisation";
import Settings from "../pages/Settings";
import RtaDocuments from "../pages/RtaDocuments";
import BreakdownRegister from "../pages/BreakdownRegister";
import FineRegister from "../pages/FineRegister";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>

          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />

          {/* Masters */}
          <Route path="/vehicles" element={<VehicleMaster />} />
          <Route path="/site-engineers" element={<SiteEngineerMaster />} />
          <Route path="/fines" element={<FineRegister />} />

          {/* Registers */}
          <Route path="/documents" element={<RtaDocuments />} />
          <Route path="/breakdowns" element={<BreakdownRegister />} />

          {/* Monthly Utilisation Entry */}
          <Route path="/utilisation" element={<MonthlyUtilisation />} />

          {/* Settings */}
          <Route path="/settings" element={<Settings />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;