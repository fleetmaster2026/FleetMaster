import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// How long a user can sit idle (no mouse/keyboard/scroll/touch activity)
// before being logged out automatically. Change this one number to adjust
// it - currently 60 minutes.
const IDLE_TIMEOUT_MS = 60 * 60 * 1000;

// Show a short on-screen warning this long before actually logging out,
// so an idle-but-still-there user gets a chance to notice.
const WARNING_BEFORE_MS = 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

const IdleLogoutGuard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };

    if (!user) {
      clearTimers();
      setShowWarning(false);
      return;
    }

    const doLogout = () => {
      clearTimers();
      logout();
      navigate("/login", { replace: true });
    };

    const resetTimers = () => {
      clearTimers();
      setShowWarning(false);

      warningTimer.current = setTimeout(() => {
        setShowWarning(true);
      }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

      idleTimer.current = setTimeout(doLogout, IDLE_TIMEOUT_MS);
    };

    resetTimers();
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, resetTimers, { passive: true })
    );

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, resetTimers)
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!showWarning) return null;

  return (
    <div className="idle-logout-banner">
      You've been inactive - you'll be logged out soon for security. Move
      your mouse or click anywhere to stay signed in.
    </div>
  );
};

export default IdleLogoutGuard;
