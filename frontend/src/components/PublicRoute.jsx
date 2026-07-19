// src/components/PublicRoute.jsx
import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function PublicRoute() {
  const { user } = useContext(AuthContext);

  // If user is logged in → redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;   // ✅ VERY IMPORTANT
}

export default PublicRoute;