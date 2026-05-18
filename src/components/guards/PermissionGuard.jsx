import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { usePermission } from "../../hooks/usePermission";
import { navConfig } from "../navigation/navConfig";

function findFirstAccessibleRoute(permMap) {
  const walk = (items) => {
    for (const item of items) {
      if (item.children?.length) {
        const childRoute = walk(item.children);
        if (childRoute) return childRoute;
      }
      const ownVisible = !item.resource || permMap[item.resource]?.[item.action || "canRead"];
      if (ownVisible && item.path) return item.path;
    }
    return null;
  };
  return walk(navConfig({}));
}

export default function PermissionGuard({ resource, action = "canRead", children }) {
  const perms = usePermission(resource);
  const location = useLocation();
  const permMap = useSelector((s) => s.permissions?.flatMap || s.permissions?.map || {});
  const isSuperUser = useSelector((s) => s.auth?.user?.isSuperUser || s.permissions?.isSuperUser);

  if (!perms[action]) {
    if (location.pathname === "/403") return children || <Outlet />;

    if (isSuperUser) return <Navigate to="/hr/employees/dashboard" replace />;

    const fallback = findFirstAccessibleRoute(permMap);
    if (fallback) return <Navigate to={fallback} replace />;

    return <Navigate to="/403" replace />;
  }

  return children || <Outlet />;
}