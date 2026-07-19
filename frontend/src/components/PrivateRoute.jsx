import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function PrivateRoute() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!user || !token) {
    if (location.pathname === "/") {
      return <Navigate to="/rooms" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Admin redirect from root
  if (
    location.pathname === "/" &&
    ["owner", "staff"].includes(user.role)
  ) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;   // ✅ VERY IMPORTANT
}

export default PrivateRoute;