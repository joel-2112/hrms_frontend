import { useEffect, useState, useCallback } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Plus, Search, Loader2, X, Save, Calendar, User, RefreshCw,
  CheckCircle, AlertCircle, Clock, Ban, ArrowRight, Eye, FileText,
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

export default function LeaveCompensatory() {
  const { canCreate, canSubmit } = usePermission("CompensatoryLeaveRequest");

  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employeeId: "", leaveTypeId: "", workDate: "", reason: "" });
  const [errors, setErrors] = useState({});

  // Detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // ═══════════════════════════════════════════════════════════════
  //  FETCH
  // ═══════════════════════════════════════════════════════════════
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search.trim()) params.employeeId = search;

      const [reqRes, empRes, typeRes] = await Promise.all([
        apiClient.get("/leaves/compensatory-requests", { params }),
        apiClient.get("/employees?limit=500"),
        apiClient.get("/leaves/leave-types"),
      ]);

      setRequests(extractArray(reqRes));
      setEmployees(extractArray(empRes));
      setLeaveTypes(extractArray(typeRes).filter((t) => t.isCompensatory && !t.disabled));
    } catch {
      toast.error("Failed to load compensatory requests");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // ═══════════════════════════════════════════════════════════════
  //  PANEL HANDLERS
  // ═══════════════════════════════════════════════════════════════
  const openNew = () => {
    setForm({ employeeId: "", leaveTypeId: "", workDate: "", reason: "" });
    setErrors({});
    setPanelOpen(true);
  };

  const closePanel = () => { setPanelOpen(false); setErrors({}); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.employeeId) errs.employeeId = "Required";
    if (!form.leaveTypeId) errs.leaveTypeId = "Required";
    if (!form.workDate) errs.workDate = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { toast.error("Please fill in all required fields"); return; }
    setSaving(true);
    try {
      await apiClient.post("/leaves/compensatory-requests", form);
      toast.success("Compensatory request created");
      closePanel();
      fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (id) => {
    try {
      await apiClient.post(`/leaves/compensatory-requests/${id}/submit`);
      toast.success("Request submitted for approval");
      fetchRequests();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
  };

  const handleApprove = async (id) => {
    try {
      await apiClient.post(`/leaves/compensatory-requests/${id}/approve`);
      toast.success("Request approved — Leave allocation created");
      fetchRequests();
    } catch (err) { toast.error(err?.response?.data?.message || "Approval failed"); }
  };

  const handleReject = async (id) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      await apiClient.post(`/leaves/compensatory-requests/${id}/reject`, { rejectionReason: reason });
      toast.success("Request rejected");
      fetchRequests();
    } catch (err) { toast.error(err?.response?.data?.message || "Rejection failed"); }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this request?")) return;
    try {
      await apiClient.post(`/leaves/compensatory-requests/${id}/cancel`);
      toast.success("Request cancelled");
      fetchRequests();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to cancel"); }
  };

  const viewDetail = (r) => { setSelectedRequest(r); setDetailOpen(true); };

  // ═══════════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════════
  const getEmployeeName = (id) => {
    const e = employees.find((emp) => emp.id === id);
    return e ? `${e.firstName} ${e.lastName}` : id;
  };
  const getLeaveTypeName = (id) => leaveTypes.find((t) => t.id === id)?.name || id;

  const getStatusBadge = (status) => {
    const map = {
      Draft: { label: "Draft", bg: "bg-gray-50 text-gray-600 border-gray-200", dot: "bg-gray-400" },
      Submitted: { label: "Submitted", bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
      Approved: { label: "Approved", bg: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
      Rejected: { label: "Rejected", bg: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-500" },
      Cancelled: { label: "Cancelled", bg: "bg-gray-50 text-gray-500 border-gray-200", dot: "bg-gray-400" },
    };
    const s = map[status] || map.Draft;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
      </span>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-5 pb-10 relative">
      <PageHeader
        title="Compensatory Leave"
        subtitle="Claim compensatory off for working on holidays or weekends"
        icon={<FileText className="w-5 h-5" />}
        actions={
          canCreate && (
            <button onClick={openNew}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> New request
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

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-sm">No compensatory requests found</p>
            {canCreate && (
              <button onClick={openNew} className="mt-3 text-xs text-blue-600 hover:underline">Create your first request</button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Work Date</th>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[160px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {(getEmployeeName(r.employeeId).charAt(0) + (getEmployeeName(r.employeeId).split(" ")[1]?.charAt(0) || "")).toUpperCase()}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{getEmployeeName(r.employeeId)}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
                      {getLeaveTypeName(r.leaveTypeId)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-gray-300" />
                      {fmtDate(r.workDate)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600 truncate max-w-[200px] block">{r.reason || "—"}</span>
                  </td>
                  <td className="py-3 px-4 text-center">{getStatusBadge(r.status)}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => viewDetail(r)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">View</button>
                      {r.status === "Draft" && (
                        <button onClick={() => handleSubmit(r.id)}
                          className="px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">Submit</button>
                      )}
                      {canSubmit && r.status === "Submitted" && (
                        <>
                          <button onClick={() => handleApprove(r.id)}
                            className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors">Approve</button>
                          <button onClick={() => handleReject(r.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">Reject</button>
                        </>
                      )}
                      {canSubmit && r.status !== "Cancelled" && r.status !== "Approved" && (
                        <button onClick={() => handleCancel(r.id)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ═══════════════ CREATE PANEL ═══════════════ */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={closePanel} />
          <div className="fixed top-20 right-6 z-50 h-auto max-h-fit w-full max-w-sm bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">New compensatory request</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Claim comp-off for working on a holiday/weekend</p>
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
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Compensatory leave type <span className="text-red-400">*</span></label>
                <select name="leaveTypeId" value={form.leaveTypeId} onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${errors.leaveTypeId ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`}>
                  <option value="">Select compensatory type...</option>
                  {leaveTypes.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
                {errors.leaveTypeId && <p className="text-[11px] text-red-500 mt-1">{errors.leaveTypeId}</p>}
                <p className="text-[10px] text-gray-400 mt-1">Only compensatory leave types are shown</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Work date <span className="text-red-400">*</span></label>
                <input type="date" name="workDate" value={form.workDate} onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${errors.workDate ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`} />
                {errors.workDate && <p className="text-[11px] text-red-500 mt-1">{errors.workDate}</p>}
                <p className="text-[10px] text-gray-400 mt-1">The holiday or weekend date you worked</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Reason</label>
                <textarea name="reason" value={form.reason} onChange={handleChange} rows={2}
                  placeholder="Describe why compensatory leave is being requested..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
              <p className="text-[10px] text-gray-400">Create compensatory request</p>
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
      {detailOpen && selectedRequest && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 " onClick={() => setDetailOpen(false)} />
          <div className="fixed top-20 right-6 z-50 h-auto w-full max-w-xs bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Request Detail</h3>
                <p className="text-[10px] text-gray-400 font-mono">{selectedRequest.id?.substring(0, 8)}</p>
              </div>
              <button onClick={() => setDetailOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <DetailRow label="Employee" value={getEmployeeName(selectedRequest.employeeId)} />
              <DetailRow label="Leave Type" value={getLeaveTypeName(selectedRequest.leaveTypeId)} />
              <DetailRow label="Work Date" value={fmtDate(selectedRequest.workDate)} />
              <DetailRow label="Reason" value={selectedRequest.reason || "—"} />
              <DetailRow label="Status" value={selectedRequest.status} highlight />
              <DetailRow label="Created" value={fmtDate(selectedRequest.createdAt)} />
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