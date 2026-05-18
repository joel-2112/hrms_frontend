import { useSelector } from "react-redux";

export function usePermission(resource) {
  const permissions = useSelector((s) => s.permissions);
  const auth = useSelector((s) => s.auth);
  
  const isSuperUser = auth?.user?.isSuperUser || permissions?.isSuperUser;
  const isSystemManager = auth?.user?.isSystemManager || permissions?.isSystemManager;
  const map = permissions?.flatMap || permissions?.map || {};

  if (isSuperUser || isSystemManager) {
    return {
      canRead: true,
      canReadSelf: true,         
      canWrite: true,     
      canCreate: true,
      canSubmit: true,
      canEdit: true,
      canDelete: true,
      canExport: true,
      canApprove: true,
      canReport: true,
      canSetPermissions: true,
    };
  }

  const p = map[resource] || {};
  return {
    canRead: !!p.canRead,
    canReadSelf: !!p.canReadSelf,  
    canWrite: !!p.canWrite,
    canCreate: !!p.canCreate,
    canEdit: !!p.canWrite,
    canDelete: !!p.canDelete,
    canSubmit: !!p.canSubmit,
    canExport: !!p.canExport,
    canApprove: !!p.canSubmit,
    canReport: !!p.canReport,
    canSetPermissions: !!p.canSetPermissions,
  };
}

export function useHasAnyPermission(resource) {
  const auth = useSelector((s) => s.auth);
  const permissions = useSelector((s) => s.permissions);
  
  const isSuperUser = auth?.user?.isSuperUser || permissions?.isSuperUser;
  const isSystemManager = auth?.user?.isSystemManager || permissions?.isSystemManager;
  const map = permissions?.flatMap || permissions?.map || {};
  
  if (isSuperUser || isSystemManager) return true;
  return !!map[resource] && Object.values(map[resource]).some(Boolean);
}