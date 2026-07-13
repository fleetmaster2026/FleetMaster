import { useEffect, useRef, useState } from "react";
import type { Breakdown } from "../types/Breakdown";
import type { Vehicle } from "../types/Vehicle";

import {
  getBreakdowns,
  addBreakdown,
  updateBreakdown,
  deleteBreakdown,
} from "../services/breakdownApi";

import { getVehicles } from "../services/vehicleApi";

import {
  FaSave,
  FaSyncAlt,
  FaTrash,
  FaTimes,
  FaSearch,
  FaEdit,
  FaTools,
} from "react-icons/fa";

const BreakdownRegister = () => {
  const [records, setRecords] = useState<Breakdown[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [editingId, setEditingId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<Breakdown>({
    vehicleNo: "",
    site: "",
    engineer: "",

    breakdownDate: "",
    breakdownType: "",
    breakdownDescription: "",

    requireFund: "No",
    estimatedAmount: 0,

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
      const [breakdownData, vehicleData] = await Promise.all([
        getBreakdowns(),
        getVehicles(),
      ]);

      setRecords(breakdownData);
      setVehicles(vehicleData);
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

    setFormData((prev) => ({
      ...prev,
      site: selectedVehicle.site,
      engineer: selectedVehicle.engineer,
    }));
  }, [formData.vehicleNo, vehicles]);

  const clearForm = () => {
    setEditingId(null);

    setFormData({
      vehicleNo: "",
      site: "",
      engineer: "",

      breakdownDate: "",
      breakdownType: "",
      breakdownDescription: "",

      requireFund: "No",
      estimatedAmount: 0,

      remarks: "",
    });
  };

  const handleSave = async () => {
    if (!formData.vehicleNo) {
      alert("Please select a vehicle.");
      return;
    }

    try {
      if (editingId === null) {
        await addBreakdown(formData);
        alert("Breakdown Saved Successfully");
      } else {
        await updateBreakdown(editingId, formData);
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

  const filteredRecords = records.filter((item) => {
    const matchesSearch = item.vehicleNo
      .toLowerCase()
      .includes(search.toLowerCase());

    if (typeFilter === "ALL") return matchesSearch;

    return (
      matchesSearch &&
      item.breakdownType.toLowerCase() === typeFilter.toLowerCase()
    );
  });
    return (
    <div className="page-container">
      <h1 className="page-title">
  {editingId === null
    ? "🔧 Breakdown Register"
    : "✏️ Edit Breakdown Record"}
</h1>

      {/* ================= VEHICLE INFORMATION ================= */}

      <div className="form-card" ref={formRef}>
        <h2 className="section-title">Vehicle Information</h2>

        <div className="form-grid">

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
            <label>Require Fund</label>

            <select
              value={formData.requireFund}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requireFund: e.target.value,
                })
              }
            >
              <option>Yes</option>
              <option>No</option>
            </select>
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
          <h2>{records.length}</h2>
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
                records.filter(
                  (item) =>
                    item.breakdownType.toLowerCase() ===
                    type.toLowerCase()
                ).length
              }
            </h2>
          </div>
        ))}

      </div>

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

      {/* ================= RECORDS ================= */}

      <div className="form-card">

        <h2 className="section-title">
          <FaSearch />
          &nbsp; Breakdown Records
        </h2>

        <table className="data-table">

          <thead>

            <tr>
              <th>Vehicle</th>
              <th>Site</th>
              <th>Engineer</th>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Fund</th>
              <th>Amount</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            {filteredRecords.map((item) => (

              <tr key={item.id}>

                <td>{item.vehicleNo}</td>

                <td>{item.site}</td>

                <td>{item.engineer}</td>

                <td>
  {item.breakdownDate
    ? new Date(item.breakdownDate)
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")
    : "-"}
</td>

                <td>
  <span
    className={`breakdown-type ${item.breakdownType
      .toLowerCase()
      .replace(/\s+/g, "-")}`}
  >
    {item.breakdownType}
  </span>
</td>

                <td title={item.breakdownDescription}>
  {item.breakdownDescription?.length > 40
    ? item.breakdownDescription.substring(0, 40) + "..."
    : item.breakdownDescription}
</td>

                <td>
  <span
    className={
      item.requireFund === "Yes"
        ? "badge-green"
        : "badge-gray"
    }
  >
    {item.requireFund}
  </span>
</td>

                <td>₹ {Number(item.estimatedAmount).toLocaleString()}</td>

                <td>{item.remarks}</td>

                <td>

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

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default BreakdownRegister;