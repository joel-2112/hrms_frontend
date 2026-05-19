import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as React from "react";
import { navConfig } from "./navConfig";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function findBreadcrumbTrail(items, pathname) {
  for (const item of items) {
    if (item.path === pathname) {
      return [item];
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.path === pathname) {
          return [item, child];
        }
        if (child.children) {
          for (const grandchild of child.children) {
            if (grandchild.path === pathname) {
              return [item, child, grandchild];
            }
          }
        }
      }
    }
  }
  return [];
}

export default function DynamicBreadcrumb() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const allNav = navConfig(t);
  const trail = findBreadcrumbTrail(allNav, pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem> */}

        {trail.length > 0 && <BreadcrumbSeparator />}

        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <React.Fragment key={item.path + index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{t(item.label)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.path}>{t(item.label)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

