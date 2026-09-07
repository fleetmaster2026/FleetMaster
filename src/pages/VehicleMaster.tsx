import { useEffect, useState } from "react";
import { FaTimes, FaTruck, FaEdit } from "react-icons/fa";
import type { Vehicle } from "../types/Vehicle";

import {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} from "../services/vehicleApi";

import VehicleForm from "../components/vehicles/VehicleForm";
import VehicleTable from "../components/vehicles/VehicleTable";
import type { SiteEngineer } from "../types/SiteEngineer";
import { getSiteEngineers } from "../services/siteEngineerApi";

import ExcelActions from "../components/common/ExcelActions";
import RecordsToolbar, {
  type ToolbarColumn,
} from "../components/common/RecordsToolbar";
import { useColumnVisibility } from "../hooks/useColumnVisibility";
import { useColumnFilters } from "../hooks/useColumnFilters";
import { printTable } from "../utils/printTable";
import {
  exportRecordsToExcel,
  readExcelFile,
  mapRowsToRecords,
  type ColumnDef,
} from "../utils/excelUtils";

const vehicleColumns: ColumnDef<Vehicle>[] = [
  { header: "Owner", key: "owner" },
  { header: "Vehicle No", key: "vehicleNo" },
  { header: "Vehicle Name", key: "vehicleName" },
  { header: "Vehicle Type", key: "vehicleType" },
  { header: "Manufacturer", key: "manufacturer" },
  { header: "Registering RTO", key: "registeringRTO" },
  { header: "Registration Date", key: "registrationDate", type: "date" },
  { header: "Chassis No", key: "chassisNo" },
  { header: "Engine No", key: "engineNo" },
  { header: "Fuel Type", key: "fuelType" },
  { header: "Project Code", key: "projectCode" },
  { header: "Site", key: "site" },
  { header: "Engineer", key: "engineer" },
  { header: "Target KM", key: "targetKm", type: "number" },
  { header: "Target Hours", key: "targetHours", type: "number" },
];

// Columns available in the on-screen table / print - drives both the
// universal search box (search checks every field below except Sr.No,
// Remarks & Action) and the "which columns to print" checklist.
const vehicleToolbarColumns: ToolbarColumn[] = [
  { key: "owner", label: "Owner" },
  { key: "vehicleNo", label: "Vehicle No" },
  { key: "vehicleName", label: "Vehicle Name" },
  { key: "vehicleType", label: "Vehicle Type" },
  { key: "projectCode", label: "Project Code" },
  { key: "site", label: "Site" },
  { key: "engineer", label: "Engineer" },
  { key: "fuelType", label: "Fuel" },
];

const VehicleMaster = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [siteEngineers, setSiteEngineers] = useState<SiteEngineer[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const emptyVehicle: Vehicle = {
    id: 0,
    vehicleNo: "",
    vehicleName: "",
    vehicleType: "DG SET",
    owner: "",

    manufacturer: "",

    registeringRTO: "",
    registrationDate: "",

    chassisNo: "",
    engineNo: "",
    fuelType: "Diesel",

    projectCode: "",
    site: "",
    engineer: "",

    targetKm: 2000,
    targetHours: 200,
  };

  const [formData, setFormData] = useState<Vehicle>(emptyVehicle);

  const {
    isColumnVisible,
    toggleColumn,
    showAllColumns,
    hideAllColumns,
  } = useColumnVisibility();

  const searchedVehicles = vehicles.filter((vehicle) => {
    const text = search.trim().toLowerCase();
    if (!text) return true;

    // Search across every record field (Vehicle No, Name, Type, RTO,
    // Project Code, Site, Engineer, Fuel...) - not just a couple of them.
    return [
      vehicle.owner,
      vehicle.vehicleNo,
      vehicle.vehicleName,
      vehicle.vehicleType,
      vehicle.registeringRTO,
      vehicle.manufacturer,
      vehicle.chassisNo,
      vehicle.engineNo,
      vehicle.fuelType,
      vehicle.projectCode,
      vehicle.site,
      vehicle.engineer,
    ].some((field) => (field || "").toLowerCase().includes(text));
  });

  // Feed the *searched* rows in, not the raw list, so the Excel-style
  // filter dropdowns only offer values that are actually present in the
  // current search results instead of the whole unfiltered dataset.
  const columnFilters = useColumnFilters(searchedVehicles);

const loadData = async () => {
  try {
    const [
      vehicleData,
      siteEngineerData,
    ] = await Promise.all([
      getVehicles(),
      getSiteEngineers(),
    ]);

    setVehicles(vehicleData);
    setSiteEngineers(siteEngineerData);
  } catch (error) {
    console.error(error);
  }
};

useEffect(() => {
  loadData();
}, []);

  const clearForm = () => {
    setEditingId(null);
    setFormData(emptyVehicle);
  };

  const handleSave = async () => {
    try {
      if (editingId === null) {
        await addVehicle(formData);
        alert("Vehicle Added Successfully");
      } else {
        await updateVehicle(editingId, formData);
        alert("Vehicle Updated Successfully");
      }

      await loadData();
      clearForm();
    } catch (error) {
      console.error(error);
      alert("Unable to Save Vehicle");
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setFormData(vehicle);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this vehicle?")) return;

    try {
      await deleteVehicle(id);
      await loadData();
      alert("Vehicle Deleted Successfully");
    } catch (error) {
      console.error(error);
      alert("Unable to Delete Vehicle");
    }
  };

  const handleExport = () => {
    exportRecordsToExcel(vehicles, vehicleColumns, "Vehicle_Master");
  };

  // Import = REPLACE. Whatever is in the Excel file becomes the complete
  // data set: every existing record is removed first, then every valid
  // row from the file is inserted fresh.
  const handleImport = async (file: File) => {
    try {
      const rows = await readExcelFile(file);
      const imported = mapRowsToRecords<Vehicle>(rows, vehicleColumns).filter(
        (row) => row.vehicleNo
      );

      if (imported.length === 0) {
        alert("The selected file has no usable rows to import.");
        return;
      }

      const confirmed = window.confirm(
        `This will DELETE all ${vehicles.length} existing record(s) and ` +
          `replace them with the ${imported.length} row(s) from this file.\n\n` +
          `This cannot be undone. Continue?`
      );

      if (!confirmed) return;

      // De-duplicate rows within the file itself by Vehicle No, keeping
      // the last occurrence.
      const uniqueRows = new Map<string, Partial<Vehicle>>();
      imported.forEach((row) =>
        uniqueRows.set(String(row.vehicleNo).trim().toLowerCase(), row)
      );

      const existing = await getVehicles();
      for (const v of existing) {
        if (v.id) await deleteVehicle(v.id);
      }

      let added = 0;
      for (const row of uniqueRows.values()) {
        const { id, ...data } = row as Vehicle;

        await addVehicle(data as Omit<Vehicle, "id">);
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

  const filteredVehicles = columnFilters.applyFilters(searchedVehicles);

  return (
    <div className="page-container">
      <div className="page-title-row">

        <h1 className="page-title">
          {editingId === null
            ? <><FaTruck /> Vehicle Master</>
            : <><FaEdit /> Edit Vehicle</>}
        </h1>

        <ExcelActions
          onExport={handleExport}
          onImport={handleImport}
          onPrint={() => printTable("print-area")}
        />

      </div>

      <VehicleForm
  formData={formData}
  setFormData={setFormData}
  editingId={editingId}
  handleSave={handleSave}
  clearForm={clearForm}
  siteEngineers={siteEngineers}
/>

      <RecordsToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search Owner / Vehicle No / Name / Type / Project Code / Site / Engineer..."
        columns={vehicleToolbarColumns}
        isColumnVisible={isColumnVisible}
        onToggleColumn={toggleColumn}
        onShowAllColumns={showAllColumns}
        onHideAllColumns={() =>
          hideAllColumns(vehicleToolbarColumns.map((col) => col.key))
        }
      />

      {columnFilters.activeFilterCount > 0 && (
        <div className="active-filters-bar no-print">
          <span>Column filters:</span>

          {vehicleToolbarColumns
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

      <div id="print-area">
        <VehicleTable
          vehicles={filteredVehicles}
          editingId={editingId}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          isColumnVisible={isColumnVisible}
          columnFilters={columnFilters}
        />
      </div>
    </div>
  );
};

export default VehicleMaster;