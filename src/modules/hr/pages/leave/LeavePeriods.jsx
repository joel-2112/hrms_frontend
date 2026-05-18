import { useEffect, useState, useCallback } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  X,
  Save,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Building2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractArray = (res) => {
  const data = res?.data?.data?.data || res?.data?.data || res?.data || [];
  return Array.isArray(data) ? data : [];
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LeavePeriods() {
  const { canCreate, canWrite, canDelete } = usePermission("LeavePeriod");

  const [periods, setPeriods] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  // Slide-over panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    companyId: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ═══════════════════════════════════════════════════════════════
  //  FETCH
  // ═══════════════════════════════════════════════════════════════
  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (companyFilter) params.companyId = companyFilter;

      const [periodRes, companyRes] = await Promise.all([
        apiClient.get("/leaves/leave-periods", { params }),
        apiClient.get("/organizations/companies?limit=100"),
      ]);

      let data = extractArray(periodRes);
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter((p) => p.name?.toLowerCase().includes(q));
      }
      setPeriods(data);
      setCompanies(
        companyRes?.data?.data?.companies || extractArray(companyRes),
      );
    } catch {
      toast.error("Failed to load leave periods");
    } finally {
      setLoading(false);
    }
  }, [search, companyFilter]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  // ═══════════════════════════════════════════════════════════════
  //  PANEL HANDLERS
  // ═══════════════════════════════════════════════════════════════
  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      companyId: companyFilter || "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
    setErrors({});
    setPanelOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      companyId: p.companyId || "",
      startDate: p.startDate || "",
      endDate: p.endDate || "",
      isActive: p.isActive ?? true,
    });
    setErrors({});
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditing(null);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.companyId) errs.companyId = "Required";
    if (!form.startDate) errs.startDate = "Required";
    if (!form.endDate) errs.endDate = "Required";
    if (
      form.startDate &&
      form.endDate &&
      new Date(form.startDate) >= new Date(form.endDate)
    ) {
      errs.endDate = "Must be after start date";
    }
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
        await apiClient.patch(`/leaves/leave-periods/${editing.id}`, form);
        toast.success("Leave period updated successfully");
      } else {
        await apiClient.post("/leaves/leave-periods", form);
        toast.success("Leave period created successfully");
      }
      closePanel();
      fetchPeriods();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (deleteConfirm?.id !== p.id) {
      setDeleteConfirm(p);
      return;
    }
    try {
      await apiClient.delete(`/leaves/leave-periods/${p.id}`);
      toast.success("Leave period deleted");
      setDeleteConfirm(null);
      fetchPeriods();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
      setDeleteConfirm(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════════
  const getCompanyName = (id) => companies.find((c) => c.id === id)?.name || id;
  const getDuration = (p) => {
    if (!p.startDate || !p.endDate) return 0;
    return (
      Math.ceil(
        (new Date(p.endDate) - new Date(p.startDate)) / (1000 * 60 * 60 * 24),
      ) + 1
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-5 pb-10 relative">
      <PageHeader
        title="Leave Periods"
        subtitle="Define financial/leave year boundaries for leave allocation"
        icon={<Calendar className="w-5 h-5" />}
        actions={
          canCreate && (
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create new period
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            placeholder="Search periods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400"
          />
        </div>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400 text-gray-600"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.abbr ? `(${c.abbr})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Status:</span>
        {[
          { v: "", l: "All", count: periods.length },
          {
            v: "active",
            l: "Active",
            count: periods.filter((p) => p.isActive).length,
          },
          {
            v: "inactive",
            l: "Inactive",
            count: periods.filter((p) => !p.isActive).length,
          },
        ].map((t) => (
          <button
            key={t.v}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              companyFilter
                ? "border-gray-200 text-gray-500"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {t.l} <span className="ml-1 opacity-60">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : periods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Calendar className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-sm">No leave periods found</p>
            {canCreate && (
              <button
                onClick={openNew}
                className="mt-3 text-xs text-blue-600 hover:underline"
              >
                Create your first leave period
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Period Name
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Start — End
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[100px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {periods.map((p) => {
                const days = getDuration(p);
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/30 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            p.isActive
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {p.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Building2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {getCompanyName(p.companyId)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-700">
                        {fmtDate(p.startDate)}{" "}
                        <span className="text-gray-300 mx-1">→</span>{" "}
                        {fmtDate(p.endDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-700">
                        {days} days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          p.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-50 text-slate-500 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${p.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                        />
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(p)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              deleteConfirm?.id === p.id
                                ? "text-red-600 bg-red-50"
                                : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                            }`}
                          >
                            {deleteConfirm?.id === p.id ? "Confirm" : "Delete"}
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

     {/* ═══════════════ SLIDE-OVER PANEL ═══════════════ */}
{/* Backdrop */}
{panelOpen && (
  <div className="fixed inset-0 z-40 bg-black/30" onClick={closePanel} />
)}

{/* Panel */}
<div
  className={`fixed top-20 right-6 z-50 max-h-[85vh] w-full max-w-sm rounded-2xl bg-white shadow-2xl flex flex-col transition-all duration-300 ${
    panelOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
  }`}
>
  {/* Header */}
  <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
    <div>
      <h2 className="text-lg font-bold text-gray-900">
        {editing ? "Edit leave period" : "Create new leave period"}
      </h2>
      <p className="text-xs text-gray-500 mt-0.5">
        {editing
          ? "Update the leave year boundaries"
          : "Define a new financial/leave year period"}
      </p>
    </div>
    <button
      onClick={closePanel}
      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
    >
      <X className="w-5 h-5" />
    </button>
  </div>

  {/* Form */}
  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
    {/* Period Name */}
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        Period name <span className="text-red-400">*</span>
      </label>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder='e.g. "2026 (Jan-Dec)"'
        className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors ${
          errors.name
            ? "border-red-300 focus:border-red-400"
            : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
        }`}
      />
      {errors.name && (
        <p className="text-xs text-red-500 mt-1">{errors.name}</p>
      )}
      <p className="text-[11px] text-gray-400 mt-1.5">
        Must be unique across all periods
      </p>
    </div>

    {/* Company */}
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        Company <span className="text-red-400">*</span>
      </label>
      <select
        name="companyId"
        value={form.companyId}
        onChange={handleChange}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors ${
          errors.companyId
            ? "border-red-300 focus:border-red-400"
            : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
        }`}
      >
        <option value="">Select company...</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {errors.companyId && (
        <p className="text-xs text-red-500 mt-1">{errors.companyId}</p>
      )}
    </div>

    {/* Date Range */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Start date <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          name="startDate"
          value={form.startDate}
          onChange={handleChange}
          className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors ${
            errors.startDate
              ? "border-red-300 focus:border-red-400"
              : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          }`}
        />
        {errors.startDate && (
          <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          End date <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          name="endDate"
          value={form.endDate}
          onChange={handleChange}
          className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors ${
            errors.endDate
              ? "border-red-300 focus:border-red-400"
              : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          }`}
        />
        {errors.endDate && (
          <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
        )}
      </div>
    </div>

    {/* Duration preview */}
    {form.startDate &&
      form.endDate &&
      new Date(form.startDate) < new Date(form.endDate) && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg">
          <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm text-blue-700">
            Period duration:{" "}
            <strong>
              {Math.ceil(
                (new Date(form.endDate) - new Date(form.startDate)) /
                  (1000 * 60 * 60 * 24),
              ) + 1}{" "}
              days
            </strong>
          </span>
        </div>
      )}

    {/* Active toggle */}
    <div className="border border-gray-200 rounded-xl p-4">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="isActive"
          checked={form.isActive}
          onChange={handleChange}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div>
          <span className="text-sm font-semibold text-gray-800">
            Set as Active Period
          </span>
          <p className="text-xs text-gray-500 mt-1">
            Only one period can be active per company.
          </p>
        </div>
      </label>
    </div>
  </div>

  {/* Footer */}
  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white rounded-b-2xl">
    <p className="text-[11px] text-gray-400">
      {editing ? "Update the leave period details" : "Define leave year boundaries"}
    </p>
    <div className="flex items-center gap-3">
      <button
        onClick={closePanel}
        className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {editing ? "Save" : "Create"}
      </button>
    </div>
  </div>
</div>
    </div>
  );
}
