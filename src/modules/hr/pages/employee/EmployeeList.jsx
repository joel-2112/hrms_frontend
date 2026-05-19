import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Users, UserPlus, Search, RefreshCw, ChevronLeft, ChevronRight,
  Eye, Pencil, CheckCircle2, ShieldAlert, ChevronDown, X, Download,
  MoreHorizontal, UserMinus, Briefcase, Building2, Mail, Phone,
  Calendar, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import EmployeeCreate from "./EmployeeCreate";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const SORTABLE_COLUMNS = {
  employee: { field: "firstName", label: "Employee" },
  employeeNumber: { field: "employeeNumber", label: "ID" },
  designation: { field: "designation.name", label: "Designation" },
  department: { field: "department.name", label: "Department" },
  branch: { field: "branch.name", label: "Branch" },
  company: { field: "company.name", label: "Company" },
  grade: { field: "employeeGrade.name", label: "Grade" },
  employmentType: { field: "employmentType.name", label: "Emp. Type" },
  email: { field: "email", label: "Email" },
  phoneNumber: { field: "phoneNumber", label: "Phone" },
  dateOfJoining: { field: "dateOfJoining", label: "Joined" },
  reportsTo: { field: "reportsTo.firstName", label: "Reports To" },
  status: { field: "status", label: "Status" },
};

// ═══════════════════════════════════════════════════════════════
//  STATUS MAP — matches backend: pending, Active, onLeave, Suspended, exited
// ═══════════════════════════════════════════════════════════════
const STATUS_MAP = {
  Active:    { label: "Active",    bg: "bg-emerald-50", color: "text-emerald-700", dot: "bg-emerald-500" },
  pending:   { label: "Pending",   bg: "bg-slate-100",   color: "text-slate-600",   dot: "bg-slate-400" },
  Suspended: { label: "Suspended", bg: "bg-amber-50",  color: "text-amber-700",  dot: "bg-amber-500" },
  onLeave:   { label: "On leave",  bg: "bg-blue-50",    color: "text-blue-700",    dot: "bg-blue-500" },
  exited:    { label: "Exited",    bg: "bg-red-50",     color: "text-red-600",     dot: "bg-red-400" },
};

const AVATAR_PALETTE = [
  "bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700", "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700", "bg-pink-100 text-pink-700",
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const initials = (e) => `${e?.firstName?.[0] ?? ""}${e?.lastName?.[0] ?? ""}`.toUpperCase() || "?";
const avatarColor = (id = "") => AVATAR_PALETTE[id.charCodeAt(0) % AVATAR_PALETTE.length];
const fullName = (e) => [e.firstName, e.middleName, e.lastName].filter(Boolean).join(" ");

const API_BASE = import.meta.env.VITE_API_URL;

function Avatar({ employee, size = "h-9 w-9" }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = employee.image
    ? (employee.image.startsWith("http") ? employee.image : `${API_BASE}/uploads/${employee.image}`)
    : null;
  if (imageUrl && !imgError) {
    return <img src={imageUrl} alt={fullName(employee)} className={`${size} rounded-full object-cover flex-shrink-0`} onError={() => setImgError(true)} />;
  }
  return <div className={`${size} rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${avatarColor(employee.id)}`}>{initials(employee)}</div>;
}

function StatusPill({ status }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color} border-current/10 whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
    </span>
  );
}

function SortableHeader({ column, label, currentSort, onSort, align = "left", sticky = false }) {
  const sortKey = SORTABLE_COLUMNS[column]?.field || column;
  const isSorted = currentSort.sortBy === sortKey;
  const sortDirection = isSorted ? currentSort.sortOrder : null;
  return (
    <th className={`text-${align} px-2 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 select-none ${sticky ? "sticky left-0 z-20" : ""}`}
      onClick={() => { let newOrder = "ASC"; if (isSorted && currentSort.sortOrder === "ASC") newOrder = "DESC"; onSort(sortKey, newOrder); }}>
      <div className={`flex items-center gap-1.5 ${align === "right" ? "justify-end" : ""}`}>
        <span>{label}</span>
        {isSorted && sortDirection === "ASC" ? <ArrowUp className="w-3 h-3 text-blue-600" /> :
         isSorted && sortDirection === "DESC" ? <ArrowDown className="w-3 h-3 text-blue-600" /> :
         <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />}
      </div>
    </th>
  );
}

function ActionMenu({ employee, canWrite, canSubmit, onRefresh, navigate }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [ready, setReady] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const s = employee.status;

  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (buttonRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return; setOpen(false); };
    const timer = setTimeout(() => document.addEventListener("mousedown", fn), 0);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", fn); };
  }, [open]);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 208;
      const spaceBelow = window.innerHeight - rect.bottom;
      let top, left;
      left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);
      left = Math.max(8, left);
      top = spaceBelow < 280 ? rect.top - 4 : rect.bottom + 4;
      setDropdownPos({ top, left }); setReady(true);
    } else setReady(false);
  }, [open]);

  useEffect(() => { if (!open) return; const fn = () => setOpen(false); window.addEventListener("scroll", fn, true); return () => window.removeEventListener("scroll", fn, true); }, [open]);
  useEffect(() => { if (!open) return; const fn = (e) => { if (e.key === "Escape") setOpen(false); }; document.addEventListener("keydown", fn); return () => document.removeEventListener("keydown", fn); }, [open]);

  const act = async (label, fn) => { setBusy(label); setOpen(false); try { await fn(); onRefresh(); } catch (err) { toast.error(err?.response?.data?.message ?? "Action failed"); } finally { setBusy(null); } };
  const doStatus = (status, reason) => act(status, () => apiClient.patch(`/employees/${employee.id}/status`, { status, ...(reason ? { reason } : {}) }));
  const doApprove = () => act("approve", async () => { const r = await apiClient.post(`/employees/${employee.id}/approve`); const pw = r?.data?.data?.temporaryPassword; toast.success(pw ? `Approved — temporary password: ${pw}` : "Employee approved", { duration: 10000 }); });

  const actions = [];
  actions.push({ key: "view", label: "View profile", icon: Eye, color: "text-gray-700 hover:bg-gray-50", onClick: () => navigate(`/hr/employees/${employee.id}`) });
  if (canWrite && s !== "exited") actions.push({ key: "edit", label: "Edit details", icon: Pencil, color: "text-gray-700 hover:bg-gray-50", onClick: () => navigate(`/hr/employees/${employee.id}/edit`) });
  if (canSubmit && s !== "exited") actions.push({ key: "div1", divider: true });

  // ═══════════════════════════════════════════════════════════
  //  APPROVE — only for "pending" status
  // ═══════════════════════════════════════════════════════════
  if (canSubmit && s === "pending") {
    actions.push({ key: "approve", label: busy === "approve" ? "Approving…" : "Approve & activate", icon: CheckCircle2, color: "text-emerald-700 hover:bg-emerald-50", onClick: doApprove });
  }
  if (canSubmit && s === "Active") {
    actions.push({ key: "leave", label: "Mark on leave", icon: RefreshCw, color: "text-blue-700 hover:bg-blue-50", onClick: () => doStatus("onLeave") });
    actions.push({ key: "suspend", label: "Suspend", icon: ShieldAlert, color: "text-amber-700 hover:bg-amber-50", onClick: () => doStatus("Suspended", "Manual suspension") });
  }
  if (canSubmit && (s === "Suspended" || s === "onLeave")) {
    actions.push({ key: "reactivate", label: "Reactivate", icon: CheckCircle2, color: "text-emerald-700 hover:bg-emerald-50", onClick: () => doStatus("Active") });
  }
  if (canSubmit && s === "Active") {
    actions.push({ key: "div2", divider: true });
    actions.push({ key: "separate", label: "Initiate separation", icon: UserMinus, color: "text-red-600 hover:bg-red-50", onClick: () => navigate(`/hr/employees/${employee.id}?tab=separation`) });
  }

  return (
    <>
      <button ref={buttonRef} onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((p) => !p); }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
        {busy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <MoreHorizontal className="w-3.5 h-3.5" />} Actions
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div ref={menuRef} style={{ position: "fixed", top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px`, zIndex: 99999, opacity: ready ? 1 : 0, transition: "opacity 0.1s ease-out", pointerEvents: ready ? "auto" : "none" }}
          className="w-52 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {actions.map((action) => {
            if (action.divider) return <div key={action.key} className="h-px bg-gray-100 my-1" />;
            const Icon = action.icon;
            return <button key={action.key} onClick={(e) => { e.stopPropagation(); action.onClick(); }} className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm ${action.color} transition-colors`}><Icon className="w-3.5 h-3.5 flex-shrink-0" />{action.label}</button>;
          })}
        </div>
      )}
    </>
  );
}

function StatusTabs({ value, onChange, counts }) {
  const tabs = [
    { v: "", l: "All", count: counts?.total ?? null },
    { v: "Active", l: "Active", count: counts?.Active ?? null },
    { v: "pending", l: "Pending", count: counts?.pending ?? null },
    { v: "onLeave", l: "On leave", count: counts?.onLeave ?? null },
    { v: "Suspended", l: "Suspended", count: counts?.Suspended ?? null },
    { v: "exited", l: "Exited", count: counts?.exited ?? null },
  ];
  return (
    <div className="flex gap-1 flex-wrap">
      {tabs.map((t) => (
        <button key={t.v} onClick={() => onChange(t.v)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${value === t.v ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>
          {t.l}{t.count !== null && <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${value === t.v ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 outline-none focus:border-blue-400 cursor-pointer">
        <option value="">{placeholder}</option>
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
    </div>
  );
}

function Pagination({ page, total, limit, onPage, onLimitChange }) {
  const totalPages = Math.ceil(total / limit);
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pages = [];
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">Showing <span className="font-semibold text-gray-700">{from}–{to}</span> of <span className="font-semibold text-gray-700">{total.toLocaleString()}</span></span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Per page:</span>
          <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))} className="appearance-none pl-2 pr-6 py-1 text-xs border border-gray-200 rounded-md bg-white text-gray-600 outline-none cursor-pointer hover:border-gray-300">
            {PAGE_SIZE_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onPage(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30" title="First page"><ChevronsLeft className="w-3.5 h-3.5" /></button>
        <button disabled={page === 1} onClick={() => onPage(page - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
        {start > 1 && <><button onClick={() => onPage(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs">1</button>{start > 2 && <span className="text-gray-300 text-xs px-1">…</span>}</>}
        {pages.map((p) => (
          <button key={p} onClick={() => onPage(p)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${p === page ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p}</button>
        ))}
        {end < totalPages && <>{end < totalPages - 1 && <span className="text-gray-300 text-xs px-1">…</span>}<button onClick={() => onPage(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs">{totalPages}</button></>}
        <button disabled={page === totalPages} onClick={() => onPage(page + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
        <button disabled={page === totalPages} onClick={() => onPage(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30" title="Last page"><ChevronsRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function StatBar({ employees }) {
  const counts = employees.reduce((acc, e) => { acc[e.status] = (acc[e.status] ?? 0) + 1; return acc; }, {});
  const stats = Object.entries(STATUS_MAP).filter(([k]) => counts[k]).map(([k, cfg]) => ({ label: cfg.label, count: counts[k], bg: cfg.bg, color: cfg.color }));
  if (!stats.length) return null;
  return <div className="flex gap-2 flex-wrap">{stats.map((s) => (<div key={s.label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.color}`}><span className="font-semibold">{s.count}</span> {s.label}</div>))}</div>;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function EmployeeList() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { canWrite, canCreate, canSubmit, canExport } = usePermission("Employee");

  const [search, setSearch] = useState(params.get("search") || "");
  const [statusF, setStatusF] = useState(params.get("status") || "");
  const [deptF, setDeptF] = useState(params.get("department") || "");
  const [branchF, setBranchF] = useState(params.get("branch") || "");
  const [desigF, setDesigF] = useState(params.get("designation") || "");
  const [gradeF, setGradeF] = useState(params.get("grade") || "");
  const [page, setPage] = useState(Number(params.get("page")) || 1);
  const [limit, setLimit] = useState(Number(params.get("limit")) || 10);
  const [sortBy, setSortBy] = useState(params.get("sortBy") || "firstName");
  const [sortOrder, setSortOrder] = useState(params.get("sortOrder") || "ASC");

  const [employees, setEmployees] = useState([]);
  const [meta, setMeta] = useState(null);
  const [statusCounts, setStatusCounts] = useState({});
  const [filterOpts, setFilterOpts] = useState({ departments: [], branches: [], designations: [], grades: [] });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const searchTimer = useRef(null);

  const handleSearch = (v) => { setSearch(v); clearTimeout(searchTimer.current); searchTimer.current = setTimeout(() => setPage(1), 350); };
  const handleSort = (field, order) => { setSortBy(field); setSortOrder(order); setPage(1); };

  const fetchFilterOpts = useCallback(async () => {
    try { const r = await apiClient.get("/employees/filter-options"); const d = r?.data?.data?.data ?? r?.data?.data ?? {}; setFilterOpts({ departments: d.departments ?? [], branches: d.branches ?? [], designations: d.designations ?? [], grades: d.grades ?? [] }); } catch {}
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const qp = new URLSearchParams({ page, limit });
      if (search.trim().length >= 2) qp.set("search", search.trim());
      if (statusF) qp.set("status", statusF);
      if (deptF) qp.set("departmentId", deptF);
      if (branchF) qp.set("branchId", branchF);
      if (desigF) qp.set("designationId", desigF);
      if (gradeF) qp.set("employeeGradeId", gradeF);
      if (sortBy) qp.set("sortBy", sortBy);
      if (sortOrder) qp.set("sortOrder", sortOrder);
      const r = await apiClient.get(`/employees?${qp}`);
      const d = r?.data?.data?.data ?? r?.data?.data ?? r?.data ?? [];
      setEmployees(Array.isArray(d) ? d : []);
      setMeta(r?.data?.meta ?? r?.data?.data?.meta ?? null);
      setStatusCounts(r?.data?.data?.statusCounts ?? r?.data?.statusCounts ?? {});
    } catch { toast.error("Failed to load employees."); setEmployees([]); }
    finally { setLoading(false); }
  }, [page, limit, search, statusF, deptF, branchF, desigF, gradeF, sortBy, sortOrder]);

  useEffect(() => { fetchFilterOpts(); }, [fetchFilterOpts]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    if (statusF) next.set("status", statusF);
    if (deptF) next.set("department", deptF);
    if (branchF) next.set("branch", branchF);
    if (desigF) next.set("designation", desigF);
    if (gradeF) next.set("grade", gradeF);
    if (page > 1) next.set("page", page);
    if (limit !== 10) next.set("limit", limit);
    if (sortBy && sortBy !== "firstName") next.set("sortBy", sortBy);
    if (sortOrder && sortOrder !== "ASC") next.set("sortOrder", sortOrder);
    setParams(next);
  }, [search, statusF, deptF, branchF, desigF, gradeF, page, limit, sortBy, sortOrder]);

  const clearFilters = () => { setSearch(""); setStatusF(""); setDeptF(""); setBranchF(""); setDesigF(""); setGradeF(""); setPage(1); };
  const handleLimitChange = (newLimit) => { setLimit(newLimit); setPage(1); };
  const hasFilters = search || statusF || deptF || branchF || desigF || gradeF;

  if (showCreate) return <EmployeeCreate onCancel={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetchEmployees(); }} />;

  return (
    <div className="flex flex-col gap-2 pb-10">
      <PageHeader title="Employees" subtitle={meta ? `${meta.total.toLocaleString()} total${hasFilters ? " · filtered view" : ""}` : "Employee directory"} icon={<Users className="w-5 h-5" />}
        actions={<div className="flex items-center gap-2">
          {canExport && <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"><Download className="w-4 h-4" /> Export</button>}
          {canCreate && <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"><UserPlus className="w-4 h-4" /> Add employee</button>}
        </div>} />

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input placeholder="Search name, ID, email…" value={search} onChange={(e) => handleSearch(e.target.value)} className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400" />
            {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {filterOpts.departments.length > 0 && <FilterSelect value={deptF} onChange={(v) => { setDeptF(v); setPage(1); }} options={filterOpts.departments.map(d => ({ value: d.id, label: d.name }))} placeholder="Department" />}
            {filterOpts.branches.length > 0 && <FilterSelect value={branchF} onChange={(v) => { setBranchF(v); setPage(1); }} options={filterOpts.branches.map(b => ({ value: b.id, label: b.name }))} placeholder="Branch" />}
            {filterOpts.designations.length > 0 && <FilterSelect value={desigF} onChange={(v) => { setDesigF(v); setPage(1); }} options={filterOpts.designations.map(d => ({ value: d.id, label: d.name }))} placeholder="Designation" />}
            {filterOpts.grades.length > 0 && <FilterSelect value={gradeF} onChange={(v) => { setGradeF(v); setPage(1); }} options={filterOpts.grades.map(g => ({ value: g.id, label: g.name }))} placeholder="Grade" />}
          </div>
          {hasFilters && <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100"><X className="w-3 h-3" /> Clear all</button>}
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <StatusTabs value={statusF} onChange={(v) => { setStatusF(v); setPage(1); }} counts={statusCounts} />
          {!loading && employees.length > 0 && <StatBar employees={employees} />}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-300"><RefreshCw className="w-5 h-5 animate-spin" /><span className="text-sm text-gray-400">Loading employees…</span></div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400"><Users className="w-10 h-10 opacity-20" /><p className="text-sm font-medium text-gray-500">{hasFilters ? "No employees match your filters." : "No employees found."}</p>{hasFilters && <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">Clear all filters</button>}</div>
        ) : (
          <>
            <div className="overflow-auto" style={{ maxHeight: `calc(100vh - 380px)`, minHeight: limit <= 10 ? "auto" : `${Math.min(limit * 52 + 40, 600)}px` }}>
              <div className="overflow-x-auto">
                <table className="min-w-[1400px] w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
                      <SortableHeader column="employee" label="Employee" currentSort={{ sortBy, sortOrder }} onSort={handleSort} sticky />
                      <SortableHeader column="employeeNumber" label="ID" currentSort={{ sortBy, sortOrder }} onSort={handleSort} />
                      <SortableHeader column="designation" label="Designation" currentSort={{ sortBy, sortOrder }} onSort={handleSort} />
                      <SortableHeader column="department" label="Department" currentSort={{ sortBy, sortOrder }} onSort={handleSort} />
                      <SortableHeader column="branch" label="Branch" currentSort={{ sortBy, sortOrder }} onSort={handleSort} />
                      <SortableHeader column="company" label="Company" currentSort={{ sortBy, sortOrder }} onSort={handleSort} />
                      <SortableHeader column="grade" label="Grade" currentSort={{ sortBy, sortOrder }} onSort={handleSort} />
                      <SortableHeader column="employmentType" label="Emp. Type" currentSort={{ sortBy, sortOrder }} onSort={handleSort} />
                      <SortableHeader column="email" label="Email" currentSort={{ sortBy, sortOrder }} onSort={handleSort} />
                      <SortableHeader column="phoneNumber" label="Phone" currentSort={{ sortBy, sortOrder }} onSort={handleSort} />
                      <SortableHeader column="dateOfJoining" label="Joined" currentSort={{ sortBy, sortOrder }} onSort={handleSort} />
                      <SortableHeader column="reportsTo" label="Reports To" currentSort={{ sortBy, sortOrder }} onSort={handleSort} />
                      <SortableHeader column="status" label="Status" currentSort={{ sortBy, sortOrder }} onSort={handleSort} />
                      <th className="text-right px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.map((emp) => (
                      <tr key={emp.id} onClick={() => navigate(`/hr/employees/${emp.id}`)} className="hover:bg-blue-50/30 cursor-pointer transition-colors">
                        <td className="px-4 py-3 sticky left-0 bg-white z-10"><div className="flex items-center gap-3"><Avatar employee={emp} /><div className="min-w-0"><div className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">{fullName(emp)}</div></div></div></td>
                        <td className="px-3 py-3"><span className="text-xs font-mono text-gray-400 whitespace-nowrap">{emp.employeeNumber}</span></td>
                        <td className="px-3 py-3"><span className="text-sm text-gray-600 truncate max-w-[150px] block">{emp.designation?.name ?? <span className="text-gray-300">—</span>}</span></td>
                        <td className="px-3 py-3"><div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" /><span className="text-sm text-gray-600 truncate max-w-[130px]">{emp.department?.name ?? <span className="text-gray-300">—</span>}</span></div></td>
                        <td className="px-3 py-3"><div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" /><span className="text-sm text-gray-600 truncate max-w-[110px]">{emp.branch?.name ?? <span className="text-gray-300">—</span>}</span></div></td>
                        <td className="px-3 py-3"><span className="text-xs text-gray-500 truncate max-w-[120px] block">{emp.company?.code || emp.company?.name || <span className="text-gray-300">—</span>}</span></td>
                        <td className="px-3 py-3">{emp.employeeGrade?.name ? <span className="inline-block px-2 py-0.5 bg-violet-50 text-violet-700 text-[11px] font-medium rounded-full border border-violet-100 whitespace-nowrap">{emp.employeeGrade.name}</span> : <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-3"><span className="text-xs text-gray-500 whitespace-nowrap">{emp.employmentType?.name || <span className="text-gray-300">—</span>}</span></td>
                        <td className="px-3 py-3">{emp.email ? <a href={`mailto:${emp.email}`} onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 hover:underline truncate max-w-[180px] block"><Mail className="w-3 h-3 inline mr-1" />{emp.email}</a> : <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-3">{emp.phoneNumber ? <span className="text-xs text-gray-500 whitespace-nowrap"><Phone className="w-3 h-3 inline mr-1 text-gray-300" />{emp.phoneNumber}</span> : <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-3"><span className="text-xs text-gray-500 whitespace-nowrap"><Calendar className="w-3 h-3 inline mr-1 text-gray-300" />{fmtDate(emp.dateOfJoining)}</span></td>
                        <td className="px-3 py-3"><span className="text-xs text-gray-500 truncate max-w-[140px] block">{emp.reportsTo ? fullName(emp.reportsTo) : <span className="text-gray-300">—</span>}</span></td>
                        <td className="px-3 py-3"><StatusPill status={emp.status} /></td>
                        <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}><ActionMenu employee={emp} canWrite={canWrite} canSubmit={canSubmit} onRefresh={fetchEmployees} navigate={navigate} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {!loading && meta && <Pagination page={page} total={meta.total} limit={limit} onPage={setPage} onLimitChange={handleLimitChange} />}
      </div>

      {!loading && employees.length > 0 && (
        <p className="text-xs text-gray-400 pl-1">Click any row to view the full employee profile. · {meta?.totalPages ? `Page ${page} of ${meta.totalPages}` : ""}</p>
      )}
    </div>
  );
}