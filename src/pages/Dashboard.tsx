import { useEffect, useRef, useState } from "react";
import { getVehicles } from "../services/vehicleApi";
import type { Vehicle } from "../types/Vehicle";
import { getRtaDocuments } from "../services/rtaDocumentApi";
import type { RtaDocument } from "../types/RtaDocument";
const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 10,
  padding: 20,
  boxShadow: "0 2px 8px rgba(0,0,0,.1)",
  flex: 1,
  minWidth: 220,
};

const Dashboard = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rtaDocuments, setRtaDocuments] = useState<RtaDocument[]>([]);
  const attentionRef = useRef<HTMLDivElement>(null);
  const loadVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error(err);
    }
  };
  const loadRtaDocuments = async () => {
  try {
    const data = await getRtaDocuments();
    setRtaDocuments(data);
  } catch (err) {
    console.error(err);
  }
};

  const activeVehicles = vehicles.filter(
  (vehicle) => vehicle.status === "Active"
).length;
const today = new Date();
today.setHours(0, 0, 0, 0);

let expiringDocuments = 0;
const attentionList: {
  vehicleNo: string;
  site: string;
  document: string;
  status: string;
}[] = [];
useEffect(() => {
  loadVehicles();
  loadRtaDocuments();
}, []);
useEffect(() => {
  const container = attentionRef.current;

  if (!container || attentionList.length === 0) return;

  let intervalId: number | null = null;

  const startScroll = () => {
    if (intervalId !== null) return;

    intervalId = window.setInterval(() => {
      const maxScroll =
        container.scrollHeight - container.clientHeight;

      if (container.scrollTop >= maxScroll - 2 && !resettingRef.current) {
  resettingRef.current = true;

  stopScroll();

  setTimeout(() => {
    container.scrollTop = 0;

    resettingRef.current = false;

    startScroll();
  }, 1500);

  return;
}

      container.scrollTop += 1;
    }, 30);
  };

  const stopScroll = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  startScroll();

  container.addEventListener("mouseenter", stopScroll);
  container.addEventListener("mouseleave", startScroll);

  return () => {
    stopScroll();
    container.removeEventListener("mouseenter", stopScroll);
    container.removeEventListener("mouseleave", startScroll);
  };
}, [rtaDocuments]);
rtaDocuments.forEach((doc) => {
  const documents = [
    { name: "RC", date: doc.rcExpiry },
    { name: "Insurance", date: doc.insuranceExpiry },
    { name: "Fitness", date: doc.fitnessExpiry },
    { name: "Permit", date: doc.permitExpiry },
    { name: "PUC", date: doc.pollutionExpiry },
    { name: "Road Tax", date: doc.taxExpiry },
  ];

  documents.forEach((d) => {
    if (!d.date) return;

    const expiry = new Date(d.date);
    expiry.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (expiry.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      attentionList.push({
        vehicleNo: doc.vehicleNo,
        site: doc.site,
        document: d.name,
        status: "Expired",
      });
    } else if (diffDays <= 30) {
      attentionList.push({
        vehicleNo: doc.vehicleNo,
        site: doc.site,
        document: d.name,
        status: `${diffDays} Days Left`,
      });
    }
  });
});
rtaDocuments.forEach((doc) => {
  [
    doc.rcExpiry,
    doc.insuranceExpiry,
    doc.fitnessExpiry,
    doc.permitExpiry,
    doc.pollutionExpiry,
    doc.taxExpiry,
  ].forEach((date) => {
    const expiry = new Date(date);
    expiry.setHours(0, 0, 0, 0);

    const diffDays =
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > 0 && diffDays <= 30) {
      expiringDocuments++;
    }
  });
});
attentionList.sort((a, b) => {
  const getPriority = (status: string) => {
    if (status === "Expired") return 0;

    if (status === "Expiring Today") return 1;

    const days = parseInt(status);

    return isNaN(days) ? 999 : days + 2;
  };

  // Group by vehicle first
  if (a.vehicleNo !== b.vehicleNo) {
    return a.vehicleNo.localeCompare(b.vehicleNo);
  }

  // Then sort issues within that vehicle
  return getPriority(a.status) - getPriority(b.status);
});
return (
    <div>
      <h1>Dashboard</h1>

      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          marginTop: 20,
        }}
      >
        <div style={cardStyle}>
          <h3>🚚 Total Vehicles</h3>
          <h1>{vehicles.length}</h1>
        </div>

        <div style={cardStyle}>
          <h3>🟢 Active Vehicles</h3>
          <h1>{activeVehicles}</h1>
        </div>

        <div style={cardStyle}>
          <h3>🔧 Breakdown</h3>
          <h1>0</h1>
        </div>

        <div style={cardStyle}>
          <h3>📄 Documents Expiring</h3>
          <h1>{expiringDocuments}</h1>
        </div>

        <div style={cardStyle}>
          <h3>💰 Pending Funds</h3>
          <h1>₹0</h1>
        </div>

        <div style={cardStyle}>
          <h3>⚠ Pending Fines</h3>
          <h1>₹0</h1>
        </div>
      </div>
      <div
  style={{
    background: "white",
    marginTop: 30,
    borderRadius: 10,
    padding: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,.1)",
  }}
>
<div
  style={{
    background: "#dc2626",
    color: "white",
    padding: "12px 18px",
    margin: "-20px -20px 15px -20px",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <h2
    style={{
      margin: 0,
      color: "white",
      fontSize: 20,
    }}
  >
    ⚠️ Attention Required
  </h2>

  <span
    style={{
      background: "white",
      color: "#dc2626",
      padding: "4px 12px",
      borderRadius: 20,
      fontWeight: "bold",
      fontSize: 15,
    }}
  >
    {attentionList.length}
  </span>
</div>
  {attentionList.length === 0 ? (
    <p style={{ color: "green", fontWeight: "bold" }}>
      ✅ All vehicle documents are valid.
    </p>
  ) : (
    <div
  ref={attentionRef}
  className="attention-container"
  style={{
    maxHeight: 300,
    overflowY: "auto",
  }}
>
  {attentionList.map((item, index) => (
    <div
  key={index}
  style={{
    display: "flex",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 16,
    background: "#fff",
    transition: "all .2s ease",
    cursor: "pointer",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "#f8fafc";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "#fff";
  }}
>
      <div
  style={{
    width: 250,
    fontWeight: 700,
    fontSize: 16,
  }}
>
        🚚 {item.vehicleNo}
      </div>

      <div
  style={{
    width: 110,
    fontSize: 15,
  }}
>
        📍 {item.site}
      </div>

      <div
  style={{
    width: 190,
    fontSize: 15,
  }}
>
        📄 {item.document}
      </div>

      <div
        style={{
          color:
            item.status === "Expired"
              ? "#dc2626"
              : "#ea580c",
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        {item.status === "Expired"
          ? "🔴 Expired"
          : item.status === "Expiring Today"
          ? "🟠 Expiring Today"
          : `🟠 ${item.status}`}
      </div>
    </div>
  ))}
</div>
  )}

</div>
    </div>
    
  );
};

export default Dashboard;