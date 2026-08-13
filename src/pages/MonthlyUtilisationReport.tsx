import { useEffect, useState } from "react";

import ReportToolbar from "../components/reports/ReportToolbar";
import MonthlyUtilisationTable from "../components/reports/MonthlyUtilisationTable";
import SearchableSelect from "../components/common/SearchableSelect";

import { getMonthlyUtilisationReport } from "../services/reportApi";

import { exportToExcel } from "../components/reports/ExportExcel";
import { exportToPDF } from "../components/reports/ExportPDF";
import { printTable } from "../utils/printTable";

import type { MonthlyUtilisationRecord } from "../types/MonthlyUtilisation";

const MonthlyUtilisationReport = () => {
  const [records, setRecords] = useState<MonthlyUtilisationRecord[]>([]);

  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [site, setSite] = useState("");
  const [engineer, setEngineer] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");

  const loadData = async () => {
    try {
      const data = await getMonthlyUtilisationReport();
      setRecords(data);
    } catch (err) {
      console.error(err);
      alert("Unable to load Monthly Utilisation Report.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = records.filter((item) => {
    const matchesSearch = item.vehicleNo
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesMonth =
      month === "" ||
      item.utilisationMonth === month;

    const matchesSite =
      site === "" ||
      item.site === site;

    const matchesEngineer =
      engineer === "" ||
      item.engineer === engineer;

    const matchesVehicle =
      vehicleNo === "" ||
      item.vehicleNo === vehicleNo;

    return (
      matchesSearch &&
      matchesMonth &&
      matchesSite &&
      matchesEngineer &&
      matchesVehicle
    );
  });

  const handleExcel = () => {
    exportToExcel(
      filteredRecords,
      "Monthly Utilisation Report"
    );
  };

  const handlePDF = () => {
    const headers = [
      "Month",
      "Vehicle",
      "Project Code",
      "Site",
      "Engineer",
      "Opening KM",
      "Closing KM",
      "Difference KM",
      "Target KM",
      "KM Utilisation",
      "Opening Hours",
      "Closing Hours",
      "Difference Hours",
      "Target Hours",
      "Hours Utilisation",
      "Remarks",
    ];

    const rows = filteredRecords.map((item) => [
      item.utilisationMonth,
      item.vehicleNo,
      item.projectCode,
      item.site,
      item.engineer,
      item.openingKm,
      item.closingKm,
      item.differenceKm,
      item.targetKm,
      `${item.kmUtilisation}%`,
      item.openingHours,
      item.closingHours,
      item.differenceHours,
      item.targetHours,
      `${item.hoursUtilisation}%`,
      item.remarks,
    ]);

    exportToPDF(
      "Monthly Utilisation Report",
      headers,
      rows
    );
  };

  return (
    <div className="page-container">
      <h1 className="page-title">
        📈 Monthly Utilisation Report
      </h1>

      <div className="form-card">
        <h2 className="section-title">
          Search & Filters
        </h2>

        <div className="form-grid">
          <div className="form-group">
            <label>Search Vehicle</label>

            <input
              value={search}
              placeholder="Vehicle No..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Month</label>

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">All Months</option>

              {[...new Set(records.map((r) => r.utilisationMonth))].map(
                (m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Site</label>

            <SearchableSelect
              options={[...new Set(records.map((r) => r.site))].map(
                (s) => ({ value: s, label: s })
              )}
              value={site}
              placeholder="All Sites"
              onChange={(value) => setSite(value)}
            />
          </div>

          <div className="form-group">
            <label>Engineer</label>

            <SearchableSelect
              options={[...new Set(records.map((r) => r.engineer))].map(
                (e) => ({ value: e, label: e || "-" })
              )}
              value={engineer}
              placeholder="All Engineers"
              onChange={(value) => setEngineer(value)}
            />
          </div>

          <div className="form-group">
            <label>Vehicle</label>

            <SearchableSelect
              options={[...new Set(records.map((r) => r.vehicleNo))].map(
                (v) => ({ value: v, label: v })
              )}
              value={vehicleNo}
              placeholder="All Vehicles"
              onChange={(value) => setVehicleNo(value)}
            />
          </div>
        </div>
      </div>

      <ReportToolbar
        totalRecords={filteredRecords.length}
        onRefresh={loadData}
        onExportExcel={handleExcel}
        onExportPDF={handlePDF}
        onPrint={() => printTable("print-area")}
      />

      <div id="print-area">
        <MonthlyUtilisationTable
          records={filteredRecords}
        />
      </div>
    </div>
  );
};

export default MonthlyUtilisationReport;