import { Outlet } from "react-router-dom";

/**
 * Layout for unauthenticated pages (Login, Register, Forgot password).
 * Renders no sidebar/topbar — just a full-screen outlet.
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-background">
      <Outlet />
    </div>
  );
}
