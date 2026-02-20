import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "@/lib/session";

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const location = useLocation();

  if (!isLoggedIn()) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?mode=signup&redirect=${redirectTo}`} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
