import {
  FaEdit,
  FaTrash,
} from "react-icons/fa";

import type { Vehicle } from "../../types/Vehicle";
import { getVehicleAge, AGE_STATUS_COLORS } from "../../utils/vehicleAge";
import ColumnFilterHeader from "../common/ColumnFilterHeader";
import type { useColumnFilters } from "../../hooks/useColumnFilters";

// Vehicle Master enriches each row with a "vehicleAge" filter category
// (derived from Registration Date - see VehicleMaster.tsx) before it
// ever reaches this table, so the funnel filter on that column has
// something other than a mostly-unique date to filter on.
type VehicleWithAge = Vehicle & { vehicleAge?: string };

interface Props {
  vehicles: VehicleWithAge[];
  editingId?: number | null;
  handleEdit?: (vehicle: Vehicle) => void;
  handleDelete?: (id: number) => void;
  showActions?: boolean;
  /** Returns whether a column (by key) should be shown - defaults to always-visible when not supplied. */
  isColumnVisible?: (key: string) => boolean;
  /** Drives the Excel-style funnel filter on every header - omit to render plain headers. */
  columnFilters?: ReturnType<typeof useColumnFilters<any>>;
}

const VehicleTable = ({
  vehicles,
  editingId = null,
  handleEdit,
  handleDelete,
  showActions = true,
  isColumnVisible = () => true,
  columnFilters,
}: Props) => {
  const visibleDataColumns = [
    "owner",
    "vehicleAge",
    "vehicleNo",
    "vehicleName",
    "vehicleType",
    "projectCode",
    "site",
    "engineer",
    "fuelType",
  ].filter(isColumnVisible).length;

  const filterableHeader = (
    key: string,
    label: string,
    valueColors?: Record<string, string>
  ) => {
    if (!columnFilters) return <th>{label}</th>;

    return (
      <ColumnFilterHeader
        key={key}
        columnKey={key}
        label={label}
        allValues={columnFilters.getUniqueValues(key)}
        selected={columnFilters.filters[key]}
        onApply={(values) => columnFilters.setColumnFilter(key, values)}
        valueColors={valueColors}
      />
    );
  };

  return (
    <div className="form-card">
      <h2 className="section-title">
        Vehicle Records
      </h2>

      <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Sr.No</th>
            {isColumnVisible("owner") && filterableHeader("owner", "Owner")}
            {isColumnVisible("vehicleAge") && filterableHeader("vehicleAge", "Vehicle Age", AGE_STATUS_COLORS)}
            {isColumnVisible("vehicleNo") && filterableHeader("vehicleNo", "Vehicle No")}
            {isColumnVisible("vehicleName") && filterableHeader("vehicleName", "Name")}
            {isColumnVisible("vehicleType") && filterableHeader("vehicleType", "Type")}
            {isColumnVisible("projectCode") && filterableHeader("projectCode", "Project Code")}
            {isColumnVisible("site") && filterableHeader("site", "Site")}
            {isColumnVisible("engineer") && filterableHeader("engineer", "Engineer")}
            {isColumnVisible("fuelType") && filterableHeader("fuelType", "Fuel")}
            {showActions && <th className="no-print">Action</th>}
          </tr>
        </thead>

        <tbody>
          {vehicles.map((item, index) => {
            const age = getVehicleAge(item.registrationDate);

            return (
            <tr
              key={item.id}
              className={
                editingId === item.id
                  ? "editing-row"
                  : ""
              }
            >
              <td>{index + 1}</td>
              {isColumnVisible("owner") && <td>{item.owner}</td>}
              {isColumnVisible("vehicleAge") && (
                <td>
                  <div className={age.className}>
                    {age.text}
                  </div>
                </td>
              )}
              {isColumnVisible("vehicleNo") && <td>{item.vehicleNo}</td>}
              {isColumnVisible("vehicleName") && <td>{item.vehicleName}</td>}
              {isColumnVisible("vehicleType") && <td>{item.vehicleType}</td>}
              {isColumnVisible("projectCode") && <td>{item.projectCode}</td>}
              {isColumnVisible("site") && <td>{item.site}</td>}
              {isColumnVisible("engineer") && <td>{item.engineer}</td>}
              {isColumnVisible("fuelType") && <td>{item.fuelType}</td>}

              {showActions && (
                <td className="no-print">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => handleEdit?.(item)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="icon-btn delete-btn"
                    onClick={() => handleDelete?.(item.id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              )}
            </tr>
            );
          })}

          {vehicles.length === 0 && (
            <tr>
              <td
                colSpan={visibleDataColumns + (showActions ? 2 : 1)}
                style={{
                  textAlign: "center",
                }}
              >
                No Vehicles Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default VehicleTable;
