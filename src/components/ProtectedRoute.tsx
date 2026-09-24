// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  requireAdmin?: boolean;
  requireContributor?: boolean;
}

const ProtectedRoute = ({ 
  requireAdmin = false, 
  requireContributor = false 
}: ProtectedRouteProps) => {
  const { user, isLoggedIn, loading } = useAuth();

  // 1. Show loading state while checking auth/cookie
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
 a     </div>
    );
  }

  // 2. If not logged in, redirect to login page
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. 🔒 CRITICAL: If user is banned, kick them out immediately
  if (user.is_banned) {
    return <Navigate to="/login?banned=true" replace />;
  }

  // 4. Check Admin requirement
  if (requireAdmin && user.role_name !== "admin") {
    return <Navigate to="/403" replace />;
  }

  // 5. Check Contributor requirement 
  // (Note: Admins are also allowed to do contributor things, so we allow them too)
  if (requireContributor && !user.allowed_to_contribute && user.role_name !== "admin") {
    return <Navigate to="/403" replace />;
  }

  // 6. All checks passed! Render the child routes
  return <Outlet />;
};

export default ProtectedRoute;