import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Search,
  Shield,
  RefreshCw,
  X,
  ChevronDown,
  Check,
  Plus,
  Trash2,
  User,
  Info,
  Users,
} from "lucide-react";
import { usePermission } from "../../../../hooks/usePermission";

// ─── Extractors ──────────────────────────────────────────────────────────────

const extractArray = (r) => {
  const arr = r?.data?.data;
  return Array.isArray(arr) ? arr : [];
};

const extractPaginated = (r) => {
  const data = r?.data;
  return {
    items: Array.isArray(data?.data) ? data.data : [],
    meta: data?.meta || {},
  };
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DOC_TYPES = [
  {
    value: "Company",
    label: "Company",
    endpoint: "/organizations/companies",
    responseKey: "companies",
    getLabel: (item) => item.name,
    getValue: (item) => item.id,
  },
  {
    value: "Branch",
    label: "Branch",
    endpoint: "/organizations/branches",
    responseKey: "branches",
    getLabel: (item) => item.name,
    getValue: (item) => item.id,
  },
  {
    value: "Department",
    label: "Department",
    endpoint: "/organizations/departments",
    responseKey: "departments",
    getLabel: (item) => item.name,
    getValue: (item) => item.id,
  },
  {
    value: "Designation",
    label: "Designation",
    endpoint: "/organizations/designations",
    responseKey: "designations",
    getLabel: (item) => item.name,
    getValue: (item) => item.id,
  },
  {
    value: "Employee",
    label: "Employee",
    endpoint: "/employees",
    responseKey: null,
    getLabel: (item) => {
      const name = [item.firstName, item.lastName].filter(Boolean).join(" ");
      return name || item.employeeNumber || item.email || item.id;
    },
    getValue: (item) => item.id,
  },
];

// ─── Debounce hook ───────────────────────────────────────────────────────────

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Name resolver — fetches the display name for a DocType + UUID pair ──────

function useNameResolver() {
  const cache = useRef(new Map());

  const resolveName = useCallback(async (docType, uuid) => {
    if (!uuid || !docType) return uuid?.substring(0, 8) + "..." || "—";

    const cacheKey = `${docType}:${uuid}`;
    if (cache.current.has(cacheKey)) return cache.current.get(cacheKey);

    const config = DOC_TYPES.find((d) => d.value === docType);
    if (!config) return uuid.substring(0, 8) + "...";

    try {
      const res = await apiClient.get(
        `${config.endpoint}?limit=1&search=${uuid}`,
      );
      const raw = res?.data?.data;
      let items = [];
      if (config.responseKey) {
        items = raw?.[config.responseKey] || [];
      } else if (Array.isArray(raw)) {
        items = raw;
      }
      const found = items.find((item) => config.getValue(item) === uuid);
      const name = found
        ? config.getLabel(found)
        : uuid.substring(0, 8) + "...";
      cache.current.set(cacheKey, name);
      return name;
    } catch {
      return uuid.substring(0, 8) + "...";
    }
  }, []);

  return resolveName;
}

// ─── User Combobox ───────────────────────────────────────────────────────────

function UserCombobox({
  label,
  placeholder,
  value,
  options,
  getLabel,
  getKey,
  onSelect,
  onClear,
  disabled,
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setActiveIdx(-1);
      setQ("");
    }
  }, [open]);

  useEffect(() => {
    const fn = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const term = q.toLowerCase();
    return options.filter((o) => getLabel(o).toLowerCase().includes(term));
  }, [q, options, getLabel]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && activeIdx >= 0 && filtered[activeIdx]) {
      e.preventDefault();
      onSelect(filtered[activeIdx]);
      setOpen(false);
    }
  };

  const displayValue = value
    ? typeof value === "object"
      ? getLabel(value)
      : value
    : "";

  return (
    <div className="relative w-full" ref={wrapRef}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {label}
        </label>
      )}
      <div
        className={`flex items-center relative border rounded-md bg-white cursor-text transition-colors ${
          open ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-300"
        } ${disabled ? "bg-gray-50 opacity-60 cursor-not-allowed" : ""}`}
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          className="w-full pl-8 pr-8 py-2 text-sm bg-transparent border-none outline-none text-gray-900 rounded-md"
          placeholder={displayValue || placeholder}
          value={open ? q : ""}
          onChange={(e) => {
            setQ(e.target.value);
            setActiveIdx(-1);
          }}
          onKeyDown={handleKeyDown}
          readOnly={!open}
          disabled={disabled}
        />
        {value ? (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onClear();
            }}
            className="absolute right-1.5 p-1 border-none bg-transparent cursor-pointer text-gray-400 flex"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        )}
      </div>
      {open && (
        <div className="absolute z-[100] top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                No results
              </div>
            ) : (
              filtered.map((opt, idx) => {
                const lbl = getLabel(opt);
                const isActive = idx === activeIdx;
                const isSelected = displayValue === lbl;
                return (
                  <button
                    key={getKey(opt)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(opt);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`w-full text-left px-3.5 py-2 text-sm border-none cursor-pointer flex items-center justify-between ${
                      isActive
                        ? "bg-gray-100"
                        : isSelected
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "bg-transparent text-gray-900"
                    }`}
                  >
                    <span>{lbl}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-700" />
                    )}
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

// ─── Value Combobox ──────────────────────────────────────────────────────────

function ValueCombobox({ docTypeConfig, value, onSelect, onClear, disabled }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [options, setOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedQ = useDebounce(q, 300);

  useEffect(() => {
    if (!docTypeConfig) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingOptions(true);
      try {
        const params = { limit: 50 };
        if (debouncedQ) params.search = debouncedQ;
        const res = await apiClient.get(docTypeConfig.endpoint, { params });
        const raw = res?.data?.data;
        let data = [];
        if (docTypeConfig.responseKey) {
          data = raw?.[docTypeConfig.responseKey] || [];
        } else if (Array.isArray(raw)) {
          data = raw;
        } else if (raw?.data && Array.isArray(raw.data)) {
          data = raw.data;
        }
        if (!cancelled) setOptions(data);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [docTypeConfig, debouncedQ]);

  useEffect(() => {
    if (!open) {
      setActiveIdx(-1);
    }
  }, [open]);

  useEffect(() => {
    const fn = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const term = q.toLowerCase();
    return options.filter((o) =>
      docTypeConfig?.getLabel(o).toLowerCase().includes(term),
    );
  }, [q, options, docTypeConfig]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && activeIdx >= 0 && filtered[activeIdx]) {
      e.preventDefault();
      onSelect(filtered[activeIdx]);
      setOpen(false);
    }
  };

  const displayValue = value ? docTypeConfig?.getLabel(value) : "";
  const placeholder = docTypeConfig
    ? `Search ${docTypeConfig.label.toLowerCase()}s...`
    : "Select resource...";

  return (
    <div className="relative w-full" ref={wrapRef}>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        Value
      </label>
      <div
        className={`flex items-center relative border rounded-md bg-white cursor-text transition-colors ${
          open ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-300"
        } ${disabled ? "bg-gray-50 opacity-60 cursor-not-allowed" : ""}`}
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          className="w-full pl-8 pr-8 py-2 text-sm bg-transparent border-none outline-none text-gray-900 rounded-md"
          placeholder={displayValue || placeholder}
          value={open ? q : ""}
          onChange={(e) => {
            setQ(e.target.value);
            setActiveIdx(-1);
          }}
          onKeyDown={handleKeyDown}
          readOnly={!open}
          disabled={disabled}
        />
        {loadingOptions && (
          <RefreshCw className="absolute right-7 w-3.5 h-3.5 text-gray-400 animate-spin" />
        )}
        {value ? (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onClear();
            }}
            className="absolute right-1.5 p-1 border-none bg-transparent cursor-pointer text-gray-400 flex"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        )}
      </div>
      {open && (
        <div className="absolute z-[100] top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                {loadingOptions ? "Loading..." : "No results"}
              </div>
            ) : (
              filtered.map((opt, idx) => {
                const lbl = docTypeConfig?.getLabel(opt);
                const isActive = idx === activeIdx;
                const isSelected = displayValue === lbl;
                return (
                  <button
                    key={docTypeConfig?.getValue(opt)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(opt);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`w-full text-left px-3.5 py-2 text-sm border-none cursor-pointer flex items-center justify-between ${
                      isActive
                        ? "bg-gray-100"
                        : isSelected
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "bg-transparent text-gray-900"
                    }`}
                  >
                    <span>{lbl}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-700" />
                    )}
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

// ═════════════════════════════════════════════════════════════════════════════

export default function UserPermissionsPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const { canCreate, canWrite, canDelete, canEdit } =
    usePermission("UserPermission");

  // All permissions (shown by default)
  const [allPermissions, setAllPermissions] = useState([]);
  const [allLoading, setAllLoading] = useState(true);

  // Filtered permissions (when user selected)
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvedNames, setResolvedNames] = useState({});

  // Add form
  const [newDocType, setNewDocType] = useState("");
  const [newValue, setNewValue] = useState(null);
  const [newApplyAll, setNewApplyAll] = useState(true);
  const [adding, setAdding] = useState(false);

  const [error, setError] = useState(null);
  const selectedDocTypeConfig = DOC_TYPES.find((dt) => dt.value === newDocType);
  const resolveName = useNameResolver();

  // ── Load users + all permissions on mount ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [usersRes, permsRes] = await Promise.all([
          apiClient.get("/roles/users/with-roles", { params: { limit: 200 } }),
          apiClient.get("/roles/users/with-permissions", {
            params: { limit: 200 },
          }),
        ]);
        setUsers(extractArray(usersRes));
        const allPerms = extractArray(permsRes);
        setAllPermissions(allPerms);
        setPermissions(allPerms); // default view = all
        setAllLoading(false);
      } catch {
        setAllLoading(false);
        setError("Failed to load data.");
      }
    })();
  }, []);

  // ── Resolve display names for all permissions ──────────────────────────────
  useEffect(() => {
    if (permissions.length === 0) return;
    let cancelled = false;
    (async () => {
      const names = {};
      for (const p of permissions) {
        const name = await resolveName(p.allowDocType, p.allowValue);
        names[`${p.id}`] = name;
      }
      if (!cancelled) setResolvedNames((prev) => ({ ...prev, ...names }));
    })();
    return () => {
      cancelled = true;
    };
  }, [permissions, resolveName]);

  // ── Filter by user ────────────────────────────────────────────────────────
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    if (user) {
      const filtered = allPermissions.filter((p) => p.userId === user.id);
      setPermissions(filtered);
    } else {
      setPermissions(allPermissions);
    }
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setPermissions(allPermissions);
  };

  // ── Add permission ────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newDocType || !newValue || !selectedUser) return;
    setAdding(true);
    setError(null);
    try {
      await apiClient.post(`/roles/users/${selectedUser.id}/permissions`, {
        allowDocType: newDocType,
        allowValue: selectedDocTypeConfig.getValue(newValue),
        applyToAllDocTypes: newApplyAll,
      });
      // Refresh all data
      const [usersRes, permsRes] = await Promise.all([
        apiClient.get("/roles/users/with-roles", { params: { limit: 200 } }),
        apiClient.get("/roles/users/with-permissions", {
          params: { limit: 200 },
        }),
      ]);
      setUsers(extractArray(usersRes));
      const allPerms = extractArray(permsRes);
      setAllPermissions(allPerms);
      setPermissions(
        selectedUser
          ? allPerms.filter((p) => p.userId === selectedUser.id)
          : allPerms,
      );
      setNewDocType("");
      setNewValue(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add permission.");
    } finally {
      setAdding(false);
    }
  };

  // ── Delete permission ─────────────────────────────────────────────────────
  const handleDelete = async (permissionId, userId) => {
    try {
      await apiClient.delete(
        `/roles/users/${userId}/permissions/${permissionId}`,
      );
      const permsRes = await apiClient.get("/roles/users/with-permissions", {
        params: { limit: 200 },
      });
      const allPerms = extractArray(permsRes);
      setAllPermissions(allPerms);
      setPermissions(
        selectedUser
          ? allPerms.filter((p) => p.userId === selectedUser.id)
          : allPerms,
      );
    } catch {
      setError("Failed to delete permission.");
    }
  };

  const displayPermissions = selectedUser ? permissions : allPermissions;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title="User Permissions"
        subtitle="Restrict which records a user can see by scoping them to a Company, Branch, Department, Designation, or Employee."
        icon={<User className="w-5 h-5" />}
      />

      {/* Info banner */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>How record-level permissions work:</strong> After adding a
          restriction, this user will ONLY see records matching the selected
          scope.
        </div>
      </div>

      {/* Filter by user + Add form */}
      {canCreate && (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <UserCombobox
          label="Filter by User (optional)"
          placeholder="Search users by name or email..."
          value={selectedUser}
          options={users}
          getLabel={(u) => {
            const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
            return name ? `${name} (${u.email})` : u.email;
          }}
          getKey={(u) => u.id}
          onSelect={handleSelectUser}
          onClear={handleClearUser}
        />
      </div>
      )}

      {/* Add form — only when user selected */}
      {selectedUser && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Add Record Restriction
          </h3>
          <p className="text-xs text-gray-500 mb-3.5">
            For:{" "}
            <strong>
              {[selectedUser.firstName, selectedUser.lastName]
                .filter(Boolean)
                .join(" ") || selectedUser.email}
            </strong>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2.5 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Restrict By
              </label>
              <select
                value={newDocType}
                onChange={(e) => {
                  setNewDocType(e.target.value);
                  setNewValue(null);
                }}
                className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option value="">Select Resource...</option>
                {DOC_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            <ValueCombobox
              docTypeConfig={selectedDocTypeConfig}
              value={newValue}
              onSelect={setNewValue}
              onClear={() => setNewValue(null)}
              disabled={!newDocType}
            />

            <button
              onClick={handleAdd}
              disabled={!newDocType || !newValue || adding}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-md whitespace-nowrap transition-colors ${
                !newDocType || !newValue || adding
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {adding ? "Adding..." : "Add Restriction"}
            </button>
          </div>

          <label className="flex items-center gap-2 mt-3 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={newApplyAll}
              onChange={(e) => setNewApplyAll(e.target.checked)}
              className="w-3.5 h-3.5 accent-blue-600"
            />
            Apply to <strong>ALL</strong> resources
          </label>
        </div>
      )}

      {/* Permissions table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            {selectedUser ? "User Restrictions" : "All User Permissions"}
          </h3>
          <span className="text-xs text-gray-500">
            {displayPermissions.length} restriction(s)
          </span>
        </div>

        {allLoading ? (
          <div className="flex flex-col items-center gap-2.5 py-12 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : displayPermissions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-gray-400 text-sm">
            <Users className="w-8 h-8 opacity-20" />
            <p>
              {selectedUser
                ? "No restrictions for this user."
                : "No user permissions defined yet."}
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-3.5 py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  All Resources
                </th>
                <th className="px-3.5 py-2.5 w-[60px]" />
              </tr>
            </thead>
            <tbody>
              {displayPermissions.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-3.5 py-2.5 text-sm text-gray-900">
                    {p.user?.firstName ||
                      p.user?.email ||
                      p.userId?.substring(0, 8) + "..."}
                  </td>
                  <td className="px-3.5 py-2.5 text-sm font-medium text-gray-900">
                    {p.allowDocType}
                  </td>
                  <td className="px-3.5 py-2.5 text-sm text-gray-700">
                    {resolvedNames[p.id] || "Loading..."}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    {p.applyToAllDocTypes ? (
                      <Check className="w-4 h-4 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(p.id, p.userId)}
                        className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors"
                        title="Remove restriction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Error toast */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="px-2 py-0.5 border-none bg-transparent cursor-pointer text-red-800 font-medium text-xs"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
