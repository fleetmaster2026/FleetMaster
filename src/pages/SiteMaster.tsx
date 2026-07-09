import { useEffect, useState } from "react";
import type { Site } from "../types/Site";
import {
  getSites,
  addSite,
  updateSite,
  deleteSite,
} from "../services/siteApi";

const SiteMaster = () => {
  const [sites, setSites] = useState<Site[]>([]);

  const [siteName, setSiteName] = useState("");
  const [location, setLocation] = useState("");
  const [projectCode, setProjectCode] = useState("");

  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const data = await getSites();
      setSites(data);
    } catch (err) {
      console.error(err);
      alert("Unable to load sites.");
    }
  };

  const saveSite = async () => {
    if (siteName.trim() === "") {
      alert("Enter Site Name");
      return;
    }

    const siteData = {
      siteName,
      location,
      projectCode,
      status,
    };

    if (editingId !== null) {
      await updateSite(editingId, siteData);
      setEditingId(null);
    } else {
      await addSite(siteData);
    }

    await loadSites();

    setSiteName("");
    setLocation("");
    setProjectCode("");
    setStatus("Active");
  };

  const filteredSites = sites.filter((s) =>
    s.siteName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>🏗 Site Master</h1>

      <input
        placeholder="Search Site..."
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
          placeholder="Site Name"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
        />

        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <input
          placeholder="Project Code"
          value={projectCode}
          onChange={(e) => setProjectCode(e.target.value)}
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

        <button onClick={saveSite}>
          {editingId !== null ? "Update Site" : "Add Site"}
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
            <th>Site Name</th>
            <th>Location</th>
            <th>Project Code</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredSites.length > 0 ? (
            filteredSites.map((site) => (
              <tr key={site.id}>
                <td>{site.siteName}</td>
                <td>{site.location}</td>
                <td>{site.projectCode}</td>
                <td>{site.status}</td>

                <td>
                  <button
                    onClick={() => {
                      setEditingId(site.id);

                      setSiteName(site.siteName);
                      setLocation(site.location);
                      setProjectCode(site.projectCode);
                      setStatus(site.status);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={async () => {
                      await deleteSite(site.id);
                      await loadSites();
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
              <td colSpan={5} style={{ textAlign: "center" }}>
                No Sites Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SiteMaster;