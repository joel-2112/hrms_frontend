// pages/HomePage.jsx
import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { navConfig } from "../components/navigation/navConfig";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { t } = useTranslation();
  const permissionsLoaded = useSelector((s) => s.permissions?.loaded);
  const permMap = useSelector((s) => s.permissions?.flatMap || s.permissions?.map || {});
  const isSuperUser = useSelector(
    (s) => s.auth?.user?.isSuperUser || s.permissions?.isSuperUser
  );

  const defaultRoute = useMemo(() => {
    if (!permissionsLoaded) return null;

    if (isSuperUser) {
      const firstModule = navConfig(t)?.[0];
      const firstChild = firstModule?.children?.[0];
      // Go deeper if the child has children
      const route = firstChild?.children?.[0]?.path || firstChild?.path || "/403";
      return route;
    }

    const walk = (items) => {
      for (const item of items) {
        // Depth-first: check children before self
        if (item.children?.length) {
          const childRoute = walk(item.children);
          if (childRoute) return childRoute;
        }

        // Check if user can access this item
        const ownVisible = !item.resource || permMap[item.resource]?.[item.action || "canRead"];
        if (ownVisible && item.path) {
          return item.path;
        }
      }
      return null;
    };

    return walk(navConfig(t)) || "/403";
  }, [permissionsLoaded, isSuperUser, permMap, t]);

  if (!permissionsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return <Navigate to={defaultRoute} replace />;
}