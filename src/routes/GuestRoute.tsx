import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/hooks/useAuth";

const GuestRoute = () => {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default GuestRoute;