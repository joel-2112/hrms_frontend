import { useEffect, useState, useCallback } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Plus, Search, Loader2, Pencil, Trash2, X, Save, Calendar, 
  ChevronDown, ChevronUp, RefreshCw, Ban, Shield, Building2, AlertTriangle, PlusCircle,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractArray = (res) => {
  const data = res?.data?.data?.data || res?.data?.data || res?.data || [];
  return Array.isArray(data) ? data : [];
};

const extractData = (res) => res?.data?.data?.data || res?.data?.data || res?.data || {};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LeaveBlockLists() {
  const { canCreate, canWrite, canDelete } = usePermission("LeaveBlockList");

  const [blockLists, setBlockLists] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDisabled, setShowDisabled] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Slide-over panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    companyId: "",
    appliesToAllDepartments: true,
    allowedDepartments: [],
    blockDates: [],
  });
  const [errors, setErrors] = useState({});
  const [newBlockDate, setNewBlockDate] = useState({ date: "", reason: "" });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ═══════════════════════════════════════════════════════════════
  //  FETCH
  // ═══════════════════════════════════════════════════════════════
  const fetchBlockLists = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = form.companyId || undefined;
      const params = { includeDisabled: showDisabled };
      if (companyId) params.companyId = companyId;

      const [listRes, companyRes, deptRes] = await Promise.all([
        apiClient.get("/leaves/block-lists", { params }),
        apiClient.get("/organizations/companies?limit=100"),
        apiClient.get("/organizations/departments?limit=200"),
      ]);

      let data = extractArray(listRes);
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter((b) => b.name?.toLowerCase().includes(q));
      }
      setBlockLists(data);
      setCompanies(companyRes?.data?.data?.companies || extractArray(companyRes));
      setDepartments(deptRes?.data?.data?.departments || extractArray(deptRes));
    } catch {
      toast.error("Failed to load block lists");
    } finally {
      setLoading(false);
    }
  }, [search, showDisabled]);

  useEffect(() => { fetchBlockLists(); }, [fetchBlockLists]);

  // ═══════════════════════════════════════════════════════════════
  //  PANEL HANDLERS
  // ═══════════════════════════════════════════════════════════════
  const openNew = () => {
    setEditing(null);
    setForm({ name: "", companyId: "", appliesToAllDepartments: true, allowedDepartments: [], blockDates: [] });
    setErrors({});
    setNewBlockDate({ date: "", reason: "" });
    setPanelOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      name: b.name || "",
      companyId: b.companyId || "",
      appliesToAllDepartments: b.appliesToAllDepartments ?? true,
      allowedDepartments: b.allowedDepartments || [],
      blockDates: b.blockDates || [],
    });
    setErrors({});
    setNewBlockDate({ date: "", reason: "" });
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditing(null);
    setErrors({});
    setNewBlockDate({ date: "", reason: "" });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const addBlockDate = () => {
    if (!newBlockDate.date.trim()) {
      toast.error("Date is required");
      return;
    }
    const exists = form.blockDates.some((b) => b.date === newBlockDate.date);
    if (exists) {
      toast.error("This date is already blocked");
      return;
    }
    setForm((prev) => ({
      ...prev,
      blockDates: [...prev.blockDates, { ...newBlockDate }].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setNewBlockDate({ date: "", reason: "" });
  };

  const removeBlockDate = (index) => {
    setForm((prev) => ({ ...prev, blockDates: prev.blockDates.filter((_, i) => i !== index) }));
  };

  const toggleDepartment = (deptId) => {
    setForm((prev) => ({
      ...prev,
      allowedDepartments: prev.allowedDepartments.includes(deptId)
        ? prev.allowedDepartments.filter((id) => id !== deptId)
        : [...prev.allowedDepartments, deptId],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.companyId) errs.companyId = "Required";
    if (form.blockDates.length === 0) errs.blockDates = "Add at least one blocked date";
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
      if (editing) {
        await apiClient.patch(`/leaves/block-lists/${editing.id}`, form);
        toast.success("Block list updated");
      } else {
        await apiClient.post("/leaves/block-lists", form);
        toast.success("Block list created");
      }
      closePanel();
      fetchBlockLists();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b) => {
    if (deleteConfirm?.id !== b.id) {
      setDeleteConfirm(b);
      return;
    }
    try {
      await apiClient.delete(`/leaves/block-lists/${b.id}`);
      toast.success("Block list disabled");
      setDeleteConfirm(null);
      fetchBlockLists();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to disable");
      setDeleteConfirm(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ═══════════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════════
  const getCompanyName = (id) => companies.find((c) => c.id === id)?.name || id;
  const getDepartmentName = (id) => departments.find((d) => d.id === id)?.name || id;
  const getBlockCount = (list) => (list.blockDates || []).length;

  const filteredDepartments = form.companyId
    ? departments.filter((d) => d.companyId === form.companyId)
    : departments;

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-5 pb-10 relative">
      <PageHeader
        title="Leave Block Lists"
        subtitle="Define dates where leave applications are restricted or blocked"
        icon={<Ban className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <input type="checkbox" checked={showDisabled} onChange={(e) => setShowDisabled(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300" />
              Show disabled
            </label>
            {canCreate && (
              <button onClick={openNew}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> Create block list
              </button>
            )}
          </div>
        }
      />

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input placeholder="Search block lists..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400" />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : blockLists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Ban className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-sm">No block lists found</p>
            {canCreate && (
              <button onClick={openNew} className="mt-3 text-xs text-blue-600 hover:underline">
                Create your first block list
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-8"></th>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Block List Name</th>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Applies To</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Blocked Dates</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {blockLists.map((b) => {
                const count = getBlockCount(b);
                const isExpanded = expandedRows.has(b.id);
                return (
                  <>
                    <tr key={b.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="py-3 px-4">
                        <button onClick={() => toggleExpand(b.id)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                            <Ban className="w-4 h-4" />
                          </div>
                          <div className="text-sm font-semibold text-gray-900">{b.name}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Building2 className="w-3.5 h-3.5 text-gray-300" />
                          {getCompanyName(b.companyId)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {b.appliesToAllDepartments ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                            <Shield className="w-3 h-3" /> All Departments
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(b.allowedDepartments || []).slice(0, 3).map((id) => (
                              <span key={id} className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-600">
                                {getDepartmentName(id)}
                              </span>
                            ))}
                            {(b.allowedDepartments || []).length > 3 && (
                              <span className="text-[10px] text-gray-400">+{b.allowedDepartments.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-semibold text-gray-700">{count} date{count !== 1 ? "s" : ""}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          b.disabled ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${b.disabled ? "bg-red-500" : "bg-emerald-500"}`} />
                          {b.disabled ? "Disabled" : "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canWrite && !b.disabled && (
                            <button onClick={() => openEdit(b)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Edit</button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(b)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                deleteConfirm?.id === b.id
                                  ? "text-red-600 bg-red-50"
                                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                              }`}>
                              {deleteConfirm?.id === b.id ? "Confirm" : "Disable"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded row */}
                    {isExpanded && (
                      <tr key={`${b.id}-expanded`}>
                        <td colSpan={7} className="bg-gray-50/50 px-4 py-3">
                          <div className="ml-10">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Blocked Dates ({count})
                              {!b.appliesToAllDepartments && b.allowedDepartments?.length > 0 && (
                                <span className="ml-2 font-normal text-gray-400">
                                  · Allowed depts: {(b.allowedDepartments || []).map(id => getDepartmentName(id)).join(", ")}
                                </span>
                              )}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {(b.blockDates || []).map((bd, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg">
                                  <span className="text-xs font-mono font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                    {fmtDate(bd.date)}
                                  </span>
                                  <span className="text-xs text-gray-600 truncate">{bd.reason || "Blocked"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ═══════════════ SLIDE-OVER PANEL ═══════════════ */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={closePanel} />
      )}

      <div className={`fixed top-20 right-6 z-50 h-auto max-h-[85vh] w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col rounded-2xl ${
        panelOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{editing ? "Edit block list" : "Create block list"}</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Define dates where leave is restricted</p>
          </div>
          <button onClick={closePanel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Block list name <span className="text-red-400">*</span></label>
            <input name="name" value={form.name} onChange={handleChange}
              placeholder='e.g. "Year-End Freeze 2026"'
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${errors.name ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`} />
            {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Company */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Company <span className="text-red-400">*</span></label>
            <select name="companyId" value={form.companyId} onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${errors.companyId ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`}>
              <option value="">Select company...</option>
              {companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            {errors.companyId && <p className="text-[11px] text-red-500 mt-1">{errors.companyId}</p>}
          </div>

          {/* Applies to */}
          <div>
            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input type="checkbox" name="appliesToAllDepartments" checked={form.appliesToAllDepartments} onChange={handleChange}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600" />
              <div>
                <span className="text-sm font-semibold text-gray-800">Applies to all departments</span>
                <p className="text-xs text-gray-500 mt-1">Leave is blocked for everyone in the company</p>
              </div>
            </label>
          </div>

          {/* Allowed departments */}
          {!form.appliesToAllDepartments && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Allowed departments</label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-50">
                {filteredDepartments.length === 0 ? (
                  <p className="text-xs text-gray-400 px-3 py-4 text-center">No departments available</p>
                ) : (
                  filteredDepartments.map((d) => (
                    <label key={d.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.allowedDepartments.includes(d.id)}
                        onChange={() => toggleDepartment(d.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{d.name}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                {form.allowedDepartments.length} department{form.allowedDepartments.length !== 1 ? "s" : ""} allowed
              </p>
            </div>
          )}

          {/* Blocked Dates */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Blocked dates <span className="text-red-400">*</span>
            </label>

            {/* Add date row */}
            <div className="flex items-center gap-2 mb-2">
              <input type="date" value={newBlockDate.date} onChange={(e) => setNewBlockDate((p) => ({ ...p, date: e.target.value }))}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400" />
              <input type="text" value={newBlockDate.reason} onChange={(e) => setNewBlockDate((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Reason (optional)" onKeyDown={(e) => e.key === "Enter" && addBlockDate()}
                className="flex-[2] px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400" />
              <button onClick={addBlockDate}
                className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex-shrink-0">
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>

            {errors.blockDates && <p className="text-[11px] text-red-500 mb-2">{errors.blockDates}</p>}

            {/* Blocked dates list */}
            {form.blockDates.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {form.blockDates.map((bd, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                    <span className="text-xs font-mono font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded flex-shrink-0">
                      {fmtDate(bd.date)}
                    </span>
                    <span className="text-xs text-gray-600 flex-1 truncate">{bd.reason || "Blocked"}</span>
                    <button onClick={() => removeBlockDate(i)}
                      className="p-0.5 hover:bg-red-50 rounded text-gray-300 hover:text-red-400 flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400">
                No blocked dates added. Add dates above.
              </div>
            )}
          </div>

          {/* Summary */}
          {form.blockDates.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-red-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{form.blockDates.length} date{form.blockDates.length !== 1 ? "s" : ""} blocked</span>
              </div>
              <p className="text-[11px] text-red-500 mt-1">
                Employees will not be able to apply for leave on these dates
                {!form.appliesToAllDepartments && " unless they are in an allowed department"}.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
          <p className="text-[10px] text-gray-400">{editing ? "Update block list" : "Create leave block list"}</p>
          <div className="flex items-center gap-2">
            <button onClick={closePanel}
              className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {editing ? "Save changes" : "Create list"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}