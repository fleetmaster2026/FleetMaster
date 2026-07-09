const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 10,
  padding: 20,
  boxShadow: "0 2px 8px rgba(0,0,0,.1)",
  flex: 1,
  minWidth: 220,
};

const Dashboard = () => {
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
          <h1>0</h1>
        </div>

        <div style={cardStyle}>
          <h3>🟢 Active Vehicles</h3>
          <h1>0</h1>
        </div>

        <div style={cardStyle}>
          <h3>🔧 Breakdown</h3>
          <h1>0</h1>
        </div>

        <div style={cardStyle}>
          <h3>📄 Documents Expiring</h3>
          <h1>0</h1>
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
    </div>
  );
};

export default Dashboard;