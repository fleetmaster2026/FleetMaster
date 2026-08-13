import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { verifyDeveloperIdentity } from "../config/appIdentity";
const Settings = () => {
  const [settings, setSettings] = useState({
    company_name: "",
    company_logo: "",
    address: "",
    phone: "",
    email: "",
    gst_number: "",
    theme: "Light",
    currency: "₹",
    date_format: "DD/MM/YYYY",
    rows_per_page: 10,
  });

  // NEW STATE
  const [backups, setBackups] = useState<any[]>([]);
  const { setTheme } = useTheme();

  const fetchSettings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/settings");

      setSettings({
        company_name: res.data.company_name || "",
        company_logo: res.data.company_logo || "",
        address: res.data.address || "",
        phone: res.data.phone || "",
        email: res.data.email || "",
        gst_number: res.data.gst_number || "",
        theme: res.data.theme || "Light",
        currency: res.data.currency || "₹",
        date_format: res.data.date_format || "DD/MM/YYYY",
        rows_per_page: res.data.rows_per_page || 10,
      });
      setTheme(
  (res.data.theme || "Light") as "Light" | "Dark"
);
    } catch (err) {
      console.error(err);
    }
  };
  const fetchBackups = async () => {
  try {
    const res = await axios.get(
      "http://localhost:5000/api/database/backups"
    );

    setBackups(res.data);

  } catch (err) {
    console.error(err);
  }
};

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
  fetchSettings();
  fetchBackups();
}, []);

useEffect(() => {

  if (settings.theme === "Dark") {

    document.body.classList.add("dark");

  } else {

    document.body.classList.remove("dark");

  }

}, [settings.theme]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setSettings({
      ...settings,
      [e.target.name]:
        e.target.name === "rows_per_page"
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  const saveSettings = async () => {
    try {
      await axios.put(
        "http://localhost:5000/api/settings",
        settings
      );
      setTheme(settings.theme as "Light" | "Dark");

      alert("Settings saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Unable to save settings.");
    }
  };

  const uploadLogo = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.length) return;

    const formData = new FormData();

    formData.append("logo", e.target.files[0]);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/settings/upload-logo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSettings((prev) => ({
        ...prev,
        company_logo: res.data.logo,
      }));

      alert("Logo uploaded successfully.");
    } catch (err) {
      console.error(err);
      alert("Logo upload failed.");
    }
  };
  const backupDatabase = async () => {
  try {

    const res = await axios.get(
      "http://localhost:5000/api/database/backup"
    );

    alert(res.data.message);

    fetchBackups();

  } catch (err) {
    console.error(err);
    alert("Database backup failed.");
  }
};
const downloadBackup = (fileName: string) => {

  window.open(
    `http://localhost:5000/api/database/download/${encodeURIComponent(fileName)}`,
    "_blank"
  );

};
const deleteBackup = async (fileName: string) => {

  const confirmDelete = window.confirm(
    `Delete backup "${fileName}"?`
  );

  if (!confirmDelete) return;

  try {

    const res = await axios.delete(
      `http://localhost:5000/api/database/delete/${encodeURIComponent(fileName)}`
    );

    alert(res.data.message);

    fetchBackups();

  } catch (err) {

    console.error(err);

    alert("Unable to delete backup.");

  }

};
const restoreBackup = async (fileName: string) => {

  const confirmRestore = window.confirm(
    `Restore "${fileName}"?\n\nCurrent database will be replaced.`
  );

  if (!confirmRestore) return;

  try {

    const res = await axios.post(
      `http://localhost:5000/api/database/restore/${encodeURIComponent(fileName)}`
    );

    alert(res.data.message);

    fetchSettings();
    fetchBackups();

  } catch (err) {

    console.error(err);

    alert("Restore failed.");

  }

};
  return (
    <div className="container-fluid">
      <h2 className="mb-4">Settings</h2>

      <div className="row g-4">

        {/* Company Information */}

        <div className="col-md-6">
          <div className="card shadow-sm h-100">

            <div className="card-header fw-bold">
              Company Information
            </div>

            <div className="card-body">

              <div className="mb-3">
                <label className="form-label">
                  Company Name
                </label>

                <input
                  type="text"
                  name="company_name"
                  className="form-control"
                  value={settings.company_name}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Company Logo
                </label>

                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={uploadLogo}
                />
              </div>

              {settings.company_logo && (
                <div className="mb-3 text-center">

                  <img
                    src={`http://localhost:5000${settings.company_logo}`}
                    alt="Company Logo"
                    className="img-fluid"
                    style={{
                      maxHeight: "120px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      padding: "5px",
                    }}
                  />

                </div>
              )}

              <div className="mb-3">
                <label className="form-label">
                  Address
                </label>

                <textarea
                  name="address"
                  className="form-control"
                  rows={3}
                  value={settings.address}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  className="form-control"
                  value={settings.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={settings.email}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  GST Number
                </label>

                <input
                  type="text"
                  name="gst_number"
                  className="form-control"
                  value={settings.gst_number}
                  onChange={handleChange}
                />
              </div>

            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="col-md-6">
  <div className="card shadow-sm h-100">

    <div className="card-header fw-bold">
      System Preferences
    </div>

    <div className="card-body">

      <div className="mb-3">
        <label className="form-label">
          Theme
        </label>

        <select
          name="theme"
          className="form-select"
          value={settings.theme}
          onChange={handleChange}
        >
          <option value="Light">Light</option>
          <option value="Dark">Dark</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">
          Currency
        </label>

        <select
          name="currency"
          className="form-select"
          value={settings.currency}
          onChange={handleChange}
        >
          <option value="₹">₹ INR</option>
          <option value="$">$ USD</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">
          Date Format
        </label>

        <select
          name="date_format"
          className="form-select"
          value={settings.date_format}
          onChange={handleChange}
        >
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">
          Rows Per Page
        </label>

        <select
          name="rows_per_page"
          className="form-select"
          value={settings.rows_per_page}
          onChange={handleChange}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

    </div>
  </div>
</div>

{/* Database */}

{/* Database Backup Manager */}

<div className="col-12">
  <div className="card shadow-sm">

    <div className="card-header d-flex justify-content-between align-items-center">
      <strong>Database Backup Manager</strong>

      <button
        className="btn btn-success btn-sm"
        onClick={backupDatabase}
      >
        Backup Database
      </button>
    </div>

    <div className="card-body">

      <div className="table-responsive">

        <table className="table table-bordered table-hover align-middle">

          <thead className="table-light">
            <tr>
              <th style={{ width: "60px" }}>#</th>
              <th>Backup File</th>
              <th>Created</th>
              <th>Size</th>
              <th style={{ width: "260px" }}>Actions</th>
            </tr>
          </thead>

          <tbody>

            {backups.length === 0 ? (

              <tr>
                <td
                  colSpan={5}
                  className="text-center text-muted"
                >
                  No backups found.
                </td>
              </tr>

            ) : (

              backups.map((backup, index) => (

                <tr key={backup.name}>

                  <td>{index + 1}</td>

                  <td>
                    <strong>{backup.name}</strong>
                  </td>

                  <td>
                    {new Date(
                      backup.created
                    ).toLocaleString()}
                  </td>

                  <td>{backup.size}</td>

                  <td>

                    <button
  className="btn btn-primary btn-sm me-2"
  onClick={() => downloadBackup(backup.name)}
>
  Download
</button>

                    <button
  className="btn btn-warning btn-sm me-2"
  onClick={() => restoreBackup(backup.name)}
>
  Restore
</button>

                    <button
  className="btn btn-danger btn-sm"
  onClick={() => deleteBackup(backup.name)}
>
  Delete
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
</div>

{/* About */}

<div className="col-md-6">
  <div className="card shadow-sm">

    <div className="card-header fw-bold">
      About
    </div>

    <div className="card-body">

      <p>
        <strong>Application :</strong> FleetMaster
      </p>

      <p>
        <strong>Version :</strong> 1.0.0
      </p>

      <p>
        <strong>Database :</strong> SQLite
      </p>

      <p>
        <strong>Developer :</strong>{" "}
        {(() => {
          const { isValid, name } = verifyDeveloperIdentity();
          return isValid ? (
            name
          ) : (
            <span style={{ color: "#dc3545", fontWeight: 600 }}>
              ⚠ Developer attribution altered (expected "Asif Shaik")
            </span>
          );
        })()}
      </p>

    </div>

  </div>
</div>

{/* Save Button */}

<div className="col-12">

  <button
    className="btn btn-primary"
    onClick={saveSettings}
  >
    Save Settings
  </button>

</div>

      </div>
    </div>
  );
};

export default Settings;