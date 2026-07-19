import { useContext, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function RoleRedirect() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;

    if (["owner", "staff"].includes(user.role)) {
      navigate("/admin", { replace: true });
    } else {
      // customer – stay on the normal home page
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  // while we’re waiting just render nothing
  return null;
}