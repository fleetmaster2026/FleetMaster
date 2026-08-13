import {
  FaSave,
  FaSyncAlt,
  FaTimes,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { useEffect, useState } from "react";

import type { MonthlyUtilisationRecord as MonthlyUtilisationType } from "../types/MonthlyUtilisation";
import type { Vehicle } from "../types/Vehicle";

import {
  getMonthlyUtilisations,
  addMonthlyUtilisation,
  updateMonthlyUtilisation,
  deleteMonthlyUtilisation,
} from "../services/MonthlyUtilisationApi";

import { getVehicles } from "../services/vehicleApi";

import "../styles/MonthlyUtilisation.css";

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

// Columns shown in the records table - drives both the universal search
// box (checks every field below, Remarks excluded on purpose) and the
// "which columns to print" checklist.
const monthlyUtilisationToolbarColumns: ToolbarColumn[] = [
  { key: "utilisationMonth", label: "Month" },
  { key: "vehicleNo", label: "Vehicle" },
  { key: "projectCode", label: "Project Code" },
  { key: "site", label: "Site" },
  { key: "engineer", label: "Engineer" },
  { key: "kmUtilisation", label: "KM %" },
  { key: "hoursUtilisation", label: "Hours %" },
  { key: "remarks", label: "Remarks" },
];

const monthlyUtilisationColumns: ColumnDef<MonthlyUtilisationType>[] = [
  { header: "Month", key: "utilisationMonth" },
  { header: "Vehicle No", key: "vehicleNo" },
  { header: "Project Code", key: "projectCode" },
  { header: "Site", key: "site" },
  { header: "Engineer", key: "engineer" },
  { header: "Opening KM", key: "openingKm", type: "number" },
  { header: "Closing KM", key: "closingKm", type: "number" },
  { header: "Difference KM", key: "differenceKm", type: "number" },
  { header: "Target KM", key: "targetKm", type: "number" },
  { header: "KM Utilisation %", key: "kmUtilisation", type: "number" },
  { header: "Opening Hours", key: "openingHours", type: "number" },
  { header: "Closing Hours", key: "closingHours", type: "number" },
  { header: "Difference Hours", key: "differenceHours", type: "number" },
  { header: "Target Hours", key: "targetHours", type: "number" },
  { header: "Hours Utilisation %", key: "hoursUtilisation", type: "number" },
  { header: "Remarks", key: "remarks" },
];

const MonthlyUtilisation = () => {
  // ============================================
  // STATES
  // ============================================

  const [records, setRecords] = useState<MonthlyUtilisationType[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  const {
    isColumnVisible,
    toggleColumn,
    showAllColumns,
    hideAllColumns,
  } = useColumnVisibility();

  const emptyForm: MonthlyUtilisationType = {
  utilisationMonth: "",

  vehicleNo: "",
  projectCode: "",
  site: "",
  engineer: "",

  openingKm: 0,
  closingKm: 0,
  differenceKm: 0,
  targetKm: 0,
  kmUtilisation: 0,

  openingHours: 0,
  closingHours: 0,
  differenceHours: 0,
  targetHours: 0,
  hoursUtilisation: 0,

  remarks: "",
};

const [formData, setFormData] =
  useState<MonthlyUtilisationType>(emptyForm);

  // ============================================
  // LOAD DATA
  // ============================================

  const loadData = async () => {
    try {
      const utilisationData = await getMonthlyUtilisations();
      const vehicleData = await getVehicles();

      setRecords(utilisationData);
      setVehicles(vehicleData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================
  // AUTO FILL VEHICLE DETAILS
  // ============================================

  useEffect(() => {
  if (!formData.vehicleNo) return;

  const vehicle = vehicles.find(
    (v) => v.vehicleNo === formData.vehicleNo
  );

  if (!vehicle) return;

  setFormData((prev) => ({
    ...prev,
    projectCode: vehicle.projectCode,
    site: vehicle.site,
    engineer: vehicle.engineer,
    targetKm: vehicle.targetKm,
    targetHours: vehicle.targetHours,
  }));
}, [formData.vehicleNo, vehicles]);

  // ============================================
  // AUTO CALCULATIONS
  // ============================================

  useEffect(() => {
    const differenceKm =
      Number(formData.closingKm) -
      Number(formData.openingKm);

    const differenceHours =
      Number(formData.closingHours) -
      Number(formData.openingHours);
const kmUtilisation =
  Number(formData.targetKm) > 0
    ? Math.min(
        (differenceKm / Number(formData.targetKm)) * 100,
        100
      )
    : 0;

const hoursUtilisation =
  Number(formData.targetHours) > 0
    ? Math.min(
        (differenceHours / Number(formData.targetHours)) * 100,
        100
      )
    : 0;

    setFormData((prev) => ({
      ...prev,

      differenceKm,
      differenceHours,

      kmUtilisation: Number(
        kmUtilisation.toFixed(2)
      ),

      hoursUtilisation: Number(
        hoursUtilisation.toFixed(2)
      ),
    }));
  }, [
    formData.openingKm,
    formData.closingKm,
    formData.openingHours,
    formData.closingHours,
    formData.targetKm,
    formData.targetHours,
  ]);

  // ============================================
  // SUMMARY
  // ============================================

  // ============================================
  // BADGE COLOR
  // ============================================

  const getBadgeClass = (value: number) => {
    if (value >= 76) return "badge green";
    if (value >= 41) return "badge orange";
    return "badge red";
  };

  // Universal search: matches Month, Vehicle, Project Code, Site or
  // Engineer - not just Vehicle No. Remarks is deliberately left out.
  const filteredRecords = records.filter((item) => {
    const text = search.trim().toLowerCase();
    if (!text) return true;

    return [
      item.utilisationMonth,
      item.vehicleNo,
      item.projectCode,
      item.site,
      item.engineer,
    ].some((field) => (field || "").toLowerCase().includes(text));
  });

  // Feed the *searched* rows in, not the raw list, so the Excel-style
  // filter dropdowns only offer values present in the current search
  // results instead of the whole unfiltered dataset.
  const columnFilters = useColumnFilters(filteredRecords);
  const displayedRecords = columnFilters.applyFilters(filteredRecords);

  // Summary cards reflect whatever is currently on screen (search + every
  // active column filter) - not the full unfiltered dataset.
  const kmRecords = displayedRecords.filter(
    (record) => Number(record.targetKm) > 0
  );

  const hourRecords = displayedRecords.filter(
    (record) => Number(record.targetHours) > 0
  );

  const averageKm =
    kmRecords.length === 0
      ? 0
      : (
          kmRecords.reduce(
            (sum, item) => sum + Math.min(item.kmUtilisation, 100),
            0
          ) / kmRecords.length
        ).toFixed(2);

  const averageHours =
    hourRecords.length === 0
      ? 0
      : (
          hourRecords.reduce(
            (sum, item) => sum + Math.min(item.hoursUtilisation, 100),
            0
          ) / hourRecords.length
        ).toFixed(2);

  const poorVehicles = displayedRecords.filter((item) => {
    const kmPoor =
      Number(item.targetKm) > 0 &&
      item.kmUtilisation < 40;

    const hoursPoor =
      Number(item.targetHours) > 0 &&
      item.hoursUtilisation < 40;

    return kmPoor || hoursPoor;
  }).length;

  const monthlyFilterColumns = [
    { key: "utilisationMonth", label: "Month" },
    { key: "vehicleNo", label: "Vehicle" },
    { key: "projectCode", label: "Project Code" },
    { key: "site", label: "Site" },
    { key: "engineer", label: "Engineer" },
    { key: "kmUtilisation", label: "KM %" },
    { key: "hoursUtilisation", label: "Hours %" },
    { key: "remarks", label: "Remarks" },
  ];

  const clearForm = () => {
  setFormData(emptyForm);
  setEditingId(null);
};
const handleSave = async () => {
  if (!formData.utilisationMonth) {
    alert("Select Month");
    return;
  }

  if (!formData.vehicleNo) {
    alert("Select Vehicle");
    return;
  }

  try {
    if (editingId === null) {
      // SAVE NEW RECORD
      await addMonthlyUtilisation(formData);

      alert("Record Saved Successfully");
    } else {
      // UPDATE EXISTING RECORD
      await updateMonthlyUtilisation(
        editingId,
        formData
      );

      alert("Record Updated Successfully");
    }

    await loadData();

    clearForm();
  } catch (error) {
    console.error(error);

    alert("Unable to Save Record");
  }
};
const handleEdit = (record: MonthlyUtilisationType) => {
  setEditingId(record.id!);
  setFormData(record);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
const handleDelete = async (id: number) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this record?"
  );

  if (!confirmDelete) return;

  await deleteMonthlyUtilisation(id);

  await loadData();

  if (editingId === id) {
    clearForm();
  }
};

const handleExport = () => {
  exportRecordsToExcel(
    records,
    monthlyUtilisationColumns,
    "Monthly_Utilisation"
  );
};

// Import = REPLACE. Whatever is in the Excel file becomes the complete
// data set: every existing record is removed first, then every valid
// row from the file is inserted fresh.
const handleImport = async (file: File) => {
  try {
    const rows = await readExcelFile(file);
    const imported = mapRowsToRecords<MonthlyUtilisationType>(
      rows,
      monthlyUtilisationColumns
    ).filter((row) => row.vehicleNo && row.utilisationMonth);

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

    // De-duplicate rows within the file itself by Vehicle No + Month,
    // keeping the last occurrence.
    const uniqueRows = new Map<string, Partial<MonthlyUtilisationType>>();
    imported.forEach((row) =>
      uniqueRows.set(
        `${String(row.vehicleNo).trim().toLowerCase()}|${String(
          row.utilisationMonth
        )
          .trim()
          .toLowerCase()}`,
        row
      )
    );

    const existing = await getMonthlyUtilisations();
    for (const r of existing) {
      if (r.id) await deleteMonthlyUtilisation(r.id);
    }

    let added = 0;

    for (const row of uniqueRows.values()) {
      const { id, ...data } = row as MonthlyUtilisationType;

      const vehicle = vehicles.find(
        (v) => v.vehicleNo === data.vehicleNo
      );

      const site = vehicle ? vehicle.site : data.site;
      const engineer = vehicle ? vehicle.engineer : data.engineer;
      const projectCode = vehicle ? vehicle.projectCode : data.projectCode;
      const targetKm = vehicle ? vehicle.targetKm : data.targetKm;
      const targetHours = vehicle
        ? vehicle.targetHours
        : data.targetHours;

      const differenceKm = Number(data.closingKm) - Number(data.openingKm);
      const differenceHours =
        Number(data.closingHours) - Number(data.openingHours);

      const kmUtilisation =
        Number(targetKm) > 0
          ? Math.min((differenceKm / Number(targetKm)) * 100, 100)
          : 0;

      const hoursUtilisation =
        Number(targetHours) > 0
          ? Math.min((differenceHours / Number(targetHours)) * 100, 100)
          : 0;

      const payload: Omit<MonthlyUtilisationType, "id"> = {
        ...data,
        site,
        engineer,
        projectCode,
        targetKm,
        targetHours,
        differenceKm,
        differenceHours,
        kmUtilisation: Number(kmUtilisation.toFixed(2)),
        hoursUtilisation: Number(hoursUtilisation.toFixed(2)),
      };

      await addMonthlyUtilisation(payload);
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
  const isKmEnabled = Number(formData.targetKm) > 0;
  const isHoursEnabled = Number(formData.targetHours) > 0;
  // ============================================
  // PART 2 STARTS HERE
  // ============================================

  return (
    <div className="page-container">
  <div className="page-title-row">
    <h1 className="page-title">Monthly Utilisation</h1>

    <ExcelActions
      onExport={handleExport}
      onImport={handleImport}
      onPrint={() => printTable("print-area")}
    />
  </div>

  {/* ================= SUMMARY ================= */}

  <div className="summary-grid">
    <div className="summary-card">
      <h4>Total Records</h4>
      <h2>{displayedRecords.length}</h2>
    </div>

    <div className="summary-card">
      <h4>Average KM %</h4>
      <h2>{averageKm}%</h2>
    </div>

    <div className="summary-card">
      <h4>Average Hours %</h4>
      <h2>{averageHours}%</h2>
    </div>

    <div className="summary-card">
      <h4>Poor Vehicles</h4>
      <h2>{poorVehicles}</h2>
    </div>
  </div>

  {/* ================= VEHICLE INFORMATION ================= */}

  <div className="form-card">
    <h2 className="section-title">Vehicle Information</h2>

    <div className="form-grid">

      <div className="form-group">
        <label>Month</label>

        <input
          type="month"
          value={formData.utilisationMonth}
          onChange={(e) =>
            setFormData({
              ...formData,
              utilisationMonth: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label>Vehicle</label>

        <SearchableSelect
          options={vehicles.map((vehicle) => ({
            value: vehicle.vehicleNo,
            label: vehicle.vehicleNo,
          }))}
          value={formData.vehicleNo}
          placeholder="Select Vehicle"
          onChange={(value) => {
            const selectedVehicle = vehicles.find(
              (v) => v.vehicleNo === value
            );

            setFormData({
              ...formData,
              vehicleNo: value,
              projectCode: selectedVehicle?.projectCode || "",
              site: selectedVehicle?.site || "",
              engineer: selectedVehicle?.engineer || "",
              targetKm: selectedVehicle?.targetKm || 0,
              targetHours: selectedVehicle?.targetHours || 0,

              // Optional: Reset readings when changing vehicle
              openingKm: 0,
              closingKm: 0,
              openingHours: 0,
              closingHours: 0,
            });
          }}
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

  {/* PART 3 STARTS BELOW */}
    {/* ================= KM DETAILS ================= */}

  <div className="form-card">
    <h2 className="section-title">KM Details</h2>

    <div className="form-grid">

      <div className="form-group">
        <label>Opening KM</label>

        <input
  type="number"
  value={formData.openingKm}
  disabled={!isKmEnabled}
  onChange={(e) =>
    setFormData({
      ...formData,
      openingKm: Number(e.target.value),
    })
  }
/>
      </div>

      <div className="form-group">
        <label>Closing KM</label>

        <input
  type="number"
  value={formData.closingKm}
  disabled={!isKmEnabled}
  onChange={(e) =>
    setFormData({
      ...formData,
      closingKm: Number(e.target.value),
    })
  }
/>
      </div>

      <div className="form-group">
        <label>Difference KM</label>

        <input
          type="number"
          value={formData.differenceKm}
          readOnly
          className="readonly-box"
        />
      </div>

      <div className="form-group">
        <label>Target KM</label>

        <input
          type="number"
          value={formData.targetKm}
          readOnly
          className="readonly-box"
        />
      </div>

      <div className="form-group">
        <label>KM Utilisation %</label>

        <div className={getBadgeClass(formData.kmUtilisation)}>
          {Math.min(formData.kmUtilisation,100).toFixed(2)}%
        </div>
      </div>

    </div>
  </div>

  {/* PART 4 STARTS BELOW */}
    {/* ================= HOURS DETAILS ================= */}

  <div className="form-card">
    <h2 className="section-title">Hours Details</h2>

    <div className="form-grid">

      <div className="form-group">
        <label>Opening Hours</label>

        <input
  type="number"
  value={formData.openingHours}
  disabled={!isHoursEnabled}
  onChange={(e) =>
    setFormData({
      ...formData,
      openingHours: Number(e.target.value),
    })
  }
/>
      </div>

      <div className="form-group">
        <label>Closing Hours</label>

        <input
  type="number"
  value={formData.closingHours}
  disabled={!isHoursEnabled}
  onChange={(e) =>
    setFormData({
      ...formData,
      closingHours: Number(e.target.value),
    })
  }
/>
      </div>

      <div className="form-group">
        <label>Difference Hours</label>

        <input
          type="number"
          value={formData.differenceHours}
          readOnly
          className="readonly-box"
        />
      </div>

      <div className="form-group">
        <label>Target Hours</label>

        <input
          type="number"
          value={formData.targetHours}
          readOnly
          className="readonly-box"
        />
      </div>

      <div className="form-group">
        <label>Hours Utilisation %</label>

        <div className={getBadgeClass(formData.hoursUtilisation)}>
          {Math.min(formData.hoursUtilisation,100).toFixed(2)}%
        </div>
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
        placeholder="Enter remarks..."
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

  {/* PART 5 STARTS BELOW */}
    {/* ================= SEARCH & COLUMN FILTERS ================= */}

  <RecordsToolbar
    search={search}
    onSearchChange={setSearch}
    placeholder="Search Month / Vehicle / Project Code / Site / Engineer..."
    columns={monthlyUtilisationToolbarColumns}
    isColumnVisible={isColumnVisible}
    onToggleColumn={toggleColumn}
    onShowAllColumns={showAllColumns}
    onHideAllColumns={() =>
      hideAllColumns(monthlyUtilisationToolbarColumns.map((col) => col.key))
    }
  />

  {/* ================= RECORDS TABLE ================= */}

  {columnFilters.activeFilterCount > 0 && (
    <div className="active-filters-bar no-print">
      <span>Column filters:</span>

      {monthlyFilterColumns
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

<div className="form-card" id="print-area">
{/* Print-only copy of the summary cards above - hidden on screen,
    shown when printing (see printTable.ts override) so printed
    copies open with the same Total Records / Average KM % /
    Average Hours % / Poor Vehicles context as the on-screen page. */}
<div className="summary-grid print-only-summary" style={{ display: "none" }}>
  <div className="summary-card">
    <h4>Total Records</h4>
    <h2>{displayedRecords.length}</h2>
  </div>

  <div className="summary-card">
    <h4>Average KM %</h4>
    <h2>{averageKm}%</h2>
  </div>

  <div className="summary-card">
    <h4>Average Hours %</h4>
    <h2>{averageHours}%</h2>
  </div>

  <div className="summary-card">
    <h4>Poor Vehicles</h4>
    <h2>{poorVehicles}</h2>
  </div>
</div>

<h2 className="section-title">
Monthly Utilisation Records
</h2>

    <div className="table-scroll">
    <table className="data-table">
      <thead>
        <tr>
          <th>Sr.No</th>
          {isColumnVisible("utilisationMonth") && (
            <ColumnFilterHeader
              columnKey="utilisationMonth"
              label="Month"
              allValues={columnFilters.getUniqueValues("utilisationMonth")}
              selected={columnFilters.filters.utilisationMonth}
              onApply={(v) => columnFilters.setColumnFilter("utilisationMonth", v)}
            />
          )}
          {isColumnVisible("vehicleNo") && (
            <ColumnFilterHeader
              columnKey="vehicleNo"
              label="Vehicle"
              allValues={columnFilters.getUniqueValues("vehicleNo")}
              selected={columnFilters.filters.vehicleNo}
              onApply={(v) => columnFilters.setColumnFilter("vehicleNo", v)}
            />
          )}
          {isColumnVisible("projectCode") && (
            <ColumnFilterHeader
              columnKey="projectCode"
              label="Project Code"
              allValues={columnFilters.getUniqueValues("projectCode")}
              selected={columnFilters.filters.projectCode}
              onApply={(v) => columnFilters.setColumnFilter("projectCode", v)}
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
          {isColumnVisible("kmUtilisation") && (
            <ColumnFilterHeader
              columnKey="kmUtilisation"
              label="KM %"
              allValues={columnFilters.getUniqueValues("kmUtilisation")}
              selected={columnFilters.filters.kmUtilisation}
              onApply={(v) => columnFilters.setColumnFilter("kmUtilisation", v)}
            />
          )}
          {isColumnVisible("hoursUtilisation") && (
            <ColumnFilterHeader
              columnKey="hoursUtilisation"
              label="Hours %"
              allValues={columnFilters.getUniqueValues("hoursUtilisation")}
              selected={columnFilters.filters.hoursUtilisation}
              onApply={(v) => columnFilters.setColumnFilter("hoursUtilisation", v)}
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
          <th className="no-print">Actions</th>
        </tr>
      </thead>

      <tbody>
        {displayedRecords.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              {isColumnVisible("utilisationMonth") && (
                <td>{item.utilisationMonth}</td>
              )}
              {isColumnVisible("vehicleNo") && <td>{item.vehicleNo}</td>}
              {isColumnVisible("projectCode") && (
                <td>{item.projectCode}</td>
              )}
              {isColumnVisible("site") && <td>{item.site}</td>}
              {isColumnVisible("engineer") && <td>{item.engineer}</td>}

              {isColumnVisible("kmUtilisation") && (
                <td>
                  <span className={getBadgeClass(Math.min(item.kmUtilisation, 100))}>
                    {item.targetKm > 0
    ? `${Math.min(item.kmUtilisation, 100).toFixed(2)}%`
    : "-"}
                  </span>
                </td>
              )}

              {isColumnVisible("hoursUtilisation") && (
                <td>
                  <span className={getBadgeClass(Math.min(item.hoursUtilisation, 100))}>
                    {item.targetHours > 0
    ? `${Math.min(item.hoursUtilisation, 100).toFixed(2)}%`
    : "-"}
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

export default MonthlyUtilisation;