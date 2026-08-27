import { FaRegCalendarAlt, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handleLogout = () => {
    if (window.confirm("Log out of FleetMaster Pro?")) {
      logout();
      window.location.href = "/login";
    }
  };

  return (
    <header className="header">
      <div>
        <div className="header-eyebrow">Fleet Operations</div>
        <h2>FleetMaster Pro</h2>
      </div>

      <div className="header-right">
        <div className="header-date-chip">
          <FaRegCalendarAlt />
          {today}
        </div>

        <div className="header-user">
          <div>
            <div className="header-user-name">{user?.username ?? "Guest"}</div>
            <div className="header-user-role">
              {user?.role === "admin" ? "Fleet Manager" : "Read-Only"}
            </div>
          </div>
          <div className="header-avatar">
            {(user?.username?.[0] ?? "?").toUpperCase()}
          </div>
        </div>

        <button
          type="button"
          className="header-logout-btn"
          onClick={handleLogout}
          title="Log out"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
};

export default Header;
