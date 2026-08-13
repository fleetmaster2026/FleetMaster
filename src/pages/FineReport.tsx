import { useEffect, useState } from "react";
import { FaMoneyBillWave } from "react-icons/fa";

import ReportToolbar from "../components/reports/ReportToolbar";
import FineTable from "../components/reports/FineTable";
import SearchableSelect from "../components/common/SearchableSelect";

import { getFineReport } from "../services/reportApi";

import { exportToExcel } from "../components/reports/ExportExcel";
import { exportToPDF } from "../components/reports/ExportPDF";
import { printTable } from "../utils/printTable";

import type {
  FineRecord,
  FineReportResponse,
} from "../types/Fine";

const FineReport = () => {
  const [records, setRecords] = useState<FineRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalFineAmount, setTotalFineAmount] = useState(0);

  const [search, setSearch] = useState("");
  const [site, setSite] = useState("");
  const [engineer, setEngineer] = useState("");

  const loadData = async () => {
    try {
      const response: FineReportResponse =
        await getFineReport();

      setRecords(response.data);
      setTotalRecords(response.totalRecords);
      setTotalFineAmount(response.totalFineAmount);
    } catch (err) {
      console.error(err);
      alert("Unable to load Fine Report.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = records.filter((item) => {
    const matchesSearch = item.vehicleNo
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesSite =
      site === "" || item.site === site;

    const matchesEngineer =
      engineer === "" ||
      item.engineer === engineer;

    return (
      matchesSearch &&
      matchesSite &&
      matchesEngineer
    );
  });

  const handleExcel = () => {
    exportToExcel(
      filteredRecords,
      "Fine Report"
    );
  };

  const handlePDF = () => {
    const headers = [
      "Vehicle No",
      "Project Code",
      "Site",
      "Engineer",
      "Fine Date",
      "Reason",
      "Fine Amount",
      "Remarks",
    ];

    const rows = filteredRecords.map((item) => [
      item.vehicleNo,
      item.projectCode,
      item.site,
      item.engineer,
      item.fineDate,
      item.fineReason,
      item.fineAmount,
      item.remarks,
    ]);

    exportToPDF(
      "Fine Report",
      headers,
      rows
    );
  };

  return (
    <div className="page-container">
      <h1 className="page-title">
        <FaMoneyBillWave /> Fine Report
      </h1>

      <div className="form-card">
        <h2 className="section-title">
          Summary
        </h2>

        <div className="form-grid">
          <div className="form-group">
            <label>Total Records</label>
            <input
              value={totalRecords}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Total Fine Amount</label>
            <input
              value={`₹${totalFineAmount.toLocaleString()}`}
              readOnly
            />
          </div>
        </div>
      </div>

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
        <FineTable
          records={filteredRecords}
        />
      </div>
    </div>
  );
};

export default FineReport;