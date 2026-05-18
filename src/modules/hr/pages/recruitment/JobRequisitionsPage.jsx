import { useEffect, useState, useCallback, useMemo } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Plus, Eye, Send, CheckCircle, XCircle, X, RefreshCw, FileText,
  Filter, Clock, User, Building2, Layers, Briefcase, Calendar,
  Users, DollarSign, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
const formatNumber = (n) => (n != null ? Number(n).toLocaleString() : "—");

const STATUS_STYLES = {
  "Draft": "bg-gray-100 text-gray-700",
  "Pending HR Review": "bg-blue-100 text-blue-700",
  "HR Rejected": "bg-red-100 text-red-700",
  "Pending GM Review": "bg-purple-100 text-purple-700",
  "GM Rejected": "bg-red-100 text-red-700",
  "Approved": "bg-green-100 text-green-700",
  "Cancelled": "bg-yellow-100 text-yellow-700",
};

// ─── Approval Timeline Component ─────────────────────────────────────────────
function ApprovalTimeline({ req }) {
  const steps = [
    {
      label: "Requested",
      icon: FileText,
      date: req.requestedOn,
      actor: req.requestedBy
        ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}`
        : "—",
      remarks: req.reasonForHiring,
      isComplete: true,
      isRejected: false,
    },
    {
      label: "HR Review",
      icon: User,
      date: req.hrReviewedOn,
      actor: req.hrManager
        ? `${req.hrManager.firstName} ${req.hrManager.lastName}`
        : req.hrStatus === "Pending" ? "Awaiting" : "—",
      remarks: req.hrRemarks,
      isComplete: req.hrStatus === "Approved",
      isRejected: req.hrStatus === "Rejected",
      isCurrent: req.hrStatus === "Pending" && req.overallStatus === "Pending HR Review",
    },
    {
      label: "GM Review",
      icon: CheckCircle,
      date: req.gmReviewedOn,
      actor: req.generalManager
        ? `${req.generalManager.firstName} ${req.generalManager.lastName}`
        : req.gmStatus === "Pending" ? "Awaiting" : "—",
      remarks: req.gmRemarks,
      isComplete: req.gmStatus === "Approved",
      isRejected: req.gmStatus === "Rejected",
      isCurrent: req.gmStatus === "Pending" && req.overallStatus === "Pending GM Review",
    },
    {
      label: req.overallStatus === "Approved" ? "Approved" : req.overallStatus.includes("Rejected") ? "Rejected" : "Outcome",
      icon: req.overallStatus === "Approved" ? CheckCircle : XCircle,
      date: req.gmReviewedOn || req.hrReviewedOn,
      actor: req.overallStatus === "Approved"
        ? (req.generalManager ? `${req.generalManager.firstName} ${req.generalManager.lastName}` : "—")
        : "—",
      remarks: req.overallStatus,
      isComplete: req.overallStatus === "Approved",
      isRejected: req.overallStatus.includes("Rejected"),
      isEnd: true,
    },
  ];

  // If HR rejected, skip GM steps
  const visibleSteps = req.hrStatus === "Rejected"
    ? steps.filter((s, i) => i <= 1 || i === 3)
    : steps;

  return (
    <div className="flex items-start gap-0 min-w-[400px]">
      {visibleSteps.map((step, idx) => {
        const isLast = idx === visibleSteps.length - 1;
        const isComplete = step.isComplete;
        const isRejected = step.isRejected;
        const isCurrent = step.isCurrent;
        const isFuture = !isComplete && !isCurrent && !isRejected;
        const isEnd = step.isEnd;

        return (
          <div key={idx} className="flex-1 flex flex-col items-center relative min-w-[80px]">
            {/* Connector line */}
            {!isLast && (
              <div className={`absolute top-5 left-[calc(50%+16px)] w-[calc(100%-32px)] h-0.5 ${
                isComplete && !isRejected ? "bg-green-400" : isFuture ? "bg-gray-200" : "bg-gray-300"
              }`} />
            )}

            {/* Icon circle */}
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isRejected
                ? "bg-red-100 text-red-600"
                : isComplete
                ? "bg-green-100 text-green-600"
                : isCurrent
                ? "bg-blue-100 text-blue-600 ring-2 ring-blue-300"
                : isFuture
                ? "bg-gray-100 text-gray-400"
                : "bg-gray-100 text-gray-500"
            }`}>
              <step.icon className="w-4.5 h-4.5" />
            </div>

            {/* Label */}
            <span className={`text-xs font-medium mt-1.5 text-center leading-tight ${
              isRejected ? "text-red-700" : isComplete ? "text-green-700" : isCurrent ? "text-blue-700" : isFuture ? "text-gray-400" : "text-gray-600"
            }`}>
              {step.label}
            </span>

            {/* Detail */}
            <div className="text-center mt-1">
              {step.date && (
                <p className={`text-xs ${isFuture ? "text-gray-300" : "text-gray-500"}`}>
                  {formatDateTime(step.date)}
                </p>
              )}
              {step.actor && (
                <p className={`text-xs font-medium truncate max-w-[90px] ${isFuture ? "text-gray-300" : "text-gray-600"}`}>
                  {step.actor}
                </p>
              )}
              {step.remarks && !isEnd && idx > 0 && (
                <p className={`text-xs italic truncate max-w-[90px] mt-0.5 ${isFuture ? "text-gray-300" : "text-gray-400"}`}>
                  "{step.remarks}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function JobRequisitionsPage() {
  const perms = usePermission("JobRequisition");
  const canCreate = perms.canCreate;
  const canSubmit = perms.canSubmit || perms.canWrite;

  const [requisitions, setRequisitions] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    companyId: "",
    departmentId: "",
    overallStatus: "",
    page: 1,
  });

  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    companyId: "",
    departmentId: "",
    designationId: "",
    employmentTypeId: "",
    numberOfPositions: 1,
    replacementFor: "",
    isNewPosition: false,
    reasonForHiring: "",
    proposedSalaryMin: "",
    proposedSalaryMax: "",
    targetHireDate: "",
    currency: "ETB",
  });

  // Approval dialog
  const [approvalDialog, setApprovalDialog] = useState({
    open: false, action: "", requisitionId: null, remarks: "",
  });

  // ── Fetch requisitions ──────────────────────────────────────────────────────
  const fetchRequisitions = useCallback(async () => {
    setLoading(true);
    const params = { page: filters.page, limit: 20 };
    if (filters.companyId) params.companyId = filters.companyId;
    if (filters.departmentId) params.departmentId = filters.departmentId;
    if (filters.overallStatus) params.overallStatus = filters.overallStatus;
    try {
      const res = await apiClient.get("/recruitment/job-requisitions", { params });
      const data = res?.data?.data;
      const metaData = res?.data?.meta || {};
      setRequisitions(Array.isArray(data) ? data : []);
      setMeta(metaData);
    } catch {
      setError("Failed to load requisitions.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRequisitions(); }, [fetchRequisitions]);

  // ── Fetch dropdowns with correct response extraction ────────────────────────
  const fetchDropdowns = useCallback(async () => {
    try {
      const [compRes, deptRes, desigRes, empTypeRes] = await Promise.all([
        apiClient.get("/organizations/companies?limit=50"),
        apiClient.get("/organizations/departments?limit=200"),
        apiClient.get("/organizations/designations?limit=200"),
        apiClient.get("/organizations/employment-types?limit=50"),
      ]);
      setCompanies(compRes?.data?.data?.companies || []);
      setDepartments(deptRes?.data?.data?.departments || []);
      setDesignations(desigRes?.data?.data?.designations || desigRes?.data?.data || []);
      setEmploymentTypes(empTypeRes?.data?.data?.employmentTypes || empTypeRes?.data?.data || []);
    } catch { }
  }, []);

  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const handleFilterChange = (key, value) => setFilters(p => ({ ...p, [key]: value, page: 1 }));
  const clearFilters = () => setFilters({ companyId: "", departmentId: "", overallStatus: "", page: 1 });

  // ── Sheet ───────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm({
      companyId: "", departmentId: "", designationId: "", employmentTypeId: "",
      numberOfPositions: 1, replacementFor: "", isNewPosition: false,
      reasonForHiring: "", proposedSalaryMin: "", proposedSalaryMax: "",
      targetHireDate: "", currency: "ETB",
    });
    setSheetOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    if (!form.companyId || !form.departmentId || !form.designationId || !form.reasonForHiring) {
      toast.error("Company, department, designation, and reason are required.");
      return;
    }
    setSaving(true);
    const payload = { ...form };
    if (!payload.employmentTypeId) delete payload.employmentTypeId;
    if (!payload.replacementFor) delete payload.replacementFor;
    try {
      await apiClient.post("/recruitment/job-requisitions", payload);
      setSheetOpen(false);
      fetchRequisitions();
      toast.success("Requisition created successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create requisition.");
    } finally {
      setSaving(false);
    }
  };

  // ── Workflow ────────────────────────────────────────────────────────────────
  const handleSubmit = async (id) => {
    try {
      await apiClient.put(`/recruitment/job-requisitions/${id}/submit`);
      fetchRequisitions();
      toast.success("Requisition submitted for HR review");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submit failed.");
    }
  };

  const openApprovalDialog = (action, requisitionId) => {
    setApprovalDialog({ open: true, action, requisitionId, remarks: "" });
  };

  const executeApprovalAction = async () => {
    const { action, requisitionId, remarks } = approvalDialog;
    try {
      switch (action) {
        case "approve-hr":
          await apiClient.put(`/recruitment/job-requisitions/${requisitionId}/approve-hr`, { remarks: remarks || null });
          toast.success("HR approved");
          break;
        case "reject-hr":
          if (!remarks) { toast.error("Remarks required for rejection"); return; }
          await apiClient.put(`/recruitment/job-requisitions/${requisitionId}/reject-hr`, { reason: remarks });
          toast.success("HR rejected");
          break;
        case "approve-gm":
          await apiClient.put(`/recruitment/job-requisitions/${requisitionId}/approve-gm`, { remarks: remarks || null });
          toast.success("GM approved - Job opening created");
          break;
        case "reject-gm":
          if (!remarks) { toast.error("Remarks required for rejection"); return; }
          await apiClient.put(`/recruitment/job-requisitions/${requisitionId}/reject-gm`, { reason: remarks });
          toast.success("GM rejected");
          break;
      }
      setApprovalDialog({ open: false, action: "", requisitionId: null, remarks: "" });
      fetchRequisitions();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed.");
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = requisitions.length;
    const pending = requisitions.filter(r => r.overallStatus === "Pending HR Review" || r.overallStatus === "Pending GM Review").length;
    const approved = requisitions.filter(r => r.overallStatus === "Approved").length;
    const rejected = requisitions.filter(r => r.overallStatus === "HR Rejected" || r.overallStatus === "GM Rejected").length;
    return { total, pending, approved, rejected };
  }, [requisitions]);

  // ── Filtered departments ────────────────────────────────────────────────────
  const filteredDepartments = useMemo(
    () => filters.companyId ? departments.filter(d => d.companyId === filters.companyId) : departments,
    [departments, filters.companyId]
  );

  const sheetFilteredDepartments = useMemo(
    () => form.companyId ? departments.filter(d => d.companyId === form.companyId) : departments,
    [departments, form.companyId]
  );

  const hasFilters = filters.companyId || filters.departmentId || filters.overallStatus;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title="Job Requisitions"
        subtitle="Manage hiring requests from draft to GM approval"
        icon={<FileText className="w-5 h-5" />}
      />

      {error && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-medium">Dismiss</button>
        </div>
      )}

      {/* Stats Cards */}
      {!loading && requisitions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600"><FileText className="w-5 h-5" /></div>
            <div><p className="text-xs text-gray-500">Total</p><p className="text-lg font-semibold text-gray-900">{stats.total}</p></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Clock className="w-5 h-5" /></div>
            <div><p className="text-xs text-gray-500">Pending</p><p className="text-lg font-semibold text-gray-900">{stats.pending}</p></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50 text-green-600"><CheckCircle className="w-5 h-5" /></div>
            <div><p className="text-xs text-gray-500">Approved</p><p className="text-lg font-semibold text-gray-900">{stats.approved}</p></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 text-red-600"><XCircle className="w-5 h-5" /></div>
            <div><p className="text-xs text-gray-500">Rejected</p><p className="text-lg font-semibold text-gray-900">{stats.rejected}</p></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <Label className="text-xs">Company</Label>
            <select value={filters.companyId} onChange={e => handleFilterChange("companyId", e.target.value)}
              className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-md bg-white">
              <option value="">All</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-44">
            <Label className="text-xs">Department</Label>
            <select value={filters.departmentId} onChange={e => handleFilterChange("departmentId", e.target.value)}
              className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-md bg-white">
              <option value="">All</option>
              {filteredDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="w-44">
            <Label className="text-xs">Status</Label>
            <select value={filters.overallStatus} onChange={e => handleFilterChange("overallStatus", e.target.value)}
              className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-md bg-white">
              <option value="">All</option>
              {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{meta.total || requisitions.length} requisition(s)</span>
        {canCreate && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> New Requisition
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : requisitions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <FileText className="w-10 h-10 opacity-20" />
          <p className="text-sm font-medium text-gray-500">No requisitions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requisitions.map((req) => {
            const status = req.overallStatus || "Draft";
            return (
              <div key={req.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Top row: Info + Actions */}
                <div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">{req.requisitionNumber}</h3>
                      <Badge className={`text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES["Draft"]}`}>{status}</Badge>
                      {req.jobOpeningId && (
                        <Badge className="text-xs bg-indigo-50 text-indigo-700">Opening Created</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1.5">
                      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{req.company?.name || "—"}</span>
                      <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{req.department?.name || "—"}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{req.designation?.name || "—"}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{req.numberOfPositions} position(s)</span>
                      {req.employmentType && <span className="text-gray-400">· {req.employmentType.name}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
                      <span>Requested by {req.requestedBy ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : "—"}</span>
                      <span>· {formatDate(req.requestedOn)}</span>
                      {req.targetHireDate && <span>· Target: {formatDate(req.targetHireDate)}</span>}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {status === "Draft" && (
                      <>
                        {canSubmit && (
                          <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => handleSubmit(req.id)}>
                            <Send className="w-3.5 h-3.5 mr-1" /> Submit
                          </Button>
                        )}
                      </>
                    )}
                    {status === "Pending HR Review" && canSubmit && (
                      <>
                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50" onClick={() => openApprovalDialog("approve-hr", req.id)}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve HR
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => openApprovalDialog("reject-hr", req.id)}>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {status === "Pending GM Review" && canSubmit && (
                      <>
                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50" onClick={() => openApprovalDialog("approve-gm", req.id)}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve GM
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => openApprovalDialog("reject-gm", req.id)}>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom row: Timeline */}
                <div className="px-5 py-4 overflow-x-auto bg-gray-50/50">
                  <ApprovalTimeline req={req} />
                </div>

                {/* Reason + Salary info */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span><strong className="text-gray-700">Reason:</strong> {req.reasonForHiring || "—"}</span>
                  {req.proposedSalaryMin && (
                    <span><strong className="text-gray-700">Salary:</strong> {formatNumber(req.proposedSalaryMin)} – {formatNumber(req.proposedSalaryMax)} {req.currency}</span>
                  )}
                  {req.isNewPosition && <Badge className="text-xs bg-amber-50 text-amber-700">New Position</Badge>}
                  {req.replacementFor && <span><strong className="text-gray-700">Replacement for:</strong> {req.replacementFor}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
          <p className="text-xs text-gray-500">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>Prev</Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>Next</Button>
          </div>
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Job Requisition</SheetTitle>
            <SheetDescription>Fill in the required fields to create a hiring request.</SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Company *</Label>
                <select name="companyId" value={form.companyId} onChange={handleFormChange} className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-md bg-white">
                  <option value="">Select</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Department *</Label>
                <select name="departmentId" value={form.departmentId} onChange={handleFormChange} className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-md bg-white">
                  <option value="">Select</option>
                  {sheetFilteredDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Designation *</Label>
                <select name="designationId" value={form.designationId} onChange={handleFormChange} className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-md bg-white">
                  <option value="">Select</option>
                  {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Employment Type</Label>
                <select name="employmentTypeId" value={form.employmentTypeId} onChange={handleFormChange} className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-md bg-white">
                  <option value="">None</option>
                  {employmentTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Number of Positions</Label>
                <Input type="number" name="numberOfPositions" min="1" value={form.numberOfPositions} onChange={handleFormChange} />
              </div>
              <div>
                <Label className="text-xs">Replacement For</Label>
                <Input name="replacementFor" value={form.replacementFor} onChange={handleFormChange} placeholder="Name" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="isNewPosition" checked={form.isNewPosition} onChange={handleFormChange} className="w-4 h-4 text-blue-600" />
              <Label className="text-sm text-gray-700">New position (not a backfill)</Label>
            </div>
            <div>
              <Label className="text-xs">Reason for Hiring *</Label>
              <Textarea name="reasonForHiring" value={form.reasonForHiring} onChange={handleFormChange} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="text-xs">Salary Min</Label><Input type="number" name="proposedSalaryMin" value={form.proposedSalaryMin} onChange={handleFormChange} /></div>
              <div><Label className="text-xs">Salary Max</Label><Input type="number" name="proposedSalaryMax" value={form.proposedSalaryMax} onChange={handleFormChange} /></div>
              <div>
                <Label className="text-xs">Currency</Label>
                <select name="currency" value={form.currency} onChange={handleFormChange} className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-md bg-white">
                  <option value="ETB">ETB</option><option value="KES">KES</option><option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Target Hire Date</Label>
              <Input type="date" name="targetHireDate" value={form.targetHireDate} onChange={handleFormChange} />
            </div>
          </div>
          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Create Requisition"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Approval Dialog */}
      <AlertDialog open={approvalDialog.open} onOpenChange={(o) => setApprovalDialog(prev => ({ ...prev, open: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approvalDialog.action.startsWith("approve") ? "Approve" : "Reject"} Requisition
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approvalDialog.action.startsWith("approve")
                ? "Confirm approval. You may add optional remarks."
                : "Rejection requires a reason."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="text-xs mb-1">Remarks {approvalDialog.action.includes("reject") ? "*" : "(optional)"}</Label>
            <Textarea
              value={approvalDialog.remarks}
              onChange={(e) => setApprovalDialog(p => ({ ...p, remarks: e.target.value }))}
              placeholder={approvalDialog.action.includes("reject") ? "Explain reason..." : "Optional notes..."}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeApprovalAction}>
              {approvalDialog.action.startsWith("approve") ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}