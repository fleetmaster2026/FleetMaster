import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { TOKEN_KEY, USER_KEY } from "../utils/httpAuth";

const API_BASE = "http://localhost:5000/api/auth";

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

  // Restore session on refresh / app open
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
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

    setUser(loggedInUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
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
