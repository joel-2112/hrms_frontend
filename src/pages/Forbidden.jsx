import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ShieldAlert } from "lucide-react";
import { navConfig } from "../components/navigation/navConfig";

export default function Forbidden() {
  const permMap = useSelector((s) => s.permissions?.flatMap || s.permissions?.map || {});
  const isSuperUser = useSelector(
    (s) => s.auth?.user?.isSuperUser || s.permissions?.isSuperUser
  );

  // Find first accessible route for the "Back to workspace" button
  const workspaceRoute = useMemo(() => {
    if (isSuperUser) {
      const firstModule = navConfig({})?.[0];
      return firstModule?.children?.[0]?.path || "/";
    }

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

    return walk(navConfig({})) || null;
  }, [isSuperUser, permMap]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Access denied
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You don't have permission to view this page. If you believe this is a mistake, contact your administrator.
        </p>
        {workspaceRoute ? (
          <Link
            to={workspaceRoute}
            className="mt-6 inline-flex items-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-base hover:shadow-glow"
          >
            Back to workspace
          </Link>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            No accessible modules found. Contact your administrator.
          </p>
        )}
      </div>
    </div>
  );
}