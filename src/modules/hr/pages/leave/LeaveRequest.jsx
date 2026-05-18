import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Calendar, FileText, Send, X, ChevronRight, ChevronLeft, Check,
  AlertCircle, Loader2, User, Info, Save, Eye, CheckCircle2, Plus, Hash, Layers,
} from "lucide-react";
import { toast } from "sonner";

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
};

const extractData = (res) => res?.data?.data?.data || res?.data?.data || res?.data || {};
const extractArray = (res) => {
  const data = res?.data?.data?.data || res?.data?.data || res?.data || [];
  return Array.isArray(data) ? data : [];
};

const calculateDays = (from, to, includeWeekends = false, includeHolidays = false) => {
  if (!from || !to) return 0;
  const start = new Date(from);
  const end = new Date(to);
  if (start > end) return 0;
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (!includeWeekends && (day === 0 || day === 6)) { current.setDate(current.getDate() + 1); continue; }
    count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

export default function LeaveRequest({ onCancel, onSuccess }) {
  const navigate = useNavigate();
  const { canCreate } = usePermission("LeaveApplication");

  const [step, setStep] = useState(1);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidayLists, setHolidayLists] = useState([]);
  const [leavePeriods, setLeavePeriods] = useState([]);
  const [periodBalances, setPeriodBalances] = useState([]);

  const [form, setForm] = useState({
    leaveTypeId: "", leavePeriodId: "", fromDate: "", toDate: "", reason: "", holidayListId: "",
  });
  const [errors, setErrors] = useState({});

  const [workingDays, setWorkingDays] = useState(0);
  const [selectedPeriodBalance, setSelectedPeriodBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);

  // ═══════════════════════════════════════════════════════════════
  //  FETCH DATA
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    (async () => {
      setLoadingData(true);
      try {
        const [typeRes, holidayRes, periodRes, summaryRes] = await Promise.all([
          apiClient.get("/leaves/leave-types"),
          apiClient.get("/leaves/holiday-lists"),
          apiClient.get("/leaves/leave-periods?isActive=true"),
          apiClient.get("/leaves/my-leave/summary"),
        ]);

        setLeaveTypes(extractArray(typeRes).filter((t) => t.isActive));
        setHolidayLists(extractArray(holidayRes).filter((h) => !h.disabled));
        setLeavePeriods(extractArray(periodRes));

        const summary = extractData(summaryRes);
        if (summary?.employee?.id) {
          setCurrentEmployee(summary.employee);
        }
        if (summary?.balances) {
          setPeriodBalances(summary.balances);
        }
      } catch {
        toast.error("Failed to load form data");
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  // ═══════════════════════════════════════════════════════════════
  //  CALCULATE WORKING DAYS & CHECK PERIOD BALANCE
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (form.fromDate && form.toDate && form.leaveTypeId && currentEmployee?.id) {
      const leaveType = leaveTypes.find((lt) => lt.id === form.leaveTypeId);
      const days = calculateDays(form.fromDate, form.toDate, leaveType?.includeWeekends || false, leaveType?.includeHolidays || false);
      setWorkingDays(days);

      if (form.leavePeriodId) {
        checkPeriodBalance(currentEmployee.id, form.leaveTypeId, form.leavePeriodId);
      } else {
        setSelectedPeriodBalance(null);
      }
    } else {
      setWorkingDays(0);
      setSelectedPeriodBalance(null);
    }
  }, [form.fromDate, form.toDate, form.leaveTypeId, form.leavePeriodId, currentEmployee, leaveTypes]);

  const checkPeriodBalance = async (employeeId, leaveTypeId, leavePeriodId) => {
    if (!employeeId || !leaveTypeId || !leavePeriodId) { setSelectedPeriodBalance(null); return; }
    setBalanceLoading(true);
    try {
      const res = await apiClient.get(`/leaves/balances/${employeeId}/${leaveTypeId}`);
      const data = res?.data?.data?.data || res?.data?.data || res?.data || {};
      const periodBalances = data.periodBalances || [];
      const period = periodBalances.find((p) => p.leavePeriodId === leavePeriodId);
      setSelectedPeriodBalance(period || { balance: 0 });
    } catch {
      setSelectedPeriodBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  //  FORM HANDLERS
  // ═══════════════════════════════════════════════════════════════
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const selectedLeaveType = leaveTypes.find((lt) => lt.id === form.leaveTypeId);
  const selectedPeriod = leavePeriods.find((p) => p.id === form.leavePeriodId);

  const validate = () => {
    const errs = {};
    if (!form.leaveTypeId) errs.leaveTypeId = "Please select a leave type";
    if (!form.leavePeriodId) errs.leavePeriodId = "Please select a leave period";
    if (!form.fromDate) errs.fromDate = "Required";
    if (!form.toDate) errs.toDate = "Required";
    if (new Date(form.fromDate) > new Date(form.toDate)) errs.toDate = "End date must be after start date";
    if (workingDays <= 0) errs.toDate = "No working days in selected period";
    if (selectedPeriodBalance && workingDays > selectedPeriodBalance.balance) {
      errs.leavePeriodId = `Insufficient balance in this period. Available: ${selectedPeriodBalance.balance} days`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(2);
    else toast.error("Please fix the errors before continuing");
  };

  // ═══════════════════════════════════════════════════════════════
  //  SUBMIT
  // ═══════════════════════════════════════════════════════════════
  const handleSaveDraft = async () => {
    if (!currentEmployee?.id) { toast.error("Employee not found"); return; }
    setSubmitting(true);
    try {
      const payload = {
        employeeId: currentEmployee.id, leaveTypeId: form.leaveTypeId,
        leavePeriodId: form.leavePeriodId, fromDate: form.fromDate, toDate: form.toDate,
        reason: form.reason || null, holidayListId: form.holidayListId || null,
      };
      const res = await apiClient.post("/leaves/applications", payload);
      toast.success("Leave application saved as Draft");
      setSubmittedApp(extractData(res));
      setStep(3);
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to save"); }
    finally { setSubmitting(false); }
  };

  const handleSubmitAndSend = async () => {
    if (!currentEmployee?.id) { toast.error("Employee not found"); return; }
    if (!currentEmployee?.reportsTo) {
      toast.error("No manager assigned. Application will be saved as Draft.");
      handleSaveDraft(); return;
    }
    setSubmitting(true);
    try {
      const payload = {
        employeeId: currentEmployee.id, leaveTypeId: form.leaveTypeId,
        leavePeriodId: form.leavePeriodId, fromDate: form.fromDate, toDate: form.toDate,
        reason: form.reason || null, holidayListId: form.holidayListId || null,
      };
      const createRes = await apiClient.post("/leaves/applications", payload);
      const app = extractData(createRes);
      await apiClient.post(`/leaves/applications/${app.id}/submit`);
      toast.success("Leave application submitted for approval!");
      setSubmittedApp(app);
      setStep(3);
      if (onSuccess) setTimeout(() => onSuccess(), 1500);
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to submit"); }
    finally { setSubmitting(false); }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
        <span className="text-sm text-gray-400">Loading form...</span>
      </div>
    );
  }

  if (!currentEmployee?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <AlertCircle className="w-12 h-12 opacity-20 mb-4" />
        <p className="text-sm font-medium text-gray-500">No employee record found. Contact HR.</p>
        <button onClick={() => (onCancel ? onCancel() : navigate(-1))} className="mt-4 text-xs text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader title="New Leave Application" subtitle="Submit a leave request for yourself" icon={<FileText className="w-5 h-5" />}
        actions={
          <button onClick={() => (onCancel ? onCancel() : navigate(-1))} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4" /> Cancel
          </button>
        }
      />

      {/* Employee info */}
      <div className="flex items-center gap-4 px-5 py-4 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {(currentEmployee.name || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-blue-800">{currentEmployee.name}</p>
          <p className="text-xs text-blue-600">{currentEmployee.employeeNumber} · {currentEmployee.department || "N/A"}</p>
        </div>
        {!currentEmployee.reportsTo ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700"><AlertCircle className="w-3 h-3" /> No manager</span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" /> Reports to {currentEmployee.reportsTo?.name}</span>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s ? "bg-blue-600 text-white" : step > s ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            <span className={`text-xs font-medium ${step >= s ? "text-gray-700" : "text-gray-400"}`}>{s === 1 ? "Details" : s === 2 ? "Review" : "Done"}</span>
            {s < 3 && <div className={`w-8 h-px ${step > s ? "bg-green-500" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Leave Type */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Leave Type <span className="text-red-400">*</span></label>
              <select name="leaveTypeId" value={form.leaveTypeId} onChange={handleChange}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-50 ${errors.leaveTypeId ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`}>
                <option value="">Select leave type...</option>
                {leaveTypes.map((lt) => (<option key={lt.id} value={lt.id}>{lt.name}</option>))}
              </select>
              {errors.leaveTypeId && <p className="text-xs text-red-500 mt-1">{errors.leaveTypeId}</p>}
            </div>

            {/* Leave Period */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Leave Period <span className="text-red-400">*</span></label>
              <select name="leavePeriodId" value={form.leavePeriodId} onChange={handleChange}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-50 ${errors.leavePeriodId ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`}>
                <option value="">Select period...</option>
                {leavePeriods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.startDate} – {p.endDate})</option>
                ))}
              </select>
              {errors.leavePeriodId && <p className="text-xs text-red-500 mt-1">{errors.leavePeriodId}</p>}
            </div>

            {/* Holiday List */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Holiday Calendar</label>
              <select name="holidayListId" value={form.holidayListId} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400">
                <option value="">Default</option>
                {holidayLists.map((h) => (<option key={h.id} value={h.id}>{h.name}</option>))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">From Date <span className="text-red-400">*</span></label>
              <input type="date" name="fromDate" value={form.fromDate} onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-50 ${errors.fromDate ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`} />
              {errors.fromDate && <p className="text-xs text-red-500 mt-1">{errors.fromDate}</p>}
            </div>

            {/* To Date */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">To Date <span className="text-red-400">*</span></label>
              <input type="date" name="toDate" value={form.toDate} onChange={handleChange}
                min={form.fromDate || new Date().toISOString().split("T")[0]}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-50 ${errors.toDate ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`} />
              {errors.toDate && <p className="text-xs text-red-500 mt-1">{errors.toDate}</p>}
            </div>

            {/* Working Days */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Working Days</label>
              <div className="px-3 py-2.5 text-sm border border-gray-100 bg-gray-50 rounded-lg text-gray-700 font-semibold">
                {workingDays > 0 ? `${workingDays} day${workingDays !== 1 ? "s" : ""}` : "—"}
              </div>
            </div>

            {/* Period Balance */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Period Balance</label>
              <div className={`px-3 py-2.5 text-sm border rounded-lg ${
                balanceLoading ? "bg-gray-50 border-gray-100" :
                selectedPeriodBalance && workingDays > selectedPeriodBalance.balance ? "bg-red-50 border-red-200 text-red-700 font-semibold" :
                selectedPeriodBalance ? "bg-gray-50 border-gray-100 text-gray-700 font-semibold" : "bg-gray-50 border-gray-100 text-gray-400"
              }`}>
                {balanceLoading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Checking...</span> :
                 selectedPeriodBalance ? `${selectedPeriodBalance.balance} day${selectedPeriodBalance.balance !== 1 ? "s" : ""} in ${selectedPeriod?.name || "this period"}` :
                 "Select period"}
              </div>
            </div>

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Reason</label>
              <textarea name="reason" value={form.reason} onChange={handleChange} rows={3}
                placeholder="Explain the reason for your leave request..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <button onClick={handleSaveDraft} disabled={submitting || workingDays <= 0}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" /> Save as Draft
            </button>
            <button onClick={handleNext} disabled={workingDays <= 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              Review & Submit <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : step === 2 ? (
        /* Review */
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Eye className="w-4 h-4 text-blue-600" /> Review Your Application</h3>
            <p className="text-xs text-gray-500 mt-0.5">Please verify all details before submitting</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReviewField label="Employee" value={<span className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-gray-400" />{currentEmployee.name}<span className="text-gray-300">·</span><span className="font-mono text-xs">{currentEmployee.employeeNumber}</span></span>} />
            <ReviewField label="Leave Type" value={<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">{selectedLeaveType?.name}</span>} />
            <ReviewField label="Period" value={selectedPeriod ? `${selectedPeriod.name}` : "—"} />
            <ReviewField label="From" value={fmtDate(form.fromDate)} />
            <ReviewField label="To" value={fmtDate(form.toDate)} />
            <ReviewField label="Working Days" value={<span className="text-blue-600 font-bold text-lg">{workingDays} day{workingDays !== 1 ? "s" : ""}</span>} />
            <ReviewField label="Period Balance" value={selectedPeriodBalance ? `${selectedPeriodBalance.balance} days${workingDays > selectedPeriodBalance.balance ? " (INSUFFICIENT)" : ""}` : "—"} />
            <ReviewField label="Holiday Calendar" value={holidayLists.find((h) => h.id === form.holidayListId)?.name || "Default"} />
            <ReviewField label="Reason" value={form.reason || "—"} />
            <ReviewField label="Reports To" value={currentEmployee.reportsTo?.name || "Not assigned"} />
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /> Edit</button>
            <div className="flex items-center gap-3">
              <button onClick={handleSaveDraft} disabled={submitting} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"><Save className="w-4 h-4" /> Save Draft</button>
              <button onClick={handleSubmitAndSend} disabled={submitting || (selectedPeriodBalance && workingDays > selectedPeriodBalance.balance)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {currentEmployee.reportsTo ? "Submit for Approval" : "Save as Draft"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Success */
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
          <h2 className="text-xl font-bold text-gray-900">Application {submittedApp?.status === "Open" ? "Submitted!" : "Saved!"}</h2>
          <p className="text-sm text-gray-500 mt-2">{submittedApp?.status === "Open" ? "Your leave application has been submitted for approval." : "Your leave application has been saved as Draft."}</p>
          {submittedApp && <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"><Hash className="w-3.5 h-3.5" />Reference: {submittedApp.id?.substring(0, 8)}</div>}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => (onCancel ? onCancel() : navigate(-1))} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"><X className="w-4 h-4" /> Close</button>
            <button onClick={() => { setStep(1); setForm({ leaveTypeId: "", leavePeriodId: "", fromDate: "", toDate: "", reason: "", holidayListId: "" }); setWorkingDays(0); setSelectedPeriodBalance(null); setSubmittedApp(null); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" /> New Application</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewField({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}