import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import ModuleLayout from "./ModuleLayout";
import { navConfig } from "../components/navigation/navConfig";

function findActiveItem(items, pathname) {
  for (const item of items) {
    if (item.path === pathname) return item;
    if (item.children) {
      const found = findActiveItem(item.children, pathname);
      if (found) return found;
    }
  }
  return null;
}

function getTabsForPath(t, pathname) {
  const hr = navConfig(t).find((m) => m.moduleName === "hr");
  if (!hr) return [];

  // ═══════════════════════════════════════════════════════════════
  //  Find which HR module the current path belongs to
  // ═══════════════════════════════════════════════════════════════
  const activeItem = findActiveItem(hr.children, pathname);
  if (!activeItem) return [];

  // Find the parent module (e.g., "Leave", "Employees", "Recruitment")
  let parentModule = null;
  
  // Walk through HR children to find which module contains the active path
  for (const child of hr.children) {
    if (child.path === pathname) {
      parentModule = child;
      break;
    }
    if (child.children) {
      const found = findActiveItem(child.children, pathname);
      if (found) {
        parentModule = child;
        break;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  If parent module has children, show them as tabs
  //  (e.g., Leave has Dashboard, Applications, Configurations)
  // ═══════════════════════════════════════════════════════════════
  if (parentModule?.children?.length > 0) {
    return parentModule.children.map((item) => ({
      label: t(item.label),
      path: item.children?.length > 0 ? (item.children[0]?.path || item.path) : item.path,
      resource: item.resource,
      action: item.action,
      // Only pass children if this item actually has children in navConfig
      children: item.children?.length > 0
        ? item.children.map((c) => ({
            label: t(c.label),
            path: c.path,
            resource: c.resource,
            action: c.action,
          }))
        : undefined,
    }));
  }

  // Fallback: return the active item itself as the only tab
  return [{
    label: t(activeItem.label),
    path: activeItem.path,
    resource: activeItem.resource,
    action: activeItem.action,
  }];
}

export default function HRLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const tabs = useMemo(() => getTabsForPath(t, pathname), [t, pathname]);

  return (
    <ModuleLayout
      title="Human Resources"
      description="People, payroll, time off, recruitment, and policies."
      icon={Users}
      tabs={tabs}
      basePath="/hr"
      moduleLabel="HR"
    />
  );
}