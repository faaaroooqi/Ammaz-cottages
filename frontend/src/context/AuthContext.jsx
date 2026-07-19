import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);

  // Restore auth + theme on app load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      const storedTheme = localStorage.getItem("theme");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }

      if (storedTheme) {
        setTheme(storedTheme);
      }
    } catch (err) {
      console.error("Auth restore error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Persist theme
  useEffect(() => {
    localStorage.setItem("theme", theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Login handler
  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
       setLoading(false);   // <-- ensure guards hide overlay

  };

  // Logout handleris
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Role helpers (VERY IMPORTANT later)
  const isAuthenticated = Boolean(user);
  const isAdmin = ["owner", "staff"].includes(user?.role);
  const isCustomer = user?.role === "customer";

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        theme,
        setTheme,
        loading,
        isAuthenticated,
        isAdmin,
        isCustomer,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}
