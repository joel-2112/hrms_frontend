// src/layouts/EmployeeSelfServiceLayout.jsx
import { User } from "lucide-react";
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
  // Find the "My Profile" module from navConfig
  const myProfile = navConfig(t).find((m) => m.moduleName === "self-service");
  if (!myProfile) return [];

  const activeItem = findActiveItem(myProfile.children, pathname);
  if (!activeItem) return [];

  // Find the parent module (e.g., "My Leave", "My Documents", "Personal Details")
  let parentModule = null;

  for (const child of myProfile.children) {
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

  // If the parent module has children, show them as tabs
  if (parentModule?.children?.length > 0) {
    return parentModule.children.map((item) => ({
      label: t(item.label),
      path: item.children?.length > 0 ? (item.children[0]?.path || item.path) : item.path,
      resource: item.resource,
      action: item.action,
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

  // Fallback: show all top-level children of "My Profile" as tabs
  if (myProfile.children?.length > 0) {
    return myProfile.children.map((item) => ({
      label: t(item.label),
      path: item.children?.length > 0 ? (item.children[0]?.path || item.path) : item.path,
      resource: item.resource,
      action: item.action,
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

  return [{
    label: t(activeItem.label),
    path: activeItem.path,
    resource: activeItem.resource,
    action: activeItem.action,
  }];
}

export default function EmployeeSelfServiceLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const tabs = useMemo(() => getTabsForPath(t, pathname), [t, pathname]);

  return (
    <ModuleLayout
      title="My Profile"
      description="Your leave, documents, and personal information."
      icon={User}
      tabs={tabs}
      basePath="/my/profile"
      moduleLabel="Profile"
    />
  );
}