import { useRef, useState } from "react";
import { FaFileExport, FaFileImport, FaPrint } from "react-icons/fa";

interface Props {
  onExport: () => void;
  onImport: (file: File) => Promise<void> | void;
  onPrint?: () => void;
}

/**
 * Small "Export Excel / Import Excel / Print" button group, meant to sit
 * next to a page's title. Used for bulk-download-edit-reupload workflows
 * and printing across the Master / Register pages.
 */
const ExcelActions = ({ onExport, onImport, onPrint }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    // Allow re-selecting the same file name twice in a row.
    e.target.value = "";

    if (!file) return;

    try {
      setImporting(true);
      await onImport(file);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="excel-actions">
      <button
        type="button"
        className="excel-btn excel-export-btn"
        onClick={onExport}
        title="Download all records as an Excel sheet"
      >
        <FaFileExport />
        &nbsp; Export Excel
      </button>

      <button
        type="button"
        className="excel-btn excel-import-btn"
        onClick={handleImportClick}
        disabled={importing}
        title="Upload an Excel sheet to bulk add/update records"
      >
        <FaFileImport />
        &nbsp; {importing ? "Importing..." : "Import Excel"}
      </button>

      {onPrint && (
        <button
          type="button"
          className="excel-btn excel-print-btn"
          onClick={onPrint}
          title="Print the records table"
        >
          <FaPrint />
          &nbsp; Print
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ExcelActions;
