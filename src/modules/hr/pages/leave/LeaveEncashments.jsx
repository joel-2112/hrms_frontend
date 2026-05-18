import { useEffect, useState, useCallback } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Plus, Search, Loader2, X, Save, Calendar, DollarSign, User,
  ChevronDown, RefreshCw, CheckCircle, AlertCircle, Clock, Ban,
  ArrowRight, Eye,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractArray = (res) => {
  const data = res?.data?.data?.data || res?.data?.data || res?.data || [];
  return Array.isArray(data) ? data : [];
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LeaveEncashments() {
  const { canCreate, canSubmit } = usePermission("LeaveEncashment");

  const [encashments, setEncashments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Slide-over panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    leaveTypeId: "",
    leavePeriodId: "",
    leavesToEncash: "",
    encashmentAmount: "",
    encashmentDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});

  // Detail panel
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEncashment, setSelectedEncashment] = useState(null);

  // ═══════════════════════════════════════════════════════════════
  //  FETCH
  // ═══════════════════════════════════════════════════════════════
  const fetchEncashments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search.trim()) params.employeeId = search;

      const [encRes, empRes, typeRes, periodRes] = await Promise.all([
        apiClient.get("/leaves/encashments", { params }),
        apiClient.get("/employees?limit=500"),
        apiClient.get("/leaves/leave-types"),
        apiClient.get("/leaves/leave-periods"),
      ]);

      let data = extractArray(encRes);
      setEncashments(data);
      setEmployees(extractArray(empRes));
      setLeaveTypes(extractArray(typeRes).filter((t) => t.isEncashable && !t.disabled));
      setPeriods(extractArray(periodRes));
    } catch {
      toast.error("Failed to load encashments");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchEncashments(); }, [fetchEncashments]);

  // ═══════════════════════════════════════════════════════════════
  //  PANEL HANDLERS
  // ═══════════════════════════════════════════════════════════════
  const openNew = () => {
    setForm({
      employeeId: "",
      leaveTypeId: "",
      leavePeriodId: periods.find((p) => p.isActive)?.id || "",
      leavesToEncash: "",
      encashmentAmount: "",
      encashmentDate: new Date().toISOString().split("T")[0],
    });
    setErrors({});
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.employeeId) errs.employeeId = "Required";
    if (!form.leaveTypeId) errs.leaveTypeId = "Required";
    if (!form.leavePeriodId) errs.leavePeriodId = "Required";
    if (!form.leavesToEncash || parseInt(form.leavesToEncash) <= 0) errs.leavesToEncash = "Must be > 0";
    if (!form.encashmentDate) errs.encashmentDate = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fix the errors before saving");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/leaves/encashments", {
        ...form,
        leavesToEncash: parseInt(form.leavesToEncash),
        encashmentAmount: parseFloat(form.encashmentAmount) || 0,
      });
      toast.success("Encashment created successfully");
      closePanel();
      fetchEncashments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create encashment");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await apiClient.post(`/leaves/encashments/${id}/approve`);
      toast.success("Encashment approved");
      fetchEncashments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approval failed");
    }
  };

  const handleReject = async (id) => {
    try {
      await apiClient.post(`/leaves/encashments/${id}/reject`);
      toast.success("Encashment rejected");
      fetchEncashments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Rejection failed");
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this encashment?")) return;
    try {
      await apiClient.post(`/leaves/encashments/${id}/cancel`);
      toast.success("Encashment cancelled");
      fetchEncashments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel");
    }
  };

  const viewDetail = (enc) => {
    setSelectedEncashment(enc);
    setDetailOpen(true);
  };

  // ═══════════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════════
  const getEmployeeName = (id) => {
    const e = employees.find((emp) => emp.id === id);
    return e ? `${e.firstName} ${e.lastName}` : id;
  };
  const getLeaveTypeName = (id) => leaveTypes.find((t) => t.id === id)?.name || id;
  const getPeriodName = (id) => periods.find((p) => p.id === id)?.name || id;

  const getStatusBadge = (docStatus) => {
    if (docStatus === 0) return { label: "Draft", bg: "bg-gray-50 text-gray-600 border-gray-200", dot: "bg-gray-400" };
    if (docStatus === 1) return { label: "Submitted", bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
    if (docStatus === 2) return { label: "Cancelled", bg: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-500" };
    return { label: "Unknown", bg: "bg-gray-50 text-gray-500", dot: "bg-gray-400" };
  };

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-5 pb-10 relative">
      <PageHeader
        title="Leave Encashments"
        subtitle="Convert unused leave balance to monetary payout"
        icon={<DollarSign className="w-5 h-5" />}
        actions={
          canCreate && (
            <button onClick={openNew}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> New encashment
            </button>
          )
        }
      />

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input placeholder="Search by employee..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400" />
      </div>

      {/* Summary stats */}
      {!loading && encashments.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Encashments</div>
            <div className="text-lg font-bold text-gray-900">{encashments.length}</div>
          </div>
          <div className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Days</div>
            <div className="text-lg font-bold text-gray-900">
              {encashments.reduce((s, e) => s + (parseFloat(e.leavesToEncash) || 0), 0)}
            </div>
          </div>
          <div className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Amount</div>
            <div className="text-lg font-bold text-gray-900">
              {encashments.reduce((s, e) => s + (parseFloat(e.encashmentAmount) || 0), 0).toLocaleString()} ETB
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : encashments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <DollarSign className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-sm">No encashments found</p>
            {canCreate && (
              <button onClick={openNew} className="mt-3 text-xs text-blue-600 hover:underline">
                Create your first encashment
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Period</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Days</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {encashments.map((e) => {
                const status = getStatusBadge(e.docStatus);
                return (
                  <tr key={e.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {(getEmployeeName(e.employeeId).charAt(0) + (getEmployeeName(e.employeeId).split(" ")[1]?.charAt(0) || "")).toUpperCase()}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{getEmployeeName(e.employeeId)}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700">
                        {getLeaveTypeName(e.leaveTypeId)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-300" />
                        {getPeriodName(e.leavePeriodId)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-semibold text-gray-900">{e.leavesToEncash} days</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-semibold text-gray-900">
                        {e.encashmentAmount ? `${parseFloat(e.encashmentAmount).toLocaleString()} ETB` : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{fmtDate(e.encashmentDate)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${status.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => viewDetail(e)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          View
                        </button>
                        {canSubmit && e.docStatus === 0 && (
                          <>
                            <button onClick={() => handleApprove(e.id)}
                              className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                              Approve
                            </button>
                            <button onClick={() => handleReject(e.id)}
                              className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              Reject
                            </button>
                          </>
                        )}
                        {canSubmit && e.docStatus !== 2 && (
                          <button onClick={() => handleCancel(e.id)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ═══════════════ NEW ENCASHMENT PANEL ═══════════════ */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 " onClick={closePanel} />
          <div className="fixed top-20 right-6 z-50 h-auto max-h-[85vh] w-full max-w-sm bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">New encashment</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Convert unused leave to payout</p>
              </div>
              <button onClick={closePanel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Employee <span className="text-red-400">*</span></label>
                <select name="employeeId" value={form.employeeId} onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${errors.employeeId ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`}>
                  <option value="">Select employee...</option>
                  {employees.slice(0, 100).map((e) => (<option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNumber})</option>))}
                </select>
                {errors.employeeId && <p className="text-[11px] text-red-500 mt-1">{errors.employeeId}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Leave type <span className="text-red-400">*</span></label>
                <select name="leaveTypeId" value={form.leaveTypeId} onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${errors.leaveTypeId ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`}>
                  <option value="">Select encashable type...</option>
                  {leaveTypes.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
                {errors.leaveTypeId && <p className="text-[11px] text-red-500 mt-1">{errors.leaveTypeId}</p>}
                <p className="text-[10px] text-gray-400 mt-1">Only encashable leave types are shown</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Leave period <span className="text-red-400">*</span></label>
                <select name="leavePeriodId" value={form.leavePeriodId} onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${errors.leavePeriodId ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`}>
                  <option value="">Select period...</option>
                  {periods.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
                {errors.leavePeriodId && <p className="text-[11px] text-red-500 mt-1">{errors.leavePeriodId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Days to encash <span className="text-red-400">*</span></label>
                  <input type="number" name="leavesToEncash" value={form.leavesToEncash} onChange={handleChange} min="1"
                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${errors.leavesToEncash ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`} />
                  {errors.leavesToEncash && <p className="text-[11px] text-red-500 mt-1">{errors.leavesToEncash}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Amount (ETB)</label>
                  <input type="number" name="encashmentAmount" value={form.encashmentAmount} onChange={handleChange} min="0" step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Encashment date <span className="text-red-400">*</span></label>
                <input type="date" name="encashmentDate" value={form.encashmentDate} onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${errors.encashmentDate ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`} />
                {errors.encashmentDate && <p className="text-[11px] text-red-500 mt-1">{errors.encashmentDate}</p>}
              </div>

              {form.leavesToEncash > 0 && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700">
                  <strong>{form.leavesToEncash} days</strong> will be converted to payout
                  {form.encashmentAmount > 0 && <span> of <strong>{parseFloat(form.encashmentAmount).toLocaleString()} ETB</strong></span>}.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
              <p className="text-[10px] text-gray-400">Create leave encashment</p>
              <div className="flex items-center gap-2">
                <button onClick={closePanel} className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════ DETAIL PANEL ═══════════════ */}
      {detailOpen && selectedEncashment && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setDetailOpen(false)} />
          <div className="fixed top-20 right-6 z-50 h-auto w-full max-w-xs bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Encashment Detail</h3>
                <p className="text-[10px] text-gray-400 font-mono">{selectedEncashment.id?.substring(0, 8)}</p>
              </div>
              <button onClick={() => setDetailOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <DetailRow label="Employee" value={getEmployeeName(selectedEncashment.employeeId)} />
              <DetailRow label="Leave Type" value={getLeaveTypeName(selectedEncashment.leaveTypeId)} />
              <DetailRow label="Period" value={getPeriodName(selectedEncashment.leavePeriodId)} />
              <DetailRow label="Days to Encash" value={`${selectedEncashment.leavesToEncash} days`} highlight />
              <DetailRow label="Amount" value={selectedEncashment.encashmentAmount ? `${parseFloat(selectedEncashment.encashmentAmount).toLocaleString()} ETB` : "—"} />
              <DetailRow label="Date" value={fmtDate(selectedEncashment.encashmentDate)} />
              <DetailRow label="Status" value={getStatusBadge(selectedEncashment.docStatus).label} />
              <DetailRow label="Created" value={fmtDate(selectedEncashment.createdAt)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Detail Row ──────────────────────────────────────────────────────────────

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={`text-[11px] font-medium ${highlight ? "text-blue-600 font-semibold" : "text-gray-800"}`}>{value}</span>
    </div>
  );
}