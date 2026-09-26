import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../features/auth/context/AuthContext";
import type { Role } from "../features/auth/types/auth.types";

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: Role;
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    // Authenticated, but wrong role — send them somewhere safe rather
    // than showing a raw 403. (docs section 7: student hitting admin
    // route should not see admin UI at all.)
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
