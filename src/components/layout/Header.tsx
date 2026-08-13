import { FaRegCalendarAlt } from "react-icons/fa";

const Header = () => {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
            <div className="header-user-name">Admin</div>
            <div className="header-user-role">Fleet Manager</div>
          </div>
          <div className="header-avatar">A</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
