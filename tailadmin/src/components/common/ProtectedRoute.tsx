import { Navigate } from "react-router";
import { useAuthStore, hasPermission } from "../../store/authStore";

interface ProtectedRouteProps {
  permission: string;
  children: React.ReactNode;
}

export default function ProtectedRoute({ permission, children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(user, permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
