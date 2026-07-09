import { useEffect, useState } from "react";
import type { Vehicle } from "../types/Vehicle";
import {
  addVehicle,
  getVehicles,
  deleteVehicle,
  updateVehicle,
} from "../services/vehicleApi";

import VehicleSearch from "../components/vehicles/VehicleSearch";

const vehicleTypes = [
  "DG SET",
  "BACKHOE LOADER",
  "CRANE-PICK & CARRY",
  "EXCAVATOR",
  "HYDRA",
  "MINI TANDEM ROLLER",
  "DIESEL TANKER",
  "SELF LOADING CONCRETE MIXER",
  "TIPPER",
  "WATER TANKER",
  "AMBULANCE",
  "COMMERCIAL",
  "SUV",
  "TRACTOR",
  "TRACTOR-TANKER",
  "CONCRETE PUMP",
  "LIGHTING TOWER",
  "TWO WHEELER",
  "HORIZONTAL DRILLING MACHINE",
  "FLAT BED TRAILER",
  "SEMI LOW BED TRAILER",
  "CRANE-TRUCK MOUNTED",
  "40 FEET LOW BED TRAILER",
  "LORRY",
  "MPV",
  "TANDEM ROLLER",
  "WHEEL LOADER",
  "CRANE-CRAWLER",
  "TRANSIT MIXER",
  "BATCHING PLANT",
  "CONCRETE MILLER",
  "COMPACTOR",
];

const VehicleMaster = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [vehicleNo, setVehicleNo] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleType, setVehicleType] = useState(vehicleTypes[0]);
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [registeringRTO, setRegisteringRTO] = useState("");
  const [chassisNo, setChassisNo] = useState("");
  const [engineNo, setEngineNo] = useState("");
  
const [fuelType, setFuelType] = useState("Diesel");

const [registrationDate, setRegistrationDate] = useState(
  new Date().toISOString().split("T")[0]
);

  const [site, setSite] = useState("");
  const [engineer, setEngineer] = useState("");

  const [targetKm, setTargetKm] = useState(2000);
  const [targetHours, setTargetHours] = useState(200);

  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
  loadVehicles();
}, []);

const loadVehicles = async () => {
  try {
    const data = await getVehicles();
    setVehicles(data);
  } catch (error) {
    console.error(error);
    alert("Unable to load vehicles.");
  }
};

  const saveVehicle = async () => {
  if (vehicleNo.trim() === "") {
    alert("Enter Vehicle Number");
    return;
  }

  const vehicleData = {
    vehicleNo: vehicleNo.toUpperCase(),
    vehicleName,
    vehicleType,
    manufacturer,
    model,
    rcNumber,
    registeringRTO,
    registrationDate,
    chassisNo,
    engineNo,
    fuelType,
    site,
    engineer,
    targetKm,
    targetHours,
    status,
  };

  if (editingId !== null) {
    await updateVehicle(editingId, vehicleData);
    setEditingId(null);
  } else {
    await addVehicle(vehicleData);
  }

  await loadVehicles();

  setVehicleNo("");
  setVehicleName("");
  setVehicleType(vehicleTypes[0]);

  setManufacturer("");
  setModel("");
  setRcNumber("");

  setRegisteringRTO("");
  setChassisNo("");
  setEngineNo("");

  setFuelType("Diesel");
  setRegistrationDate(new Date().toISOString().split("T")[0]);

  setSite("");
  setEngineer("");

  setTargetKm(2000);
  setTargetHours(200);

  setStatus("Active");
};

  const filteredVehicles = vehicles.filter((v) =>
    v.vehicleNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Vehicle Master</h1>

      <VehicleSearch
        search={search}
        setSearch={setSearch}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 15,
          marginBottom: 20,
        }}
      >
        <input
          placeholder="Vehicle Number"
          value={vehicleNo}
          onChange={(e) => setVehicleNo(e.target.value)}
        />

        <input
          placeholder="Vehicle Name"
          value={vehicleName}
          onChange={(e) => setVehicleName(e.target.value)}
        />

        <select
  value={vehicleType}
  onChange={(e) => setVehicleType(e.target.value)}
>
  {vehicleTypes.map((type) => (
    <option key={type}>{type}</option>
  ))}
</select>

<input
  placeholder="Manufacturer"
  value={manufacturer}
  onChange={(e) => setManufacturer(e.target.value)}
/>

<input
  placeholder="Model"
  value={model}
  onChange={(e) => setModel(e.target.value)}
/>

<input
  placeholder="RC Number"
  value={rcNumber}
  onChange={(e) => setRcNumber(e.target.value)}
/>

<input
  placeholder="Registering RTO"
  value={registeringRTO}
  onChange={(e) => setRegisteringRTO(e.target.value)}
/>

        <input
          placeholder="Chassis Number"
          value={chassisNo}
          onChange={(e) => setChassisNo(e.target.value)}
        />

        <input
          placeholder="Engine Number"
          value={engineNo}
          onChange={(e) => setEngineNo(e.target.value)}
        />

        <input
          placeholder="Site"
          value={site}
          onChange={(e) => setSite(e.target.value)}
        />

        <input
          placeholder="Engineer"
          value={engineer}
          onChange={(e) => setEngineer(e.target.value)}
        />

        <input
          type="number"
          placeholder="Target KM"
          value={targetKm}
          onChange={(e) => setTargetKm(Number(e.target.value))}
        />

        <input
          type="number"
          placeholder="Target Hours"
          value={targetHours}
          onChange={(e) => setTargetHours(Number(e.target.value))}
        />

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "Active" | "Inactive")
          }
        >
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <button onClick={saveVehicle}>
  {editingId ? "Update Vehicle" : "Add Vehicle"}
</button>
      </div>
            <table
        border={1}
        cellPadding={8}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 20,
        }}
      >
        <thead style={{ background: "#2563eb", color: "white" }}>
          <tr>
            <th>Vehicle No</th>
            <th>Vehicle Name</th>
            <th>Type</th>
            <th>RTO</th>
            <th>Site</th>
            <th>Engineer</th>
            <th>Target KM</th>
            <th>Target Hours</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map((v) => (
              <tr key={v.id}>
                <td>{v.vehicleNo}</td>
                <td>{v.vehicleName}</td>
                <td>{v.vehicleType}</td>
                <td>{v.registeringRTO}</td>
                <td>{v.site}</td>
                <td>{v.engineer}</td>
                <td>{v.targetKm}</td>
                <td>{v.targetHours}</td>
                <td>{v.status}</td>

                <td>
  <button
    onClick={() => {
      setEditingId(v.id);

      setVehicleNo(v.vehicleNo);
      setVehicleName(v.vehicleName);
      setVehicleType(v.vehicleType);

      setManufacturer(v.manufacturer);
      setModel(v.model);
      setRcNumber(v.rcNumber);

      setRegisteringRTO(v.registeringRTO);
      setRegistrationDate(v.registrationDate);

      setChassisNo(v.chassisNo);
      setEngineNo(v.engineNo);
      setFuelType(v.fuelType);

      setSite(v.site);
      setEngineer(v.engineer);

      setTargetKm(v.targetKm);
      setTargetHours(v.targetHours);

      setStatus(v.status);
    }}
  >
    Edit
  </button>

  <button
    onClick={async () => {
      await deleteVehicle(v.id);
      await loadVehicles();
    }}
  >
    Delete
  </button>
</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} style={{ textAlign: "center" }}>
                No Vehicles Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VehicleMaster;