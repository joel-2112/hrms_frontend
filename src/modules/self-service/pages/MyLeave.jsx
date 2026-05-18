import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../api/axiosConfig";
import PageHeader from "../../../components/common/PageHeader";
import {
  Calendar,
  FileText,
  Plus,
  User,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Printer,
  X,
  Send,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import LeaveRequest from "../../hr/pages/leave/LeaveRequest";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

const extractData = (res) => res?.data?.data.data || res?.data || {};

const avatarColor = (id = "") =>
  AVATAR_PALETTE[(id?.charCodeAt(0) || 0) % AVATAR_PALETTE.length];

const initials = (firstName, lastName) => {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "??";
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtShortDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const LEAVE_TYPE_STYLES = {
  "Annual Leave": "bg-purple-50 text-purple-700",
  "Sick Leave": "bg-teal-50 text-teal-700",
  "Maternity Leave": "bg-orange-50 text-orange-800",
  "Paternity Leave": "bg-green-50 text-green-700",
  "Emergency Leave": "bg-red-50 text-red-600",
  "Compensatory Leave": "bg-blue-50 text-blue-700",
};

const STATUS_STYLES = {
  Draft: "bg-gray-100 text-gray-600 border-gray-200",
  Open: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-green-50 text-green-700 border-green-200",
  Rejected: "bg-red-50 text-red-600 border-red-200",
  Cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0 gap-3">
      <span className="text-[11px] text-gray-500 flex-shrink-0">{label}</span>
      <span
        className={`text-[11px] font-medium text-right ${highlight ? "text-blue-600 font-semibold" : "text-gray-800"}`}
      >
        {value}
      </span>
    </div>
  );
}

function TimelineStep({ title, subtitle, isLast, status }) {
  const config = {
    done: { dotBg: "bg-green-100", icon: Check, iconColor: "text-green-600" },
    current: { dotBg: "bg-amber-100", icon: null, dotColor: "bg-amber-500" },
    pending: { dotBg: "bg-gray-100", icon: null, dotColor: "bg-gray-300" },
  };
  const cfg = config[status] || config.pending;
  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      {!isLast && (
        <div className="absolute left-[7px] top-4 bottom-0 w-px bg-gray-200" />
      )}
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 ${cfg.dotBg}`}
      >
        {cfg.icon ? (
          <cfg.icon className={`w-2.5 h-2.5 ${cfg.iconColor}`} />
        ) : (
          <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-semibold ${status === "pending" ? "text-gray-300" : "text-gray-800"}`}
        >
          {title}
        </div>
        <div
          className={`text-xs mt-0.5 ${status === "current" ? "text-amber-600" : status === "pending" ? "text-gray-300" : "text-gray-400"}`}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function getLeaveTypePill(type) {
  const s = LEAVE_TYPE_STYLES[type] || "bg-gray-50 text-gray-700";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${s}`}
    >
      {type || "Unknown"}
    </span>
  );
}

function getStatusPill(status) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${style.dot || "bg-gray-400"}`}
      />
      {status}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MyLeave() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail panel states
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetail, setAppDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const fetchMyLeave = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, appsRes] = await Promise.all([
        apiClient.get("/leaves/my-leave/summary"),
        apiClient.get("/leaves/my-leave/applications?limit=50"),
      ]);
      setSummary(extractData(summaryRes));
      const appsData =
        appsRes?.data?.data?.data || appsRes?.data?.data || appsRes?.data || [];
      setApplications(Array.isArray(appsData) ? appsData : []);
    } catch (err) {
      toast.error("Failed to load leave data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyLeave();
  }, [fetchMyLeave]);

  // Detail panel handlers
  const handleSelectApp = async (app) => {
    setSelectedApp(app.id);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(`/leaves/applications/${app.id}`);
      setAppDetail(res?.data?.data?.data || res?.data?.data || res?.data || {});
    } catch {
      toast.error("Failed to load detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedApp(null);
    setAppDetail(null);
  };

  const handleSubmitDraft = async () => {
    if (!selectedApp) return;
    setActionBusy(true);
    try {
      await apiClient.post(`/leaves/applications/${selectedApp}/submit`);
      toast.success("Application submitted for approval");
      fetchMyLeave();
      handleSelectApp({ id: selectedApp });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submit failed");
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const s = summary || {};
  const emp = s?.employee || {};
  const balances = s?.balances || [];
  const activePeriod = s?.activePeriod;

const hiredDate = emp.dateOfJoining || null;
const serviceDuration = hiredDate ? getDuration(hiredDate) : null;

// Helper function
function getDuration(dateOfJoining) {
  const start = new Date(dateOfJoining);
  const now = new Date();

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

// Format for display
const serviceDisplay = serviceDuration 
  ? `${serviceDuration.years}y ${serviceDuration.months}m ${serviceDuration.days}d`
  : null;

  const totalEntitled = balances.reduce(
    (sum, b) => sum + (b.allocated || 0),
    0,
  );
  const totalUsed = balances.reduce(
    (sum, b) => sum + (b.used || b.allocated - b.balance || 0),
    0,
  );
  const totalBalance = balances.reduce((sum, b) => sum + (b.balance || 0), 0);

  const expiryShort = activePeriod?.endDate
    ? fmtShortDate(activePeriod.endDate)
    : fmtShortDate(`${new Date().getFullYear()}-06-30`);

  return (
    <>
      {showRequestForm ? (
        <div className="p-12">
        <LeaveRequest
          onCancel={() => setShowRequestForm(false)}
          onSuccess={() => {
            setShowRequestForm(false);
            fetchMyLeave();
          }}
        />
        </div>
      ) : (
        <div className="flex flex-col p-12 gap-6 ">
          <PageHeader
            title="My Leave"
            subtitle={`${emp.name || "Employee"} · ${emp.employeeNumber || ""} · ${emp.department || ""}`}
            icon={<User className="w-5 h-5" />}
            actions={
              <div className="flex items-center gap-2">
                {/* <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button> */}
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Request Leave
                </button>
              </div>
            }
          />

          {/* ═══════════ LEAVE TO BE EXPIRED REPORT ═══════════ */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-base font-bold text-gray-900">
                Company Leave to be expired report
              </h2>
            </div>

            <div className="overflow-x-auto ">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th
                      colSpan={4}
                      className="text-center py-2 px-2 text-[11px] font-bold text-gray-700 uppercase tracking-wider bg-blue-50/50 border-r border-gray-200"
                    >
                      Person Detail
                    </th>
                    <th
                      colSpan={balances.length > 0 ? balances.length * 3 : 3}
                      className="text-center py-2 px-2 text-[11px] font-bold text-gray-700 uppercase tracking-wider bg-green-50/50 border-r border-gray-200"
                    >
                      Leave Balances
                    </th>
                    <th
                      colSpan={4}
                      className="text-center py-2 px-2 text-[11px] font-bold text-gray-700 uppercase tracking-wider bg-purple-50/50"
                    >
                      Active Period
                    </th>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-blue-50/30 whitespace-nowrap">
                      Person Number
                    </th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-blue-50/30 whitespace-nowrap">
                      Person Name
                    </th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-blue-50/30 whitespace-nowrap">
                      Hired Date
                    </th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-blue-50/30 border-r border-gray-200 whitespace-nowrap">
                      Service Year
                    </th>
                    {balances.map((b) => (
                      <React.Fragment key={b.leaveTypeId}>
                        <th className="text-center py-2.5 px-2 text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-green-50/30 whitespace-nowrap">
                          {b.leaveTypeName.replace(" Leave", "")}
                          <br />
                          <span className="text-[8px] font-normal text-gray-400">
                            Allocated
                          </span>
                        </th>
                        <th className="text-center py-2.5 px-2 text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-green-50/30 whitespace-nowrap">
                          {b.leaveTypeName.replace(" Leave", "")}
                          <br />
                          <span className="text-[8px] font-normal text-gray-400">
                            Taken
                          </span>
                        </th>
                        <th className="text-center py-2.5 px-2 text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-green-50/30 whitespace-nowrap">
                          {b.leaveTypeName.replace(" Leave", "")}
                          <br />
                          <span className="text-[8px] font-normal text-gray-400">
                            Balance
                          </span>
                        </th>
                      </React.Fragment>
                    ))}
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-purple-50/30 whitespace-nowrap">
                      Period Name
                    </th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-purple-50/30 whitespace-nowrap">
                      Start Date
                    </th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-purple-50/30 whitespace-nowrap">
                      End Date
                    </th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-purple-50/30 whitespace-nowrap">
                      Total Bal. as of {expiryShort}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-3 px-3 text-sm font-mono text-gray-600 bg-blue-50/10 whitespace-nowrap">
                      {emp.employeeNumber || "—"}
                    </td>
                    <td className="py-3 px-3 text-sm font-semibold text-gray-900 bg-blue-50/10">
                      {emp.name || "—"}
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-center bg-blue-50/10 whitespace-nowrap">
                      {fmtDate(hiredDate)}
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-center bg-blue-50/10 border-r border-gray-200">
                      {serviceDisplay || "—"}
                    </td>
                    {balances.map((b) => {
                      const entitled = b.allocated || 0;
                      const used = b.used || b.allocated - b.balance || 0;
                      const balance = b.balance || 0;
                      return (
                        <React.Fragment key={b.leaveTypeId}>
                          <td className="py-3 px-2 text-sm font-semibold text-gray-900 text-center bg-green-50/5">
                            {entitled}
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-700 text-center bg-green-50/5">
                            {used}
                          </td>
                          <td className="py-3 px-2 text-sm font-bold text-blue-600 text-center bg-green-50/5">
                            {balance.toFixed(2)}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="py-3 px-3 text-sm text-gray-700 text-center bg-purple-50/5">
                      {activePeriod?.name || "—"}
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-center bg-purple-50/5 whitespace-nowrap">
                      {activePeriod ? fmtDate(activePeriod.startDate) : "—"}
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-600 text-center bg-purple-50/5 whitespace-nowrap">
                      {activePeriod ? fmtDate(activePeriod.endDate) : "—"}
                    </td>
                    <td className="py-3 px-3 text-sm font-bold text-gray-900 text-center bg-purple-50/5">
                      {totalBalance.toFixed(2)}
                    </td>
                  </tr>
                  {balances.length > 0 && (
                    <tr className="bg-gray-100 font-bold">
                      <td
                        colSpan={2}
                        className="py-3 px-3 text-sm text-center text-gray-700"
                      >
                        Total: {totalEntitled} / Used: {totalUsed}
                      </td>
                      <td className="py-3 px-3 text-sm text-blue-700 text-center">
                        {totalBalance.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-amber-50/50">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> Please make sure to use your leave before
                it is being expired after the calendar year.
              </p>
            </div>
          </div>

          {/* ═══════════ LEAVE APPLICATIONS ═══════════ */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex gap-0">
              {/* Left — Table */}
              <div
                className={`flex-1 min-w-0 ${selectedApp ? "border-r border-gray-200" : ""}`}
              >
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900">
                    My Leave Applications
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {applications.length} application
                    {applications.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <FileText className="w-12 h-12 opacity-20 mb-3" />
                    <p className="text-sm font-medium">
                      No leave applications yet
                    </p>
                    <button
                      onClick={() => navigate("/hr/leave/applications")}
                      className="mt-3 text-xs text-blue-600 hover:underline"
                    >
                      Submit your first leave request
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-[700px] w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Leave Type
                          </th>
                          <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            From
                          </th>
                          <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            To
                          </th>
                          <th className="text-center py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[60px]">
                            Days
                          </th>
                          <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                          <th className="text-center py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Applied
                          </th>
                          <th className="text-center py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[70px]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {applications.map((app) => {
                          const statusStyle =
                            STATUS_STYLES[app.status] || STATUS_STYLES.Draft;
                          const displayStatus =
                            app.status === "Open" ? "Pending" : app.status;
                          return (
                            <tr
                              key={app.id}
                              onClick={() => handleSelectApp(app)}
                              className={`cursor-pointer transition-colors hover:bg-blue-50/30 ${selectedApp === app.id ? "bg-blue-50/50" : ""}`}
                            >
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${LEAVE_TYPE_STYLES[app.leaveType?.name] || "bg-gray-50 text-gray-700"}`}
                                >
                                  {app.leaveType?.name || "N/A (Leave Type)"}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">
                                {fmtShortDate(app.fromDate)}
                              </td>
                              <td className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">
                                {fmtShortDate(app.toDate)}
                              </td>
                              <td className="py-3 px-3 text-center text-sm font-semibold text-gray-900">
                                {app.totalLeaveDays}
                              </td>
                              <td className="py-3 px-3 text-sm text-gray-600 truncate max-w-[150px]">
                                {app.reason || "—"}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle}`}
                                >
                                  {displayStatus}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                                {fmtShortDate(app.createdAt)}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectApp(app);
                                  }}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${selectedApp === app.id ? "bg-blue-100 text-blue-700 border border-blue-200" : "text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100"}`}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right — Detail Panel */}
              {selectedApp && appDetail && (
                <div
                  className="w-[360px] flex-shrink-0 bg-white overflow-y-auto flex flex-col"
                  style={{ maxHeight: "calc(100vh - 380px)" }}
                >
                  {detailLoading ? (
                    <div className="flex items-center justify-center flex-1 py-16">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(appDetail.employeeId || appDetail.id)}`}
                          >
                            {initials(
                              appDetail.applicant?.firstName,
                              appDetail.applicant?.lastName,
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-900 uppercase truncate">
                              {appDetail.applicant?.firstName}{" "}
                              {appDetail.applicant?.lastName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {appDetail.applicant?.department?.name ||
                                "N/A (Department)"}{" "}
                              ·{" "}
                              {appDetail.applicant?.branch?.name ||
                                "N/A (Branch)"}
                            </div>
                          </div>
                          <button
                            onClick={handleCloseDetail}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {getStatusPill(
                          appDetail.status === "Open"
                            ? "Pending"
                            : appDetail.status,
                        )}
                      </div>
                      <div className="p-4 border-b border-gray-100">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                          Application Details
                        </h4>
                        <DetailRow
                          label="Leave type"
                          value={getLeaveTypePill(
                            appDetail.leaveType?.name || "N/A (Leave Type)",
                          )}
                        />
                        <DetailRow
                          label="From"
                          value={fmtDate(appDetail.fromDate)}
                        />
                        <DetailRow
                          label="To"
                          value={fmtDate(appDetail.toDate)}
                        />
                        <DetailRow
                          label="Working days"
                          value={`${appDetail.totalLeaveDays} days`}
                          highlight
                        />
                        <DetailRow
                          label="Reason"
                          value={appDetail.reason || "—"}
                        />
                        {appDetail.approver && (
                          <DetailRow
                            label="Approver"
                            value={`${appDetail.approver.firstName} ${appDetail.approver.lastName}`}
                          />
                        )}
                        {appDetail.rejectionReason && (
                          <DetailRow
                            label="Rejection reason"
                            value={appDetail.rejectionReason}
                          />
                        )}
                      </div>
                      <div className="p-4 border-b border-gray-100">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                          Approval Chain
                        </h4>
                        <TimelineStep
                          status="done"
                          title="Applied by employee"
                          subtitle={`${appDetail.applicant?.firstName || ""} ${appDetail.applicant?.lastName?.charAt(0) || ""}. · ${fmtDateTime(appDetail.createdAt)}`}
                        />
                        {appDetail.status === "Draft" && (
                          <div className="relative flex gap-3 pb-4">
                            <div className="absolute left-[7px] top-4 bottom-0 w-px bg-gray-200" />
                            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 bg-amber-100">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-800">
                                Submit for approval
                              </div>
                              <div className="text-xs text-amber-600 mt-0.5">
                                Application is still in draft
                              </div>
                              <button
                                onClick={handleSubmitDraft}
                                disabled={actionBusy}
                                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                              >
                                {actionBusy ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}{" "}
                                Submit for Approval
                              </button>
                            </div>
                          </div>
                        )}
                        <TimelineStep
                          status={
                            appDetail.status === "Open"
                              ? "current"
                              : appDetail.status === "Approved" ||
                                  appDetail.status === "Rejected"
                                ? "done"
                                : "pending"
                          }
                          title="Branch Manager review"
                          subtitle={
                            appDetail.status === "Open"
                              ? "Awaiting decision"
                              : appDetail.status === "Approved"
                                ? "Approved"
                                : appDetail.status === "Rejected"
                                  ? "Rejected"
                                  : "Not yet submitted"
                          }
                        />
                        <TimelineStep
                          status={
                            appDetail.status === "Approved" ? "done" : "pending"
                          }
                          title="HOM / GM (if escalated)"
                          subtitle={
                            appDetail.status === "Approved"
                              ? "Approved"
                              : "Not yet reached"
                          }
                          isLast
                        />
                      </div>
                      {appDetail.status === "Approved" && (
                        <div className="p-4">
                          <div className="p-3 rounded-lg text-xs font-medium text-center bg-green-50 text-green-700">
                            ✓ This application has been approved.
                          </div>
                        </div>
                      )}
                      {appDetail.status === "Rejected" && (
                        <div className="p-4">
                          <div className="p-3 rounded-lg text-xs font-medium text-center bg-red-50 text-red-700">
                            ✗ This application has been rejected.
                            {appDetail.rejectionReason && (
                              <p className="mt-1 opacity-80">
                                Reason: {appDetail.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {appDetail.status === "Cancelled" && (
                        <div className="p-4">
                          <div className="p-3 rounded-lg text-xs font-medium text-center bg-gray-50 text-gray-500">
                            This application has been cancelled.
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {!emp.reportsTo && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  No manager assigned
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  You don't have a reporting manager. Your leave applications
                  will stay as drafts until HR assigns a manager.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
