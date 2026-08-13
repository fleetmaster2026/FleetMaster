import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaHardHat,
  FaTruck,
  FaCalendarAlt,
  FaFileAlt,
  FaTools,
  FaMoneyBillWave,
  FaCog,
} from "react-icons/fa";

const navItems = [
  { to: "/", icon: <FaTachometerAlt />, label: "Dashboard", end: true },
  { to: "/site-engineers", icon: <FaHardHat />, label: "Site & Engineer" },
  { to: "/vehicles", icon: <FaTruck />, label: "Vehicle Master" },
  { to: "/utilisation", icon: <FaCalendarAlt />, label: "Monthly Utilisation" },
  { to: "/documents", icon: <FaFileAlt />, label: "RTA Documents" },
  { to: "/breakdowns", icon: <FaTools />, label: "Breakdown Register" },
  { to: "/fines", icon: <FaMoneyBillWave />, label: "Fine Register" },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <FaTruck />
        </div>
        <div>
          <div className="sidebar-title">FleetMaster Pro</div>
          <div className="sidebar-subtitle">Fleet Operations Suite</div>
        </div>
      </div>

      <div>
        <div className="sidebar-section-label">Main Menu</div>
        <div className="sidebar-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "active" : undefined
              }
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div>
        <div className="sidebar-section-label">System</div>
        <div className="sidebar-menu">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "active" : undefined
            }
          >
            <span className="sidebar-icon"><FaCog /></span>
            Settings
          </NavLink>
        </div>
      </div>

      <div className="sidebar-footer">FleetMaster Pro · v1.0</div>
    </aside>
  );
};

export default Sidebar;
