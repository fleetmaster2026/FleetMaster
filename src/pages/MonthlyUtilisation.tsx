import { useEffect, useState } from "react";

import type { MonthlyUtilisation } from "../types/MonthlyUtilisation";
import type { Vehicle } from "../types/Vehicle";

import {
  getMonthlyUtilisations,
  addMonthlyUtilisation,
  updateMonthlyUtilisation,
  deleteMonthlyUtilisation,
} from "../services/MonthlyUtilisationApi";

import { getVehicles } from "../services/vehicleApi";

import "../styles/monthlyUtilisation.css";

const MonthlyUtilisation = () => {
  // ============================================
  // STATES
  // ============================================

  const [records, setRecords] = useState<MonthlyUtilisation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState<MonthlyUtilisation>({
    utilisationMonth: "",

    vehicleNo: "",
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
  });

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
      formData.targetKm > 0
        ? (differenceKm / formData.targetKm) * 100
        : 0;

    const hoursUtilisation =
      formData.targetHours > 0
        ? (differenceHours / formData.targetHours) * 100
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

  const averageKm =
    records.length === 0
      ? 0
      : (
          records.reduce(
            (sum, item) => sum + item.kmUtilisation,
            0
          ) / records.length
        ).toFixed(2);

  const averageHours =
    records.length === 0
      ? 0
      : (
          records.reduce(
            (sum, item) => sum + item.hoursUtilisation,
            0
          ) / records.length
        ).toFixed(2);

  const poorVehicles = records.filter(
    (item) =>
      item.kmUtilisation < 40 ||
      item.hoursUtilisation < 40
  ).length;

  // ============================================
  // BADGE COLOR
  // ============================================

  const getBadgeClass = (value: number) => {
    if (value >= 76) return "badge green";
    if (value >= 41) return "badge orange";
    return "badge red";
  };

  // ============================================
  // PART 2 STARTS HERE
  // ============================================

  return (
    <div className="page-container">
  <h1 className="page-title">Monthly Utilisation</h1>

  {/* ================= SUMMARY ================= */}

  <div className="summary-grid">
    <div className="summary-card">
      <h4>Total Records</h4>
      <h2>{records.length}</h2>
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

        <select
          value={formData.vehicleNo}
          onChange={(e) =>
            setFormData({
              ...formData,
              vehicleNo: e.target.value,
            })
          }
        >
          <option value="">Select Vehicle</option>

          {vehicles.map((vehicle) => (
            <option
              key={vehicle.id}
              value={vehicle.vehicleNo}
            >
              {vehicle.vehicleNo}
            </option>
          ))}
        </select>
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
          {formData.kmUtilisation.toFixed(2)}%
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
          {formData.hoursUtilisation.toFixed(2)}%
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

      <button
        type="button"
        className="save-btn"
      >
        Save
      </button>

      <button
        type="button"
        className="update-btn"
      >
        Update
      </button>

      <button
        type="button"
        className="clear-btn"
      >
        Clear
      </button>

    </div>
  </div>

  {/* PART 5 STARTS BELOW */}
    {/* ================= SEARCH ================= */}

  <div className="form-card">
    <div className="form-group">
      <label>Search Vehicle</label>

      <input
        type="text"
        placeholder="Search by Vehicle No..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  </div>

  {/* ================= RECORDS TABLE ================= */}

  <div className="form-card">
    <h2 className="section-title">Monthly Utilisation Records</h2>

    <table className="data-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Vehicle</th>
          <th>Site</th>
          <th>Engineer</th>
          <th>KM %</th>
          <th>Hours %</th>
          <th>Remarks</th>
        </tr>
      </thead>

      <tbody>
        {records
          .filter((item) =>
            item.vehicleNo
              .toLowerCase()
              .includes(search.toLowerCase())
          )
          .map((item) => (
            <tr key={item.id}>
              <td>{item.utilisationMonth}</td>
              <td>{item.vehicleNo}</td>
              <td>{item.site}</td>
              <td>{item.engineer}</td>

              <td>
                <span className={getBadgeClass(item.kmUtilisation)}>
                  {item.kmUtilisation.toFixed(2)}%
                </span>
              </td>

              <td>
                <span className={getBadgeClass(item.hoursUtilisation)}>
                  {item.hoursUtilisation.toFixed(2)}%
                </span>
              </td>

              <td>{item.remarks}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>

</div>
);
};

export default MonthlyUtilisation;