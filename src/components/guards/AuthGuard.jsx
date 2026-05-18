import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "../../hooks/useAuth";

export default function AuthGuard() {
  const location = useLocation();
  const { isAuthenticated, loading, initMe } = useAuth();
  const permLoaded = useSelector((s) => s.permissions.loaded);

  useEffect(() => {
    initMe();
  }, [initMe]);

  if (loading || !permLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

