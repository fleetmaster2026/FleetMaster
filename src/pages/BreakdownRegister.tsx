import { useEffect, useRef, useState } from "react";
import type { BreakdownRecord as Breakdown } from "../types/Breakdown";
import type { Vehicle } from "../types/Vehicle";
import type { SiteEngineer } from "../types/SiteEngineer";

import {
  getBreakdowns,
  addBreakdown,
  updateBreakdown,
  deleteBreakdown,
} from "../services/breakdownApi";

import { getVehicles } from "../services/vehicleApi";
import { getSiteEngineers } from "../services/siteEngineerApi";

import {
  FaSave,
  FaSyncAlt,
  FaTrash,
  FaTimes,
  FaSearch,
  FaEdit,
  FaTools,
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

const breakdownColumns: ColumnDef<Breakdown>[] = [
  { header: "BU", key: "businessUnit" },
  { header: "Project Code", key: "projectCode" },
  { header: "Site", key: "site" },
  { header: "Vehicle No", key: "vehicleNo" },
  { header: "Vehicle Name", key: "vehicleName" },
  { header: "Vehicle Type", key: "vehicleType" },
  { header: "Engineer", key: "engineer" },
  { header: "Breakdown Date", key: "breakdownDate", type: "date" },
  { header: "Breakdown Days", key: "breakdownDays", type: "number" },
  { header: "Breakdown Type", key: "breakdownType" },
  { header: "Breakdown Description", key: "breakdownDescription" },
  { header: "Estimated Amount", key: "estimatedAmount", type: "number" },
  { header: "Approval Status", key: "approvalStatus" },
  { header: "Remarks", key: "remarks" },
];

// Columns shown in the records table - drives both the universal search
// box (checks every field below, Remarks excluded on purpose) and the
// "which columns to print" checklist.
const breakdownToolbarColumns: ToolbarColumn[] = [
  { key: "businessUnit", label: "BU" },
  { key: "projectCode", label: "Project Code" },
  { key: "vehicleNo", label: "Vehicle" },
  { key: "vehicleName", label: "Vehicle Name" },
  { key: "vehicleType", label: "Vehicle Type" },
  { key: "site", label: "Site" },
  { key: "engineer", label: "Engineer" },
  { key: "breakdownDate", label: "Date" },
  { key: "breakdownDays", label: "Days" },
  { key: "breakdownType", label: "Type" },
  { key: "breakdownDescription", label: "Description" },
  { key: "estimatedAmount", label: "Amount" },
  { key: "approvalStatus", label: "Approval" },
  { key: "remarks", label: "Remarks" },
];

// Days since the breakdown occurred, calculated live against today's date
// rather than stored as a fixed number - so it keeps reflecting reality as
// time passes instead of going stale.
const getBreakdownDays = (dateStr?: string): number => {
  if (!dateStr) return 0;

  const breakdownDate = new Date(dateStr);
  if (Number.isNaN(breakdownDate.getTime())) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  breakdownDate.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - breakdownDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return days > 0 ? days : 0;
};

const BreakdownRegister = () => {
  const [records, setRecords] = useState<Breakdown[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [siteEngineers, setSiteEngineers] = useState<SiteEngineer[]>([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [editingId, setEditingId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const {
    isColumnVisible,
    toggleColumn,
    showAllColumns,
    hideAllColumns,
  } = useColumnVisibility();
  const [formData, setFormData] = useState<Breakdown>({
  businessUnit: "",
  projectCode: "",
  vehicleNo: "",
  vehicleName: "",
  vehicleType: "",
  site: "",
  engineer: "",
  breakdownDate: "",
  breakdownDays: 0,
  breakdownType: "",
  breakdownDescription: "",
  estimatedAmount: 0,
  approvalStatus: "",
  remarks: "",
});

  const breakdownTypes = [
    "Engine",
    "Hydraulic",
    "Electrical",
    "Transmission",
    "Tyre",
    "Battery",
    "Brake",
    "Other",
  ];

  const loadData = async () => {
    try {
      const [breakdownData, vehicleData, siteEngineerData] =
        await Promise.all([
          getBreakdowns(),
          getVehicles(),
          getSiteEngineers(),
        ]);

      setRecords(breakdownData);
      setVehicles(vehicleData);
      setSiteEngineers(siteEngineerData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Selecting a vehicle auto-fills everything the app already knows about
  // it: Site & Engineer come from Vehicle Master, and Business Unit /
  // Project Code are then looked up from Site & Engineer Master using
  // that site. Nothing here needs to be typed by hand.
  useEffect(() => {
    if (!formData.vehicleNo) return;

    const selectedVehicle = vehicles.find(
      (v) => v.vehicleNo === formData.vehicleNo
    );

    if (!selectedVehicle) return;

    const siteInfo = siteEngineers.find(
      (s) => s.siteLocation === selectedVehicle.site
    );

    setFormData((prev) => ({
      ...prev,
      site: selectedVehicle.site,
      engineer: selectedVehicle.engineer,
      vehicleName: selectedVehicle.vehicleName,
      vehicleType: selectedVehicle.vehicleType,
      businessUnit: siteInfo ? siteInfo.businessUnit : prev.businessUnit,
      projectCode: siteInfo ? siteInfo.projectCode : prev.projectCode,
    }));
  }, [formData.vehicleNo, vehicles, siteEngineers]);

  // Breakdown Days is never typed in - it's calculated automatically
  // from today's date vs the Breakdown Date, and recalculates live
  // whenever the date changes.
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      breakdownDays: getBreakdownDays(prev.breakdownDate),
    }));
  }, [formData.breakdownDate]);

  const clearForm = () => {
    setEditingId(null);

    setFormData({
      businessUnit: "",
      projectCode: "",

      vehicleNo: "",
      vehicleName: "",
      vehicleType: "",

      site: "",
      engineer: "",

      breakdownDate: "",
      breakdownDays: 0,
      breakdownType: "",
      breakdownDescription: "",

      estimatedAmount: 0,
      approvalStatus: "",

      remarks: "",
    });
  };

  const handleSave = async () => {
    if (!formData.vehicleNo) {
      alert("Please select a vehicle.");
      return;
    }

    const payload: Breakdown = {
      ...formData,
      breakdownDays: getBreakdownDays(formData.breakdownDate),
    };

    try {
      if (editingId === null) {
        await addBreakdown(payload);
        alert("Breakdown Saved Successfully");
      } else {
        await updateBreakdown(editingId, payload);
        alert("Breakdown Updated Successfully");
      }

      await loadData();
      clearForm();
    } catch (error) {
      console.error(error);
      alert("Unable to Save Record");
    }
  };

  const handleEdit = (item: Breakdown) => {
  setEditingId(item.id!);
  setFormData(item);

  formRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

  const handleDelete = async (
  id: number,
  vehicleNo: string,
  breakdownType: string
) => {
  if (
    !window.confirm(
      `Delete this Breakdown Record?\n\nVehicle : ${vehicleNo}\nType : ${breakdownType}`
    )
  )
    return;

  try {
    await deleteBreakdown(id);
    await loadData();
    alert("Record Deleted Successfully");
  } catch (error) {
    console.error(error);
    alert("Unable to Delete Record");
  }
};

  const handleExport = () => {
    const exportData = records.map((r) => ({
      ...r,
      breakdownDays: getBreakdownDays(r.breakdownDate),
    }));

    exportRecordsToExcel(exportData, breakdownColumns, "Breakdown_Register");
  };

  // Import = REPLACE. Whatever is in the Excel file becomes the complete
  // data set: every existing record is removed first, then every valid
  // row from the file is inserted fresh.
  const handleImport = async (file: File) => {
    try {
      const rows = await readExcelFile(file);
      const imported = mapRowsToRecords<Breakdown>(
        rows,
        breakdownColumns
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

      // De-duplicate rows within the file itself by Vehicle No +
      // Breakdown Date + Breakdown Type (this is a log, so the same
      // vehicle can legitimately appear more than once).
      const uniqueRows = new Map<string, Partial<Breakdown>>();
      imported.forEach((row) =>
        uniqueRows.set(
          [row.vehicleNo, row.breakdownDate, row.breakdownType]
            .map((v) => String(v ?? "").trim().toLowerCase())
            .join("|"),
          row
        )
      );

      const existing = await getBreakdowns();
      for (const r of existing) {
        if (r.id) await deleteBreakdown(r.id);
      }

      // Reference data used to resolve everything the import file itself
      // doesn't need to specify: Vehicle Number is enough to look up
      // Site, Engineer, Vehicle Name and Vehicle Type from Vehicle
      // Master, and the resolved Site is then used to look up Business
      // Unit and Project Code from Site & Engineer Master.
      const currentVehicles = await getVehicles();
      const currentSiteEngineers = await getSiteEngineers();

      let added = 0;

      for (const row of uniqueRows.values()) {
        const { id, ...data } = row as Breakdown;

        const vehicle = currentVehicles.find(
          (v) => v.vehicleNo === data.vehicleNo
        );

        const site = vehicle ? vehicle.site : data.site;

        const siteInfo = currentSiteEngineers.find(
          (s) => s.siteLocation === site
        );

        const payload: Breakdown = {
          ...data,
          site,
          engineer: vehicle ? vehicle.engineer : data.engineer,
          vehicleName: vehicle ? vehicle.vehicleName : data.vehicleName,
          vehicleType: vehicle ? vehicle.vehicleType : data.vehicleType,
          businessUnit: siteInfo ? siteInfo.businessUnit : data.businessUnit,
          projectCode: siteInfo ? siteInfo.projectCode : data.projectCode,
          breakdownDays: getBreakdownDays(data.breakdownDate),
          approvalStatus: data.approvalStatus || "",
        };

        await addBreakdown(payload);
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
  const searchFilteredRecords = records.filter((record) => {
  const text = search.trim().toLowerCase();

  // Universal search across BU, Project Code, Vehicle, Vehicle Name,
  // Vehicle Type, Site, Engineer, Breakdown Type, Description & Approval
  // Status - Remarks is deliberately left out.
  return (
    !text ||
    [
      record.businessUnit,
      record.projectCode,
      record.vehicleNo,
      record.vehicleName,
      record.vehicleType,
      record.site,
      record.engineer,
      record.breakdownType,
      record.breakdownDescription,
      record.approvalStatus,
    ].some((field) => (field || "").toLowerCase().includes(text))
  );
});

  const filteredRecords = searchFilteredRecords.filter(
    (record) =>
      typeFilter === "ALL" || record.breakdownType === typeFilter
  );

  // Feed the *searched* rows in, not the raw list, so the Excel-style
  // filter dropdowns only offer values present in the current search
  // results instead of the whole unfiltered dataset.
  const columnFilters = useColumnFilters(filteredRecords);
  const displayedRecords = columnFilters.applyFilters(filteredRecords);

  // The type-count cards act as tabs (clicking one sets typeFilter), so
  // they're driven by search + column filters only - not typeFilter
  // itself, otherwise every other tab's count would collapse to 0 the
  // moment one tab was selected.
  const cardRecords = columnFilters.applyFilters(searchFilteredRecords);

  const breakdownFilterColumns = [
    { key: "businessUnit", label: "BU" },
    { key: "projectCode", label: "Project Code" },
    { key: "vehicleNo", label: "Vehicle" },
    { key: "vehicleName", label: "Vehicle Name" },
    { key: "vehicleType", label: "Vehicle Type" },
    { key: "site", label: "Site" },
    { key: "engineer", label: "Engineer" },
    { key: "breakdownDate", label: "Date" },
    { key: "breakdownDays", label: "Days" },
    { key: "breakdownType", label: "Type" },
    { key: "breakdownDescription", label: "Description" },
    { key: "estimatedAmount", label: "Amount" },
    { key: "approvalStatus", label: "Approval" },
    { key: "remarks", label: "Remarks" },
  ];

  // Subtotal of Estimated Amount for whatever is currently on screen -
  // stays in sync with search/type/column filtering so it always reflects
  // what's visible.
  const breakdownSubtotal = displayedRecords.reduce(
    (sum, r) => sum + (Number(r.estimatedAmount) || 0),
    0
  );
    return (
    <div className="page-container">
      <div className="page-title-row">
        <h1 className="page-title">
  {editingId === null
    ? <><FaTools /> Breakdown Register</>
    : <><FaEdit /> Edit Breakdown Record</>}
</h1>

        <ExcelActions
          onExport={handleExport}
          onImport={handleImport}
          onPrint={() => printTable("print-area")}
        />
      </div>

      {/* ================= VEHICLE INFORMATION ================= */}

      <div className="form-card" ref={formRef}>
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
            <label>Vehicle Name</label>

            <input
              type="text"
              value={formData.vehicleName}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Vehicle Type</label>

            <input
              type="text"
              value={formData.vehicleType}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Business Unit</label>

            <input
              type="text"
              value={formData.businessUnit}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Project Code</label>

            <input
              type="text"
              value={formData.projectCode}
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

      {/* ================= BREAKDOWN DETAILS ================= */}

      <div className="form-card">
        <h2 className="section-title">Breakdown Details</h2>

        <div className="form-grid">

          <div className="form-group">
            <label>Breakdown Date</label>

            <input
              type="date"
              value={formData.breakdownDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  breakdownDate: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Breakdown Days (auto-calculated)</label>

            <input
              type="text"
              value={
                formData.breakdownDate
                  ? `${getBreakdownDays(formData.breakdownDate)} day(s)`
                  : "-"
              }
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Breakdown Type</label>

            <select
              value={formData.breakdownType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  breakdownType: e.target.value,
                })
              }
            >
              <option value="">Select Type</option>

              {breakdownTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Approval Status</label>

            <input
              type="text"
              value={formData.approvalStatus}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  approvalStatus: e.target.value,
                })
              }
              placeholder="Enter Approval Status..."
            />
          </div>

          <div className="form-group">
  <label>Estimated Amount</label>

  <input
    type="number"
    value={formData.estimatedAmount}
    onChange={(e) =>
      setFormData({
        ...formData,
        estimatedAmount: Number(e.target.value),
      })
    }
  />
</div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Breakdown Description</label>

            <textarea
              rows={4}
              value={formData.breakdownDescription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  breakdownDescription: e.target.value,
                })
              }
              placeholder="Enter Breakdown Description..."
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
          className={`summary-card ${
            typeFilter === "ALL" ? "active-card" : ""
          }`}
          onClick={() => setTypeFilter("ALL")}
        >
          <FaTools size={28} />
          <h4>Total Breakdowns</h4>
          <h2>{cardRecords.length}</h2>
        </div>

        {breakdownTypes.map((type) => (
          <div
            key={type}
            className={`summary-card ${
              typeFilter === type ? "active-card" : ""
            }`}
            onClick={() => setTypeFilter(type)}
          >
            <h4>{type}</h4>

            <h2>
              {
                cardRecords.filter(
                  (item) =>
                    item.breakdownType.toLowerCase() ===
                    type.toLowerCase()
                ).length
              }
            </h2>
          </div>
        ))}

      </div>

      {/* ================= SEARCH & COLUMN FILTERS ================= */}

      <RecordsToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search BU / Project Code / Vehicle / Site / Engineer / Type..."
        columns={breakdownToolbarColumns}
        isColumnVisible={isColumnVisible}
        onToggleColumn={toggleColumn}
        onShowAllColumns={showAllColumns}
        onHideAllColumns={() =>
          hideAllColumns(breakdownToolbarColumns.map((col) => col.key))
        }
      />

      {columnFilters.activeFilterCount > 0 && (
        <div className="active-filters-bar no-print">
          <span>Column filters:</span>

          {breakdownFilterColumns
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
          &nbsp; Breakdown Records
        </h2>

        <div className="table-scroll">
        <table className="data-table">

          <thead>

            <tr>
              <th>Sr.No</th>
              {isColumnVisible("businessUnit") && (
                <ColumnFilterHeader columnKey="businessUnit" label="BU"
                  allValues={columnFilters.getUniqueValues("businessUnit")}
                  selected={columnFilters.filters.businessUnit}
                  onApply={(v) => columnFilters.setColumnFilter("businessUnit", v)} />
              )}
              {isColumnVisible("projectCode") && (
                <ColumnFilterHeader columnKey="projectCode" label="Project Code"
                  allValues={columnFilters.getUniqueValues("projectCode")}
                  selected={columnFilters.filters.projectCode}
                  onApply={(v) => columnFilters.setColumnFilter("projectCode", v)} />
              )}
              {isColumnVisible("vehicleNo") && (
                <ColumnFilterHeader columnKey="vehicleNo" label="Vehicle"
                  allValues={columnFilters.getUniqueValues("vehicleNo")}
                  selected={columnFilters.filters.vehicleNo}
                  onApply={(v) => columnFilters.setColumnFilter("vehicleNo", v)} />
              )}
              {isColumnVisible("vehicleName") && (
                <ColumnFilterHeader columnKey="vehicleName" label="Vehicle Name"
                  allValues={columnFilters.getUniqueValues("vehicleName")}
                  selected={columnFilters.filters.vehicleName}
                  onApply={(v) => columnFilters.setColumnFilter("vehicleName", v)} />
              )}
              {isColumnVisible("vehicleType") && (
                <ColumnFilterHeader columnKey="vehicleType" label="Vehicle Type"
                  allValues={columnFilters.getUniqueValues("vehicleType")}
                  selected={columnFilters.filters.vehicleType}
                  onApply={(v) => columnFilters.setColumnFilter("vehicleType", v)} />
              )}
              {isColumnVisible("site") && (
                <ColumnFilterHeader columnKey="site" label="Site"
                  allValues={columnFilters.getUniqueValues("site")}
                  selected={columnFilters.filters.site}
                  onApply={(v) => columnFilters.setColumnFilter("site", v)} />
              )}
              {isColumnVisible("engineer") && (
                <ColumnFilterHeader columnKey="engineer" label="Engineer"
                  allValues={columnFilters.getUniqueValues("engineer")}
                  selected={columnFilters.filters.engineer}
                  onApply={(v) => columnFilters.setColumnFilter("engineer", v)} />
              )}
              {isColumnVisible("breakdownDate") && (
                <ColumnFilterHeader columnKey="breakdownDate" label="Date"
                  allValues={columnFilters.getUniqueValues("breakdownDate")}
                  selected={columnFilters.filters.breakdownDate}
                  onApply={(v) => columnFilters.setColumnFilter("breakdownDate", v)} />
              )}
              {isColumnVisible("breakdownDays") && (
                <ColumnFilterHeader columnKey="breakdownDays" label="Days"
                  allValues={columnFilters.getUniqueValues("breakdownDays")}
                  selected={columnFilters.filters.breakdownDays}
                  onApply={(v) => columnFilters.setColumnFilter("breakdownDays", v)} />
              )}
              {isColumnVisible("breakdownType") && (
                <ColumnFilterHeader columnKey="breakdownType" label="Type"
                  allValues={columnFilters.getUniqueValues("breakdownType")}
                  selected={columnFilters.filters.breakdownType}
                  onApply={(v) => columnFilters.setColumnFilter("breakdownType", v)} />
              )}
              {isColumnVisible("breakdownDescription") && (
                <ColumnFilterHeader columnKey="breakdownDescription" label="Description"
                  allValues={columnFilters.getUniqueValues("breakdownDescription")}
                  selected={columnFilters.filters.breakdownDescription}
                  onApply={(v) => columnFilters.setColumnFilter("breakdownDescription", v)} />
              )}
              {isColumnVisible("estimatedAmount") && (
                <ColumnFilterHeader columnKey="estimatedAmount" label="Amount"
                  allValues={columnFilters.getUniqueValues("estimatedAmount")}
                  selected={columnFilters.filters.estimatedAmount}
                  onApply={(v) => columnFilters.setColumnFilter("estimatedAmount", v)} />
              )}
              {isColumnVisible("approvalStatus") && (
                <ColumnFilterHeader columnKey="approvalStatus" label="Approval"
                  allValues={columnFilters.getUniqueValues("approvalStatus")}
                  selected={columnFilters.filters.approvalStatus}
                  onApply={(v) => columnFilters.setColumnFilter("approvalStatus", v)}
                  valueColors={{ "Approved": "#16a34a", "Rejected": "#dc2626" }} />
              )}
              {isColumnVisible("remarks") && (
                <ColumnFilterHeader columnKey="remarks" label="Remarks"
                  allValues={columnFilters.getUniqueValues("remarks")}
                  selected={columnFilters.filters.remarks}
                  onApply={(v) => columnFilters.setColumnFilter("remarks", v)} />
              )}
              <th className="no-print">Action</th>
            </tr>

          </thead>

          <tbody>

            {displayedRecords.map((item, index) => (

              <tr
  key={item.id}
  className={editingId === item.id ? "editing-row" : ""}
>

                <td>{index + 1}</td>

                {isColumnVisible("businessUnit") && (
                  <td>{item.businessUnit}</td>
                )}

                {isColumnVisible("projectCode") && (
                  <td>{item.projectCode}</td>
                )}

                {isColumnVisible("vehicleNo") && <td>{item.vehicleNo}</td>}

                {isColumnVisible("vehicleName") && (
                  <td>{item.vehicleName}</td>
                )}

                {isColumnVisible("vehicleType") && (
                  <td>{item.vehicleType}</td>
                )}

                {isColumnVisible("site") && <td>{item.site}</td>}

                {isColumnVisible("engineer") && <td>{item.engineer}</td>}

                {isColumnVisible("breakdownDate") && (
                  <td>
  {item.breakdownDate
    ? new Date(item.breakdownDate)
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")
    : "-"}
</td>
                )}

                {isColumnVisible("breakdownDays") && (
                  <td>
  {(() => {
    const days = getBreakdownDays(item.breakdownDate);
    return (
      <>
        {days} day(s)
        {days > 30 && (
          <>
            {" "}
            <span className="badge-red">Overdue</span>
          </>
        )}
      </>
    );
  })()}
</td>
                )}

                {isColumnVisible("breakdownType") && (
                  <td>
  <span
    className={`breakdown-type ${item.breakdownType
      .toLowerCase()
      .replace(/\s+/g, "-")}`}
  >
    {item.breakdownType}
  </span>
</td>
                )}

                {isColumnVisible("breakdownDescription") && (
                  <td title={item.breakdownDescription}>
  {item.breakdownDescription?.length > 40
    ? item.breakdownDescription.substring(0, 40) + "..."
    : item.breakdownDescription}
</td>
                )}

                {isColumnVisible("estimatedAmount") && (
                  <td>₹ {Number(item.estimatedAmount).toLocaleString()}</td>
                )}

                {isColumnVisible("approvalStatus") && (
                  <td>
  <span
    className={
      item.approvalStatus === "Approved"
        ? "badge-green"
        : item.approvalStatus === "Rejected"
        ? "badge-red"
        : "badge-gray"
    }
  >
    {item.approvalStatus || "-"}
  </span>
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
                    onClick={() =>
  handleDelete(
    item.id!,
    item.vehicleNo,
    item.breakdownType
  )
}
                  >
                    <FaTrash />
                  </button>

                </td>

              </tr>

            ))}
            {displayedRecords.length === 0 && (
  <tr>
    <td
      colSpan={
        breakdownToolbarColumns.filter((col) =>
          isColumnVisible(col.key)
        ).length + 2
      }
      style={{ textAlign: "center" }}
    >
      No Breakdown Records Found
    </td>
  </tr>
)}

          </tbody>

          {displayedRecords.length > 0 && isColumnVisible("estimatedAmount") && (
            <tfoot>
              <tr className="subtotal-row">
                <td
                  colSpan={
                    1 +
                    [
                      "businessUnit",
                      "projectCode",
                      "vehicleNo",
                      "vehicleName",
                      "vehicleType",
                      "site",
                      "engineer",
                      "breakdownDate",
                      "breakdownDays",
                      "breakdownType",
                      "breakdownDescription",
                    ].filter(isColumnVisible).length
                  }
                  style={{ textAlign: "right" }}
                >
                  <strong>Subtotal</strong>
                </td>

                <td>
                  <strong>
                    ₹ {breakdownSubtotal.toLocaleString()}
                  </strong>
                </td>

                {(isColumnVisible("approvalStatus") ||
                  isColumnVisible("remarks")) && (
                  <td
                    colSpan={
                      ["approvalStatus", "remarks"].filter(isColumnVisible)
                        .length
                    }
                  ></td>
                )}

                <td className="no-print"></td>
              </tr>
            </tfoot>
          )}

        </table>
        </div>

      </div>

    </div>
  );
};

export default BreakdownRegister;