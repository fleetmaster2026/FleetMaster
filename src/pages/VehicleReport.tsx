import { useEffect, useState } from "react";
import { FaTruck, FaFilePdf } from "react-icons/fa";

import VehicleSearch from "../components/vehicles/VehicleSearch";
import VehicleTable from "../components/vehicles/VehicleTable";

import { getVehicleReport } from "../services/reportApi";

import { exportToExcel } from "../components/reports/ExportExcel";
import { exportToPDF } from "../components/reports/ExportPDF";
import { printTable } from "../utils/printTable";

import type { Vehicle } from "../types/Vehicle";

const VehicleReport = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");

  const loadVehicles = async () => {
    try {
      const data = await getVehicleReport();
      setVehicles(data);
    } catch (error) {
      console.error(error);
      alert("Unable to load vehicle report.");
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const text = search.toLowerCase();

    return (
      vehicle.vehicleNo.toLowerCase().includes(text) ||
      vehicle.vehicleName.toLowerCase().includes(text) ||
      vehicle.vehicleType.toLowerCase().includes(text) ||
      vehicle.site.toLowerCase().includes(text) ||
      vehicle.engineer.toLowerCase().includes(text)
    );
  });

  const handleExportExcel = () => {
    exportToExcel(filteredVehicles, "Vehicle Report");
  };

  const handleExportPDF = () => {
    const headers = [
      "Vehicle No",
      "Vehicle Name",
      "Type",
      "Site",
      "Engineer",
    ];

    const rows = filteredVehicles.map((vehicle) => [
      vehicle.vehicleNo,
      vehicle.vehicleName,
      vehicle.vehicleType,
      vehicle.site,
      vehicle.engineer,
    ]);

    exportToPDF("Vehicle Report", headers, rows);
  };

  return (
    <div className="page-container">
      <h1 className="page-title"><FaTruck /> Vehicle Report</h1>

      <VehicleSearch
        search={search}
        setSearch={setSearch}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "20px 0",
          padding: "12px 16px",
          background: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: "16px",
          }}
        >
          Total Records : {filteredVehicles.length}
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="primary-btn"
            onClick={loadVehicles}
          >
            🔄 Refresh
          </button>

          <button
            className="primary-btn"
            onClick={handleExportExcel}
          >
            📊 Export Excel
          </button>

          <button
            className="primary-btn"
            onClick={handleExportPDF}
          >
            <FaFilePdf /> Export PDF
          </button>

          <button
            className="primary-btn"
            onClick={() => printTable("print-area")}
          >
            🖨 Print
          </button>
        </div>
      </div>

      <div id="print-area">
        <VehicleTable
          vehicles={filteredVehicles}
          showActions={false}
        />
      </div>
    </div>
  );
};

export default VehicleReport;