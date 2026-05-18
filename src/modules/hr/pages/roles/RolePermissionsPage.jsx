import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Search, Shield, RefreshCw, X, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check, Lock, Save, Edit3 } from "lucide-react";

// ─── Extractors ──────────────────────────────────────────────────────────────
const extractRoles = (r) => {
  const arr = r?.data?.data?.data || r?.data?.data || r?.data || [];
  return Array.isArray(arr) ? arr : [];
};

const extractResources = (r) => {
  const arr = r?.data?.data?.data || r?.data?.data || r?.data || [];
  return Array.isArray(arr) ? arr : [];
};

const extractPermissions = (r) => {
  const arr = r?.data?.data?.data || r?.data?.data || r?.data || [];
  return Array.isArray(arr) ? arr : [];
};

const extractMeta = (r) => {
  return r?.data?.data?.meta || r?.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 };
};

const groupByResourceAndRole = (rows) => {
  const map = new Map();
  for (const row of rows) {
    const key = row.resourceName;
    if (!map.has(key)) map.set(key, new Map());
    const roleMap = map.get(key);
    const roleKey = row.roleId;
    if (!roleMap.has(roleKey)) roleMap.set(roleKey, row);
  }
  return map;
};

// ─── Permission Flags — added canReadSelf ────────────────────────────────────
const FLAGS = [
  { key: "canRead", label: "Read (All)" },
  { key: "canReadSelf", label: "Read Self" },
  { key: "canWrite", label: "Write" },
  { key: "canCreate", label: "Create" },
  { key: "canDelete", label: "Delete" },
  { key: "canSubmit", label: "Submit" },
  { key: "canCancel", label: "Cancel" },
  { key: "canAmend", label: "Amend" },
  { key: "canPrint", label: "Print" },
  { key: "canEmail", label: "Email" },
  { key: "canReport", label: "Report" },
  { key: "canImport", label: "Import" },
  { key: "canExport", label: "Export" },
  { key: "canSetPermissions", label: "Set User Permissions" },
];

// ─── Combobox ────────────────────────────────────────────────────────────────
function Combobox({ label, placeholder, value, options, getLabel, getKey, onSelect, onClear }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (!open) { setActiveIdx(-1); setQ(""); } }, [open]);

  useEffect(() => {
    const fn = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const term = q.toLowerCase();
    return options.filter((o) => getLabel(o).toLowerCase().includes(term));
  }, [q, options, getLabel]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); return; }
    if (!open) { setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); return; }
    if (e.key === "Enter" && activeIdx >= 0 && filtered[activeIdx]) {
      e.preventDefault();
      onSelect(filtered[activeIdx]);
      setOpen(false);
    }
  };

  const displayValue = value ? (typeof value === "object" ? getLabel(value) : value) : "";

  return (
    <div className="relative w-full" ref={wrapRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div
        className={`flex items-center relative border rounded-md bg-white cursor-text transition-all ${
          open ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-300"
        }`}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        <Search className="absolute left-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          className="w-full pl-8 pr-8 py-2 text-sm bg-transparent border-none outline-none text-gray-900 rounded-md"
          placeholder={displayValue || placeholder}
          value={open ? q : ""}
          onChange={(e) => { setQ(e.target.value); setActiveIdx(-1); }}
          onKeyDown={handleKeyDown}
          readOnly={!open}
        />
        {value ? (
          <button onMouseDown={(e) => { e.preventDefault(); onClear(); }} className="absolute right-1.5 p-1 border-none bg-transparent cursor-pointer text-gray-400 flex">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <ChevronDown className="absolute right-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No matching results</div>
            ) : (
              filtered.map((opt, idx) => {
                const lbl = getLabel(opt);
                const isActive = idx === activeIdx;
                const isSelected = displayValue === lbl;
                return (
                  <button
                    key={getKey(opt)}
                    onMouseDown={(e) => { e.preventDefault(); onSelect(opt); setOpen(false); }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`w-full text-left px-3.5 py-2 text-sm border-none cursor-pointer flex items-center justify-between ${
                      isActive ? "bg-gray-100" : isSelected ? "bg-blue-50 text-blue-700 font-medium" : "bg-transparent text-gray-900"
                    }`}
                  >
                    <span>{lbl}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-700" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Permission Checkbox ─────────────────────────────────────────────────────
function PermCheckbox({ label, checked, onChange, disabled }) {
  return (
    <label className={`flex items-center gap-2 py-1.5 select-none text-sm text-gray-700 ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="w-4 h-4 accent-blue-600" />
      {label}
    </label>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function RolePermissionsPage() {
  const perms = usePermission("RolePermission");
  const canEdit = perms.canWrite;

  const [resources, setResources] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [dirtyRoles, setDirtyRoles] = useState({});
  const [editingRoles, setEditingRoles] = useState({});
  const [error, setError] = useState(null);
  const [selResource, setSelResource] = useState("");
  const [selRole, setSelRole] = useState(null);

  const PAGE_SIZE = 5;
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  // ── initial load — uses dynamic available-resources ────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [rRes, rolesRes, permsRes] = await Promise.all([
          apiClient.get("/roles/permissions/available-resources"),
          apiClient.get("/roles", { params: { includeDisabled: false, limit: 200 } }),
          apiClient.get("/roles/permissions", { params: { page: currentPage, limit: PAGE_SIZE } }),
        ]);
        setResources(extractResources(rRes).sort());
        setRoles(extractRoles(rolesRes));
        setPermissions(extractPermissions(permsRes));
        setMeta(extractMeta(permsRes));
        setCurrentPage(extractMeta(permsRes).page || 1);
      } catch (err) {
        console.error("Failed to load", err);
        setError("Failed to load permissions. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── fetch on filter change ────────────────────────────────────────────────
  const fetchPermissions = useCallback(async (resource, role, page = 1) => {
    setLoading(true);
    setError(null);
    setDirtyRoles({});
    setEditingRoles({});
    try {
      const params = { page, limit: PAGE_SIZE };
      if (resource) params.resourceName = resource;
      if (role) params.roleId = role.id;
      const res = await apiClient.get("/roles/permissions", { params });
      setPermissions(extractPermissions(res));
      setMeta(extractMeta(res));
      setCurrentPage(extractMeta(res).page || page);
    } catch (err) {
      console.error("Failed to filter permissions:", err);
      setError("Failed to filter permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onSelectResource = useCallback((name) => {
    setSelResource(name);
    fetchPermissions(name, selRole, 1);
  }, [selRole, fetchPermissions]);

  const onClearResource = useCallback(() => {
    setSelResource("");
    fetchPermissions("", selRole, 1);
  }, [selRole, fetchPermissions]);

  const onSelectRole = useCallback((role) => {
    setSelRole(role);
    fetchPermissions(selResource, role, 1);
  }, [selResource, fetchPermissions]);

  const onClearRole = useCallback(() => {
    setSelRole(null);
    fetchPermissions(selResource, null, 1);
  }, [selResource, fetchPermissions]);

  const clearAll = useCallback(() => {
    setSelResource("");
    setSelRole(null);
    fetchPermissions("", null, 1);
  }, [fetchPermissions]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > meta.totalPages) return;
    fetchPermissions(selResource, selRole, newPage);
  }, [selResource, selRole, meta.totalPages, fetchPermissions]);

  const enterEditMode = useCallback((roleId) => {
    if (!canEdit) return;
    setEditingRoles((prev) => ({ ...prev, [roleId]: true }));
  }, [canEdit]);

  const handleCheckboxChange = useCallback((roleId, resourceName, moduleName, flagKey, currentRow) => {
    if (!canEdit) return;
    const dirtyKey = roleId;
    setDirtyRoles((prev) => {
      const existing = prev[dirtyKey] || {};
      const baseRow = permissions.find((p) => p.roleId === roleId && p.resourceName === resourceName) || currentRow;
      const currentPerms = existing[resourceName] || {
        moduleName: moduleName || baseRow?.moduleName || "hr",
        resourceName,
        permLevel: baseRow?.level ?? 0,
        canRead: baseRow?.canRead ?? false,
        canReadSelf: baseRow?.canReadSelf ?? false,
        canWrite: baseRow?.canWrite ?? false,
        canCreate: baseRow?.canCreate ?? false,
        canDelete: baseRow?.canDelete ?? false,
        canSubmit: baseRow?.canSubmit ?? false,
        canCancel: baseRow?.canCancel ?? false,
        canAmend: baseRow?.canAmend ?? false,
        canPrint: baseRow?.canPrint ?? false,
        canEmail: baseRow?.canEmail ?? false,
        canReport: baseRow?.canReport ?? false,
        canImport: baseRow?.canImport ?? false,
        canExport: baseRow?.canExport ?? false,
        canSetPermissions: baseRow?.canSetPermissions ?? false,
      };
      return {
        ...prev,
        [dirtyKey]: {
          ...existing,
          [resourceName]: { ...currentPerms, [flagKey]: !currentPerms[flagKey] },
        },
      };
    });
  }, [canEdit, permissions]);

  const handleSaveRole = useCallback(async (roleId) => {
    const dirtyKey = roleId;
    const roleChanges = dirtyRoles[dirtyKey];
    if (!roleChanges) return;
    setSaving((prev) => ({ ...prev, [dirtyKey]: true }));
    setError(null);
    const resourceNames = Object.keys(roleChanges);
    try {
      for (const resourceName of resourceNames) {
        const perm = roleChanges[resourceName];
        await apiClient.put(`/roles/${roleId}/permissions`, {
          moduleName: perm.moduleName,
          resourceName: perm.resourceName,
          permLevel: perm.permLevel ?? 0,
          canRead: perm.canRead ?? false,
          canReadSelf: perm.canReadSelf ?? false,
          canWrite: perm.canWrite ?? false,
          canCreate: perm.canCreate ?? false,
          canDelete: perm.canDelete ?? false,
          canSubmit: perm.canSubmit ?? false,
          canCancel: perm.canCancel ?? false,
          canAmend: perm.canAmend ?? false,
          canPrint: perm.canPrint ?? false,
          canEmail: perm.canEmail ?? false,
          canImport: perm.canImport ?? false,
          canExport: perm.canExport ?? false,
          canReport: perm.canReport ?? false,
          canSetPermissions: perm.canSetPermissions ?? false,
        });
      }
      setDirtyRoles((prev) => { const next = { ...prev }; delete next[dirtyKey]; return next; });
      setEditingRoles((prev) => { const next = { ...prev }; delete next[dirtyKey]; return next; });
      fetchPermissions(selResource, selRole, currentPage);
    } catch (err) {
      console.error("Save failed:", err);
      setError("Save failed. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving((prev) => ({ ...prev, [dirtyKey]: false }));
    }
  }, [dirtyRoles, selResource, selRole, currentPage, fetchPermissions]);

  const displayPermissions = useMemo(() =>
    permissions.map((p) => {
      const dirty = dirtyRoles[p.roleId]?.[p.resourceName];
      return dirty ? { ...p, ...dirty, permissionId: p.permissionId, roleId: p.roleId, role: p.role, resourceName: p.resourceName, moduleName: p.moduleName } : p;
    }),
    [permissions, dirtyRoles]
  );

  const displayGrouped = useMemo(() => groupByResourceAndRole(displayPermissions), [displayPermissions]);
  const hasFilters = selResource || selRole;
  const hasUnsavedChanges = (roleId) => !!dirtyRoles[roleId] && Object.keys(dirtyRoles[roleId]).length > 0;
  const isEditing = (roleId) => !!editingRoles[roleId];

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisible = 5;
    const totalPages = meta.totalPages;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push('ellipsis'); pages.push(totalPages); }
      else if (currentPage >= totalPages - 2) { pages.push(1); pages.push('ellipsis'); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
      else { pages.push(1); pages.push('ellipsis'); for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i); pages.push('ellipsis'); pages.push(totalPages); }
    }
    return pages;
  }, [currentPage, meta.totalPages]);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title="Role Permissions" subtitle="Define what each role can do on each resource. Click Edit to modify permissions, then Save." icon={<Shield className="w-5 h-5" />} />

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
          <span className="text-sm font-semibold text-gray-900">Filters</span>
          {hasFilters && <button onClick={clearAll} className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-300 rounded-md px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Clear Filters</button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Combobox label="Resource Name" placeholder="Search resources..." value={selResource} options={resources} getLabel={(r) => r} getKey={(r) => r} onSelect={onSelectResource} onClear={onClearResource} />
          <Combobox label="Role" placeholder="Search roles..." value={selRole} options={roles} getLabel={(r) => r.name} getKey={(r) => r.id} onSelect={onSelectRole} onClear={onClearRole} />
        </div>
        {hasFilters && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {selResource && <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700">Resource: {selResource}<button onClick={onClearResource} className="text-blue-700"><X className="w-3 h-3" /></button></span>}
            {selRole && <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-purple-50 text-purple-700">Role: {selRole.name}<button onClick={onClearRole} className="text-purple-700"><X className="w-3 h-3" /></button></span>}
          </div>
        )}
        {!loading && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <span><strong className="text-gray-900">{permissions.length}</strong> rules</span>
            <span><strong className="text-gray-900">{displayGrouped.size}</strong> resources</span>
            <span><strong className="text-gray-900">{meta.total}</strong> total records</span>
            {!canEdit && <span className="ml-auto flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md text-xs font-medium"><Lock className="w-3 h-3" /> Read-only</span>}
          </div>
        )}
      </div>

      {error && <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"><span>{error}</span><button onClick={() => setError(null)} className="text-xs font-medium text-red-800">Dismiss</button></div>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin" /><span className="text-sm">Loading permissions...</span></div>
        ) : displayPermissions.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-16 text-gray-400"><Shield className="w-10 h-10 opacity-20" /><p className="text-sm font-medium text-gray-500">No permission rules found</p>{hasFilters && <button onClick={clearAll} className="text-xs text-blue-600 hover:underline">Clear filters</button>}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="sticky left-0 z-10 bg-gray-50 px-3.5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[180px] border-r border-gray-200">Resources</th>
                    <th className="px-3.5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap w-40 border-r border-gray-200">Role</th>
                    <th className="px-3.5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(displayGrouped.entries()).map(([resourceName, roleMap], gi) => {
                    const roleEntries = Array.from(roleMap.entries());
                    return roleEntries.map(([roleId, row], ri) => {
                      const isFirst = ri === 0;
                      const bg = gi % 2 === 0 ? "bg-white" : "bg-gray-50/50";
                      const isDirty = hasUnsavedChanges(roleId);
                      const inEditMode = isEditing(roleId);
                      const isSaving = saving[roleId];
                      return (
                        <tr key={`${roleId}-${resourceName}`} className={`border-b border-gray-100 ${bg}`}>
                          {isFirst && (
                            <td rowSpan={roleEntries.length} className={`sticky left-0 z-5 px-3.5 py-3 border-r border-gray-200 align-top ${bg}`}>
                              <div className="text-sm font-medium text-gray-900">{resourceName}</div>
                              {row.moduleName && <div className="text-xs text-gray-400 mt-0.5">{row.moduleName}</div>}
                            </td>
                          )}
                          <td className="px-3.5 py-3 border-r border-gray-200 align-top w-40">
                            <div className="text-sm font-medium text-gray-900">{row.role || "—"}</div>
                            {isDirty && <div className="text-xs text-amber-600 mt-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Unsaved</div>}
                          </td>
                          <td className="px-3.5 py-3 align-top">
                            <div className={`flex flex-wrap gap-x-4 gap-y-0 ${inEditMode || isDirty ? "mb-2.5" : ""}`}>
                              {FLAGS.map((f) => (
                                <PermCheckbox key={f.key} label={f.label} checked={row[f.key] === true}
                                  onChange={() => handleCheckboxChange(roleId, resourceName, row.moduleName, f.key, row)}
                                  disabled={!inEditMode || isSaving} />
                              ))}
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-2">
                                {!inEditMode && !isDirty && (
                                  <button onClick={() => enterEditMode(roleId)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 hover:text-gray-700 transition-colors"><Edit3 className="w-3 h-3" /> Edit</button>
                                )}
                                {(inEditMode || isDirty) && (
                                  <button onClick={() => handleSaveRole(roleId)} disabled={isSaving} className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white rounded-md transition-colors ${isSaving ? "bg-blue-300 cursor-not-allowed" : isDirty ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"}`}>
                                    {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    {isSaving ? "Saving..." : "Save Permissions"}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
            {meta.total > 0 && meta.totalPages > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-gray-600">Showing <span className="font-medium text-gray-900">{((currentPage - 1) * PAGE_SIZE) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * PAGE_SIZE, meta.total)}</span> of <span className="font-medium text-gray-900">{meta.total}</span> results</div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handlePageChange(1)} disabled={currentPage <= 1}><ChevronsLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                  {getPageNumbers().map((page, index) => page === 'ellipsis' ? <span key={`ellipsis-${index}`} className="px-2 text-gray-400">...</span> : <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" className="h-8 w-8 p-0 text-xs" onClick={() => handlePageChange(page)}>{page}</Button>)}
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= meta.totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handlePageChange(meta.totalPages)} disabled={currentPage >= meta.totalPages}><ChevronsRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!loading && displayPermissions.length > 0 && <p className="text-xs text-gray-400">{canEdit ? "Click Edit to modify permissions, then Save to apply changes." : ""}</p>}
    </div>
  );
}