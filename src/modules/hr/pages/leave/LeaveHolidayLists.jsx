import { useEffect, useState, useCallback } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Plus, Search, Loader2, Pencil, Trash2, X, Save, Sun,
} from "lucide-react";
import { toast } from "sonner";

const extractArray = (res) => {
  const data = res?.data?.data?.data || res?.data?.data || res?.data || [];
  return Array.isArray(data) ? data : [];
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export default function HolidayLists() {
  const { canCreate, canWrite, canDelete } = usePermission("HolidayList");

  const [holidays, setHolidays] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDisabled, setShowDisabled] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", companyId: "", fromDate: "", toDate: "",
  });
  const [errors, setErrors] = useState({});

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, companyRes] = await Promise.all([
        apiClient.get("/leaves/holiday-lists", { params: { includeDisabled: showDisabled } }),
        apiClient.get("/organizations/companies?limit=100"),
      ]);
      let data = extractArray(listRes);
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter((h) => h.name?.toLowerCase().includes(q));
      }
      setHolidays(data);
      setCompanies(extractArray(companyRes));
    } catch {
      toast.error("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, [search, showDisabled]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", companyId: "", fromDate: "", toDate: "" });
    setErrors({});
    setPanelOpen(true);
  };

  const openEdit = (h) => {
    setEditing(h);
    setForm({
      name: h.name || "",
      companyId: h.companyId || "",
      fromDate: h.fromDate || "",
      toDate: h.toDate || "",
    });
    setErrors({});
    setPanelOpen(true);
  };

  const closePanel = () => { setPanelOpen(false); setEditing(null); setErrors({}); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.fromDate) errs.fromDate = "Required";
    if (!form.toDate) errs.toDate = "Required";
    if (new Date(form.fromDate) > new Date(form.toDate)) errs.toDate = "Must be after start date";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { toast.error("Please fix the errors"); return; }
    setSaving(true);
    try {
      if (editing) {
        await apiClient.patch(`/leaves/holiday-lists/${editing.id}`, form);
        toast.success("Holiday updated");
      } else {
        await apiClient.post("/leaves/holiday-lists", form);
        toast.success("Holiday created");
      }
      closePanel();
      fetchHolidays();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (h) => {
    if (!confirm(`Disable "${h.name}"?`)) return;
    try {
      await apiClient.delete(`/leaves/holiday-lists/${h.id}`);
      toast.success("Holiday disabled");
      fetchHolidays();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to disable");
    }
  };

  const getCompanyName = (id) => companies.find((c) => c.id === id)?.name || "All Companies";

  const isSameDay = (h) => h.fromDate === h.toDate;

  return (
    <div className="flex flex-col gap-5 pb-10 relative">
      <PageHeader
        title="Holidays"
        subtitle="Manage company holidays — used for leave day calculations"
        icon={<Sun className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <input type="checkbox" checked={showDisabled} onChange={(e) => setShowDisabled(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300" />
              Show disabled
            </label>
            {canCreate && (
              <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> Add Holiday
              </button>
            )}
          </div>
        }
      />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input placeholder="Search holidays..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
        ) : holidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Sun className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-sm">No holidays found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Holiday Name</th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Company</th>
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Date</th>
                  <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Duration</th>
                  <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Status</th>
                  <th className="text-center py-3 px-4 text-[11px] font-bold text-gray-500 uppercase w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                          <Sun className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{h.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{getCompanyName(h.companyId)}</td>
                    <td className="py-3 px-4">
                      {isSameDay(h) ? (
                        <span className="text-sm font-mono text-gray-700">{fmtDate(h.fromDate)}</span>
                      ) : (
                        <span className="text-sm text-gray-700">{fmtDate(h.fromDate)} <span className="text-gray-300">→</span> {fmtDate(h.toDate)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isSameDay(h) ? (
                        <span className="text-xs text-gray-500">1 day</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Multi-day</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        h.disabled ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${h.disabled ? "bg-red-500" : "bg-emerald-500"}`} />
                        {h.disabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canWrite && !h.disabled && (
                          <button onClick={() => openEdit(h)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Edit</button>
                        )}
                        {canDelete && !h.disabled && (
                          <button onClick={() => handleDelete(h)} className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">Disable</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

{/* Overlay */}
{panelOpen && <div className="fixed inset-0 z-40 bg-black/30" onClick={closePanel} />}

{/* Panel */}
<div className={`fixed top-20 right-6 z-50 w-full max-w-sm bg-white shadow-2xl rounded-2xl flex flex-col transition-all duration-300 ${
  panelOpen 
    ? "translate-x-0 opacity-100" 
    : "translate-x-full opacity-0 pointer-events-none"
}`}>
  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
    <h2 className="text-base font-bold text-gray-900">{editing ? "Edit Holiday" : "Add Holiday"}</h2>
    <button onClick={closePanel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
  </div>

  <div className="p-5 space-y-4">
    <div>
      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Holiday Name <span className="text-red-400">*</span></label>
      <input name="name" value={form.name} onChange={handleChange} placeholder='e.g. "Ethiopian Christmas"'
        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${errors.name ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`} />
      {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Company</label>
      <select name="companyId" value={form.companyId} onChange={handleChange}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400">
        <option value="">All Companies</option>
        {companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
      </select>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-[11px] font-semibold text-gray-700 mb-1">From <span className="text-red-400">*</span></label>
        <input type="date" name="fromDate" value={form.fromDate} onChange={handleChange}
          className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${errors.fromDate ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`} />
        {errors.fromDate && <p className="text-[11px] text-red-500 mt-1">{errors.fromDate}</p>}
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-700 mb-1">To <span className="text-red-400">*</span></label>
        <input type="date" name="toDate" value={form.toDate} onChange={handleChange}
          className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${errors.toDate ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`} />
        {errors.toDate && <p className="text-[11px] text-red-500 mt-1">{errors.toDate}</p>}
      </div>
    </div>

    <p className="text-[10px] text-gray-400">
      For a single day, set From and To to the same date. For a range, set the start and end dates.
    </p>
  </div>

  <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
    <button onClick={closePanel} className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
    <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
      {editing ? "Save" : "Create"}
    </button>
  </div>
</div>
    </div>
  );
}