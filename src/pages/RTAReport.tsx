import { useEffect, useState } from "react";

import RTATable from "../components/reports/RTATable";
import ReportToolbar from "../components/reports/ReportToolbar";
import SearchableSelect from "../components/common/SearchableSelect";

import { getRTAReport } from "../services/reportApi";

import { exportToExcel } from "../components/reports/ExportExcel";
import { exportToPDF } from "../components/reports/ExportPDF";
import { printTable } from "../utils/printTable";

import type { RTARecord } from "../types/RTA";

const RTAReport = () => {
  const [records, setRecords] = useState<RTARecord[]>([]);
  const [search, setSearch] = useState("");
  const [site, setSite] = useState("");
  const [engineer, setEngineer] = useState("");
  const [status, setStatus] = useState("");

  const loadRecords = async () => {
    try {
      const data = await getRTAReport();
      setRecords(data);
    } catch (err) {
      console.error(err);
      alert("Unable to load RTA Report.");
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = records.filter((item) => {
    const matchesSearch = item.vehicleNo
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesSite =
      site === "" || item.site === site;

    const matchesEngineer =
      engineer === "" || item.engineer === engineer;

    const matchesStatus =
      status === "" || item.overallStatus === status;

    return (
      matchesSearch &&
      matchesSite &&
      matchesEngineer &&
      matchesStatus
    );
  });

  const handleExportExcel = () => {
    exportToExcel(filteredRecords, "RTA Report");
  };

  const handleExportPDF = () => {
    const headers = [
      "Vehicle No",
      "Site",
      "Engineer",
      "Registration Date",
      "Insurance Expiry",
      "Fitness Expiry",
      "Permit Expiry",
      "Pollution Expiry",
      "Overall Status",
      "Remarks",
    ];

    const rows = filteredRecords.map((item) => [
      item.vehicleNo,
      item.site,
      item.engineer,
      item.registrationDate,
      item.insuranceExpiry,
      item.fitnessExpiry,
      item.permitExpiry,
      item.pollutionExpiry,
      item.overallStatus,
      item.remarks,
    ]);

    exportToPDF("RTA Report", headers, rows);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">
        📑 RTA Report
      </h1>

      <div className="form-card">
        <h2 className="section-title">
          Search & Filters
        </h2>

        <div className="form-grid">
          <div className="form-group">
            <label>Search Vehicle</label>

            <input
              type="text"
              placeholder="Vehicle No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Site</label>

            <SearchableSelect
              options={[...new Set(records.map((r) => r.site))].map(
                (site) => ({ value: site, label: site })
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
                (engineer) => ({
                  value: engineer,
                  label: engineer || "-",
                })
              )}
              value={engineer}
              placeholder="All Engineers"
              onChange={(value) => setEngineer(value)}
            />
          </div>

          <div className="form-group">
            <label>Status</label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Valid">Valid</option>
              <option value="Expiring Soon">
                Expiring Soon
              </option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      <ReportToolbar
        totalRecords={filteredRecords.length}
        onRefresh={loadRecords}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onPrint={() => printTable("print-area")}
      />

      <div id="print-area">
        <RTATable records={filteredRecords} />
      </div>
    </div>
  );
};

export default RTAReport;