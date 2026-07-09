// src/components/layout/Header.tsx

const Header = () => {
  const today = new Date().toLocaleDateString();

  return (
    <header
      style={{
        height: 65,
        background: "#2563eb",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 25px",
        boxShadow: "0 2px 8px rgba(0,0,0,.15)",
      }}
    >
      <h2>FleetMaster Pro</h2>

      <div style={{ textAlign: "right" }}>
        <div>Admin</div>
        <small>{today}</small>
      </div>
    </header>
  );
};

export default Header;