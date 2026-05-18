import { useEffect, useState, useCallback } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Plus, Search, Pencil, Trash2, X, Save, Loader2, Calendar, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const extractArray = (res) => {
  const data = res?.data?.data?.data || res?.data?.data || res?.data || [];
  return Array.isArray(data) ? data : [];
};

const GENDER_OPTIONS = ["Male", "Female", "Non-binary"];

export default function LeaveTypes() {
  const { canCreate, canWrite, canDelete } = usePermission("LeaveType");

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    eligibilityMonths: "", baseAllocation: 0, annualIncrementDays: 0,
    incrementCap: "", maxDaysPerYear: "", maxCarryForwardYears: "",
    maxContinuousDaysAllowed: "",
    isEncashable: false, includeHolidays: false, includeWeekends: false,
  });

  // Gender rule
  const [genderRuleEnabled, setGenderRuleEnabled] = useState(false);
  const [genderRuleDays, setGenderRuleDays] = useState(0);
  const [selectedGenders, setSelectedGenders] = useState([]);

  const fetchLeaveTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/leaves/leave-types", { params: { includeInactive: showInactive } });
      let data = extractArray(res);
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter((lt) => lt.name?.toLowerCase().includes(q));
      }
      setLeaveTypes(data);
    } catch { toast.error("Failed to load leave types"); }
    finally { setLoading(false); }
  }, [search, showInactive]);

  useEffect(() => { fetchLeaveTypes(); }, [fetchLeaveTypes]);

  const resetForm = () => {
    setForm({
      name: "", eligibilityMonths: "", baseAllocation: 0, annualIncrementDays: 0,
      incrementCap: "", maxDaysPerYear: "", maxCarryForwardYears: "",
      maxContinuousDaysAllowed: "",
      isEncashable: false, includeHolidays: false, includeWeekends: false,
    });
    setGenderRuleEnabled(false); setGenderRuleDays(0); setSelectedGenders([]);
  };

  const handleNew = () => { setEditing(null); resetForm(); setShowForm(true); };

  const handleEdit = (lt) => {
    setEditing(lt);
    setForm({
      name: lt.name || "", eligibilityMonths: lt.eligibilityMonths ?? "",
      baseAllocation: lt.baseAllocation ?? 0, annualIncrementDays: lt.annualIncrementDays ?? 0,
      incrementCap: lt.incrementCap ?? "", maxDaysPerYear: lt.maxDaysPerYear ?? "",
      maxCarryForwardYears: lt.maxCarryForwardYears ?? "", maxContinuousDaysAllowed: lt.maxContinuousDaysAllowed ?? "",
      isEncashable: lt.isEncashable || false, includeHolidays: lt.includeHolidays || false,
      includeWeekends: lt.includeWeekends || false,
    });
    const rules = lt.allocationRules || [];
    const genderRule = rules.find(r => r.field === "gender");
    if (genderRule) {
      setGenderRuleEnabled(true);
      setGenderRuleDays(genderRule.days);
      setSelectedGenders(Array.isArray(genderRule.value) ? genderRule.value : [genderRule.value]);
    } else {
      setGenderRuleEnabled(false); setGenderRuleDays(0); setSelectedGenders([]);
    }
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toggleGender = (gender) => {
    setSelectedGenders((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]
    );
  };

  const buildAllocationRules = () => {
    const rules = [];
    if (genderRuleEnabled && selectedGenders.length > 0) {
      rules.push({ field: "gender", value: selectedGenders, days: parseInt(genderRuleDays) || 0 });
    }
    return rules.length > 0 ? rules : null;
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        eligibilityMonths: form.eligibilityMonths ? parseInt(form.eligibilityMonths) : null,
        baseAllocation: genderRuleEnabled ? 0 : parseFloat(form.baseAllocation) || 0,
        annualIncrementDays: parseFloat(form.annualIncrementDays) || 0,
        incrementCap: form.incrementCap ? parseFloat(form.incrementCap) : null,
        maxDaysPerYear: form.maxDaysPerYear ? parseFloat(form.maxDaysPerYear) : null,
        maxCarryForwardYears: form.maxCarryForwardYears ? parseInt(form.maxCarryForwardYears) : null,
        maxContinuousDaysAllowed: form.maxContinuousDaysAllowed ? parseInt(form.maxContinuousDaysAllowed) : null,
        allocationRules: buildAllocationRules(),
      };

      if (editing) {
        await apiClient.patch(`/leaves/leave-types/${editing.id}`, payload);
        toast.success("Leave type updated");
      } else {
        await apiClient.post("/leaves/leave-types", payload);
        toast.success("Leave type created");
      }
      setShowForm(false);
      fetchLeaveTypes();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (lt) => {
    if (!confirm(`Disable "${lt.name}"?`)) return;
    try { await apiClient.delete(`/leaves/leave-types/${lt.id}`); toast.success("Leave type disabled"); fetchLeaveTypes(); }
    catch (err) { toast.error(err?.response?.data?.message || "Failed to disable"); }
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <PageHeader title="Leave Types" subtitle="Define leave categories, accrual rules, and carry-forward policies" icon={<Calendar className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300" />
              Show inactive
            </label>
            {canCreate && (
              <button onClick={handleNew} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> Add Leave Type
              </button>
            )}
          </div>
        }
      />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input placeholder="Search leave types..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
        ) : leaveTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400"><Calendar className="w-10 h-10 opacity-20 mb-2" /><p className="text-sm">No leave types found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Name</th>
                  <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase">Eligibility</th>
                  <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase">Base</th>
                  <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase">Incr/Yr</th>
                  <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase">Cap</th>
                  <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase">Max/Yr</th>
                  <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase">Carry</th>
                  <th className="text-center py-3 px-3 text-[11px] font-bold text-gray-500 uppercase">Flags</th>
                  <th className="text-center py-3 px-3 text-[11px] font-bold text-gray-500 uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leaveTypes.map((lt) => (
                  <tr key={lt.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4"><div className="text-sm font-semibold text-gray-900">{lt.name}</div></td>
                    <td className="py-3 px-3 text-sm text-gray-700">{lt.eligibilityMonths ? `${lt.eligibilityMonths}mo` : "—"}</td>
                    <td className="py-3 px-3 text-sm text-gray-700">{lt.baseAllocation || "—"}</td>
                    <td className="py-3 px-3 text-sm text-gray-700">{lt.annualIncrementDays || "—"}</td>
                    <td className="py-3 px-3 text-sm text-gray-700">{lt.incrementCap || "—"}</td>
                    <td className="py-3 px-3 text-sm text-gray-700">{lt.maxDaysPerYear || "—"}</td>
                    <td className="py-3 px-3 text-sm text-gray-700">{lt.maxCarryForwardYears ? `${lt.maxCarryForwardYears}yr` : "—"}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {lt.isEncashable && <FlagBadge label="Encash" color="green" />}
                        {lt.includeWeekends && <FlagBadge label="+WE" color="purple" />}
                        {lt.includeHolidays && <FlagBadge label="+Hol" color="violet" />}
                        {lt.allocationRules?.length > 0 && <FlagBadge label="Rule" color="blue" />}
                        {!lt.isEncashable && !lt.includeWeekends && !lt.includeHolidays && !lt.allocationRules?.length && <span className="text-xs text-gray-300">—</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${lt.isActive ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                        {lt.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canWrite && <button onClick={() => handleEdit(lt)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>}
                        {canDelete && lt.isActive && <button onClick={() => handleDelete(lt)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{editing ? "Edit Leave Type" : "New Leave Type"}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Configure accrual rules, limits, and gender-based overrides</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Leave Type Name <span className="text-red-400">*</span></label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Annual Leave, Maternity Leave" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400" />
              </div>

              {/* Accrual */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Allocation & Accrual</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Eligibility (months)" name="eligibilityMonths" value={form.eligibilityMonths} onChange={handleChange} placeholder="e.g. 9" />
                  <Field label="Base Days" name="baseAllocation" value={form.baseAllocation} onChange={handleChange} type="number" disabled={genderRuleEnabled} />
                  <Field label="Days Increment / Year" name="annualIncrementDays" value={form.annualIncrementDays} onChange={handleChange} type="number" />
                  <Field label="Entitlement Cap" name="incrementCap" value={form.incrementCap} onChange={handleChange} type="number" placeholder="e.g. 30" />
                  <Field label="Max Days Per Year" name="maxDaysPerYear" value={form.maxDaysPerYear} onChange={handleChange} type="number" placeholder="e.g. 30" />
                  <Field label="Carry Forward Limit (years)" name="maxCarryForwardYears" value={form.maxCarryForwardYears} onChange={handleChange} type="number" placeholder="e.g. 2" />
                  <Field label="Max Consecutive Days" name="maxContinuousDaysAllowed" value={form.maxContinuousDaysAllowed} onChange={handleChange} type="number" placeholder="Unlimited" />
                </div>
              </div>

              {/* Gender Rule */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Gender-Based Override</h4>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input type="checkbox" checked={genderRuleEnabled} onChange={(e) => { setGenderRuleEnabled(e.target.checked); if (e.target.checked) setForm(p => ({ ...p, baseAllocation: 0 })); }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Enable gender-based allocation rule</span>
                </label>
                {genderRuleEnabled && (
                  <div className="p-4 border border-blue-200 rounded-xl bg-blue-50/30 space-y-4">
                    <p className="text-xs text-gray-500">Select which genders get a fixed allocation. Base Days will be set to 0.</p>
                    <div className="flex flex-wrap gap-2">
                      {GENDER_OPTIONS.map((g) => (
                        <button key={g} type="button" onClick={() => toggleGender(g)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${selectedGenders.includes(g) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Days Allocated</label>
                      <input type="number" value={genderRuleDays} onChange={(e) => setGenderRuleDays(e.target.value)}
                        className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400" min="0" />
                    </div>
                  </div>
                )}
              </div>

              {/* Flags */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Behavior Flags</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Toggle name="isEncashable" checked={form.isEncashable} onChange={handleChange} label="Encashable — unused days convertible to salary" />
                  <Toggle name="includeHolidays" checked={form.includeHolidays} onChange={handleChange} label="Include Holidays — count as leave days" />
                  <Toggle name="includeWeekends" checked={form.includeWeekends} onChange={handleChange} label="Include Weekends — count as leave days" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? "Update" : "Create"} Leave Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", placeholder, disabled }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`} />
    </div>
  );
}

function Toggle({ name, checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0" />
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </label>
  );
}

function FlagBadge({ label, color }) {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${colors[color] || ""}`}>{label}</span>;
}