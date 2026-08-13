import { useEffect, useRef, useState } from "react";
import type { FineRecord as Fine } from "../types/Fine";
import type { Vehicle } from "../types/Vehicle";

import {
  getFines,
  addFine,
  updateFine,
  deleteFine,
} from "../services/fineApi";

import { getVehicles } from "../services/vehicleApi";
import { getSiteEngineers } from "../services/siteEngineerApi";
import type { SiteEngineer } from "../types/SiteEngineer";

import {
  FaSave,
  FaSyncAlt,
  FaTrash,
  FaTimes,
  FaSearch,
  FaEdit,
  FaMoneyBillWave,
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

const fineColumns: ColumnDef<Fine>[] = [
  { header: "Vehicle No", key: "vehicleNo" },
  { header: "Project Code", key: "projectCode" },
  { header: "Site", key: "site" },
  { header: "Engineer", key: "engineer" },
  { header: "Fine Date", key: "fineDate", type: "date" },
  { header: "Fine Reason", key: "fineReason" },
  { header: "Fine Amount", key: "fineAmount", type: "number" },
  { header: "Remarks", key: "remarks" },
];

// Columns shown in the records table - drives both the universal search
// box (checks every field below, Remarks excluded on purpose) and the
// "which columns to print" checklist.
const fineToolbarColumns: ToolbarColumn[] = [
  { key: "vehicleNo", label: "Vehicle" },
  { key: "projectCode", label: "Project Code" },
  { key: "site", label: "Site" },
  { key: "engineer", label: "Engineer" },
  { key: "fineDate", label: "Date" },
  { key: "fineReason", label: "Reason" },
  { key: "fineAmount", label: "Amount" },
  { key: "remarks", label: "Remarks" },
];

const FineRegister = () => {
  const [records, setRecords] = useState<Fine[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [siteEngineers, setSiteEngineers] = useState<SiteEngineer[]>([]);

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const {
    isColumnVisible,
    toggleColumn,
    showAllColumns,
    hideAllColumns,
  } = useColumnVisibility();
  const [formData, setFormData] = useState<Fine>({
  vehicleNo: "",
  projectCode: "",
  site: "",
  engineer: "",

  fineDate: "",
  fineReason: "",
  fineAmount: 0,

  remarks: "",
});

  const loadData = async () => {
    try {
      const [FineData, vehicleData, siteEngineerData] = await Promise.all([
        getFines(),
        getVehicles(),
        getSiteEngineers(),
      ]);

      setRecords(FineData);
      setVehicles(vehicleData);
      setSiteEngineers(siteEngineerData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      projectCode: siteInfo ? siteInfo.projectCode : prev.projectCode,
    }));
  }, [formData.vehicleNo, vehicles, siteEngineers]);

  const clearForm = () => {
    setEditingId(null);

    setFormData({
  vehicleNo: "",
  projectCode: "",
  site: "",
  engineer: "",

  fineDate: "",
  fineReason: "",
  fineAmount: 0,

  remarks: "",
});
  };

  const handleSave = async () => {
  if (!formData.vehicleNo) {
    alert("Please select a vehicle.");
    return;
  }

  if (!formData.fineReason.trim()) {
    alert("Please enter Fine Reason.");
    return;
  }

  if (formData.fineAmount <= 0) {
    alert("Please enter Fine Amount.");
    return;
  }

  try {
      if (editingId === null) {
        await addFine(formData);
        alert("Fine Saved Successfully");
      } else {
        await updateFine(editingId, formData);
        alert("Fine Updated Successfully");
      }

      await loadData();
      clearForm();
    } catch (error) {
      console.error(error);
      alert("Unable to Save Record");
    }
  };

  const handleEdit = (item: Fine) => {
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
  fineReason: string
) => {
  if (
    !window.confirm(
      `Delete this Fine Record?\n\nVehicle : ${vehicleNo}\nReason : ${fineReason}`
    )
  )
    return;

  try {
    await deleteFine(id);
    await loadData();
    alert("Record Deleted Successfully");
  } catch (error) {
    console.error(error);
    alert("Unable to Delete Record");
  }
};

  const handleExport = () => {
    exportRecordsToExcel(records, fineColumns, "Fine_Register");
  };

  // Import = REPLACE. Whatever is in the Excel file becomes the complete
  // data set: every existing record is removed first, then every valid
  // row from the file is inserted fresh.
  const handleImport = async (file: File) => {
    try {
      const rows = await readExcelFile(file);
      const imported = mapRowsToRecords<Fine>(rows, fineColumns).filter(
        (row) => row.vehicleNo
      );

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

      // De-duplicate rows within the file itself by Vehicle No + Fine
      // Date + Fine Reason (this is a log, so the same vehicle can
      // legitimately appear more than once).
      const uniqueRows = new Map<string, Partial<Fine>>();
      imported.forEach((row) =>
        uniqueRows.set(
          [row.vehicleNo, row.fineDate, row.fineReason]
            .map((v) => String(v ?? "").trim().toLowerCase())
            .join("|"),
          row
        )
      );

      const existing = await getFines();
      for (const r of existing) {
        if (r.id) await deleteFine(r.id);
      }

      let added = 0;

      for (const row of uniqueRows.values()) {
        const { id, ...data } = row as Fine;

        const vehicle = vehicles.find(
          (v) => v.vehicleNo === data.vehicleNo
        );

        const site = vehicle ? vehicle.site : data.site;

        const siteInfo = siteEngineers.find(
          (s) => s.siteLocation === site
        );

        const payload: Fine = {
          ...data,
          site,
          engineer: vehicle ? vehicle.engineer : data.engineer,
          projectCode: siteInfo ? siteInfo.projectCode : data.projectCode,
        };

        await addFine(payload);
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
  const filteredRecords = records.filter((record) => {
  const text = search.trim().toLowerCase();

  // Universal search across Vehicle, Project Code, Site, Engineer & Fine
  // Reason - Remarks is deliberately left out.
  return (
    !text ||
    [
      record.vehicleNo,
      record.projectCode,
      record.site,
      record.engineer,
      record.fineReason,
    ].some((field) => (field || "").toLowerCase().includes(text))
  );
});

  // Feed the *searched* rows in, not the raw list, so the Excel-style
  // filter dropdowns only offer values present in the current search
  // results instead of the whole unfiltered dataset.
  const columnFilters = useColumnFilters(filteredRecords);
  const displayedRecords = columnFilters.applyFilters(filteredRecords);

  const fineFilterColumns = [
    { key: "vehicleNo", label: "Vehicle" },
    { key: "projectCode", label: "Project Code" },
    { key: "site", label: "Site" },
    { key: "engineer", label: "Engineer" },
    { key: "fineDate", label: "Date" },
    { key: "fineReason", label: "Reason" },
    { key: "fineAmount", label: "Amount" },
    { key: "remarks", label: "Remarks" },
  ];

  // Subtotal of Fine Amount for whatever is currently on screen - stays
  // in sync with search/column filtering so it always reflects what's
  // visible.
  const fineSubtotal = displayedRecords.reduce(
    (sum, r) => sum + (Number(r.fineAmount) || 0),
    0
  );
    return (
    <div className="page-container">
      <div className="page-title-row">
        <h1 className="page-title">
  {editingId === null
    ? <><FaMoneyBillWave /> Fine Register</>
    : <><FaEdit /> Edit Fine Record</>}
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

      {/* ================= Fine DETAILS ================= */}

      <div className="form-card">
        <h2 className="section-title">Fine Details</h2>

        <div className="form-grid">

          <div className="form-group">
            <label>Fine Date</label>

            <input
              type="date"
              value={formData.fineDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fineDate: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
  <label>Fine Reason</label>

  <input
    type="text"
    value={formData.fineReason}
    onChange={(e) =>
      setFormData({
        ...formData,
        fineReason: e.target.value,
      })
    }
    placeholder="Enter Fine Reason"
  />
</div>

          <div className="form-group">
  <label>Fine Amount</label>

  <input
    type="number"
    value={formData.fineAmount}
    onChange={(e) =>
      setFormData({
        ...formData,
        fineAmount: Number(e.target.value),
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

      {/* ================= SEARCH & COLUMN FILTERS ================= */}

      <RecordsToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search Vehicle / Project Code / Site / Engineer / Reason..."
        columns={fineToolbarColumns}
        isColumnVisible={isColumnVisible}
        onToggleColumn={toggleColumn}
        onShowAllColumns={showAllColumns}
        onHideAllColumns={() =>
          hideAllColumns(fineToolbarColumns.map((col) => col.key))
        }
      />

      {columnFilters.activeFilterCount > 0 && (
        <div className="active-filters-bar no-print">
          <span>Column filters:</span>

          {fineFilterColumns
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
          &nbsp; Fine Records
        </h2>

        <div className="table-scroll">
        <table className="data-table">

          <thead>

            <tr>
              <th>Sr.No</th>
              {isColumnVisible("vehicleNo") && (
                <ColumnFilterHeader columnKey="vehicleNo" label="Vehicle"
                  allValues={columnFilters.getUniqueValues("vehicleNo")}
                  selected={columnFilters.filters.vehicleNo}
                  onApply={(v) => columnFilters.setColumnFilter("vehicleNo", v)} />
              )}
              {isColumnVisible("projectCode") && (
                <ColumnFilterHeader columnKey="projectCode" label="Project Code"
                  allValues={columnFilters.getUniqueValues("projectCode")}
                  selected={columnFilters.filters.projectCode}
                  onApply={(v) => columnFilters.setColumnFilter("projectCode", v)} />
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
              {isColumnVisible("fineDate") && (
                <ColumnFilterHeader columnKey="fineDate" label="Date"
                  allValues={columnFilters.getUniqueValues("fineDate")}
                  selected={columnFilters.filters.fineDate}
                  onApply={(v) => columnFilters.setColumnFilter("fineDate", v)} />
              )}
              {isColumnVisible("fineReason") && (
                <ColumnFilterHeader columnKey="fineReason" label="Reason"
                  allValues={columnFilters.getUniqueValues("fineReason")}
                  selected={columnFilters.filters.fineReason}
                  onApply={(v) => columnFilters.setColumnFilter("fineReason", v)} />
              )}
              {isColumnVisible("fineAmount") && (
                <ColumnFilterHeader columnKey="fineAmount" label="Amount"
                  allValues={columnFilters.getUniqueValues("fineAmount")}
                  selected={columnFilters.filters.fineAmount}
                  onApply={(v) => columnFilters.setColumnFilter("fineAmount", v)} />
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

                {isColumnVisible("vehicleNo") && <td>{item.vehicleNo}</td>}

                {isColumnVisible("projectCode") && (
                  <td>{item.projectCode}</td>
                )}

                {isColumnVisible("site") && <td>{item.site}</td>}

                {isColumnVisible("engineer") && <td>{item.engineer}</td>}

                {isColumnVisible("fineDate") && (
                  <td>
  {item.fineDate
    ? new Date(item.fineDate)
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")
    : "-"}
</td>
                )}
                {isColumnVisible("fineReason") && (
                  <td>{item.fineReason}</td>
                )}

                {isColumnVisible("fineAmount") && (
                  <td>
  ₹{" "}
  {Number(item.fineAmount).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
  })}
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
  item.fineReason
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
        fineToolbarColumns.filter((col) => isColumnVisible(col.key))
          .length + 2
      }
      style={{ textAlign: "center" }}
    >
      No Fine Records Found
    </td>
  </tr>
)}

          </tbody>

          {displayedRecords.length > 0 && isColumnVisible("fineAmount") && (
            <tfoot>
              <tr className="subtotal-row">
                <td
                  colSpan={
                    1 +
                    [
                      "vehicleNo",
                      "projectCode",
                      "site",
                      "engineer",
                      "fineDate",
                      "fineReason",
                    ].filter(isColumnVisible).length
                  }
                  style={{ textAlign: "right" }}
                >
                  <strong>Subtotal</strong>
                </td>

                <td>
                  <strong>
                    ₹{" "}
                    {fineSubtotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                    })}
                  </strong>
                </td>

                {isColumnVisible("remarks") && <td></td>}

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

export default FineRegister;