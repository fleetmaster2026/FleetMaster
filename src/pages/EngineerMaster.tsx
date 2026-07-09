import { useEffect, useState } from "react";
import type { Engineer } from "../types/Engineer";
import {
  getEngineers,
  addEngineer,
  updateEngineer,
  deleteEngineer,
} from "../services/engineerApi";

const EngineerMaster = () => {
  const [engineers, setEngineers] = useState<Engineer[]>([]);

  const [engineerName, setEngineerName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [site, setSite] = useState("");

  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadEngineers();
  }, []);

  const loadEngineers = async () => {
    try {
      const data = await getEngineers();
      setEngineers(data);
    } catch (err) {
      console.error(err);
      alert("Unable to load engineers.");
    }
  };

  const saveEngineer = async () => {
    if (engineerName.trim() === "") {
      alert("Enter Engineer Name");
      return;
    }

    const engineerData = {
      engineerName,
      employeeCode,
      mobile,
      email,
      designation,
      site,
      status,
    };

    if (editingId !== null) {
      await updateEngineer(editingId, engineerData);
      setEditingId(null);
    } else {
      await addEngineer(engineerData);
    }

    await loadEngineers();

    setEngineerName("");
    setEmployeeCode("");
    setMobile("");
    setEmail("");
    setDesignation("");
    setSite("");
    setStatus("Active");
  };

  const filteredEngineers = engineers.filter((e) =>
    e.engineerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>👷 Engineer Master</h1>

      <input
        placeholder="Search Engineer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: 300,
          padding: 8,
          marginBottom: 20,
        }}
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
          placeholder="Engineer Name"
          value={engineerName}
          onChange={(e) => setEngineerName(e.target.value)}
        />

        <input
          placeholder="Employee Code"
          value={employeeCode}
          onChange={(e) => setEmployeeCode(e.target.value)}
        />

        <input
          placeholder="Mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Designation"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
        />

        <input
          placeholder="Site"
          value={site}
          onChange={(e) => setSite(e.target.value)}
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

        <button onClick={saveEngineer}>
          {editingId !== null
            ? "Update Engineer"
            : "Add Engineer"}
        </button>
      </div>

      <table
        border={1}
        cellPadding={8}
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead style={{ background: "#2563eb", color: "white" }}>
          <tr>
            <th>Engineer Name</th>
            <th>Employee Code</th>
            <th>Mobile</th>
            <th>Email</th>
            <th>Designation</th>
            <th>Site</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredEngineers.length > 0 ? (
            filteredEngineers.map((engineer) => (
              <tr key={engineer.id}>
                <td>{engineer.engineerName}</td>
                <td>{engineer.employeeCode}</td>
                <td>{engineer.mobile}</td>
                <td>{engineer.email}</td>
                <td>{engineer.designation}</td>
                <td>{engineer.site}</td>
                <td>{engineer.status}</td>

                <td>
                  <button
                    onClick={() => {
                      setEditingId(engineer.id!);

                      setEngineerName(engineer.engineerName);
                      setEmployeeCode(engineer.employeeCode);
                      setMobile(engineer.mobile);
                      setEmail(engineer.email);
                      setDesignation(engineer.designation);
                      setSite(engineer.site);
                      setStatus(engineer.status);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={async () => {
                      await deleteEngineer(engineer.id!);
                      await loadEngineers();
                    }}
                    style={{ marginLeft: 10 }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} style={{ textAlign: "center" }}>
                No Engineers Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EngineerMaster;