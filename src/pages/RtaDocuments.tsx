import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { RtaDocument } from "../types/RtaDocument";
import type { Vehicle } from "../types/Vehicle";

import {
  getRtaDocuments,
  addRtaDocument,
  updateRtaDocument,
  deleteRtaDocument,
  sendRtaReminders,
  type ReminderRunSummary,
} from "../services/rtaDocumentApi";

import { getVehicles } from "../services/vehicleApi";

import {
  FaSave,
  FaSyncAlt,
  FaTrash,
  FaTimes,
  FaSearch,
  FaEdit,
  FaPaperPlane,
} from "react-icons/fa";

import ExcelActions from "../components/common/ExcelActions";
import SearchableSelect from "../components/common/SearchableSelect";
import RecordsToolbar, {
  type ToolbarColumn,
} from "../components/common/RecordsToolbar";
import { useColumnVisibility } from "../hooks/useColumnVisibility";
import { useColumnFilters } from "../hooks/useColumnFilters";
import ColumnFilterHeader from "../components/common/ColumnFilterHeader";
import { printTable } from "../utils/printTable";
import {
  exportRecordsToExcel,
  readExcelFile,
  mapRowsToRecords,
  type ColumnDef,
} from "../utils/excelUtils";

const rtaDocumentColumns: ColumnDef<RtaDocument>[] = [
  { header: "Vehicle No", key: "vehicleNo" },
  { header: "Registering RTO", key: "registeringRTO" },
  { header: "Site", key: "site" },
  { header: "Engineer", key: "engineer" },
  { header: "Registration Date", key: "registrationDate", type: "date" },
  { header: "Insurance Expiry", key: "insuranceExpiry", type: "date" },
  { header: "Fitness Expiry", key: "fitnessExpiry", type: "date" },
  { header: "Permit Expiry", key: "permitExpiry", type: "date" },
  { header: "PUC Expiry", key: "pollutionExpiry", type: "date" },
  { header: "Road Tax Expiry", key: "taxExpiry", type: "date" },
  { header: "Remarks", key: "remarks" },
];

// Columns shown in the records table - drives both the universal search
// box (checks every field below, Remarks excluded on purpose) and the
// "which columns to print" checklist.
const rtaToolbarColumns: ToolbarColumn[] = [
  { key: "vehicleNo", label: "Vehicle" },
  { key: "vehicleName", label: "Vehicle Name" },
  { key: "vehicleType", label: "Vehicle Type" },
  { key: "registeringRTO", label: "Registering RTO" },
  { key: "site", label: "Site" },
  { key: "engineer", label: "Engineer" },
  { key: "registrationDate", label: "Registration Date" },
  { key: "vehicleAge", label: "Vehicle Age" },
  { key: "insuranceExpiry", label: "Insurance" },
  { key: "fitnessExpiry", label: "Fitness" },
  { key: "permitExpiry", label: "Permit" },
  { key: "pollutionExpiry", label: "PUC" },
  { key: "taxExpiry", label: "Road Tax" },
  { key: "remarks", label: "Remarks" },
];
const RtaDocuments = () => {
  const [records, setRecords] = useState<RtaDocument[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("vehicle") || "");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] =
    useState<ReminderRunSummary | null>(null);

  const handleSendReminders = async () => {
    if (sendingReminders) return;

    const confirmed = window.confirm(
      "Send expiry/expired document reminder emails to every engineer now, " +
        "plus a summary email to the admin? Engineers with no email on " +
        "file will be reported as \"Mail Not Found\" instead of skipped " +
        "silently."
    );
    if (!confirmed) return;

    try {
      setSendingReminders(true);
      const summary = await sendRtaReminders();
      setReminderResult(summary);
    } catch (err) {
      console.error(err);
      alert(
        "Failed to send reminder emails. Check that the server is " +
          "running and Gmail credentials in server/.env are correct."
      );
    } finally {
      setSendingReminders(false);
    }
  };

  const {
    isColumnVisible,
    toggleColumn,
    showAllColumns,
    hideAllColumns,
  } = useColumnVisibility();

  const [formData, setFormData] = useState<RtaDocument>({
    vehicleNo: "",
    registeringRTO: "",
    site: "",
    engineer: "",

    registrationDate: "",
    insuranceExpiry: "",
    fitnessExpiry: "",
    permitExpiry: "",
    pollutionExpiry: "",
    taxExpiry: "",

    remarks: "",
  });

  const loadData = async () => {
    try {
      const [rtaData, vehicleData] = await Promise.all([
        getRtaDocuments(),
        getVehicles(),
      ]);

      setRecords(rtaData);
      setVehicles(vehicleData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Deep-link support: opening /documents?vehicle=XXXX (e.g. from the
  // Dashboard "Attention Required" list) pre-fills the search box so the
  // matching vehicle's RTA records are shown immediately.
  useEffect(() => {
    const vehicleParam = searchParams.get("vehicle");
    if (vehicleParam) {
      setSearch(vehicleParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!formData.vehicleNo) return;

    const selectedVehicle = vehicles.find(
      (v) =>
        v.vehicleNo.trim().toLowerCase() ===
        formData.vehicleNo.trim().toLowerCase()
    );

    if (!selectedVehicle) return;

    setFormData((prev) => ({
      ...prev,
      site: selectedVehicle.site,
      engineer: selectedVehicle.engineer,
      registeringRTO: selectedVehicle.registeringRTO,
    }));
  }, [formData.vehicleNo, vehicles]);
    const clearForm = () => {
    setEditingId(null);

    setFormData({
      vehicleNo: "",
      registeringRTO: "",
      site: "",
      engineer: "",

      registrationDate: "",
      insuranceExpiry: "",
      fitnessExpiry: "",
      permitExpiry: "",
      pollutionExpiry: "",
      taxExpiry: "",

      remarks: "",
    });
  };

  const handleSave = async () => {
    if (!formData.vehicleNo) {
      alert("Please enter a vehicle number.");
      return;
    }

    try {
      if (editingId === null) {
        await addRtaDocument(formData);

        alert("RTA Document Saved Successfully");
      } else {
        await updateRtaDocument(editingId, formData);

        alert("RTA Document Updated Successfully");
      }

      await loadData();

      clearForm();
    } catch (error) {
      console.error(error);

      alert("Unable to Save Record");
    }
  };

  const handleEdit = (item: RtaDocument) => {
    setEditingId(item.id!);

    setFormData(item);
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmDelete) return;

    try {
      await deleteRtaDocument(id);

      await loadData();

      alert("Record Deleted Successfully");
    } catch (error) {
      console.error(error);

      alert("Unable to Delete Record");
    }
  };

  const handleExport = () => {
    exportRecordsToExcel(records, rtaDocumentColumns, "RTA_Documents");
  };

  // Import = REPLACE. Whatever is in the Excel file becomes the complete
  // data set: every existing record is removed first, then every valid
  // row from the file is inserted fresh.
  const handleImport = async (file: File) => {
    try {
      const rows = await readExcelFile(file);
      const imported = mapRowsToRecords<RtaDocument>(
        rows,
        rtaDocumentColumns
      ).filter((row) => row.vehicleNo);

      if (imported.length === 0) {
        alert("The selected file has no usable rows to import.");
        return;
      }

      const confirmed = window.confirm(
        `This will DELETE all ${records.length} existing record(s) and ` +
          `replace them with the ${imported.length} row(s) from this file.\n\n` +
          `This cannot be undone. Continue?`
      );

      if (!confirmed) return;

      // De-duplicate rows within the file itself by Vehicle No, keeping
      // the last occurrence.
      const uniqueRows = new Map<string, Partial<RtaDocument>>();
      imported.forEach((row) =>
        uniqueRows.set(String(row.vehicleNo).trim().toLowerCase(), row)
      );

      const existing = await getRtaDocuments();
      for (const r of existing) {
        if (r.id) await deleteRtaDocument(r.id);
      }

      let added = 0;

      for (const row of uniqueRows.values()) {
        const { id, ...data } = row as RtaDocument;

        const vehicle = vehicles.find(
          (v) => v.vehicleNo === data.vehicleNo
        );

        const payload: RtaDocument = {
          ...data,
          site: vehicle ? vehicle.site : data.site,
          engineer: vehicle ? vehicle.engineer : data.engineer,
          registeringRTO: vehicle
            ? vehicle.registeringRTO
            : data.registeringRTO,
        };

        await addRtaDocument(payload);
        added++;
      }

      await loadData();

      const skippedDuplicates = imported.length - uniqueRows.size;

      alert(
        `Import Complete - data replaced.\nRecords added: ${added}${
          skippedDuplicates
            ? `\nDuplicate rows in file skipped: ${skippedDuplicates}`
            : ""
        }`
      );
    } catch (error) {
      console.error(error);
      alert("Unable to Import Excel File");
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);

    // Keep the URL in sync so the filter survives a refresh / can be
    // shared, and clear the query param once the user edits the search box.
    if (value) {
      setSearchParams({ vehicle: value });
    } else {
      setSearchParams({});
    }
  };

const searchFilteredRecords = records.filter((item) => {
  const text = search.trim().toLowerCase();

  // Universal search: matches Vehicle, Registering RTO, Site or
  // Engineer - not just Vehicle No. Remarks is deliberately left out.
  return (
    !text ||
    [item.vehicleNo, item.registeringRTO, item.site, item.engineer].some(
      (field) => (field || "").toLowerCase().includes(text)
    )
  );
});

const filteredRecords = searchFilteredRecords.filter((item) => {
  // Registration Date is excluded here: it's a fixed, one-time date (not
  // a renewable document), so it doesn't factor into expired/expiring/valid.
  const dates = [
    item.insuranceExpiry,
    item.fitnessExpiry,
    item.permitExpiry,
    item.pollutionExpiry,
    item.taxExpiry,
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasExpired = dates.some((date) => {
    const expiry = new Date(date);
    expiry.setHours(0, 0, 0, 0);
    return expiry <= today;
  });

  const hasExpiringSoon = dates.some((date) => {
    const expiry = new Date(date);
    expiry.setHours(0, 0, 0, 0);

    const diff =
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    return diff > 0 && diff <= 30;
  });

  const allValid = dates.every((date) => {
    const expiry = new Date(date);
    expiry.setHours(0, 0, 0, 0);

    const diff =
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    return diff > 30;
  });

  if (statusFilter === "EXPIRED") return hasExpired;

  if (statusFilter === "EXPIRING") return hasExpiringSoon;

  if (statusFilter === "VALID") return allValid;

  return true;
});

const formatDate = (date: string) => {
  if (!date) return "";

  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

const getExpiryBadge = (date: string) => {
  if (!date) {
    return {
      className: "badge-gray",
      text: "No Date",
      days: "",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(date);
  expiry.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
  const daysAgo = Math.abs(diffDays);
  return {
    className: "badge-red",
    text: formatDate(date),
    days: `${daysAgo} ${daysAgo === 1 ? "Day" : "Days"} Ago`,
  };
}

if (diffDays <= 30) {
  return {
    className: "badge-orange",
    text: formatDate(date),
    days: `${diffDays} Days Left`,
  };
}

return {
  className: "badge-green",
  text: formatDate(date),
  days: `${diffDays} Days Left`,
};
};

// ================= VEHICLE AGE =================
// Auto-calculated from Registration Date.
// < 10 years  -> green
// 10-15 years -> orange
// > 15 years  -> red
const getVehicleAge = (date: string) => {
  if (!date) {
    return {
      className: "age-gray",
      text: "-",
      years: null as number | null,
    };
  }

  const regDate = new Date(date);
  const today = new Date();

  let years = today.getFullYear() - regDate.getFullYear();
  const monthDiff = today.getMonth() - regDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < regDate.getDate())
  ) {
    years--;
  }

  if (years < 0) years = 0;

  let className = "age-green";
  if (years > 15) {
    className = "age-red";
  } else if (years >= 10) {
    className = "age-orange";
  }

  return {
    className,
    text: `${years} ${years === 1 ? "Year" : "Years"}`,
    years,
  };
};

// Same thresholds as getExpiryBadge, but returns just the status category
// so it can be used as a filterable value ("Expired" / "Expiring Soon" /
// "Valid" / "No Date") instead of the raw, mostly-unique date.
const getExpiryStatus = (date: string): string => {
  if (!date) return "No Date";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(date);
  expiry.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) return "Expired";
  if (diffDays <= 30) return "Expiring Soon";
  return "Valid";
};

// Same thresholds as getVehicleAge, returned as a filterable category.
const getAgeStatus = (date: string): string => {
  if (!date) return "Unknown";

  const regDate = new Date(date);
  const today = new Date();

  let years = today.getFullYear() - regDate.getFullYear();
  const monthDiff = today.getMonth() - regDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < regDate.getDate())
  ) {
    years--;
  }

  if (years < 0) years = 0;

  if (years > 15) return "Over 15 Years";
  if (years >= 10) return "10-15 Years";
  return "Under 10 Years";
};

// Colour dots shown next to each option in the funnel dropdown, matching
// the badge colours used in the table cells themselves.
const EXPIRY_STATUS_COLORS: Record<string, string> = {
  "Expired": "#dc2626",
  "Expiring Soon": "#f59e0b",
  "Valid": "#16a34a",
  "No Date": "#9ca3af",
};

const AGE_STATUS_COLORS: Record<string, string> = {
  "Under 10 Years": "#16a34a",
  "10-15 Years": "#f59e0b",
  "Over 15 Years": "#dc2626",
  "Unknown": "#9ca3af",
};

// Feed the *searched* rows in, not the raw list, so the Excel-style
// filter dropdowns only offer values present in the current search
// results instead of the whole unfiltered dataset. Every colour-coded
// column (Vehicle Age + the 5 expiry badges) also gets its status
// category attached here, so the funnel filter on those columns lets you
// tick "Expired" / "Expiring Soon" / "Valid" / "No Date" etc. instead of
// a long list of mostly-unique raw dates.
const recordsWithStatus = filteredRecords.map((r) => ({
  ...r,
  vehicleAgeStatus: getAgeStatus(r.registrationDate),
  insuranceStatus: getExpiryStatus(r.insuranceExpiry),
  fitnessStatus: getExpiryStatus(r.fitnessExpiry),
  permitStatus: getExpiryStatus(r.permitExpiry),
  pollutionStatus: getExpiryStatus(r.pollutionExpiry),
  taxStatus: getExpiryStatus(r.taxExpiry),
}));

const columnFilters = useColumnFilters(recordsWithStatus);
const displayedRecords = columnFilters.applyFilters(recordsWithStatus);

// The Expired/Expiring/Valid cards act as tabs (clicking one sets
// statusFilter), so their counts are driven by search + column filters
// only - not statusFilter itself, otherwise the other cards would
// collapse toward 0 the moment one tab was selected.
const cardRecords = columnFilters.applyFilters(
  searchFilteredRecords.map((r) => ({
    ...r,
    vehicleAgeStatus: getAgeStatus(r.registrationDate),
    insuranceStatus: getExpiryStatus(r.insuranceExpiry),
    fitnessStatus: getExpiryStatus(r.fitnessExpiry),
    permitStatus: getExpiryStatus(r.permitExpiry),
    pollutionStatus: getExpiryStatus(r.pollutionExpiry),
    taxStatus: getExpiryStatus(r.taxExpiry),
  }))
);

const rtaFilterColumns = [
  { key: "vehicleNo", label: "Vehicle" },
  { key: "registeringRTO", label: "Registering RTO" },
  { key: "site", label: "Site" },
  { key: "engineer", label: "Engineer" },
  { key: "registrationDate", label: "Registration Date" },
  { key: "vehicleAgeStatus", label: "Vehicle Age" },
  { key: "insuranceStatus", label: "Insurance" },
  { key: "fitnessStatus", label: "Fitness" },
  { key: "permitStatus", label: "Permit" },
  { key: "pollutionStatus", label: "PUC" },
  { key: "taxStatus", label: "Road Tax" },
  { key: "remarks", label: "Remarks" },
];

const today = new Date();
today.setHours(0, 0, 0, 0);

const totalDocuments = cardRecords.length * 5;

let expiredCount = 0;
let expiringSoonCount = 0;
let validCount = 0;

cardRecords.forEach((item) => {
  [
    item.insuranceExpiry,
    item.fitnessExpiry,
    item.permitExpiry,
    item.pollutionExpiry,
    item.taxExpiry,
  ].forEach((date) => {
    const expiry = new Date(date);
    expiry.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 0) {
      expiredCount++;
    } else if (diffDays <= 30) {
      expiringSoonCount++;
    } else {
      validCount++;
    }
  });
});
    return (
    <div className="page-container">
      <div className="page-title-row">
        <h1 className="page-title">RTA Documents</h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="excel-btn"
            style={{ background: sendingReminders ? "#9ca3af" : "#7c3aed" }}
            onClick={handleSendReminders}
            disabled={sendingReminders}
            title="Email every engineer with expiring/expired documents now, and send the admin a summary"
          >
            <FaPaperPlane />
            &nbsp; {sendingReminders ? "Sending..." : "Send Reminder Emails"}
          </button>

          <ExcelActions
            onExport={handleExport}
            onImport={handleImport}
            onPrint={() => printTable("print-area")}
          />
        </div>
      </div>

      {reminderResult && (
        <div className="form-card no-print">
          <h2 className="section-title">
            Last Reminder Run
            <FaTimes
              className="cursor-pointer"
              style={{ marginLeft: "auto", fontSize: 14 }}
              onClick={() => setReminderResult(null)}
              title="Dismiss"
            />
          </h2>

          <p style={{ marginBottom: 12 }}>
            Scanned <b>{reminderResult.totalVehicles}</b> vehicles &middot;{" "}
            <b>{reminderResult.totalAlerts}</b> alerts due &middot;{" "}
            <b>{reminderResult.emailsSent}</b> emails sent &middot;{" "}
            <b>{reminderResult.failedEmails}</b> failed &middot;{" "}
            <b>{reminderResult.skipped}</b> skipped (already sent today or
            no email on file)
          </p>

          {reminderResult.errors.length > 0 && (
            <p style={{ color: "#dc2626", marginBottom: 12 }}>
              Errors: {reminderResult.errors.join("; ")}
            </p>
          )}

          {reminderResult.siteDetails.length > 0 ? (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Engineer</th>
                    <th>Vehicles</th>
                    <th>Alerts</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reminderResult.siteDetails.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.site || "-"}</td>
                      <td>{row.engineer || "-"}</td>
                      <td>{row.vehicles}</td>
                      <td>{row.alerts}</td>
                      <td>
                        <span
                          className={
                            row.status === "Success"
                              ? "badge-green"
                              : row.status === "Mail Not Found"
                              ? "badge-orange"
                              : row.status === "Already Sent Today"
                              ? "badge-gray"
                              : "badge-red"
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No documents are due for a reminder today.</p>
          )}
        </div>
      )}

      {/* ================= VEHICLE INFORMATION ================= */}

      <div className="form-card">
        <h2 className="section-title">Vehicle Information</h2>

        <div className="form-grid">

          <div className="form-group">
            <label>Vehicle</label>

            <SearchableSelect
              options={vehicles.map((vehicle) => ({
                value: vehicle.vehicleNo,
                label: vehicle.vehicleNo,
              }))}
              value={formData.vehicleNo}
              placeholder="Select Vehicle"
              onChange={(value) =>
                setFormData({
                  ...formData,
                  vehicleNo: value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Registering RTO</label>

            <input
              type="text"
              value={formData.registeringRTO}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Site</label>

            <input
              type="text"
              value={formData.site}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Engineer</label>

            <input
              type="text"
              value={formData.engineer}
              readOnly
            />
          </div>

        </div>
      </div>

      {/* ================= RTA DOCUMENTS ================= */}

      <div className="form-card">
        <h2 className="section-title">Document Expiry Details</h2>

        <div className="form-grid">

          <div className="form-group">
            <label>Registration Date</label>

            <input
              type="date"
              value={formData.registrationDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  registrationDate: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Insurance Expiry</label>

            <input
              type="date"
              value={formData.insuranceExpiry}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  insuranceExpiry: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Fitness Expiry</label>

            <input
              type="date"
              value={formData.fitnessExpiry}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fitnessExpiry: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Permit Expiry</label>

            <input
              type="date"
              value={formData.permitExpiry}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  permitExpiry: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Pollution Expiry</label>

            <input
              type="date"
              value={formData.pollutionExpiry}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pollutionExpiry: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Road Tax Expiry</label>

            <input
              type="date"
              value={formData.taxExpiry}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  taxExpiry: e.target.value,
                })
              }
            />
          </div>

        </div>
      </div>
            {/* ================= REMARKS ================= */}

      <div className="form-card">
        <h2 className="section-title">Remarks</h2>

        <div className="form-group">
          <textarea
            value={formData.remarks}
            onChange={(e) =>
              setFormData({
                ...formData,
                remarks: e.target.value,
              })
            }
            placeholder="Enter Remarks..."
          />
        </div>

        <div className="button-group">
          {editingId === null ? (
            <>
              <button
                className="save-btn"
                onClick={handleSave}
              >
                <FaSave />
                &nbsp; Save
              </button>

              <button
                className="clear-btn"
                onClick={clearForm}
              >
                <FaTimes />
                &nbsp; Clear
              </button>
            </>
          ) : (
            <>
              <button
                className="update-btn"
                onClick={handleSave}
              >
                <FaSyncAlt />
                &nbsp; Update
              </button>

              <button
                className="clear-btn"
                onClick={clearForm}
              >
                <FaTimes />
                &nbsp; Cancel
              </button>
            </>
          )}
        </div>
      </div>
{/* ================= SUMMARY ================= */}

<div className="summary-cards">
  <div
  className={`summary-card ${statusFilter === "ALL" ? "active-card" : ""}`}
  onClick={() => setStatusFilter("ALL")}
>
    <h4>Total Documents</h4>
    <h2>{totalDocuments}</h2>
  </div>

  <div
  className={`summary-card expired ${
    statusFilter === "EXPIRED" ? "active-card" : ""
  }`}
  onClick={() => setStatusFilter("EXPIRED")}
>
    <h4>Expired</h4>
    <h2>{expiredCount}</h2>
  </div>

  <div
  className={`summary-card warning ${
    statusFilter === "EXPIRING" ? "active-card" : ""
  }`}
  onClick={() => setStatusFilter("EXPIRING")}
>
    <h4>Expiring (30 Days)</h4>
    <h2>{expiringSoonCount}</h2>
  </div>

  <div
  className={`summary-card valid ${
    statusFilter === "VALID" ? "active-card" : ""
  }`}
  onClick={() => setStatusFilter("VALID")}
>
    <h4>Valid</h4>
    <h2>{validCount}</h2>
  </div>
</div>
      {/* ================= SEARCH & COLUMN FILTERS ================= */}

      <RecordsToolbar
        search={search}
        onSearchChange={handleSearchChange}
        placeholder="Search Vehicle / Registering RTO / Site / Engineer..."
        columns={rtaToolbarColumns}
        isColumnVisible={isColumnVisible}
        onToggleColumn={toggleColumn}
        onShowAllColumns={showAllColumns}
        onHideAllColumns={() =>
          hideAllColumns(rtaToolbarColumns.map((col) => col.key))
        }
      />

      {columnFilters.activeFilterCount > 0 && (
        <div className="active-filters-bar no-print">
          <span>Column filters:</span>

          {rtaFilterColumns
            .filter((col) => columnFilters.isColumnFiltered(col.key))
            .map((col) => (
              <span className="active-filter-chip" key={col.key}>
                {col.label}
                <button
                  type="button"
                  onClick={() => columnFilters.clearColumnFilter(col.key)}
                  title={`Clear ${col.label} filter`}
                >
                  <FaTimes />
                </button>
              </span>
            ))}

          <button
            type="button"
            className="active-filters-clear"
            onClick={columnFilters.clearAllFilters}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ================= RECORDS ================= */}

      <div className="form-card" id="print-area">
        <h2 className="section-title">
          <FaSearch />
          &nbsp; RTA Document Records
        </h2>

        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sr.No</th>
              {isColumnVisible("vehicleNo") && (
                <ColumnFilterHeader
                  columnKey="vehicleNo"
                  label="Vehicle"
                  allValues={columnFilters.getUniqueValues("vehicleNo")}
                  selected={columnFilters.filters.vehicleNo}
                  onApply={(v) => columnFilters.setColumnFilter("vehicleNo", v)}
                />
              )}
              {isColumnVisible("vehicleName") && <th>Vehicle Name</th>}
              {isColumnVisible("vehicleType") && <th>Vehicle Type</th>}
              {isColumnVisible("registeringRTO") && (
                <ColumnFilterHeader
                  columnKey="registeringRTO"
                  label="Registering RTO"
                  allValues={columnFilters.getUniqueValues("registeringRTO")}
                  selected={columnFilters.filters.registeringRTO}
                  onApply={(v) => columnFilters.setColumnFilter("registeringRTO", v)}
                />
              )}
              {isColumnVisible("site") && (
                <ColumnFilterHeader
                  columnKey="site"
                  label="Site"
                  allValues={columnFilters.getUniqueValues("site")}
                  selected={columnFilters.filters.site}
                  onApply={(v) => columnFilters.setColumnFilter("site", v)}
                />
              )}
              {isColumnVisible("engineer") && (
                <ColumnFilterHeader
                  columnKey="engineer"
                  label="Engineer"
                  allValues={columnFilters.getUniqueValues("engineer")}
                  selected={columnFilters.filters.engineer}
                  onApply={(v) => columnFilters.setColumnFilter("engineer", v)}
                />
              )}
              {isColumnVisible("registrationDate") && (
                <ColumnFilterHeader
                  columnKey="registrationDate"
                  label="Registration Date"
                  allValues={columnFilters.getUniqueValues("registrationDate")}
                  selected={columnFilters.filters.registrationDate}
                  onApply={(v) => columnFilters.setColumnFilter("registrationDate", v)}
                />
              )}
              {isColumnVisible("vehicleAge") && (
                <ColumnFilterHeader
                  columnKey="vehicleAgeStatus"
                  label="Vehicle Age"
                  allValues={columnFilters.getUniqueValues("vehicleAgeStatus")}
                  selected={columnFilters.filters.vehicleAgeStatus}
                  onApply={(v) => columnFilters.setColumnFilter("vehicleAgeStatus", v)}
                  valueColors={AGE_STATUS_COLORS}
                />
              )}
              {isColumnVisible("insuranceExpiry") && (
                <ColumnFilterHeader
                  columnKey="insuranceStatus"
                  label="Insurance"
                  allValues={columnFilters.getUniqueValues("insuranceStatus")}
                  selected={columnFilters.filters.insuranceStatus}
                  onApply={(v) => columnFilters.setColumnFilter("insuranceStatus", v)}
                  valueColors={EXPIRY_STATUS_COLORS}
                />
              )}
              {isColumnVisible("fitnessExpiry") && (
                <ColumnFilterHeader
                  columnKey="fitnessStatus"
                  label="Fitness"
                  allValues={columnFilters.getUniqueValues("fitnessStatus")}
                  selected={columnFilters.filters.fitnessStatus}
                  onApply={(v) => columnFilters.setColumnFilter("fitnessStatus", v)}
                  valueColors={EXPIRY_STATUS_COLORS}
                />
              )}
              {isColumnVisible("permitExpiry") && (
                <ColumnFilterHeader
                  columnKey="permitStatus"
                  label="Permit"
                  allValues={columnFilters.getUniqueValues("permitStatus")}
                  selected={columnFilters.filters.permitStatus}
                  onApply={(v) => columnFilters.setColumnFilter("permitStatus", v)}
                  valueColors={EXPIRY_STATUS_COLORS}
                />
              )}
              {isColumnVisible("pollutionExpiry") && (
                <ColumnFilterHeader
                  columnKey="pollutionStatus"
                  label="PUC"
                  allValues={columnFilters.getUniqueValues("pollutionStatus")}
                  selected={columnFilters.filters.pollutionStatus}
                  onApply={(v) => columnFilters.setColumnFilter("pollutionStatus", v)}
                  valueColors={EXPIRY_STATUS_COLORS}
                />
              )}
              {isColumnVisible("taxExpiry") && (
                <ColumnFilterHeader
                  columnKey="taxStatus"
                  label="Road Tax"
                  allValues={columnFilters.getUniqueValues("taxStatus")}
                  selected={columnFilters.filters.taxStatus}
                  onApply={(v) => columnFilters.setColumnFilter("taxStatus", v)}
                  valueColors={EXPIRY_STATUS_COLORS}
                />
              )}
              {isColumnVisible("remarks") && (
                <ColumnFilterHeader
                  columnKey="remarks"
                  label="Remarks"
                  allValues={columnFilters.getUniqueValues("remarks")}
                  selected={columnFilters.filters.remarks}
                  onApply={(v) => columnFilters.setColumnFilter("remarks", v)}
                />
              )}
              <th className="no-print">Action</th>
            </tr>
          </thead>

          <tbody>
            {displayedRecords.map((item, index) => (
              <tr key={item.id} id={`vehicle-${item.vehicleNo}`}>
                <td>{index + 1}</td>
                {isColumnVisible("vehicleNo") && <td>{item.vehicleNo}</td>}

                {isColumnVisible("vehicleName") && (
                  <td>
                    {vehicles.find((v) => v.vehicleNo === item.vehicleNo)
                      ?.vehicleName || "-"}
                  </td>
                )}

                {isColumnVisible("vehicleType") && (
                  <td>
                    {vehicles.find((v) => v.vehicleNo === item.vehicleNo)
                      ?.vehicleType || "-"}
                  </td>
                )}

                {isColumnVisible("registeringRTO") && (
                  <td>
                    {item.registeringRTO ||
                      vehicles.find((v) => v.vehicleNo === item.vehicleNo)
                        ?.registeringRTO ||
                      "-"}
                  </td>
                )}

                {isColumnVisible("site") && <td>{item.site}</td>}
                {isColumnVisible("engineer") && <td>{item.engineer}</td>}

                {isColumnVisible("registrationDate") && (
                  <td>
                    {formatDate(item.registrationDate) || (
                      <span className="text-muted">Not Set</span>
                    )}
                  </td>
                )}

                {isColumnVisible("vehicleAge") && (
                  <td>
                    <div className={getVehicleAge(item.registrationDate).className}>
                      {getVehicleAge(item.registrationDate).text}
                    </div>
                  </td>
                )}

                {isColumnVisible("insuranceExpiry") && (
                  <td>
    <div className={getExpiryBadge(item.insuranceExpiry).className}>
      {getExpiryBadge(item.insuranceExpiry).text}
    </div>

    <small>{getExpiryBadge(item.insuranceExpiry).days}</small>
  </td>
                )}
                {isColumnVisible("fitnessExpiry") && (
                  <td>
    <div className={getExpiryBadge(item.fitnessExpiry).className}>
      {getExpiryBadge(item.fitnessExpiry).text}
    </div>

    <small>{getExpiryBadge(item.fitnessExpiry).days}</small>
  </td>
                )}
                {isColumnVisible("permitExpiry") && (
                  <td>
    <div className={getExpiryBadge(item.permitExpiry).className}>
      {getExpiryBadge(item.permitExpiry).text}
    </div>

    <small>{getExpiryBadge(item.permitExpiry).days}</small>
  </td>
                )}
                {isColumnVisible("pollutionExpiry") && (
                  <td>
    <div className={getExpiryBadge(item.pollutionExpiry).className}>
      {getExpiryBadge(item.pollutionExpiry).text}
    </div>

    <small>{getExpiryBadge(item.pollutionExpiry).days}</small>
  </td>
                )}
                {isColumnVisible("taxExpiry") && (
                  <td>
    <div className={getExpiryBadge(item.taxExpiry).className}>
      {getExpiryBadge(item.taxExpiry).text}
    </div>

    <small>{getExpiryBadge(item.taxExpiry).days}</small>
  </td>
                )}

                {isColumnVisible("remarks") && <td>{item.remarks}</td>}

                <td className="no-print">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => handleEdit(item)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="icon-btn delete-btn"
                    onClick={() => handleDelete(item.id!)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
          </div>
  );
};

export default RtaDocuments;
