import React, { useState, useEffect, useCallback } from "react";
import { usePermission, useHasAnyPermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Users, Clock, TrendingUp, FileText, Download, AlertCircle, Plus,
  Calendar, RefreshCw, ArrowRight, Loader2, CheckCircle2, XCircle,
  Umbrella, Bed, Baby, Gift, TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// ═════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const extractData = (res) => res?.data?.data.data || res?.data || {};
const extractArray = (res) => {
  const d = res?.data?.data || res?.data || [];
  return Array.isArray(d) ? d : [];
};

const LEAVE_TYPE_COLORS = {
  Annual: "#534AB7", Sick: "#1D9E75", Maternity: "#D85A30",
  Compensatory: "#378ADD", Unpaid: "#888780", Paternity: "#0F6E56",
};

const LEAVE_TYPE_ICONS = {
  Annual: Umbrella, Sick: Bed, Maternity: Baby,
  Compensatory: Gift, Unpaid: TrendingDown, Paternity: Users,
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700", "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-cyan-100 text-cyan-700",
];

const Avatar = ({ name }) => {
  const initials = name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";
  const color = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${color}`}>{initials}</div>;
};

// ═════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

const StatCard = ({ label, value, subtext, icon: Icon, color = "blue" }) => {
  const c = { blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600", green: "bg-green-50 text-green-600", purple: "bg-purple-50 text-purple-600" };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        {Icon && <div className={`p-2 rounded-lg ${c[color]}`}><Icon size={16} /></div>}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-[11px] text-gray-400 mt-1">{subtext}</div>
    </div>
  );
};

const BalanceCard = ({ name, entitled, avgRemaining, utilizationPercent, color, icon: Icon }) => (
  <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {Icon && <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}18` }}><Icon size={14} style={{ color }} /></div>}
        <span className="text-xs font-semibold text-gray-700">{name}</span>
      </div>
      <span className="text-[10px] text-gray-400">{utilizationPercent}% used</span>
    </div>
    <div className="text-xl font-bold text-gray-900 mb-2">
      {typeof entitled === "number" ? `${entitled}` : entitled}
      <span className="text-xs font-normal text-gray-400 ml-1">days</span>
    </div>
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(utilizationPercent, 100)}%`, backgroundColor: color }} />
    </div>
    <div className="text-[11px] text-gray-500">{avgRemaining} avg remaining</div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const LeaveDashboard = () => {
  const navigate = useNavigate();
  const leavePerms = usePermission("LeaveApplication");
  const canViewLeave = useHasAnyPermission("LeaveApplication");
  const canApprove = leavePerms.canApprove || leavePerms.canSubmit;
  const canCreate = leavePerms.canCreate;
  const canExport = leavePerms.canExport;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);

  // All data from backend
  const [stats, setStats] = useState({});
  const [balances, setBalances] = useState({});
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [onLeaveThisWeek, setOnLeaveThisWeek] = useState([]);
  const [leaveByType, setLeaveByType] = useState([]);
  const [nextHoliday, setNextHoliday] = useState(null);
  const [leavePeriods, setLeavePeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");

  // ═══════════════════════════════════════════════════════════════════
  //  LOAD PERIODS FIRST, THEN DASHBOARD
  // ═══════════════════════════════════════════════════════════════════

  const fetchPeriods = useCallback(async () => {
    try {
      const res = await apiClient.get("/leaves/leave-periods");
      const periods = extractArray(res);
      setLeavePeriods(periods);
      const active = periods.find(p => p.isActive);
      setSelectedPeriod(active?.name || periods[0]?.name || new Date().getFullYear().toString());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

  const fetchDashboardData = useCallback(async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    setError(null);
    try {
      const periodParam = selectedPeriod.includes("-") 
        ? selectedPeriod.split(" ")[0] 
        : selectedPeriod;

      const [
        statsRes, balancesRes, pendingRes, onLeaveRes, leaveTypeRes, holidayRes,
      ] = await Promise.all([
        apiClient.get("/leaves/dashboard/stats", { params: { period: periodParam } }),
        apiClient.get("/leaves/dashboard/balances"),
        apiClient.get("/leaves/dashboard/pending-approvals", { params: { limit: 4 } }),
        apiClient.get("/leaves/dashboard/on-leave-this-week"),
        apiClient.get("/leaves/dashboard/by-type", { params: { period: periodParam } }),
        apiClient.get("/leaves/dashboard/next-holiday"),
      ]);

      setStats(extractData(statsRes));
      setBalances(extractData(balancesRes));
      setPendingApprovals(extractArray(pendingRes));
      setOnLeaveThisWeek(extractArray(onLeaveRes));
      setLeaveByType(extractArray(leaveTypeRes));
      setNextHoliday(extractData(holidayRes));
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
      setError(err?.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // ═══════════════════════════════════════════════════════════════════
  //  ACTIONS
  // ═══════════════════════════════════════════════════════════════════

  const handleApprove = async (leaveId) => {
    setApproving(leaveId);
    try {
      await apiClient.post(`/leaves/applications/${leaveId}/approve`);
      toast.success("Leave approved");
      fetchDashboardData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approval failed");
    } finally { setApproving(null); }
  };

  const handleExport = async () => {
    try {
      const res = await apiClient.get("/leaves/dashboard/export", { params: { period: selectedPeriod } });
      const data = res?.data?.data || res?.data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `leave-dashboard-${selectedPeriod}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      toast.success("Dashboard exported");
    } catch { toast.error("Export failed"); }
  };

  const getLeaveTypePill = (type) => {
    const s = { Annual: "bg-purple-50 text-purple-700", Sick: "bg-teal-50 text-teal-700", Maternity: "bg-amber-50 text-amber-800", Compensatory: "bg-blue-50 text-blue-700", Unpaid: "bg-gray-100 text-gray-600", Paternity: "bg-green-50 text-green-700" };
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${s[type] || "bg-gray-50 text-gray-700"}`}>{type || "Unknown"}</span>;
  };

  // ═══════════════════════════════════════════════════════════════════
  //  LOADING
  // ═══════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  ERROR
  // ═══════════════════════════════════════════════════════════════════
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
          <AlertCircle className="text-red-500" size={24} />
          <div className="flex-1"><h3 className="font-bold text-red-800">Error Loading Dashboard</h3><p className="text-sm text-red-600">{error}</p></div>
          <button onClick={fetchDashboardData} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Retry</button>
        </div>
      </div>
    );
  }

  if (!canViewLeave) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="text-amber-500 mx-auto mb-3" size={32} />
          <h3 className="font-bold text-amber-800">Access Denied</h3>
          <p className="text-sm text-amber-600 mt-1">No permission to view leave dashboard.</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════
  const balanceKeys = Object.keys(balances || {});

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title="Leave Dashboard"
        subtitle="Real-time overview of leave stats, balances, and pending approvals"
        icon={<Calendar className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-3">
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              {leavePeriods.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            {canExport && (
              <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download size={14} /> Export
              </button>
            )}
            {canCreate && (
              <button onClick={() => navigate("/hr/leave/applications")} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                <Plus size={14} /> New Application
              </button>
            )}
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="On Leave Today" value={stats.onLeaveToday ?? 0}
          subtext={`${stats.branchesWithLeave ?? 0} of ${stats.totalBranches ?? 0} branches`} icon={Users} color="blue" />
        <StatCard label="Pending Approval" value={stats.pendingApprovals ?? 0}
          subtext={stats.oldestPending ? `Oldest: ${stats.oldestPending}` : "None"} icon={Clock} color="amber" />
        <StatCard label="Leave Taken This Month" value={stats.leavesTakenThisMonth ?? 0}
          subtext="Days across all staff" icon={TrendingUp} color="green" />
        <StatCard label="Encashment Eligible" value={stats.encashmentEligible ?? 0}
          subtext="Employees" icon={FileText} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balances — dynamic from backend */}
          {balanceKeys.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Leave Balance Snapshot</h3>
                <button onClick={handleExport} className="text-xs text-blue-600 hover:text-blue-700">Export</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {balanceKeys.map((key) => {
                  const b = balances[key];
                  const color = LEAVE_TYPE_COLORS[key] || "#6B7280";
                  const Icon = LEAVE_TYPE_ICONS[key] || FileText;
                  return (
                    <BalanceCard key={key} name={key.charAt(0).toUpperCase() + key.slice(1)}
                      entitled={b.entitled} avgRemaining={b.avgRemaining}
                      utilizationPercent={b.utilizationPercent} color={color} icon={Icon} />
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Approvals */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Pending Approvals</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                  {stats.pendingApprovals ?? 0}
                </span>
              </div>
              <button onClick={() => navigate("/hr/leave/applications")} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left py-3 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="text-center py-3 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="text-center py-3 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[90px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingApprovals.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-sm text-gray-400">No pending approvals 🎉</td></tr>
                ) : (
                  pendingApprovals.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={a.employee?.name} />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{a.employee?.name}</div>
                            <div className="text-[11px] text-gray-400">{a.employee?.department} · {a.employee?.branch}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">{getLeaveTypePill(a.leaveType)}</td>
                      <td className="py-3 px-3 text-sm text-gray-700">{a.duration}</td>
                      <td className="py-3 px-3 text-center text-sm font-bold text-gray-900">{a.days}</td>
                      <td className="py-3 px-3 text-center">
                        {canApprove && (
                          <button onClick={() => handleApprove(a.id)} disabled={approving === a.id}
                            className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors">
                            {approving === a.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Approve"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          {/* On Leave This Week */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">On Leave This Week</h3>
              <button onClick={() => navigate("/hr/leave/applications")} className="text-xs text-blue-600 hover:text-blue-700">View all</button>
            </div>
            <div className="space-y-3">
              {onLeaveThisWeek.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No one on leave</p>
              ) : (
                onLeaveThisWeek.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.name} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                        <div className="text-[11px] text-gray-400">{emp.dates} · {emp.leaveType}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-medium text-green-700 bg-green-50 rounded-full">Active</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Leave by Type */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Leave by Type</h3>
            {leaveByType.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No data</p>
            ) : (
              <div className="space-y-4">
                {leaveByType.map((item) => (
                  <div key={item.type}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-600">{item.type}</span>
                      <span className="font-semibold text-gray-900">{item.days} days</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.percentage}%`, backgroundColor: item.color || "#6B7280" }} />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{item.percentage}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Holiday */}
          {nextHoliday && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-green-800 mb-1">📅 Next Holiday</h4>
              <p className="text-xs text-green-700">{nextHoliday.name} · {nextHoliday.date} · {nextHoliday.daysAway} days away</p>
              {nextHoliday.overlappingLeaves > 0 && (
                <p className="text-xs text-green-600 mt-1">{nextHoliday.overlappingLeaves} employees on leave</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveDashboard;