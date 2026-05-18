import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users, Wallet, ShoppingCart, FolderKanban,
  ChevronLeft, ChevronRight, LayoutGrid,
  ChevronDown, ChevronUp,
  UserCheck, CalendarDays, DollarSign, Clock,
  Briefcase, ClipboardList, FileText, Megaphone,
  UserPlus, Share2, MessageSquare, MailCheck,
  FileSignature, TrendingUp, Shield, List,
  UserCog, Key, ShieldCheck, FileStack,
  Building2, Building, GitBranch, Layers,
  Tag, GraduationCap, FolderOpen, ShieldAlert,
  Receipt, CreditCard, BarChart3, ShoppingBag,
  CheckSquare, Flag, X,
} from "lucide-react";
import { navConfig } from "./navConfig";
import { toggleSidebar, setSidebarOpen, setSidebarCollapsed } from "../../redux/features/uiSlice";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ICONS = {
  Users, Wallet, ShoppingCart, FolderKanban,
  UserCheck, CalendarDays, DollarSign, Clock,
  Briefcase, ClipboardList, FileText, Megaphone,
  UserPlus, Share2, MessageSquare, MailCheck,
  FileSignature, TrendingUp, Shield, List,
  UserCog, Key, ShieldCheck, FileStack,
  Building2, Building, GitBranch, Layers,
  Tag, GraduationCap, FolderOpen, ShieldAlert,
  Receipt, CreditCard, BarChart3, ShoppingBag,
  CheckSquare, Flag,
};

// ═══════════════════════════════════════════════════════════════
//  ACTION → PERMISSION FIELD MAPPING
//  Maps navConfig action names to actual permission field names
// ═══════════════════════════════════════════════════════════════
const ACTION_TO_FIELD = {
  canRead: 'canRead',
  readSelf: 'canReadSelf',
  canWrite: 'canWrite',
  canCreate: 'canCreate',
  canDelete: 'canDelete',
  canSubmit: 'canSubmit',
  canCancel: 'canCancel',
  canAmend: 'canAmend',
  canPrint: 'canPrint',
  canEmail: 'canEmail',
  canImport: 'canImport',
  canExport: 'canExport',
  canReport: 'canReport',
  canSetPermissions: 'canSetPermissions',
};

function hasVisibleDescendants(item, map) {
  if (!item.children || item.children.length === 0) return false;
  return item.children.some((c) => {
    const fieldName = ACTION_TO_FIELD[c.action] || c.action;
    const selfVisible = map[c.resource]?.[fieldName];
    const kidsVisible = hasVisibleDescendants(c, map);
    return selfVisible || kidsVisible;
  });
}

function filterNavRecursive(items, map) {
  return items
    .map((item) => {
      const filteredChildren = item.children
        ? filterNavRecursive(item.children, map)
        : [];
      const fieldName = ACTION_TO_FIELD[item.action] || item.action;
      const ownVisible = map[item.resource]?.[fieldName];
      const descendantsVisible = filteredChildren.length > 0;

      if (!ownVisible && !descendantsVisible) return null;
      return { ...item, children: filteredChildren };
    })
    .filter(Boolean);
}

function filterNav(map, t) {
  const topLevel = navConfig(t).map((item) => {
    const children = item.children ? filterNavRecursive(item.children, map) : [];
    const fieldName = ACTION_TO_FIELD[item.action] || item.action;
    const ownVisible = map[item.resource]?.[fieldName];
    const descendantsVisible = hasVisibleDescendants(item, map);
    if (!children.length && !ownVisible && !descendantsVisible) return null;
    return { ...item, children };
  });
  return topLevel.filter(Boolean);
}

function NestedNav({ items, level = 0, sidebarCollapsed, t }) {
  if (!items || items.length === 0) return null;

  return (
    <ul
      className={cn(
        "space-y-0.5",
        level === 0 && !sidebarCollapsed && "ml-2",
        level > 0 && !sidebarCollapsed && "ml-4 border-l border-sidebar-border/40 pl-2"
      )}
    >
      {items.map((child) => {
        const ChildIcon = child.icon ? ICONS[child.icon] || LayoutGrid : null;
        const linkTo = child.children && child.children.length > 0
          ? child.children[0].path
          : child.path;

        return (
          <li key={child.path}>
            <NavLink
              to={linkTo}
              end={child.path === "/projects"}
              className={({ isActive }) =>
                cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-base",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-primary-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {ChildIcon && (
                    <ChildIcon className={cn("h-4 w-4", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50")} />
                  )}
                  {t(child.label)}
                </>
              )}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const { sidebarCollapsed, sidebarOpen } = useSelector((s) => s.ui);
  const { isSuperUser, map: permMap } = useSelector((s) => s.permissions);
  const { t } = useTranslation();
  const location = useLocation();
  const _isMobile = useIsMobile();
  const isMobile = _isMobile === true;

  const nav = useMemo(() => {
    if (isSuperUser) return navConfig(t);
    return filterNav(permMap, t);
  }, [isSuperUser, permMap, t]);

  const [expanded, setExpanded] = useState(() => {
    const initial = new Set();
    const walk = (items) => {
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          initial.add(item.path);
          walk(item.children);
        }
      });
    };
    walk(navConfig(t));
    return initial;
  });
  const [activeFlyout, setActiveFlyout] = useState(null);

  const toggleExpand = useCallback((path) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Auto-expand sidebar when switching to mobile so Sheet shows full labels
  useEffect(() => {
    if (isMobile && sidebarCollapsed) {
      dispatch(setSidebarCollapsed(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      dispatch(setSidebarOpen(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const sidebarBody = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4 ">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <img src="/image.png" alt="Logo" className="h-7 w-7 object-contain" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold  tracking-tight text-sidebar-primary-foreground">teamwork ERP</span>
              <span className="text-[11px] text-sidebar-foreground/60">Enterprise workspace</span>
            </div>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-primary-foreground transition-base"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {nav.length === 0 && !sidebarCollapsed && (
          <p className="px-3 py-6 text-xs text-sidebar-foreground/50">
            Your role has no module access. Contact your administrator.
          </p>
        )}
        {nav.map((group) => {
          const GroupIcon = ICONS[group.icon] || LayoutGrid;
          const isGroupExpanded = expanded.has(group.path);
          const isFlyoutActive = activeFlyout === group.label;

          return (
            <div
              key={group.label}
              className={cn("mb-4", sidebarCollapsed && "relative")}
              onMouseEnter={() => sidebarCollapsed && setActiveFlyout(group.label)}
              onMouseLeave={() => sidebarCollapsed && setActiveFlyout(null)}
            >
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (sidebarCollapsed) {
                        setActiveFlyout(group.label);
                      } else {
                        toggleExpand(group.path);
                      }
                    }}
                    className={cn(
                      "mb-1 flex w-full items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-base",
                      sidebarCollapsed && "justify-center px-0",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <GroupIcon className="h-4 w-4" />
                      {!sidebarCollapsed && <span>{t(group.label)}</span>}
                    </span>
                    {!sidebarCollapsed && (
                      isGroupExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )
                    )}
                  </button>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="capitalize">
                    {t(group.label)}
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Flyout for collapsed desktop mode */}
              {sidebarCollapsed && isFlyoutActive && (
                <div className="absolute left-full top-0 z-50 ml-2 w-64 rounded-lg border border-sidebar-border bg-popover p-3 shadow-lg">
                  <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t(group.label)}
                  </div>
                  <NestedNav
                    items={group.children}
                    level={0}
                    sidebarCollapsed={false}
                    t={t}
                  />
                </div>
              )}

              {!sidebarCollapsed && isGroupExpanded && (
                <NestedNav
                  items={group.children}
                  level={0}
                  sidebarCollapsed={sidebarCollapsed}
                  t={t}
                />
              )}
            </div>
          );
        })}
      </nav>
    </>
  );

  const sidebar = (
    <>
      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={(open) => dispatch(setSidebarOpen(open))}>
          <SheetContent side="left" className="w-52 bg-sidebar p-0 border-r border-sidebar-border gap-0">
            {sidebarBody}
          </SheetContent>
        </Sheet>
      ) : (
        <aside
          className={cn(
            "hidden md:flex flex-col bg-sidebar text-sidebar-foreground transition-base border-r border-sidebar-border",
            sidebarCollapsed ? "w-16" : "w-72",
          )}
        >
          {sidebarBody}
        </aside>
      )}
    </>
  );

  return (
    <TooltipProvider delayDuration={0}>
      {sidebar}
    </TooltipProvider>
  );
}