import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Search, ChevronDown, X, Check, Clock, User, Calendar, FileText,
  AlertCircle, RefreshCw, Plus, ChevronRight, Filter, Loader2,
  Send, CheckCircle2, XCircle, FileEdit,
} from "lucide-react";
import { toast } from "sonner";
import LeaveRequest from "./LeaveRequest";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  Pending:  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  Approved: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  Rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  Cancelled:{ bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", dot: "bg-gray-400" },
  Draft:    { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
  Open:     { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
};

const AVATAR_PALETTE = [
  "bg-blue-100 text-blue-700","bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700","bg-rose-100 text-rose-700","bg-cyan-100 text-cyan-700",
];

const LEAVE_TYPE_STYLES = {
  Annual: "bg-purple-50 text-purple-700", Sick: "bg-teal-50 text-teal-700",
  Maternity: "bg-orange-50 text-orange-800", Compensatory: "bg-blue-50 text-blue-700",
  Unpaid: "bg-gray-100 text-gray-600", Paternity: "bg-green-50 text-green-700",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const initials = (firstName, middleName, lastName) => {
  return `${firstName?.[0] || ""}${middleName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "??";
};
const avatarColor = (id = "") => AVATAR_PALETTE[(id?.charCodeAt(0) || 0) % AVATAR_PALETTE.length];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "—";
const fmtShortDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const extractData = (res) => res?.data?.data?.data || res?.data?.data || res?.data || {};
const extractArray = (res) => {
  const d = res?.data?.data?.data || res?.data?.data || res?.data || [];
  return Array.isArray(d) ? d : [];
};

// ─── Helper to get employee display info from application ────────────────────
const getEmployeeDisplay = (app) => {
  // Try multiple possible response structures
  const emp = app.applicant || app.employee || app.Employee || {};
  return {
    firstName: emp.firstName || emp.first_name || "",
    lastName: emp.lastName || emp.last_name || "",
    employeeNumber: emp.employeeNumber || emp.employee_number || "",
    department: emp.department?.name || emp.Department?.name || "",
    branch: emp.branch?.name || emp.Branch?.name || "",
    id: emp.id || "",
  };
};

const getLeaveTypeDisplay = (app) => {
  const lt = app.leaveType || app.LeaveType || app.leave_type || {};
  return lt.name || lt.Name || "Unknown";
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function FilterDropdown({ label, value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 outline-none focus:border-blue-400 cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0 gap-3">
      <span className="text-[11px] text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-[11px] font-medium text-right ${highlight ? "text-blue-600 font-semibold" : "text-gray-800"}`}>{value}</span>
    </div>
  );
}

function TimelineStep({ title, subtitle, isLast, status }) {
  const config = {
    done: { dotBg: "bg-green-100", icon: Check, iconColor: "text-green-600" },
    current: { dotBg: "bg-amber-100", icon: null, dotColor: "bg-amber-500" },
    pending: { dotBg: "bg-gray-100", icon: null, dotColor: "bg-gray-300" },
  };
  const cfg = config[status] || config.pending;
  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      {!isLast && <div className="absolute left-[7px] top-4 bottom-0 w-px bg-gray-200" />}
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 ${cfg.dotBg}`}>
        {cfg.icon ? <cfg.icon className={`w-2.5 h-2.5 ${cfg.iconColor}`} /> : <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${status === "pending" ? "text-gray-300" : "text-gray-800"}`}>{title}</div>
        <div className={`text-xs mt-0.5 ${status === "current" ? "text-amber-600" : status === "pending" ? "text-gray-300" : "text-gray-400"}`}>{subtitle}</div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LeaveApplications() {
  const navigate = useNavigate();
  const leavePerms = usePermission("LeaveApplication");
  const canSubmit = leavePerms.canSubmit || leavePerms.canApprove;
  const canCreate = leavePerms.canCreate;
  const canWrite = leavePerms.canWrite;
  const canCancel = leavePerms.canCancel;

  // Data
  const [applications, setApplications] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leavePeriods, setLeavePeriods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");

  // Rejection reason & submit draft
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  //  FETCH DROPDOWNS
  // ═══════════════════════════════════════════════════════════════
  const fetchDropdownData = useCallback(async () => {
    try {
      const [typeRes, periodRes] = await Promise.all([
        apiClient.get("/leaves/leave-types"),
        apiClient.get("/leaves/leave-periods"),
      ]);
      setLeaveTypes(extractArray(typeRes));
      setLeavePeriods(extractArray(periodRes));
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);

  // ═══════════════════════════════════════════════════════════════
  //  FETCH APPLICATIONS
  // ═══════════════════════════════════════════════════════════════
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter === "Pending" ? "Open" : statusFilter);
      if (leaveTypeFilter) params.set("leaveTypeId", leaveTypeFilter);
      params.set("limit", "100");

      const res = await apiClient.get(`/leaves/applications?${params}`);
      let apps = extractArray(res);

      // Client-side search
      if (search.trim()) {
        const q = search.toLowerCase();
        apps = apps.filter((a) => {
          const emp = getEmployeeDisplay(a);
          return `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
            emp.employeeNumber?.toLowerCase().includes(q) ||
            getLeaveTypeDisplay(a).toLowerCase().includes(q);
        });
      }

      setApplications(apps);

      if (selected) {
        const stillExists = apps.find((a) => a.id === selected);
        if (!stillExists) { setSelected(null); setSelectedDetail(null); }
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally { setLoading(false); }
  }, [search, statusFilter, leaveTypeFilter, periodFilter]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  // ═══════════════════════════════════════════════════════════════
  //  SELECT ROW
  // ═══════════════════════════════════════════════════════════════
  const handleSelect = async (app) => {
    setSelected(app.id);
    setDetailLoading(true);
    setRejectionReason("");
    try {
      const res = await apiClient.get(`/leaves/applications/${app.id}`);
      setSelectedDetail(extractData(res));
    } catch (err) {
      toast.error("Failed to load application detail");
      setSelected(null);
    } finally { setDetailLoading(false); }
  };

  const handleCloseDetail = () => { setSelected(null); setSelectedDetail(null); };

  // ═══════════════════════════════════════════════════════════════
  //  ACTIONS
  // ═══════════════════════════════════════════════════════════════
  const handleSubmitDraft = async () => {
    if (!selected) return;
    setActionBusy(true);
    try {
      await apiClient.post(`/leaves/applications/${selected}/submit`);
      toast.success("Application submitted for approval");
      fetchApplications();
      handleSelect({ id: selected });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submit failed");
    } finally { setActionBusy(false); }
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionBusy(true);
    try {
      await apiClient.post(`/leaves/applications/${selected}/approve`);
      toast.success("Leave application approved");
      setSelected(null); setSelectedDetail(null);
      fetchApplications();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approval failed");
    } finally { setActionBusy(false); }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!rejectionReason.trim()) { toast.error("Please provide a rejection reason"); return; }
    setActionBusy(true);
    try {
      await apiClient.post(`/leaves/applications/${selected}/reject`, { rejectionReason: rejectionReason.trim() });
      toast.success("Leave application rejected");
      setSelected(null); setSelectedDetail(null); setRejectionReason("");
      fetchApplications();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Rejection failed");
    } finally { setActionBusy(false); }
  };

  const handleCancel = async () => {
    if (!selected) return;
    if (!confirm("Cancel this application?")) return;
    setActionBusy(true);
    try {
      await apiClient.post(`/leaves/applications/${selected}/cancel`);
      toast.success("Application cancelled");
      setSelected(null); setSelectedDetail(null);
      fetchApplications();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cancel failed");
    } finally { setActionBusy(false); }
  };

  // ═══════════════════════════════════════════════════════════════
  //  RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════
  const getStatusPill = (status) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES.Draft;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />{status}
      </span>
    );
  };

  const getLeaveTypePill = (type) => {
    const s = LEAVE_TYPE_STYLES[type] || "bg-gray-50 text-gray-700";
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${s}`}>{type || "Unknown"}</span>;
  };

  const statusCounts = applications.reduce((acc, a) => {
    const s = a.status === "Open" ? "Pending" : a.status;
    acc[s] = (acc[s] || 0) + 1;
    acc.All = (acc.All || 0) + 1;
    return acc;
  }, {});

  const leaveTypeOptions = [
    { value: "", label: "Leave type" },
    ...leaveTypes.map((lt) => ({ value: lt.id, label: lt.name })),
  ];
  const periodOptions = [
    { value: "", label: "Period" },
    ...leavePeriods.map((lp) => ({ value: lp.id, label: lp.name })),
  ];

  const d = selectedDetail;

  return (
    <>
      {showRequestForm ? (
        <LeaveRequest onCancel={() => setShowRequestForm(false)} onSuccess={() => { setShowRequestForm(false); fetchApplications(); }} />
      ) : (
        <div className="flex flex-col gap-4 pb-10">
          <PageHeader
            title="Leave Applications"
            subtitle={`${applications.length} applications`}
            icon={<FileText className="w-5 h-5" />}
            actions={
              canCreate && (
                <button onClick={() => setShowRequestForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" /> Apply for self
                </button>
              )
            }
          />

          {/* Split Panel */}
          <div className="flex gap-0 border border-gray-200 rounded-xl overflow-hidden bg-white">
            {/* Left — Table */}
            <div className={`flex-1 min-w-0 ${selected ? "border-r border-gray-200" : ""}`}>
              {/* Filters */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[160px] max-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400" />
                  </div>
                  <FilterDropdown label="Leave type" value={leaveTypeFilter} onChange={setLeaveTypeFilter} options={leaveTypeOptions} />
                  <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter}
                    options={[
                      { value: "", label: "Status" }, { value: "Draft", label: "Draft" },
                      { value: "Open", label: "Pending" }, { value: "Approved", label: "Approved" },
                      { value: "Rejected", label: "Rejected" }, { value: "Cancelled", label: "Cancelled" },
                    ]} />
                  <FilterDropdown label="Period" value={periodFilter} onChange={setPeriodFilter} options={periodOptions} />
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  {[
                    { v: "", l: `All (${statusCounts.All || 0})` },
                    { v: "Draft", l: `Draft (${statusCounts.Draft || 0})`, activeBg: "bg-slate-100 text-slate-700 border-slate-300" },
                    { v: "Open", l: `Pending (${statusCounts.Pending || 0})`, activeBg: "bg-amber-50 text-amber-700 border-amber-200" },
                    { v: "Approved", l: `Approved (${statusCounts.Approved || 0})` },
                    { v: "Rejected", l: `Rejected (${statusCounts.Rejected || 0})` },
                  ].map((t) => (
                    <button key={t.v} onClick={() => setStatusFilter(t.v === statusFilter ? "" : t.v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        statusFilter === t.v ? (t.activeBg || "bg-gray-100 text-gray-700 border-gray-300") : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}>{t.l}</button>
                  ))}
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
              ) : applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FileText className="w-10 h-10 opacity-20 mb-2" /><p className="text-sm">No applications found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[60px]">Days</th>
                        <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[70px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {applications.map((app) => {
                        const emp = getEmployeeDisplay(app);
                        const ltName = getLeaveTypeDisplay(app);
                        return (
                          <tr key={app.id} onClick={() => handleSelect(app)}
                            className={`cursor-pointer transition-colors hover:bg-blue-50/30 ${selected === app.id ? "bg-blue-50/50" : app.status === "Open" ? "bg-amber-50/10" : ""}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${avatarColor(emp.id || app.id)}`}>
                                  {initials(emp.firstName, emp.lastName)}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate">{emp.firstName} {emp.lastName}</div>
                                  <div className="text-[11px] text-gray-400">{emp.department || "N/A"} · Applied {fmtShortDate(app.createdAt)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">{getLeaveTypePill(ltName)}</td>
                            <td className="py-3 px-3 text-sm text-gray-700 font-medium">{fmtShortDate(app.fromDate)} – {fmtShortDate(app.toDate)}</td>
                            <td className="py-3 px-3 text-sm font-semibold text-gray-900">{app.totalLeaveDays}</td>
                            <td className="py-3 px-3">{getStatusPill(app.status === "Open" ? "Pending" : app.status)}</td>
                            <td className="py-3 px-3">
                              <button onClick={(e) => { e.stopPropagation(); handleSelect(app); }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${selected === app.id ? "bg-blue-100 text-blue-700 border border-blue-200" : "text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100"}`}>View</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right — Detail Panel */}
            {selected && d && (
              <div className="w-[360px] flex-shrink-0 bg-white overflow-y-auto flex flex-col" style={{ maxHeight: "calc(100vh - 280px)" }}>
                {detailLoading ? (
                  <div className="flex items-center justify-center flex-1 py-16"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
                ) : d ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(d.applicant?.id || d.employeeId)}`}>
                          {initials(d.applicant?.firstName, d.applicant?.lastName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 uppercase truncate">{d.applicant?.firstName} {d.applicant?.lastName}</div>
                          <div className="text-xs text-gray-400">{d.applicant?.department?.name || "N/A"} · {d.applicant?.branch?.name || "N/A"}</div>
                        </div>
                        <button onClick={handleCloseDetail} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X className="w-4 h-4" /></button>
                      </div>
                      {getStatusPill(d.status === "Open" ? "Pending" : d.status)}
                    </div>

                    {/* Application Details */}
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Application Details</h4>
                      <div className="space-y-0">
                        <DetailRow label="Leave type" value={getLeaveTypePill(getLeaveTypeDisplay(d))} />
                        <DetailRow label="From" value={fmtDate(d.fromDate)} />
                        <DetailRow label="To" value={fmtDate(d.toDate)} />
                        <DetailRow label="Working days" value={`${d.totalLeaveDays} days`} highlight />
                        <DetailRow label="Reason" value={d.reason || "—"} />
                      </div>
                    </div>

                    {/* Approval Chain */}
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Approval Chain</h4>
                      <div className="pl-1">
                        <TimelineStep status="done" title="Applied by employee"
                          subtitle={`${d.applicant?.firstName || ""} ${d.applicant?.lastName?.charAt(0) || ""}. · ${fmtDateTime(d.createdAt)}`} />
                        
                        {/* Draft — show Submit button */}
                        {d.status === "Draft" && (
                          <div className="relative flex gap-3 pb-4">
                            <div className="absolute left-[7px] top-4 bottom-0 w-px bg-gray-200" />
                            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 bg-amber-100">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-800">Submit for approval</div>
                              <div className="text-xs text-amber-600 mt-0.5">Application is still in draft</div>
                              {canSubmit && (
                                <button onClick={handleSubmitDraft} disabled={actionBusy}
                                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors">
                                  {actionBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                  Submit for Approval
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Branch Manager — approve/reject */}
                        <TimelineStep
                          status={d.status === "Open" ? "current" : d.status === "Approved" || d.status === "Rejected" ? "done" : "pending"}
                          title="Branch Manager review"
                          subtitle={d.status === "Open" ? "Awaiting decision" : d.status === "Approved" ? "Approved" : d.status === "Rejected" ? "Rejected" : d.status === "Draft" ? "Not yet submitted" : "Completed"}
                        />

                        {/* HOM / GM */}
                        <TimelineStep
                          status={d.status === "Approved" ? "done" : "pending"}
                          title="HOM / GM (if escalated)"
                          subtitle={d.status === "Approved" ? "Approved" : "Not yet reached"}
                          isLast
                        />
                      </div>
                    </div>

                    {/* Actions — Approve/Reject for Open status */}
                    {canWrite && d.status === "Open" && (
                      <div className="p-4">
                        <div className="mb-3">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rejection reason (if rejecting)</label>
                          <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Optional — visible to employee" rows={2}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg resize-none outline-none focus:border-blue-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={handleReject} disabled={actionBusy}
                            className="px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors">Reject</button>
                          <button onClick={handleApprove} disabled={actionBusy}
                            className="px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {actionBusy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Approve"}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center mt-3">Employee will be notified immediately</p>
                      </div>
                    )}

                    {/* Cancel button for Draft/Open */}
                    {canCancel && (d.status === "Draft" || d.status === "Open") && (
                      <div className="px-4 pb-4">
                        <button onClick={handleCancel} disabled={actionBusy}
                          className="w-full px-4 py-2 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-red-500 transition-colors">
                          Cancel Application
                        </button>
                      </div>
                    )}

                    {/* Already processed message */}
                    {d.status === "Approved" && (
                      <div className="p-4"><div className="p-3 rounded-lg text-xs font-medium text-center bg-green-50 text-green-700">✓ This application has been approved.</div></div>
                    )}
                    {d.status === "Rejected" && (
                      <div className="p-4"><div className="p-3 rounded-lg text-xs font-medium text-center bg-red-50 text-red-700">✗ This application has been rejected.{d.rejectionReason && <p className="mt-1 opacity-80">Reason: {d.rejectionReason}</p>}</div></div>
                    )}
                    {d.status === "Cancelled" && (
                      <div className="p-4"><div className="p-3 rounded-lg text-xs font-medium text-center bg-gray-50 text-gray-500">This application has been cancelled.</div></div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center flex-1 py-16 text-gray-400 text-sm">Failed to load details</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}