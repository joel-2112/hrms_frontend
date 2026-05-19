import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import { useAuth } from "../../../../hooks/useAuth";
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

// ─── Extract data from API responses ─────────────────────────────────────────
const extractArray = (res) => {
  if (!res) return [];
  const payload = res?.data;
  if (!payload) return [];
  
  const list = payload?.data?.data ||
    payload?.data?.companies ||
    payload?.data?.departments ||
    payload?.data?.designations ||
    payload?.data?.employmentTypes ||
    payload?.data?.employeeGrades ||
    payload?.data?.employees ||
    payload?.data?.items ||
    payload?.data ||
    (Array.isArray(payload) ? payload : []);
  
  return Array.isArray(list) ? list : [];
};

const extractObject = (res) => {
  if (!res) return null;
  const payload = res?.data;
  if (!payload) return null;
  return payload?.data?.data || payload?.data || payload;
};

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
            {!isLast && (
              <div className={`absolute top-5 left-[calc(50%+16px)] w-[calc(100%-32px)] h-0.5 ${
                isComplete && !isRejected ? "bg-green-400" : isFuture ? "bg-gray-200" : "bg-gray-300"
              }`} />
            )}

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

            <span className={`text-xs font-medium mt-1.5 text-center leading-tight ${
              isRejected ? "text-red-700" : isComplete ? "text-green-700" : isCurrent ? "text-blue-700" : isFuture ? "text-gray-400" : "text-gray-600"
            }`}>
              {step.label}
            </span>

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
  const { user } = useAuth();
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
  const [employeeGrades, setEmployeeGrades] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inline Popover State - one active at a time
  const [activePopover, setActivePopover] = useState({
    requisitionId: null,
    action: "", // "submit", "approve-hr", "reject-hr", "approve-gm", "reject-gm"
    remarks: "",
  });

  const [form, setForm] = useState({
    companyId: "",
    departmentId: "",
    designationId: "",
    employmentTypeId: "",
    employeeGradeId: "",
    requestedOn: new Date().toISOString().split("T")[0],
    numberOfPositions: 1,
    replacementFor: "",
    isNewPosition: false,
    reasonForHiring: "",
    proposedSalaryMin: "",
    proposedSalaryMax: "",
    targetHireDate: "",
    currency: "KES",
    remarks: "",
  });

  // Ref for popover to handle click outside
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setActivePopover({ requisitionId: null, action: "", remarks: "" });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Fetch current logged-in employee ───────────────────────────────────────
  const fetchCurrentEmployee = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await apiClient.get(`/employees/user/${user.id}`);
      const employee = extractObject(res);
      setCurrentEmployee(employee);
    } catch (err) {
      console.error("Failed to fetch current employee:", err);
    }
  }, [user]);

  // ── Fetch requisitions ──────────────────────────────────────────────────────
  const fetchRequisitions = useCallback(async () => {
    setLoading(true);
    const params = { page: filters.page, limit: 20 };
    if (filters.companyId) params.companyId = filters.companyId;
    if (filters.departmentId) params.departmentId = filters.departmentId;
    if (filters.overallStatus) params.overallStatus = filters.overallStatus;
    try {
      const res = await apiClient.get("/recruitment/job-requisitions", { params });
      const data = extractArray(res);
      const payload = res?.data;
      const metaData = payload?.meta || payload?.data?.meta || {};
      setRequisitions(Array.isArray(data) ? data : []);
      setMeta(metaData);
    } catch (err) {
      console.error("Failed to load requisitions:", err);
      setError("Failed to load requisitions.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRequisitions(); }, [fetchRequisitions]);
  useEffect(() => { fetchCurrentEmployee(); }, [fetchCurrentEmployee]);

  // ── Fetch dropdowns ────────────────────────────────────────────────────────
  const fetchDropdowns = useCallback(async () => {
    try {
      const [compRes, deptRes, desigRes, empTypeRes, gradeRes] = await Promise.all([
        apiClient.get("/organizations/companies?limit=50"),
        apiClient.get("/organizations/departments?limit=200"),
        apiClient.get("/organizations/designations?limit=200"),
        apiClient.get("/organizations/employment-types?limit=50"),
        apiClient.get("/organizations/employee-grades?limit=50"),
      ]);

      setCompanies(extractArray(compRes));
      setDepartments(extractArray(deptRes));
      setDesignations(extractArray(desigRes));
      setEmploymentTypes(extractArray(empTypeRes));
      setEmployeeGrades(extractArray(gradeRes));
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  }, []);

  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const handleFilterChange = (key, value) => setFilters(p => ({ ...p, [key]: value, page: 1 }));
  const clearFilters = () => setFilters({ companyId: "", departmentId: "", overallStatus: "", page: 1 });

  // ── Sheet ───────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm({
      companyId: "",
      departmentId: "",
      designationId: "",
      employmentTypeId: "",
      employeeGradeId: "",
      requestedOn: new Date().toISOString().split("T")[0],
      numberOfPositions: 1,
      replacementFor: "",
      isNewPosition: false,
      reasonForHiring: "",
      proposedSalaryMin: "",
      proposedSalaryMax: "",
      targetHireDate: "",
      currency: "KES",
      remarks: "",
    });
    setSheetOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    if (!form.companyId) {
      toast.error("Please select a company");
      return;
    }
    if (!form.departmentId) {
      toast.error("Please select a department");
      return;
    }
    if (!form.designationId) {
      toast.error("Please select a designation");
      return;
    }
    if (!form.reasonForHiring) {
      toast.error("Please provide a reason for hiring");
      return;
    }
    if (!currentEmployee) {
      toast.error("Unable to identify the requester. Please ensure you have an employee record.");
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      requestedById: currentEmployee.id,
    };
    
    if (!payload.employmentTypeId) delete payload.employmentTypeId;
    if (!payload.employeeGradeId) delete payload.employeeGradeId;
    if (!payload.replacementFor) delete payload.replacementFor;
    if (!payload.remarks) delete payload.remarks;
    if (!payload.proposedSalaryMin) delete payload.proposedSalaryMin;
    if (!payload.proposedSalaryMax) delete payload.proposedSalaryMax;
    
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

  // ── Workflow Actions ───────────────────────────────────────────────────────
  const openPopover = (action, requisitionId) => {
    setActivePopover({ requisitionId, action, remarks: "" });
  };

  const handleWorkflowAction = async () => {
    const { requisitionId, action, remarks } = activePopover;
    if (!requisitionId) return;
    
    // Validation for reject actions
    if (action.includes("reject") && !remarks.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    
    setSaving(true);
    try {
      if (action === "submit") {
        await apiClient.put(`/recruitment/job-requisitions/${requisitionId}/submit`);
        toast.success("Requisition submitted successfully");
      } else if (action === "approve-hr") {
        await apiClient.put(`/recruitment/job-requisitions/${requisitionId}/approve-hr`, { remarks: remarks || null });
        toast.success("HR Approved successfully");
      } else if (action === "reject-hr") {
        await apiClient.put(`/recruitment/job-requisitions/${requisitionId}/reject-hr`, { reason: remarks });
        toast.success("HR Rejected successfully");
      } else if (action === "approve-gm") {
        await apiClient.put(`/recruitment/job-requisitions/${requisitionId}/approve-gm`, { remarks: remarks || null });
        toast.success("GM Approved - Job opening created!");
      } else if (action === "reject-gm") {
        await apiClient.put(`/recruitment/job-requisitions/${requisitionId}/reject-gm`, { reason: remarks });
        toast.success("GM Rejected successfully");
      }
      
      setActivePopover({ requisitionId: null, action: "", remarks: "" });
      fetchRequisitions();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed.");
    } finally {
      setSaving(false);
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

  const sheetFilteredDesignations = useMemo(
    () => form.companyId ? designations.filter(d => d.companyId === form.companyId) : designations,
    [designations, form.companyId]
  );

  const hasFilters = filters.companyId || filters.departmentId || filters.overallStatus;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 pb-12">
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
          <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="p-3 rounded-xl bg-gray-50 text-gray-700 border border-gray-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="p-3 rounded-xl bg-blue-50/70 text-blue-600 border border-blue-100/50">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-blue-600 mt-0.5">{stats.pending}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="p-3 rounded-xl bg-emerald-50/70 text-emerald-600 border border-emerald-100/50">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.approved}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="p-3 rounded-xl bg-rose-50/70 text-rose-600 border border-rose-100/50">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-rose-600 mt-0.5">{stats.rejected}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-52">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Company</Label>
            <select
              value={filters.companyId}
              onChange={e => handleFilterChange("companyId", e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#89E900] focus:border-transparent text-gray-800 transition-all"
            >
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-52">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Department</Label>
            <select
              value={filters.departmentId}
              onChange={e => handleFilterChange("departmentId", e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#89E900] focus:border-transparent text-gray-800 transition-all"
            >
              <option value="">All Departments</option>
              {filteredDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="w-52">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Approval Status</Label>
            <select
              value={filters.overallStatus}
              onChange={e => handleFilterChange("overallStatus", e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#89E900] focus:border-transparent text-gray-800 transition-all"
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <span className="text-sm font-medium text-gray-500">
          Showing <strong className="text-gray-900">{meta.total || requisitions.length}</strong> requisition(s)
        </span>
        {canCreate && (
          <Button
            onClick={openCreate}
            className="gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 px-5 py-2.5"
          >
            <Plus className="w-4 h-4 text-[#89E900]" /> New Requisition
          </Button>
        )}
      </div>

      {/* Requisitions List */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-400 bg-white border border-gray-100 rounded-2xl">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          <span className="text-sm font-medium">Fetching job requisitions...</span>
        </div>
      ) : requisitions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-gray-400 bg-white border border-gray-100 rounded-2xl">
          <FileText className="w-12 h-12 opacity-25 text-gray-400" />
          <p className="text-sm font-semibold text-gray-500">No requisitions found matching filters</p>
          <p className="text-xs text-gray-400 -mt-1">Add a new hiring request to get started.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {requisitions.map((req) => {
            const status = req.overallStatus || "Draft";
            const isPopoverActive = activePopover.requisitionId === req.id;
            
            return (
              <div key={req.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 relative">
                {/* Top row: Info + Actions */}
                <div className="px-8 py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-bold text-gray-900 tracking-tight">{req.requisitionNumber}</h3>
                      <Badge className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[status] || STATUS_STYLES["Draft"]}`}>{status}</Badge>
                      {req.jobOpeningId && (
                        <Badge className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Job Opening Created</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-medium text-gray-500 mt-2">
                      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-gray-400" />{req.company?.name || "—"}</span>
                      <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-gray-400" />{req.department?.name || "—"}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-gray-400" />{req.designation?.name || "—"}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-gray-400" />{req.numberOfPositions} position(s)</span>
                      {req.employmentType && <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 text-[10px] uppercase font-bold">{req.employmentType.name}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 mt-2 font-medium">
                      <span>Requested by <strong className="text-gray-600">{req.requestedBy ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : "—"}</strong></span>
                      <span className="h-1 w-1 bg-gray-300 rounded-full" />
                      <span>{formatDate(req.requestedOn)}</span>
                      {req.targetHireDate && (
                        <>
                          <span className="h-1 w-1 bg-gray-300 rounded-full" />
                          <span className="text-amber-600 font-semibold">Target: {formatDate(req.targetHireDate)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons container with relative positioning for popover */}
                  <div className="flex items-center gap-2 flex-shrink-0 relative">
                    {status === "Draft" && canSubmit && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50/50 gap-1.5 h-9 px-4"
                        onClick={() => openPopover("submit", req.id)}
                      >
                        <Send className="w-3.5 h-3.5" /> Submit
                      </Button>
                    )}
                    {status === "Pending HR Review" && canSubmit && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50/50 gap-1.5 h-9 px-4"
                          onClick={() => openPopover("approve-hr", req.id)}
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve HR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50/50 gap-1.5 h-9 px-4"
                          onClick={() => openPopover("reject-hr", req.id)}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </>
                    )}
                    {status === "Pending GM Review" && canSubmit && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50/50 gap-1.5 h-9 px-4"
                          onClick={() => openPopover("approve-gm", req.id)}
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve GM
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50/50 gap-1.5 h-9 px-4"
                          onClick={() => openPopover("reject-gm", req.id)}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </>
                    )}

                    {/* Inline Popover confirmation card - positioned relative to parent */}
                    {isPopoverActive && (
                      <div 
                        ref={popoverRef}
                        className="absolute right-0 top-full mt-2 z-[9999] w-80 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150"
                        style={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.02)" }}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                            {activePopover.action.includes("reject") ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                            ) : activePopover.action === "submit" ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            )}
                            {activePopover.action.includes("reject")
                              ? "Confirm Rejection"
                              : activePopover.action === "submit"
                              ? "Confirm Submission"
                              : "Confirm Approval"}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setActivePopover({ requisitionId: null, action: "", remarks: "" })}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                          {activePopover.action === "submit"
                            ? "Submit this hiring requisition for formal HR validation?"
                            : activePopover.action.includes("reject")
                            ? "Please enter a comment below explaining the reason for this rejection."
                            : "Approve this job requisition? Review comments can be supplied below."}
                        </p>

                        {activePopover.action !== "submit" && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              Remarks {activePopover.action.includes("reject") ? "*" : "(optional)"}
                            </label>
                            <textarea
                              value={activePopover.remarks}
                              onChange={(e) => setActivePopover((p) => ({ ...p, remarks: e.target.value }))}
                              placeholder={
                                activePopover.action.includes("reject")
                                  ? "Rejection reason is required..."
                                  : "Optional comments..."
                              }
                              className="w-full min-h-[60px] rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#89E900] focus:border-transparent text-gray-800 transition-all placeholder:text-gray-400"
                              rows={2}
                              autoFocus
                            />
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-3 text-gray-600 hover:bg-gray-50"
                            onClick={() => setActivePopover({ requisitionId: null, action: "", remarks: "" })}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs px-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                            disabled={saving || (activePopover.action.includes("reject") && !activePopover.remarks.trim())}
                            onClick={handleWorkflowAction}
                          >
                            {saving ? "Processing..." : "Confirm"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom row: Timeline */}
                <div className="px-8 py-5 overflow-x-auto bg-gray-50/40 border-b border-gray-50">
                  <ApprovalTimeline req={req} />
                </div>

                {/* Reason + Salary info */}
                <div className="px-8 py-4 bg-gray-50/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-500">
                  <span className="flex-1 min-w-[200px]"><strong className="text-gray-700">Hiring Reason:</strong> {req.reasonForHiring || "—"}</span>
                  {req.proposedSalaryMin && (
                    <span className="flex items-center gap-1 font-medium"><DollarSign className="w-3.5 h-3.5 text-gray-400" />{formatNumber(req.proposedSalaryMin)} – {formatNumber(req.proposedSalaryMax)} {req.currency}</span>
                  )}
                  {req.isNewPosition ? (
                    <Badge className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200/50 font-bold uppercase rounded px-2 py-0.5">New Position</Badge>
                  ) : req.replacementFor ? (
                    <span className="text-[11px]"><strong className="text-gray-700">Backfill for:</strong> <span className="font-semibold text-gray-800">{req.replacementFor}</span></span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold px-4"
              disabled={meta.page <= 1}
              onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold px-4"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Requisition Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[480px] sm:w-[600px] overflow-y-auto border-l border-gray-100 rounded-l-2xl p-0">
          <div className="p-6 sm:p-8">
            <SheetHeader className="pb-6 border-b border-gray-100">
              <SheetTitle className="text-xl font-bold text-gray-900">New Hiring Requisition</SheetTitle>
              <SheetDescription className="text-sm text-gray-500 mt-1">
                Provide staffing requirements to initiate the validation workflow.
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6 space-y-8">
              {/* Requester Info Banner */}
              {currentEmployee && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">Requester</p>
                      <p className="text-sm font-medium text-gray-900">
                        {currentEmployee.firstName} {currentEmployee.middleName} {currentEmployee.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Department: {currentEmployee.department?.name || "—"} | 
                        Designation: {currentEmployee.designation?.name || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 1: Organization Details */}
              <div className="space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">1. Organization Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Company *</Label>
                    <select
                      name="companyId"
                      value={form.companyId}
                      onChange={handleFormChange}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#89E900] focus:border-transparent text-gray-800 transition-all"
                    >
                      <option value="">Select Company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Department *</Label>
                    <select
                      name="departmentId"
                      value={form.departmentId}
                      onChange={handleFormChange}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#89E900] focus:border-transparent text-gray-800 transition-all"
                    >
                      <option value="">Select Department</option>
                      {sheetFilteredDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs font-semibold text-gray-700">Designation *</Label>
                    <select
                      name="designationId"
                      value={form.designationId}
                      onChange={handleFormChange}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#89E900] focus:border-transparent text-gray-800 transition-all"
                    >
                      <option value="">Select Designation</option>
                      {sheetFilteredDesignations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Classification */}
              <div className="space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">2. Classification</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Employment Type</Label>
                    <select
                      name="employmentTypeId"
                      value={form.employmentTypeId}
                      onChange={handleFormChange}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#89E900] focus:border-transparent text-gray-800 transition-all"
                    >
                      <option value="">Select Type</option>
                      {employmentTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Employee Grade</Label>
                    <select
                      name="employeeGradeId"
                      value={form.employeeGradeId}
                      onChange={handleFormChange}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#89E900] focus:border-transparent text-gray-800 transition-all"
                    >
                      <option value="">Select Grade</option>
                      {employeeGrades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Position Details */}
              <div className="space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">3. Position Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Number of Positions</Label>
                    <Input
                      type="number"
                      name="numberOfPositions"
                      min="1"
                      value={form.numberOfPositions}
                      onChange={handleFormChange}
                      className="h-10 px-3 text-sm focus-visible:ring-2 focus-visible:ring-[#89E900]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Replacement For</Label>
                    <Input
                      name="replacementFor"
                      value={form.replacementFor}
                      onChange={handleFormChange}
                      placeholder="e.g. Employee name"
                      className="h-10 px-3 text-sm focus-visible:ring-2 focus-visible:ring-[#89E900]"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                    <input
                      type="checkbox"
                      name="isNewPosition"
                      id="isNewPosition"
                      checked={form.isNewPosition}
                      onChange={handleFormChange}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-[#89E900]"
                    />
                    <Label htmlFor="isNewPosition" className="text-sm font-medium text-gray-700 cursor-pointer">
                      This is a brand new position (not a backfill request)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Section 4: Budget & Timeline */}
              <div className="space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">4. Budget & Timeline</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Salary Min</Label>
                    <Input
                      type="number"
                      name="proposedSalaryMin"
                      value={form.proposedSalaryMin}
                      onChange={handleFormChange}
                      placeholder="Min"
                      className="h-10 px-3 text-sm focus-visible:ring-2 focus-visible:ring-[#89E900]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Salary Max</Label>
                    <Input
                      type="number"
                      name="proposedSalaryMax"
                      value={form.proposedSalaryMax}
                      onChange={handleFormChange}
                      placeholder="Max"
                      className="h-10 px-3 text-sm focus-visible:ring-2 focus-visible:ring-[#89E900]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Currency</Label>
                    <select
                      name="currency"
                      value={form.currency}
                      onChange={handleFormChange}
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#89E900] focus:border-transparent text-gray-800 transition-all"
                    >
                      <option value="KES">KES</option>
                      <option value="ETB">ETB</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700">Target Hire Date</Label>
                  <Input
                    type="date"
                    name="targetHireDate"
                    value={form.targetHireDate}
                    onChange={handleFormChange}
                    className="h-10 px-3 text-sm focus-visible:ring-2 focus-visible:ring-[#89E900]"
                  />
                </div>
              </div>

              {/* Section 5: Justification */}
              <div className="space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">5. Justification & Notes</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Reason for Hiring *</Label>
                    <Textarea
                      name="reasonForHiring"
                      value={form.reasonForHiring}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder="Explain justification for this staffing addition..."
                      className="px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[#89E900] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Remarks / Notes</Label>
                    <Textarea
                      name="remarks"
                      value={form.remarks}
                      onChange={handleFormChange}
                      rows={2}
                      placeholder="Additional context or workflow remarks..."
                      className="px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[#89E900] resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <SheetFooter className="gap-3 pt-6 border-t border-gray-100">
              <Button variant="outline" onClick={() => setSheetOpen(false)} className="h-10 px-6">Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="h-10 px-6 bg-gray-900 hover:bg-gray-800 text-white font-medium"
              >
                {saving ? "Creating..." : "Create Requisition"}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}