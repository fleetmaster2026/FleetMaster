// src/components/layout/Sidebar.tsx

import { NavLink } from "react-router-dom";

const menus = [
  { name: "🏠 Dashboard", path: "/" },
  { name: "🚚 Vehicle Master", path: "/vehicles" },
  { name: "🏗 Site Master", path: "/sites" },
  { name: "👷 Engineer Master", path: "/engineers" },
  { name: "📅 Monthly Utilisation", path: "/utilisation" },
  { name: "📄 RTA Documents", path: "/documents" },
  { name: "🔧 Breakdown Register", path: "/breakdowns" },
  { name: "💰 Fine Register", path: "/fines" },
  { name: "📊 Reports", path: "/reports" },
  { name: "⚙ Settings", path: "/settings" },
];
const Sidebar = () => {
  return (
    <aside
      style={{
        width: 250,
        background: "#1e293b",
        color: "#fff",
        padding: 20,
      }}
    >
      <h2 style={{ textAlign: "center" }}>🚚 FleetMaster Pro</h2>

      <hr />

      <div style={{ marginTop: 20 }}>
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            style={({ isActive }) => ({
              display: "block",
              padding: "12px",
              marginBottom: 8,
              borderRadius: 8,
              textDecoration: "none",
              color: "#fff",
              background: isActive ? "#2563eb" : "transparent",
            })}
          >
            {menu.name}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;