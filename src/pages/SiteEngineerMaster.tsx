import { useEffect, useState } from "react";
import {
  FaSave,
  FaSyncAlt,
  FaTimes,
  FaSearch,
  FaEdit,
  FaTrash,
  FaHardHat,
} from "react-icons/fa";

import type { SiteEngineer } from "../types/SiteEngineer";

import {
  getSiteEngineers,
  addSiteEngineer,
  updateSiteEngineer,
  deleteSiteEngineer,
} from "../services/siteEngineerApi";

import ExcelActions from "../components/common/ExcelActions";
import ColumnFilterHeader from "../components/common/ColumnFilterHeader";
import { useColumnFilters } from "../hooks/useColumnFilters";
import { printTable } from "../utils/printTable";
import {
  exportRecordsToExcel,
  readExcelFile,
  mapRowsToRecords,
  type ColumnDef,
} from "../utils/excelUtils";

const businessUnits = [
  "IRR",
  "WATER",
];

const siteEngineerColumns: ColumnDef<SiteEngineer>[] = [
  { header: "Site Location", key: "siteLocation" },
  { header: "Project Code", key: "projectCode" },
  { header: "Business Unit", key: "businessUnit" },
  { header: "Engineer Name", key: "engineerName" },
  { header: "Mobile", key: "mobile" },
  { header: "Email", key: "email" },
  { header: "Designation", key: "designation" },
  { header: "Project Manager Name", key: "projectManagerName" },
  { header: "PM Contact", key: "pmContact" },
  { header: "PM Email", key: "pmEmail" },
];

const SiteEngineerMaster = () => {
  const [records, setRecords] = useState<SiteEngineer[]>([]);

  const emptyRecord: SiteEngineer = {
    siteLocation: "",
    projectCode: "",
    businessUnit: "IRR",

    engineerName: "",
    mobile: "",
    email: "",
    designation: "",

    projectManagerName: "",
    pmContact: "",
    pmEmail: "",
  };

  const [formData, setFormData] =
    useState(emptyRecord);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [businessUnitFilter, setBusinessUnitFilter] =
    useState("ALL");

  const loadData = async () => {
    try {
      const data =
        await getSiteEngineers();

      setRecords(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearForm = () => {
    setEditingId(null);

    setFormData(emptyRecord);
  };

  const handleSave = async () => {
    try {
      if (editingId === null) {
        await addSiteEngineer(formData);

        alert(
          "Record Added Successfully"
        );
      } else {
        await updateSiteEngineer(
          editingId,
          formData
        );

        alert(
          "Record Updated Successfully"
        );
      }

      await loadData();

      clearForm();
    } catch (error) {
      console.error(error);

      alert("Unable to Save");
    }
  };

  const handleEdit = (
    item: SiteEngineer
  ) => {
    setEditingId(item.id!);

    setFormData(item);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (
    id: number
  ) => {
    if (
      !window.confirm(
        "Delete this record?"
      )
    )
      return;

    await deleteSiteEngineer(id);

    await loadData();

    alert(
      "Record Deleted Successfully"
    );
  };

  const handleExport = () => {
    exportRecordsToExcel(
      records,
      siteEngineerColumns,
      "Site_Engineer_Master"
    );
  };

  // Builds a normalised "fingerprint" for a record so we can tell whether
  // an imported row already exists, regardless of what (if anything) is in
  // its ID column. Site + Project Code + Engineer Name is what makes a row
  // unique in this sheet.
  const recordKey = (r: Partial<SiteEngineer>) =>
    [r.siteLocation, r.projectCode, r.engineerName]
      .map((v) => String(v ?? "").trim().toLowerCase())
      .join("|");

  // Import = REPLACE. Whatever is in the Excel file becomes the complete
  // data set: every existing record is removed first, then every valid
  // row from the file is inserted fresh. Nothing "merges" or "updates" -
  // the sheet is treated as the single source of truth.
  const handleImport = async (file: File) => {
    try {
      const rows = await readExcelFile(file);

      const imported = mapRowsToRecords<SiteEngineer>(
        rows,
        siteEngineerColumns
      ).filter((row) => row.siteLocation || row.engineerName);

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

      // Also de-duplicate rows within the file itself (e.g. the same
      // Site + Project Code + Engineer appearing twice), keeping the
      // last occurrence.
      const uniqueRows = new Map<string, Partial<SiteEngineer>>();
      imported.forEach((row) => uniqueRows.set(recordKey(row), row));

      // Wipe existing data first.
      const existing = await getSiteEngineers();
      for (const r of existing) {
        if (r.id) await deleteSiteEngineer(r.id);
      }

      // Insert the file's data fresh.
      let added = 0;
      for (const row of uniqueRows.values()) {
        const { id, ...data } = row as SiteEngineer;
        await addSiteEngineer(data as SiteEngineer);
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

  const filteredRecords =
    records.filter((record) => {
      const text =
        search.toLowerCase();

      const searchMatch =
        record.siteLocation
          .toLowerCase()
          .includes(text) ||
        record.projectCode
          .toLowerCase()
          .includes(text) ||
        record.engineerName
          .toLowerCase()
          .includes(text) ||
        record.mobile
          .toLowerCase()
          .includes(text) ||
        record.email
          .toLowerCase()
          .includes(text) ||
        (record.projectManagerName ?? "")
          .toLowerCase()
          .includes(text) ||
        (record.pmContact ?? "")
          .toLowerCase()
          .includes(text);

      const businessMatch =
        businessUnitFilter === "ALL" ||
        record.businessUnit ===
          businessUnitFilter;

      return (
        searchMatch &&
        businessMatch
      );
    });

  // Feed the *searched* rows in, not the raw list, so the Excel-style
  // filter dropdowns only offer values present in the current search
  // results instead of the whole unfiltered dataset.
  const columnFilters = useColumnFilters(filteredRecords);
  const filteredAndColumnFilteredRecords = columnFilters.applyFilters(filteredRecords);

  return (
<div className="page-container">

  <div className="page-title-row">

    <h1 className="page-title">
      {editingId === null
        ? <><FaHardHat /> Site & Engineer Master</>
        : <><FaEdit /> Edit Site & Engineer</>}
    </h1>

    <ExcelActions
      onExport={handleExport}
      onImport={handleImport}
      onPrint={() => printTable("print-area")}
    />

  </div>

  <div className="form-card">

    <h2 className="section-title">
      Site & Engineer Information
    </h2>

    <div className="form-grid">

      <div className="form-group">
        <label>Site Location</label>

        <input
          value={formData.siteLocation}
          onChange={(e) =>
            setFormData({
              ...formData,
              siteLocation: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label>Project Code</label>

        <input
          value={formData.projectCode}
          onChange={(e) =>
            setFormData({
              ...formData,
              projectCode: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label>Business Unit</label>

        <select
          value={formData.businessUnit}
          onChange={(e) =>
            setFormData({
              ...formData,
              businessUnit: e.target.value as
                | "IRR"
                | "WATER",
            })
          }
        >
          {businessUnits.map((unit) => (
            <option
              key={unit}
              value={unit}
            >
              {unit}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Engineer Name</label>

        <input
          value={formData.engineerName}
          onChange={(e) =>
            setFormData({
              ...formData,
              engineerName: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label>Mobile</label>

        <input
          value={formData.mobile}
          onChange={(e) =>
            setFormData({
              ...formData,
              mobile: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label>Email</label>

        <input
          value={formData.email}
          onChange={(e) =>
            setFormData({
              ...formData,
              email: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label>Designation</label>

        <input
          value={formData.designation}
          onChange={(e) =>
            setFormData({
              ...formData,
              designation: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label>Project Manager Name</label>

        <input
          value={formData.projectManagerName}
          onChange={(e) =>
            setFormData({
              ...formData,
              projectManagerName: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label>PM Contact Number</label>

        <input
          value={formData.pmContact}
          onChange={(e) =>
            setFormData({
              ...formData,
              pmContact: e.target.value,
            })
          }
        />
      </div>

      <div className="form-group">
        <label>PM Email</label>

        <input
          value={formData.pmEmail}
          onChange={(e) =>
            setFormData({
              ...formData,
              pmEmail: e.target.value,
            })
          }
        />
      </div>

    </div>

  </div>

  <div className="form-card">

    <div className="button-group">

      {editingId === null ? (
        <>
          <button
            className="save-btn"
            onClick={handleSave}
          >
            <FaSave />
            &nbsp; Save Record
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
            &nbsp; Update Record
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
        <div className="form-card">
        <h2 className="section-title">
          <FaSearch />
          &nbsp; Search & Filters
        </h2>

        <div className="form-grid">
          <div className="form-group">
            <label>Search</label>

            <input
              placeholder="Site, Project Code, Engineer, Mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Business Unit</label>

            <select
              value={businessUnitFilter}
              onChange={(e) =>
                setBusinessUnitFilter(e.target.value)
              }
            >
              <option value="ALL">All</option>

              {businessUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div
            className="form-group"
            style={{
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <button
              className="clear-btn"
              onClick={() => {
                setSearch("");
                setBusinessUnitFilter("ALL");
              }}
            >
              <FaTimes />
              &nbsp; Clear Filters
            </button>
          </div>
        </div>
      </div>

      {columnFilters.activeFilterCount > 0 && (
        <div className="active-filters-bar no-print">
          <span>Column filters:</span>

          {[
            { key: "siteLocation", label: "Site Location" },
            { key: "projectCode", label: "Project Code" },
            { key: "businessUnit", label: "Business Unit" },
            { key: "engineerName", label: "Engineer" },
            { key: "mobile", label: "Mobile" },
            { key: "email", label: "Email" },
            { key: "designation", label: "Designation" },
            { key: "projectManagerName", label: "Project Manager" },
            { key: "pmContact", label: "PM Contact" },
            { key: "pmEmail", label: "PM Email" },
          ]
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
        <h2 className="section-title">
          Site & Engineer Records
        </h2>

        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sr.No</th>
              <ColumnFilterHeader
                columnKey="siteLocation"
                label="Site Location"
                allValues={columnFilters.getUniqueValues("siteLocation")}
                selected={columnFilters.filters.siteLocation}
                onApply={(v) => columnFilters.setColumnFilter("siteLocation", v)}
              />
              <ColumnFilterHeader
                columnKey="projectCode"
                label="Project Code"
                allValues={columnFilters.getUniqueValues("projectCode")}
                selected={columnFilters.filters.projectCode}
                onApply={(v) => columnFilters.setColumnFilter("projectCode", v)}
              />
              <ColumnFilterHeader
                columnKey="businessUnit"
                label="Business Unit"
                allValues={columnFilters.getUniqueValues("businessUnit")}
                selected={columnFilters.filters.businessUnit}
                onApply={(v) => columnFilters.setColumnFilter("businessUnit", v)}
              />
              <ColumnFilterHeader
                columnKey="engineerName"
                label="Engineer"
                allValues={columnFilters.getUniqueValues("engineerName")}
                selected={columnFilters.filters.engineerName}
                onApply={(v) => columnFilters.setColumnFilter("engineerName", v)}
              />
              <ColumnFilterHeader
                columnKey="mobile"
                label="Mobile"
                allValues={columnFilters.getUniqueValues("mobile")}
                selected={columnFilters.filters.mobile}
                onApply={(v) => columnFilters.setColumnFilter("mobile", v)}
              />
              <ColumnFilterHeader
                columnKey="email"
                label="Email"
                allValues={columnFilters.getUniqueValues("email")}
                selected={columnFilters.filters.email}
                onApply={(v) => columnFilters.setColumnFilter("email", v)}
              />
              <ColumnFilterHeader
                columnKey="designation"
                label="Designation"
                allValues={columnFilters.getUniqueValues("designation")}
                selected={columnFilters.filters.designation}
                onApply={(v) => columnFilters.setColumnFilter("designation", v)}
              />
              <ColumnFilterHeader
                columnKey="projectManagerName"
                label="Project Manager"
                allValues={columnFilters.getUniqueValues("projectManagerName")}
                selected={columnFilters.filters.projectManagerName}
                onApply={(v) => columnFilters.setColumnFilter("projectManagerName", v)}
              />
              <ColumnFilterHeader
                columnKey="pmContact"
                label="PM Contact"
                allValues={columnFilters.getUniqueValues("pmContact")}
                selected={columnFilters.filters.pmContact}
                onApply={(v) => columnFilters.setColumnFilter("pmContact", v)}
              />
              <ColumnFilterHeader
                columnKey="pmEmail"
                label="PM Email"
                allValues={columnFilters.getUniqueValues("pmEmail")}
                selected={columnFilters.filters.pmEmail}
                onApply={(v) => columnFilters.setColumnFilter("pmEmail", v)}
              />
              <th className="no-print">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredAndColumnFilteredRecords.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: "center" }}>
                  No Records Found
                </td>
              </tr>
            ) : (
              filteredAndColumnFilteredRecords.map((record, index) => (
                <tr
                  key={record.id}
                  className={
                    editingId === record.id
                      ? "editing-row"
                      : ""
                  }
                >
                  <td>{index + 1}</td>
                  <td>{record.siteLocation}</td>
                  <td>{record.projectCode}</td>
                  <td>{record.businessUnit}</td>
                  <td>{record.engineerName}</td>
                  <td>{record.mobile}</td>
                  <td>{record.email}</td>
                  <td>{record.designation}</td>
                  <td>{record.projectManagerName}</td>
                  <td>{record.pmContact}</td>
                  <td>{record.pmEmail}</td>

                  <td className="no-print">
                    <button
                      className="icon-btn edit-btn"
                      onClick={() =>
                        handleEdit(record)
                      }
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="icon-btn delete-btn"
                      onClick={() =>
                        handleDelete(record.id!)
                      }
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default SiteEngineerMaster;