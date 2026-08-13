import { useEffect, useState } from "react";
import { FaTools } from "react-icons/fa";

import BreakdownTable from "../components/reports/BreakdownTable";
import ReportToolbar from "../components/reports/ReportToolbar";
import SearchableSelect from "../components/common/SearchableSelect";

import { getBreakdownReport } from "../services/reportApi";

import { exportToExcel } from "../components/reports/ExportExcel";
import { exportToPDF } from "../components/reports/ExportPDF";
import { printTable } from "../utils/printTable";

import type { BreakdownRecord } from "../types/Breakdown";

const BreakdownReport = () => {
  const [records, setRecords] = useState<BreakdownRecord[]>([]);

  const [search, setSearch] = useState("");
  const [site, setSite] = useState("");
  const [engineer, setEngineer] = useState("");
  const [breakdownType, setBreakdownType] = useState("");

  const loadRecords = async () => {
    try {
      const data = await getBreakdownReport();
      setRecords(data);
    } catch (err) {
      console.error(err);
      alert("Unable to load Breakdown Report.");
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = records.filter((item) => {
    const matchesSearch = item.vehicleNo
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesSite = site === "" || item.site === site;

    const matchesEngineer =
      engineer === "" || item.engineer === engineer;

    const matchesType =
      breakdownType === "" ||
      item.breakdownType === breakdownType;

    return (
      matchesSearch &&
      matchesSite &&
      matchesEngineer &&
      matchesType
    );
  });

  const handleExportExcel = () => {
    exportToExcel(filteredRecords, "Breakdown Report");
  };

  const handleExportPDF = () => {
    const headers = [
      "BU",
      "Project Code",
      "Vehicle No",
      "Vehicle Name",
      "Vehicle Type",
      "Site",
      "Engineer",
      "Date",
      "Days",
      "Type",
      "Description",
      "Estimated Amount",
      "Approval Status",
      "Remarks",
    ];

    const rows = filteredRecords.map((item) => [
      item.businessUnit,
      item.projectCode,
      item.vehicleNo,
      item.vehicleName,
      item.vehicleType,
      item.site,
      item.engineer,
      item.breakdownDate,
      item.breakdownDays,
      item.breakdownType,
      item.breakdownDescription,
      item.estimatedAmount,
      item.approvalStatus,
      item.remarks,
    ]);

    exportToPDF("Breakdown Report", headers, rows);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">
        <FaTools /> Breakdown Report
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
              onChange={(e) =>
                setSearch(e.target.value)
              }
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
            <label>Breakdown Type</label>

            <select
              value={breakdownType}
              onChange={(e) =>
                setBreakdownType(e.target.value)
              }
            >
              <option value="">All Types</option>

              {[...new Set(records.map((r) => r.breakdownType))].map(
                (type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                )
              )}
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
        <BreakdownTable records={filteredRecords} />
      </div>
    </div>
  );
};

export default BreakdownReport;