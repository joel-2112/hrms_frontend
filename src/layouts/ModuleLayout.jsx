import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export default function ModuleLayout({ tabs }) {
  const { isSuperUser, map: permMap } = useSelector((s) => s.permissions);
  const location = useLocation();
  const navigate = useNavigate();

  const canView = (tab) => {
    if (isSuperUser) return true;
    if (!tab.resource) return true;
    return permMap[tab.resource]?.[tab.action || "canRead"];
  };

  const visibleTabs = isSuperUser
    ? tabs
    : tabs.filter((t) => {
        if (canView(t)) return true;
        if (t.children) {
          return t.children.some((child) => canView(child));
        }
        return false;
      });

  return (
    <div className="animate-fade-in">
      {/* Sub-nav tabs — overflow-visible for dropdown */}
      <div className="border-b border-border bg-card px-6 pt-4 overflow-visible">
        <div className="flex gap-1 overflow-visible">
          {visibleTabs.map((tab) => (
            <TabItem
              key={tab.path}
              tab={tab}
              canView={canView}
              location={location}
              navigate={navigate}
            />
          ))}
        </div>
      </div>

      <div className="p-6">
        <Outlet />
      </div>
    </div>
  );
}

// ─── Tab Item Component ──────────────────────────────────────────────────────

function TabItem({ tab, canView, location, navigate }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const hasChildren = tab.children && tab.children.length > 0;

  // Check if any child path is currently active
  const isChildActive = hasChildren && tab.children.some(
    (child) => location.pathname === child.path || location.pathname.startsWith(child.path + "/")
  );
  const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + "/") || isChildActive;

  // Hover handlers with delay to prevent flicker
  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // If it has children, render as dropdown trigger
  if (hasChildren) {
    const visibleChildren = tab.children.filter((child) => canView(child));
    if (visibleChildren.length === 0) return null;

    return (
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Dropdown trigger button */}
        <button
          onClick={() => {
            const firstChild = visibleChildren[0];
            if (firstChild) navigate(firstChild.path);
          }}
          className={cn(
            "relative flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium transition-base rounded-t-lg",
            isChildActive
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
          )}
        >
          {tab.label}
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
          {isActive && (
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
          )}
        </button>

        {/* Dropdown menu */}
        {open && (
          <>
            {/* Invisible bridge to prevent gap between button and menu */}
            <div className="absolute top-full left-0 right-0 h-2" />
            
            <div
              className="absolute top-[calc(100%+8px)] left-0 min-w-[220px] bg-white border border-gray-200 rounded-xl shadow-lg z-[100] py-2 animate-in fade-in slide-in-from-top-2 duration-150"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {visibleChildren.map((child) => {
                const childActive = location.pathname === child.path || location.pathname.startsWith(child.path + "/");
                return (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={cn(
                      "block px-4 py-2.5 text-sm transition-colors mx-2 rounded-lg",
                      childActive
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {child.label}
                  </NavLink>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Regular tab (no children)
  return (
    <NavLink
      to={tab.path}
      end={tab.exact}
      className={({ isActive: linkActive }) =>
        cn(
          "relative whitespace-nowrap px-3 py-3 text-sm font-medium transition-base",
          linkActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
        )
      }
    >
      {({ isActive: linkActive }) => (
        <>
          {tab.label}
          {linkActive && (
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
          )}
        </>
      )}
    </NavLink>
  );
}