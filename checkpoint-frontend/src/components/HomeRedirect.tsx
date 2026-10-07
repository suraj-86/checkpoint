import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/context/AuthContext";

export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "ADMIN" ? "/admin" : "/dashboard"} replace />;
}
