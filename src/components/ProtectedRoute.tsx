import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

const ProtectedRoute = ({ adminOnly = false }: ProtectedRouteProps) => {
  const { user, isLoggedIn, loading } = useAuth();

  // 1. Wait for the initial /api/auth/me check to finish
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>; 
  }

  // 2. If not logged in, send them to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // 3. If route is Admin-only but user is a regular user (role_id !== 1)
  // Based on your docs: role_id: 1 is likely Admin
  if (adminOnly && user?.role_id !== 1) {
    return <Navigate to="/403" replace />;
  }

  // 4. Everything is fine, render the requested page
  return <Outlet />;
};

export default ProtectedRoute;