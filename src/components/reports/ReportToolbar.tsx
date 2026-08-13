import React from "react";
import { FaFilePdf } from "react-icons/fa";

interface ReportToolbarProps {
  totalRecords: number;
  onRefresh: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onPrint?: () => void;
}

const ReportToolbar: React.FC<ReportToolbarProps> = ({
  totalRecords,
  onRefresh,
  onExportExcel,
  onExportPDF,
  onPrint,
}) => {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 8,
        padding: "15px 20px",
        margin: "20px 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          fontWeight: 600,
        }}
      >
        Total Records : {totalRecords}
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
          onClick={onRefresh}
        >
          🔄 Refresh
        </button>

        <button
          className="primary-btn"
          onClick={onExportExcel}
        >
          📊 Export Excel
        </button>

        <button
          className="primary-btn"
          onClick={onExportPDF}
        >
          <FaFilePdf /> Export PDF
        </button>

        <button
          className="primary-btn"
          onClick={onPrint}
        >
          🖨 Print
        </button>
      </div>
    </div>
  );
};

export default ReportToolbar;