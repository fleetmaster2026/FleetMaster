import { useEffect, useState } from "react";
import type { RtaDocument } from "../types/RtaDocument";
import type { Vehicle } from "../types/Vehicle";

import {
  getRtaDocuments,
  addRtaDocument,
  updateRtaDocument,
  deleteRtaDocument,
} from "../services/rtaDocumentApi";

import { getVehicles } from "../services/vehicleApi";

import {
  FaSave,
  FaSyncAlt,
  FaTrash,
  FaTimes,
  FaSearch,
  FaEdit,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";
const formatDate = (date: string) => {
  if (!date) return "-";

  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};
const RtaDocuments = () => {
  const [records, setRecords] = useState<RtaDocument[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<RtaDocument>({
    vehicleNo: "",
    site: "",
    engineer: "",

    rcExpiry: "",
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

      rcExpiry: "",
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
      alert("Please select a vehicle.");
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

const filteredRecords = records.filter((item) => {
  const matchesSearch = item.vehicleNo
    .toLowerCase()
    .includes(search.toLowerCase());

  const dates = [
    item.rcExpiry,
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

  if (statusFilter === "EXPIRED") return matchesSearch && hasExpired;

  if (statusFilter === "EXPIRING")
    return matchesSearch && hasExpiringSoon;

  if (statusFilter === "VALID") return matchesSearch && allValid;

  return matchesSearch;
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
  return {
    className: "badge-red",
    text: formatDate(date),
    days: "Expired",
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
const today = new Date();
today.setHours(0, 0, 0, 0);

const totalDocuments = filteredRecords.length * 6;

let expiredCount = 0;
let expiringSoonCount = 0;
let validCount = 0;

filteredRecords.forEach((item) => {
  [
    item.rcExpiry,
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
      <h1 className="page-title">RTA Documents</h1>

      {/* ================= VEHICLE INFORMATION ================= */}

      <div className="form-card">
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

      {/* ================= RTA DOCUMENTS ================= */}

      <div className="form-card">
        <h2 className="section-title">Document Expiry Details</h2>

        <div className="form-grid">

          <div className="form-group">
            <label>RC Expiry</label>

            <input
              type="date"
              value={formData.rcExpiry}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rcExpiry: e.target.value,
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
          &nbsp; RTA Document Records
        </h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Site</th>
              <th>Engineer</th>
              <th>RC</th>
              <th>Insurance</th>
              <th>Fitness</th>
              <th>Permit</th>
              <th>PUC</th>
              <th>Road Tax</th>
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
  <div className={getExpiryBadge(item.rcExpiry).className}>
    {getExpiryBadge(item.rcExpiry).text}
  </div>

  <small>{getExpiryBadge(item.rcExpiry).days}</small>
</td>
                <td>
  <div className={getExpiryBadge(item.insuranceExpiry).className}>
    {getExpiryBadge(item.insuranceExpiry).text}
  </div>

  <small>{getExpiryBadge(item.insuranceExpiry).days}</small>
</td>
                <td>
  <div className={getExpiryBadge(item.fitnessExpiry).className}>
    {getExpiryBadge(item.fitnessExpiry).text}
  </div>

  <small>{getExpiryBadge(item.fitnessExpiry).days}</small>
</td>
                <td>
  <div className={getExpiryBadge(item.permitExpiry).className}>
    {getExpiryBadge(item.permitExpiry).text}
  </div>

  <small>{getExpiryBadge(item.permitExpiry).days}</small>
</td>
                <td>
  <div className={getExpiryBadge(item.pollutionExpiry).className}>
    {getExpiryBadge(item.pollutionExpiry).text}
  </div>

  <small>{getExpiryBadge(item.pollutionExpiry).days}</small>
</td>
                <td>
  <div className={getExpiryBadge(item.taxExpiry).className}>
    {getExpiryBadge(item.taxExpiry).text}
  </div>

  <small>{getExpiryBadge(item.taxExpiry).days}</small>
</td>

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
  );
};

export default RtaDocuments;