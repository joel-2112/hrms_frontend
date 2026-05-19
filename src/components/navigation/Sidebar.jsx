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
        level > 0 && !sidebarCollapsed && "ml-4 border-l border-white/10 pl-2"
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
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all duration-200",
                  "backdrop-blur-sm",
                  isActive
                    ? "bg-white/15 text-white font-medium shadow-sm shadow-black/10 ring-1 ring-white/20"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {ChildIcon && (
                    <ChildIcon className={cn(
                      "h-4 w-4 transition-colors duration-200",
                      isActive ? "text-secondary" : "text-white/50"
                    )} />
                  )}
                  <span className="truncate">{t(child.label)}</span>
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

  useEffect(() => {
    if (isMobile && sidebarCollapsed) {
      dispatch(setSidebarCollapsed(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      dispatch(setSidebarOpen(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const sidebarBody = (
    <>
      {/* Header with glass morphism */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-secondary/70 shadow-lg shadow-secondary/20">
            <svg className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="text-sm font-semibold tracking-tight text-white">Ethiohr ERP</span>
              <span className="text-[11px] text-white/50">Enterprise workspace</span>
            </div>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Navigation with glass background */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 backdrop-blur-sm">
        {nav.length === 0 && !sidebarCollapsed && (
          <div className="px-3 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
              <Shield className="h-5 w-5 text-white/30" />
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Your role has no module access.<br />Contact your administrator.
            </p>
          </div>
        )}
        {nav.map((group) => {
          const GroupIcon = ICONS[group.icon] || LayoutGrid;
          const isGroupExpanded = expanded.has(group.path);
          const isFlyoutActive = activeFlyout === group.label;

          return (
            <div
              key={group.label}
              className={cn("mb-1", sidebarCollapsed && "relative")}
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
                      "mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200",
                      "text-white/40 hover:text-white/70 hover:bg-white/5",
                      sidebarCollapsed && "justify-center px-0"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <GroupIcon className="h-4 w-4" />
                      {!sidebarCollapsed && <span>{t(group.label)}</span>}
                    </span>
                    {!sidebarCollapsed && (
                      isGroupExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 opacity-50" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                      )
                    )}
                  </button>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="capitalize backdrop-blur-xl bg-black/90 border-white/20 text-white">
                    {t(group.label)}
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Glass flyout for collapsed desktop mode */}
              {sidebarCollapsed && isFlyoutActive && (
                <div className="absolute left-full top-0 z-50 ml-2 w-64 rounded-xl border border-white/20 bg-black/80 backdrop-blur-xl p-3 shadow-2xl shadow-black/50">
                  <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-white/50">
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

      {/* Bottom gradient overlay */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
    </>
  );

  const sidebar = (
    <>
      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={(open) => dispatch(setSidebarOpen(open))}>
          <SheetContent side="left" className="w-72 bg-gradient-to-b from-[#1a1a1a] via-[#222222] to-[#1a1a1a] backdrop-blur-xl p-0 border-r border-white/10 gap-0">
            {sidebarBody}
          </SheetContent>
        </Sheet>
      ) : (
        <aside
          className={cn(
            "hidden md:flex flex-col relative transition-all duration-300 ease-in-out",
            "bg-gradient-to-b from-[#1a1a1a] via-[#222222] to-[#1a1a1a] backdrop-blur-xl",
            "text-white border-r border-white/10",
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