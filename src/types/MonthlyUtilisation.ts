import { useEffect, useState } from "react";

import type { MonthlyUtilisation } from "../types/MonthlyUtilisation";
import type { Vehicle } from "../types/Vehicle";
import type { Site } from "../types/Site";
import type { Engineer } from "../types/Engineer";

import {
  getMonthlyUtilisations,
  addMonthlyUtilisation,
  updateMonthlyUtilisation,
  deleteMonthlyUtilisation,
} from "../services/monthlyUtilisationApi";

import { getVehicles } from "../services/vehicleApi";
import { getSites } from "../services/siteApi";
import { getEngineers } from "../services/engineerApi";

const MonthlyUtilisation = () => {
  // ==========================
  // STATE
  // ==========================

  const [records, setRecords] = useState<MonthlyUtilisation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);

  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [utilisationMonth, setUtilisationMonth] = useState("");

  const [vehicleNo, setVehicleNo] = useState("");

  const [site, setSite] = useState("");

  const [engineer, setEngineer] = useState("");

  // ==========================
  // KM DETAILS
  // ==========================

  const [openingKm, setOpeningKm] = useState(0);
  const [closingKm, setClosingKm] = useState(0);

  const [diffKm, setDiffKm] = useState(0);

  const [targetKm, setTargetKm] = useState(0);

  const [kmUtilisation, setKmUtilisation] = useState(0);

  // ==========================
  // HOUR DETAILS
  // ==========================

  const [openingHours, setOpeningHours] = useState(0);

  const [closingHours, setClosingHours] = useState(0);

  const [diffHours, setDiffHours] = useState(0);

  const [targetHours, setTargetHours] = useState(0);

  const [hoursUtilisation, setHoursUtilisation] = useState(0);

  // ==========================
  // REMARKS
  // ==========================

  const [remarks, setRemarks] = useState("");

  // ==========================
  // INITIAL LOAD
  // ==========================

  useEffect(() => {
    loadRecords();
    loadMasterData();
  }, []);

  // ==========================
  // VEHICLE AUTO FILL
  // ==========================

  useEffect(() => {
    if (!vehicleNo) return;

    const vehicle = vehicles.find(
      (v) => v.vehicleNo === vehicleNo
    );

    if (!vehicle) return;

    setSite(vehicle.site);
    setEngineer(vehicle.engineer);

    setTargetKm(vehicle.targetKm);
    setTargetHours(vehicle.targetHours);
  }, [vehicleNo, vehicles]);

  // ==========================
  // KM CALCULATION
  // ==========================

  useEffect(() => {
    const diff = closingKm - openingKm;

    setDiffKm(diff);

    if (targetKm > 0) {
      setKmUtilisation(
        Number(((diff / targetKm) * 100).toFixed(2))
      );
    } else {
      setKmUtilisation(0);
    }
  }, [openingKm, closingKm, targetKm]);

  // ==========================
  // HOURS CALCULATION
  // ==========================

  useEffect(() => {
    const diff = closingHours - openingHours;

    setDiffHours(diff);

    if (targetHours > 0) {
      setHoursUtilisation(
        Number(((diff / targetHours) * 100).toFixed(2))
      );
    } else {
      setHoursUtilisation(0);
    }
  }, [
    openingHours,
    closingHours,
    targetHours,
  ]);

  // ==========================
  // LOAD RECORDS
  // ==========================

  const loadRecords = async () => {
    try {
      const data = await getMonthlyUtilisations();
      setRecords(data);
    } catch (error) {
      console.error(error);
      alert("Unable to load records.");
    }
  };

  // ==========================
  // LOAD MASTER DATA
  // ==========================

  const loadMasterData = async () => {
    try {
      const vehicleData = await getVehicles();

      const siteData = await getSites();

      const engineerData = await getEngineers();

      setVehicles(vehicleData);

      setSites(siteData);

      setEngineers(engineerData);
    } catch (error) {
      console.error(error);
      alert("Unable to load master data.");
    }
  };
    // ==========================
  // CLEAR FORM
  // ==========================

  const clearForm = () => {
    setEditingId(null);

    setUtilisationMonth("");
    setVehicleNo("");

    setSite("");
    setEngineer("");

    setOpeningKm(0);
    setClosingKm(0);
    setDiffKm(0);

    setTargetKm(0);
    setKmUtilisation(0);

    setOpeningHours(0);
    setClosingHours(0);
    setDiffHours(0);

    setTargetHours(0);
    setHoursUtilisation(0);

    setRemarks("");
  };

  // ==========================
  // SAVE RECORD
  // ==========================

  const saveRecord = async () => {
    if (!utilisationMonth) {
      alert("Please select Month");
      return;
    }

    if (!vehicleNo) {
      alert("Please select Vehicle");
      return;
    }

    const record: Omit<MonthlyUtilisation, "id"> = {
      utilisationMonth,

      vehicleNo,
      site,
      engineer,

      openingKm,
      closingKm,
      diffKm,

      targetKm,
      kmUtilisation,

      openingHours,
      closingHours,
      diffHours,

      targetHours,
      hoursUtilisation,

      remarks,
    };

    try {
      if (editingId !== null) {
        await updateMonthlyUtilisation(editingId, record);
      } else {
        await addMonthlyUtilisation(record);
      }

      await loadRecords();

      clearForm();
    } catch (error) {
      console.error(error);
      alert("Unable to save record.");
    }
  };

  // ==========================
  // EDIT RECORD
  // ==========================

  const editRecord = (record: MonthlyUtilisation) => {
    setEditingId(record.id ?? null);

    setUtilisationMonth(record.utilisationMonth);

    setVehicleNo(record.vehicleNo);

    setSite(record.site);
    setEngineer(record.engineer);

    setOpeningKm(record.openingKm);
    setClosingKm(record.closingKm);
    setDiffKm(record.diffKm);

    setTargetKm(record.targetKm);
    setKmUtilisation(record.kmUtilisation);

    setOpeningHours(record.openingHours);
    setClosingHours(record.closingHours);
    setDiffHours(record.diffHours);

    setTargetHours(record.targetHours);
    setHoursUtilisation(record.hoursUtilisation);

    setRemarks(record.remarks);
  };

  // ==========================
  // DELETE RECORD
  // ==========================

  const removeRecord = async (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmDelete) return;

    try {
      await deleteMonthlyUtilisation(id);

      await loadRecords();
    } catch (error) {
      console.error(error);
      alert("Unable to delete record.");
    }
  };

  // ==========================
  // STATUS
  // ==========================

  const getStatus = (
    km: number,
    hrs: number
  ) => {
    const avg = (km + hrs) / 2;

    if (avg >= 90)
      return {
        text: "Good",
        color: "#16a34a",
      };

    if (avg >= 70)
      return {
        text: "Average",
        color: "#d97706",
      };

    return {
      text: "Low",
      color: "#dc2626",
    };
  };

  // ==========================
  // RETURN
  // ==========================

  return (
    <div
      style={{
        padding: 20,
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          marginBottom: 20,
          color: "#1e3a8a",
        }}
      >
        Monthly Utilisation
      </h1>
            <div
        style={{
          background: "#ffffff",
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 15,
          }}
        >
          {/* Month */}

          <div>
            <label>Month</label>

            <input
              type="month"
              value={utilisationMonth}
              onChange={(e) =>
                setUtilisationMonth(e.target.value)
              }
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          {/* Vehicle */}

          <div>
            <label>Vehicle</label>

            <select
              value={vehicleNo}
              onChange={(e) =>
                setVehicleNo(e.target.value)
              }
              style={{ width: "100%", padding: 8 }}
            >
              <option value="">Select Vehicle</option>

              {vehicles.map((v) => (
                <option
                  key={v.id}
                  value={v.vehicleNo}
                >
                  {v.vehicleNo} - {v.vehicleName}
                </option>
              ))}
            </select>
          </div>

          {/* Site */}

          <div>
            <label>Site</label>

            <input
              value={site}
              readOnly
              style={{
                width: "100%",
                padding: 8,
                background: "#f1f5f9",
              }}
            />
          </div>

          {/* Engineer */}

          <div>
            <label>Engineer</label>

            <input
              value={engineer}
              readOnly
              style={{
                width: "100%",
                padding: 8,
                background: "#f1f5f9",
              }}
            />
          </div>
        </div>

        <hr style={{ margin: "25px 0" }} />

        <h3>KM Details</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: 15,
          }}
        >
          <div>
            <label>Opening KM</label>

            <input
              type="number"
              value={openingKm}
              onChange={(e) =>
                setOpeningKm(Number(e.target.value))
              }
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label>Closing KM</label>

            <input
              type="number"
              value={closingKm}
              onChange={(e) =>
                setClosingKm(Number(e.target.value))
              }
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label>Difference KM</label>

            <input
              value={diffKm}
              readOnly
              style={{
                width: "100%",
                padding: 8,
                background: "#f1f5f9",
              }}
            />
          </div>

          <div>
            <label>Target KM</label>

            <input
              value={targetKm}
              readOnly
              style={{
                width: "100%",
                padding: 8,
                background: "#f1f5f9",
              }}
            />
          </div>

          <div>
            <label>KM Utilisation %</label>

            <input
              value={kmUtilisation}
              readOnly
              style={{
                width: "100%",
                padding: 8,
                background: "#dcfce7",
                fontWeight: "bold",
              }}
            />
          </div>
        </div>

        <hr style={{ margin: "25px 0" }} />

        <h3>Hour Details</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: 15,
          }}
        >
          <div>
            <label>Opening Hours</label>

            <input
              type="number"
              value={openingHours}
              onChange={(e) =>
                setOpeningHours(Number(e.target.value))
              }
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label>Closing Hours</label>

            <input
              type="number"
              value={closingHours}
              onChange={(e) =>
                setClosingHours(Number(e.target.value))
              }
              style={{ width: "100%", padding: 8 }}
            />
          </div>

          <div>
            <label>Difference Hours</label>

            <input
              value={diffHours}
              readOnly
              style={{
                width: "100%",
                padding: 8,
                background: "#f1f5f9",
              }}
            />
          </div>

          <div>
            <label>Target Hours</label>

            <input
              value={targetHours}
              readOnly
              style={{
                width: "100%",
                padding: 8,
                background: "#f1f5f9",
              }}
            />
          </div>

          <div>
            <label>Hours Utilisation %</label>

            <input
              value={hoursUtilisation}
              readOnly
              style={{
                width: "100%",
                padding: 8,
                background: "#dcfce7",
                fontWeight: "bold",
              }}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 25,
          }}
        >
          <label>Remarks</label>

          <textarea
            value={remarks}
            onChange={(e) =>
              setRemarks(e.target.value)
            }
            rows={3}
            style={{
              width: "100%",
              padding: 10,
            }}
          />
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 10,
          }}
        >
          <button
            onClick={saveRecord}
          >
            {editingId !== null
              ? "Update Record"
              : "Save Record"}
          </button>

          <button
            onClick={clearForm}
          >
            Clear
          </button>
        </div>
      </div>
            {/* ==========================
          SEARCH
      ========================== */}

      <div
        style={{
          background: "#ffffff",
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <input
          type="text"
          placeholder="Search Vehicle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "300px",
            padding: 10,
          }}
        />
      </div>

      {/* ==========================
          TABLE
      ========================== */}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <thead
          style={{
            background: "#2563eb",
            color: "#ffffff",
          }}
        >
          <tr>
            <th style={{ padding: 10 }}>Month</th>
            <th>Vehicle</th>
            <th>Site</th>
            <th>Engineer</th>
            <th>KM %</th>
            <th>Hours %</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {records
            .filter((r) =>
              r.vehicleNo
                .toLowerCase()
                .includes(search.toLowerCase())
            )
            .map((r) => {
              const status = getStatus(
                r.kmUtilisation,
                r.hoursUtilisation
              );

              return (
                <tr
                  key={r.id}
                  style={{
                    textAlign: "center",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <td style={{ padding: 10 }}>
                    {r.utilisationMonth}
                  </td>

                  <td>{r.vehicleNo}</td>

                  <td>{r.site}</td>

                  <td>{r.engineer}</td>

                  <td>{r.kmUtilisation}%</td>

                  <td>{r.hoursUtilisation}%</td>

                  <td>
                    <span
                      style={{
                        background: status.color,
                        color: "#fff",
                        padding: "5px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                      }}
                    >
                      {status.text}
                    </span>
                  </td>

                  <td>
                    <button
                      onClick={() => editRecord(r)}
                    >
                      Edit
                    </button>

                    <button
                      style={{
                        marginLeft: 10,
                      }}
                      onClick={() =>
                        removeRecord(r.id!)
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

          {records.length === 0 && (
            <tr>
              <td
                colSpan={8}
                style={{
                  padding: 20,
                  textAlign: "center",
                }}
              >
                No Records Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MonthlyUtilisation;