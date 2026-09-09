import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { TOKEN_KEY, USER_KEY } from "../utils/httpAuth";

const API_BASE = "https://fleetmaster-server.onrender.com/api/auth";

// Every login (admin or regular user) is force-logged-out exactly this
// long after signing in, no matter how active they are - matches the
// server's JWT expiresIn in server/routes/authRoutes.js, so both sides
// agree on the same cutoff. Change both together if this ever needs to
// be adjusted.
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

const LOGIN_TIME_KEY = "fm_login_time";

interface AuthUser {
  username: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSessionTimer = () => {
    if (sessionTimer.current) {
      clearTimeout(sessionTimer.current);
      sessionTimer.current = null;
    }
  };

  const logout = () => {
    clearSessionTimer();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LOGIN_TIME_KEY);
    setUser(null);
  };

  // Schedules the hard 1-hour-from-login cutoff. Called both right after
  // a fresh login, and when restoring a session on page refresh - in the
  // refresh case `remainingMs` is whatever's left of the original hour,
  // not a fresh 60 minutes, so refreshing the page can't be used to
  // extend a session past its real expiry.
  const scheduleAbsoluteLogout = (remainingMs: number) => {
    clearSessionTimer();

    if (remainingMs <= 0) {
      logout();
      return;
    }

    sessionTimer.current = setTimeout(() => {
      logout();
    }, remainingMs);
  };

  // Restore session on refresh / app open. Unlike before, this now
  // actually re-validates the stored token against the server (GET
  // /api/auth/me) instead of just trusting whatever's sitting in
  // localStorage - a token whose 1-hour server-side expiry has already
  // passed gets rejected here and the person is treated as logged out,
  // rather than the UI showing them as "still logged in" until they
  // happen to trigger some other API call.
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      const loginTime = Number(localStorage.getItem(LOGIN_TIME_KEY));

      if (!token || !storedUser || !loginTime) {
        setLoading(false);
        return;
      }

      const remainingMs = SESSION_DURATION_MS - (Date.now() - loginTime);

      if (remainingMs <= 0) {
        logout();
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/me`);

        if (!res.ok) {
          logout();
          setLoading(false);
          return;
        }

        setUser(JSON.parse(storedUser));
        scheduleAbsoluteLogout(remainingMs);
      } catch {
        // Network hiccup while validating - don't force a logout just
        // because the check itself failed to reach the server; fall
        // back to trusting the locally stored session for the time
        // that's left on it. A real 401 from any subsequent request is
        // still caught globally by the fetch/axios interceptors.
        setUser(JSON.parse(storedUser));
        scheduleAbsoluteLogout(remainingMs);
      }

      setLoading(false);
    };

    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect role on <body> so CSS can hide edit/import controls
  // for read-only accounts (see role-based rules in shared.css).
  useEffect(() => {
    document.body.classList.remove("role-admin", "role-user");

    if (user) {
      document.body.classList.add(
        user.role === "admin" ? "role-admin" : "role-user"
      );
    }
  }, [user]);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Login failed.");
    }

    const loggedInUser: AuthUser = { username: data.username, role: data.role };

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
    localStorage.setItem(LOGIN_TIME_KEY, Date.now().toString());

    setUser(loggedInUser);
    scheduleAbsoluteLogout(SESSION_DURATION_MS);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAdmin: user?.role === "admin", loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
