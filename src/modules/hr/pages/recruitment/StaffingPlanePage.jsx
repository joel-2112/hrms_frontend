import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Plus,
  Edit3,
  Send,
  CheckCircle,
  X,
  RefreshCw,
  Briefcase,
  Users,
  DollarSign,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  0: { label: "Draft", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  1: {
    label: "Submitted",
    color: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  2: {
    label: "Active",
    color: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  3: {
    label: "Cancelled",
    color: "bg-red-100 text-red-600",
    dot: "bg-red-400",
  },
};

const fmt = (n) => (n != null ? Number(n).toLocaleString() : "—");
const fmtD = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtDShort = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })
    : "—";

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ docStatus }) {
  const cfg = STATUS_CFG[docStatus] ?? STATUS_CFG[0];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ProgressBar({ value, max, color = "bg-blue-500" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 tabular-nums w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

// ─── popover / dropdown ───────────────────────────────────────────────────────

function usePopover() {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);

  const toggle = useCallback(() => {
    if (!open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
    setOpen((v) => !v);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return { open, rect, triggerRef, toggle, close };
}

function Popover({ open, rect, onClose, children, minWidth = 480 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open || !rect) return null;

  // pin to bottom so it doesn't overflow viewport
  const maxHeight = window.innerHeight - rect.bottom - 20;
  const style = {
    position: "fixed",
    top: rect.bottom + 6,
    right: window.innerWidth - rect.right,
    width: Math.min(minWidth, window.innerWidth - 32),
    maxHeight: Math.max(200, maxHeight),
    zIndex: 9999,
  };

  return (
    <div
      ref={ref}
      style={style}
      className="bg-white rounded-xl border border-gray-200 shadow-xl flex flex-col overflow-hidden"
    >
      {children}
    </div>
  );
}

// ─── select field ─────────────────────────────────────────────────────────────

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder-gray-300";

// ─── form popover (scrollable body) ──────────────────────────────────────────

function PlanFormPopover({
  open,
  rect,
  onClose,
  editingPlan,
  companies,
  departments,
  designationOptions,
  onSaved,
}) {
  const isEdit = !!editingPlan;

  const blank = () => ({
    name: "",
    companyId: "",
    departmentId: "",
    fromDate: "",
    toDate: "",
    planDetails: [],
  });

  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    if (editingPlan) {
      setForm({
        name: editingPlan.name || "",
        companyId: editingPlan.companyId || "",
        departmentId: editingPlan.departmentId || "",
        fromDate: editingPlan.fromDate || "",
        toDate: editingPlan.toDate || "",
        planDetails: (editingPlan.planDetails || []).map((d) => ({
          designationId: d.designationId || "",
          numberOfPositions: d.numberOfPositions ?? 1,
          estimatedCostPerPosition: d.estimatedCostPerPosition ?? 0,
        })),
      });
    } else {
      setForm(blank());
    }
    setErrors({});
  }, [open, editingPlan]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const filteredDepts = useMemo(
    () =>
      form.companyId
        ? departments.filter((d) => d.companyId === form.companyId)
        : departments,
    [departments, form.companyId],
  );

  const addRow = () =>
    set("planDetails", [
      ...form.planDetails,
      { designationId: "", numberOfPositions: 1, estimatedCostPerPosition: 0 },
    ]);

  const updateRow = (i, k, v) => {
    const next = form.planDetails.map((r, idx) =>
      idx === i ? { ...r, [k]: v } : r,
    );
    set("planDetails", next);
  };

  const removeRow = (i) =>
    set(
      "planDetails",
      form.planDetails.filter((_, idx) => idx !== i),
    );

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.companyId) e.companyId = "Required";
    if (!form.fromDate) e.fromDate = "Required";
    if (!form.toDate) e.toDate = "Required";
    if (form.fromDate && form.toDate && form.fromDate >= form.toDate)
      e.toDate = "Must be after From Date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = { ...form };
    if (!payload.departmentId) delete payload.departmentId;
    try {
      if (isEdit) {
        await apiClient.patch(
          `/recruitment/staffing-plans/${editingPlan.id}`,
          payload,
        );
        toast.success("Plan updated.");
      } else {
        await apiClient.post("/recruitment/staffing-plans", payload);
        toast.success("Plan created.");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const budgetPreview = form.planDetails.reduce(
    (s, d) =>
      s +
      (Number(d.numberOfPositions) || 0) *
        (Number(d.estimatedCostPerPosition) || 0),
    0,
  );

  return (
    <Popover open={open} rect={rect} onClose={onClose} minWidth={520}>
      {/* fixed header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {isEdit ? "Edit staffing plan" : "New staffing plan"}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEdit
              ? "Update plan details · only Draft plans can be edited"
              : "Define budget and headcount targets"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* scrollable body — THIS is the key change */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        style={{ minHeight: 0 }}
      >
        {/* plan name */}
        <Field label="Plan name" required>
          <input
            className={`${inputCls} ${errors.name ? "border-red-300" : ""}`}
            placeholder="e.g. Engineering Hiring Plan Q2 2026"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </Field>

        {/* company + department */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company" required>
            <select
              className={`${inputCls} ${errors.companyId ? "border-red-300" : ""}`}
              value={form.companyId}
              onChange={(e) => {
                set("companyId", e.target.value);
                set("departmentId", "");
              }}
            >
              <option value="">Select company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.companyId && (
              <p className="text-xs text-red-500 mt-1">{errors.companyId}</p>
            )}
          </Field>
          <Field label="Department">
            <select
              className={inputCls}
              value={form.departmentId}
              onChange={(e) => set("departmentId", e.target.value)}
            >
              <option value="">All departments</option>
              {filteredDepts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* dates */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="From date" required>
            <input
              type="date"
              className={`${inputCls} ${errors.fromDate ? "border-red-300" : ""}`}
              value={form.fromDate}
              onChange={(e) => set("fromDate", e.target.value)}
            />
            {errors.fromDate && (
              <p className="text-xs text-red-500 mt-1">{errors.fromDate}</p>
            )}
          </Field>
          <Field label="To date" required>
            <input
              type="date"
              className={`${inputCls} ${errors.toDate ? "border-red-300" : ""}`}
              value={form.toDate}
              onChange={(e) => set("toDate", e.target.value)}
            />
            {errors.toDate && (
              <p className="text-xs text-red-500 mt-1">{errors.toDate}</p>
            )}
          </Field>
        </div>

        {/* positions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Positions
            </label>
            <button
              onClick={addRow}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add row
            </button>
          </div>

          {form.planDetails.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-lg py-6 text-center text-xs text-gray-400">
              No positions defined — click "Add row" to specify headcount
              targets
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[1fr_64px_80px_28px] gap-2 px-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Designation
                </span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">
                  Pos.
                </span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">
                  Cost/pos
                </span>
                <span />
              </div>
              {form.planDetails.map((d, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_64px_80px_28px] gap-2 items-center"
                >
                  <select
                    value={d.designationId}
                    onChange={(e) =>
                      updateRow(i, "designationId", e.target.value)
                    }
                    className={inputCls}
                  >
                    <option value="">Select…</option>
                    {designationOptions.map((des) => (
                      <option key={des.id} value={des.id}>
                        {des.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={d.numberOfPositions}
                    onChange={(e) =>
                      updateRow(
                        i,
                        "numberOfPositions",
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    placeholder="ETB"
                    value={d.estimatedCostPerPosition || ""}
                    onChange={(e) =>
                      updateRow(
                        i,
                        "estimatedCostPerPosition",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                  <button
                    onClick={() => removeRow(i)}
                    className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {budgetPreview > 0 && (
            <div className="mt-3 flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
              <span className="text-xs text-blue-700 font-medium">
                Estimated total budget
              </span>
              <span className="text-sm font-bold text-blue-800 tabular-nums">
                {fmt(budgetPreview)} ETB
              </span>
            </div>
          )}
        </div>

        {/* bottom spacer so last row doesn't stick to footer */}
        <div className="h-2" />
      </div>

      {/* fixed footer */}
      <div className="flex-shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
        <button
          onClick={onClose}
          className="px-3.5 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          {saving ? "Saving…" : isEdit ? "Update plan" : "Create plan"}
        </button>
      </div>
    </Popover>
  );
}

// ─── plan row (list view) ─────────────────────────────────────────────────────

function PlanRow({
  plan,
  designationMap,
  canWrite,
  canSubmit,
  onEdit,
  onSubmit,
  onApprove,
  onRefresh,
}) {
  const [expanded, setExpanded] = useState(false);
  const [actioning, setActioning] = useState(null);

  const details = plan.planDetails || [];
  const totalPos = details.reduce(
    (s, d) => s + (Number(d.numberOfPositions) || 0),
    0,
  );
  const totalCur = details.reduce(
    (s, d) => s + (Number(d.currentCount) || 0),
    0,
  );
  const totalVac = details.reduce((s, d) => s + (Number(d.vacancies) || 0), 0);
  const budget =
    Number(plan.totalEstimatedBudget) ||
    details.reduce((s, d) => s + (Number(d.totalEstimatedCost) || 0), 0);
  const fillRate = totalPos > 0 ? totalCur / totalPos : 0;

  const act = async (fn, label) => {
    setActioning(label);
    try {
      await fn();
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden hover:border-gray-300 transition-colors">
      {/* main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 flex-shrink-0"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {plan.name}
            </span>
            <StatusBadge docStatus={plan.docStatus} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {plan.company?.name || "—"}
            </span>
            {plan.department?.name && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {plan.department.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {fmtDShort(plan.fromDate)} – {fmtDShort(plan.toDate)}
            </span>
          </div>
        </div>

        {/* metrics */}
        <div className="hidden md:flex items-center gap-6 text-xs text-gray-500 flex-shrink-0">
          <div className="text-center min-w-[48px]">
            <div className="text-base font-bold text-gray-900 tabular-nums">
              {totalPos || "—"}
            </div>
            <div className="text-gray-400">planned</div>
          </div>
          <div className="text-center min-w-[48px]">
            <div
              className={`text-base font-bold tabular-nums ${totalVac > 0 ? "text-amber-600" : "text-gray-900"}`}
            >
              {details.length > 0 ? totalVac : "—"}
            </div>
            <div className="text-gray-400">vacancies</div>
          </div>
          <div className="min-w-[120px]">
            <div className="text-xs text-gray-500 mb-1">
              Fill rate · {totalCur}/{totalPos}
            </div>
            <ProgressBar
              value={totalCur}
              max={totalPos}
              color={
                fillRate >= 0.8
                  ? "bg-emerald-500"
                  : fillRate >= 0.5
                    ? "bg-blue-500"
                    : "bg-amber-400"
              }
            />
          </div>
          {budget > 0 && (
            <div className="text-center min-w-[90px]">
              <div className="text-sm font-bold text-gray-900 tabular-nums">
                {fmt(budget)}
              </div>
              <div className="text-gray-400">ETB budget</div>
            </div>
          )}
        </div>

        {/* actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {plan.docStatus === 0 && canWrite && (
            <button
              onClick={() => onEdit(plan)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
          {plan.docStatus === 0 && canSubmit && (
            <button
              onClick={() => act(() => onSubmit(plan.id), "submit")}
              disabled={actioning === "submit"}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-all"
            >
              {actioning === "submit" ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}{" "}
              Submit
            </button>
          )}
          {plan.docStatus === 1 && canSubmit && (
            <button
              onClick={() => act(() => onApprove(plan.id), "approve")}
              disabled={actioning === "approve"}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-all"
            >
              {actioning === "approve" ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3" />
              )}{" "}
              Approve
            </button>
          )}
          {plan.docStatus === 2 && (
            <span className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle className="w-3 h-3" /> Active
            </span>
          )}
        </div>
      </div>

      {/* expanded detail table */}
      {expanded && details.length > 0 && (
        <div className="border-t border-gray-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="text-center px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">
                  Planned
                </th>
                <th className="text-center px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">
                  Current
                </th>
                <th className="text-center px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">
                  Vacancies
                </th>
                <th className="text-right px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider">
                  Cost/pos
                </th>
                <th className="text-right px-4 py-2 font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-2 w-32" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {details.map((d, i) => {
                const vac =
                  d.vacancies ??
                  (d.numberOfPositions || 0) - (d.currentCount || 0);
                const cur = d.currentCount ?? null;
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      {designationMap[d.designationId] ||
                        d.designationId ||
                        "—"}
                    </td>
                    <td className="text-center px-3 py-2.5 tabular-nums">
                      {d.numberOfPositions}
                    </td>
                    <td className="text-center px-3 py-2.5 tabular-nums text-gray-500">
                      {cur != null ? (
                        cur
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-semibold tabular-nums ${vac > 0 ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {vac}
                      </span>
                    </td>
                    <td className="text-right px-3 py-2.5 tabular-nums text-gray-500">
                      {d.estimatedCostPerPosition
                        ? `${fmt(d.estimatedCostPerPosition)} ETB`
                        : "—"}
                    </td>
                    <td className="text-right px-4 py-2.5 tabular-nums font-semibold text-gray-800">
                      {d.totalEstimatedCost
                        ? `${fmt(d.totalEstimatedCost)} ETB`
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {cur != null && d.numberOfPositions > 0 && (
                        <ProgressBar
                          value={cur}
                          max={d.numberOfPositions}
                          color={
                            cur >= d.numberOfPositions
                              ? "bg-emerald-500"
                              : "bg-blue-400"
                          }
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {details.length > 1 && (
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                  <td className="px-4 py-2 text-xs text-gray-600">Totals</td>
                  <td className="text-center px-3 py-2 tabular-nums text-gray-800">
                    {totalPos}
                  </td>
                  <td className="text-center px-3 py-2 tabular-nums text-gray-500">
                    {totalCur}
                  </td>
                  <td className="text-center px-3 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${totalVac > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {totalVac}
                    </span>
                  </td>
                  <td className="px-3" />
                  <td className="text-right px-4 py-2 tabular-nums text-gray-800">
                    {budget ? `${fmt(budget)} ETB` : "—"}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
          <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-3 text-xs text-gray-400">
            <Clock className="w-3 h-3" /> Created {fmtD(plan.createdAt)}
            {plan.updatedAt !== plan.createdAt &&
              ` · Updated ${fmtD(plan.updatedAt)}`}
          </div>
        </div>
      )}
      {expanded && details.length === 0 && (
        <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400 text-center">
          No position details defined on this plan.
        </div>
      )}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function StaffingPlansPage() {
  const perms = usePermission("StaffingPlan");
  const canCreate = perms.canCreate;
  const canWrite = perms.canWrite;
  const canSubmit = perms.canSubmit;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designationOptions, setDesignationOptions] = useState([]);
  const [designationMap, setDesignationMap] = useState({});
  const [editingPlan, setEditingPlan] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const {
    open: popOpen,
    rect: popRect,
    triggerRef,
    toggle: togglePop,
    close: closePop,
  } = usePopover();

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/recruitment/staffing-plans");
      const data = res?.data?.data;
      setPlans(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load staffing plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRefs = useCallback(async () => {
    try {
      const [c, d, des] = await Promise.all([
        apiClient.get("/organizations/companies?limit=100"),
        apiClient.get("/organizations/departments?limit=200"),
        apiClient.get("/organizations/designations?limit=300"),
      ]);
      setCompanies(c?.data?.data?.companies || []);
      setDepartments(d?.data?.data?.departments || []);
      const desigs = des?.data?.data?.designations || des?.data?.data || [];
      setDesignationOptions(desigs);
      const map = {};
      desigs.forEach((x) => (map[x.id] = x.name));
      setDesignationMap(map);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchRefs();
  }, [fetchPlans, fetchRefs]);

  const handleSubmit = async (id) => {
    await apiClient.put(`/recruitment/staffing-plans/${id}/submit`);
    toast.success("Plan submitted.");
    fetchPlans();
  };
  const handleApprove = async (id) => {
    await apiClient.put(`/recruitment/staffing-plans/${id}/approve`);
    toast.success("Plan approved.");
    fetchPlans();
  };

  const openCreate = () => {
    setEditingPlan(null);
    togglePop();
  };
  const openEdit = (plan) => {
    setEditingPlan(plan);
    togglePop();
  };

  const stats = useMemo(() => {
    const active = plans.filter((p) => p.docStatus === 2).length;
    const submitted = plans.filter((p) => p.docStatus === 1).length;
    const draft = plans.filter((p) => p.docStatus === 0).length;
    const budget = plans.reduce(
      (s, p) => s + (Number(p.totalEstimatedBudget) || 0),
      0,
    );
    const vacancies = plans.reduce(
      (s, p) =>
        s +
        (p.planDetails || []).reduce(
          (ss, d) => ss + (Number(d.vacancies) || 0),
          0,
        ),
      0,
    );
    return { total: plans.length, active, submitted, draft, budget, vacancies };
  }, [plans]);

  const filtered = useMemo(() => {
    if (filterStatus === "all") return plans;
    const map = { draft: 0, submitted: 1, active: 2, cancelled: 3 };
    return plans.filter((p) => p.docStatus === map[filterStatus]);
  }, [plans, filterStatus]);

  return (
    <div className="flex flex-col gap-5 pb-10">
      <PageHeader
        title="Staffing plans"
        subtitle="Headcount budget planning — define positions and approval workflow"
        icon={<Briefcase className="w-5 h-5" />}
      />

      {!loading && plans.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            {
              label: "Total plans",
              val: stats.total,
              icon: <FileText className="w-4 h-4" />,
              color: "text-gray-500 bg-gray-50",
            },
            {
              label: "Active",
              val: stats.active,
              icon: <CheckCircle className="w-4 h-4" />,
              color: "text-emerald-600 bg-emerald-50",
            },
            {
              label: "Submitted",
              val: stats.submitted,
              icon: <Send className="w-4 h-4" />,
              color: "text-blue-600 bg-blue-50",
            },
            {
              label: "Draft",
              val: stats.draft,
              icon: <Clock className="w-4 h-4" />,
              color: "text-gray-500 bg-gray-50",
            },
            {
              label: "Open vacancies",
              val: stats.vacancies,
              icon: <Users className="w-4 h-4" />,
              color: "text-amber-600 bg-amber-50",
            },
          ].map(({ label, val, icon, color }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
              <div>
                <div className="text-xs text-gray-500 leading-none mb-1">
                  {label}
                </div>
                <div className="text-lg font-bold text-gray-900 tabular-nums leading-none">
                  {val}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: "all", label: `All (${plans.length})` },
            { key: "active", label: `Active (${stats.active})` },
            { key: "submitted", label: `Submitted (${stats.submitted})` },
            { key: "draft", label: `Draft (${stats.draft})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {canCreate && (
          <button
            ref={triggerRef}
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New staffing plan
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading plans…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
          <Briefcase className="w-10 h-10 opacity-20" />
          <p className="text-sm font-medium text-gray-500">
            {filterStatus === "all"
              ? "No staffing plans yet."
              : `No ${filterStatus} plans.`}
          </p>
          {filterStatus !== "all" && (
            <button
              onClick={() => setFilterStatus("all")}
              className="text-xs text-blue-600 hover:underline"
            >
              View all plans
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              designationMap={designationMap}
              canWrite={canWrite}
              canSubmit={canSubmit}
              onEdit={openEdit}
              onSubmit={handleSubmit}
              onApprove={handleApprove}
              onRefresh={fetchPlans}
            />
          ))}
        </div>
      )}

      {!loading && plans.length > 0 && stats.budget > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            Total estimated budget across all plans
          </div>
          <div className="text-base font-bold text-gray-900 tabular-nums">
            {fmt(stats.budget)} ETB
          </div>
        </div>
      )}

      <PlanFormPopover
        open={popOpen}
        rect={popRect}
        onClose={() => {
          closePop();
          setEditingPlan(null);
        }}
        editingPlan={editingPlan}
        companies={companies}
        departments={departments}
        designationOptions={designationOptions}
        onSaved={fetchPlans}
      />
    </div>
  );
}
