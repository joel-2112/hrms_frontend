import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Users, UserCheck, UserX, Clock, TrendingUp, Award,
  UserPlus, RefreshCw, ArrowRight, Building2, Briefcase,
  AlertCircle, CheckCircle2, Timer, Calendar,
} from "lucide-react";
const baseUrl = import.meta.env.VITE_API_URL;

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Extracts data array from any API response shape */
const extractArray = (res) => {
  const data = res?.data?.data?.data
    || res?.data?.data
    || res?.data
    || [];
  return Array.isArray(data) ? data : [];
};

/** Extracts object from any API response shape */
const extractObject = (res) => {
  const data = res?.data?.data?.data
    || res?.data?.data
    || res?.data
    || {};
  return typeof data === "object" && !Array.isArray(data) ? data : {};
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateShort = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";

/**
 * Calculate exact duration from dateOfJoining to now.
 * Returns { years, months, days } object.
 */
const getDuration = (dateOfJoining) => {
  if (!dateOfJoining) return null;
  
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
};

/**
 * Format duration into readable string.
 * e.g., "2yr 3mo 15d" or "5mo 10d" or "1yr 0mo 5d"
 */
const formatDuration = (duration) => {
  if (!duration) return "—";
  
  const parts = [];
  if (duration.years > 0) parts.push(`${duration.years}yr`);
  if (duration.months > 0) parts.push(`${duration.months}mo`);
  if (duration.days > 0 || parts.length === 0) parts.push(`${duration.days}d`);
  
  return parts.join(" ");
};

const initials = (e) =>
  `${e?.firstName?.[0] ?? ""}${e?.lastName?.[0] ?? ""}`.toUpperCase() || "?";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700", "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700", "bg-pink-100 text-pink-700",
];
const avatarColor = (id = "") => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

const STATUS_CFG = {
  Active:    { label: "Active",    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  Inactive:  { label: "Pending",   cls: "bg-gray-100 text-gray-600 border border-gray-200" },
  Suspended: { label: "Suspended", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  onLeave:   { label: "On Leave",  cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  exited:    { label: "Exited",    cls: "bg-red-50 text-red-600 border border-red-200" },
};

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.Inactive;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function Avatar({ employee, size = "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  const API_BASE = baseUrl;
  const imageUrl = employee?.image
    ? (employee.image.startsWith('http') ? employee.image : `${API_BASE}/uploads/${employee.image}`)
    : null;

  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={employee.firstName} 
        className={`${sz} rounded-full object-cover flex-shrink-0`}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${avatarColor(employee?.id)}`}>
      {initials(employee)}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = "blue", onClick }) {
  const colors = {
    blue:    "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber:   "bg-amber-50 text-amber-600",
    rose:    "bg-rose-50 text-rose-600",
    violet:  "bg-violet-50 text-violet-600",
    gray:    "bg-gray-100 text-gray-600",
  };
  return (
    <button
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl px-4 py-4 flex items-center gap-3 w-full text-left transition-all hover:border-gray-300 hover:shadow-sm ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className={`p-2.5 rounded-xl ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500 leading-none mb-1 truncate">{label}</div>
        <div className="text-xl font-bold text-gray-900 leading-none tabular-nums">{value ?? "—"}</div>
        {sub && <div className="text-xs text-gray-400 mt-1 truncate">{sub}</div>}
      </div>
    </button>
  );
}

function SectionCard({ title, icon, children, action, loading }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <span className="text-sm font-semibold text-gray-800">{title}</span>
        </div>
        {action}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-300">
          <RefreshCw className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const navigate   = useNavigate();
  const { canRead, canCreate } = usePermission("Employee");

  const [stats,        setStats]        = useState(null);
  const [anniversaries,setAnniversaries]= useState([]);
  const [recent,       setRecent]       = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAnn,   setLoadingAnn]   = useState(true);
  const [loadingRec,   setLoadingRec]   = useState(true);

  const load = useCallback(async () => {
    setLoadingStats(true);
    setLoadingAnn(true);
    setLoadingRec(true);

    try {
      const [s, a, r] = await Promise.allSettled([
        apiClient.get("/employees/stats"),
        apiClient.get("/employees/anniversaries"),
        apiClient.get("/employees/recently-joined", { params: { limit: 8 } }),
      ]);

      // Stats — object
      if (s.status === "fulfilled") {
        setStats(extractObject(s.value));
      } else {
        setStats({});
      }

      // Anniversaries — array
      if (a.status === "fulfilled") {
        setAnniversaries(extractArray(a.value));
      } else {
        setAnniversaries([]);
      }

      // Recently joined — array
      if (r.status === "fulfilled") {
        setRecent(extractArray(r.value));
      } else {
        setRecent([]);
      }
    } catch {
      // Already handled by Promise.allSettled
    } finally {
      setLoadingStats(false);
      setLoadingAnn(false);
      setLoadingRec(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = stats?.inactive ?? 0;
  const activeCount = stats?.active ?? 0;
  const onLeaveCount = stats?.onLeave ?? 0;
  const suspendedCount = stats?.suspended ?? 0;
  const totalCount = stats?.total ?? 0;

  return (
    <div className="flex flex-col gap-5 pb-10">
      <PageHeader
        title="Employees"
        subtitle="Workforce overview — lifecycle management, stats, and insights"
        icon={<Users className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <button
                onClick={() => navigate("/hr/employees/new")}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" /> Add employee
              </button>
            )}
            <button
              onClick={() => navigate("/hr/employees/list")}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Users className="w-4 h-4" /> View all
            </button>
          </div>
        }
      />

      {/* Pending approval banner */}
      {!loadingStats && pending > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-800 font-medium">
              {pending} employee record{pending > 1 ? "s" : ""} pending GM approval
            </span>
          </div>
          <button
            onClick={() => navigate("/hr/employees/list?status=Inactive")}
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900"
          >
            Review <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stats grid */}
      {loadingStats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border border-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total employees"
            value={totalCount || "—"}
            color="blue"
            onClick={() => navigate("/hr/employees/list")}
          />
          <StatCard
            icon={<UserCheck className="w-5 h-5" />}
            label="Active"
            value={activeCount || "—"}
            sub={totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% of total` : null}
            color="emerald"
            onClick={() => navigate("/hr/employees/list?status=Active")}
          />
          <StatCard
            icon={<Timer className="w-5 h-5" />}
            label="Pending approval"
            value={pending}
            color={pending > 0 ? "amber" : "gray"}
            onClick={() => navigate("/hr/employees/list?status=Inactive")}
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="On leave"
            value={onLeaveCount || "—"}
            color="violet"
            onClick={() => navigate("/hr/employees/list?status=onLeave")}
          />
          <StatCard
            icon={<UserX className="w-5 h-5" />}
            label="Suspended"
            value={suspendedCount || "—"}
            color={suspendedCount > 0 ? "rose" : "gray"}
            onClick={() => navigate("/hr/employees/list?status=Suspended")}
          />
        </div>
      )}

      {/* Department breakdown */}
      {!loadingStats && stats?.departmentDistribution?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.departmentDistribution.slice(0, 4).map((d) => (
            <div key={d.departmentId ?? d.departmentName} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 truncate">{d.departmentName ?? "—"}</span>
              </div>
              <div className="text-lg font-bold text-gray-900 tabular-nums">{d.count}</div>
              <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((d.count / (totalCount || 1)) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recently joined */}
        <div>
          <SectionCard
            title="Recently joined"
            icon={<UserPlus className="w-4 h-4" />}
            loading={loadingRec}
            action={
              <button
                onClick={() => navigate("/hr/employees/list?sort=dateOfJoining")}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            }
          >
            {recent.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No new hires in the last 30 days</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recent.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => navigate(`/hr/employees/${emp.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Avatar employee={emp} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {emp.designation?.name ?? "—"} · {emp.department?.name ?? "—"}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <StatusPill status={emp.status} />
                      <div className="text-xs text-gray-400 mt-1">{fmtDateShort(emp.dateOfJoining)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Work Anniversaries */}
        <div>
          <SectionCard
            title="Work anniversaries this month"
            icon={<Award className="w-4 h-4" />}
            loading={loadingAnn}
          >
            {anniversaries.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No anniversaries this month</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {anniversaries.map((emp) => {
                  const duration = getDuration(emp.dateOfJoining);
                  const durationStr = formatDuration(duration);
                  const day = emp.day || new Date(emp.dateOfJoining).getDate();
                  
                  return (
                    <button
                      key={emp.id}
                      onClick={() => navigate(`/hr/employees/${emp.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Avatar employee={emp} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {emp.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {emp.department ?? emp.designation ?? "—"}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                          {durationStr}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          {fmtDateShort(emp.dateOfJoining)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Branch breakdown */}
      {!loadingStats && stats?.branchDistribution?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">Headcount by branch</span>
          </div>
          <div className="px-4 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.branchDistribution.map((b) => {
                const pct = Math.min(100, Math.round((b.count / (totalCount || 1)) * 100));
                return (
                  <button
                    key={b.branchId ?? b.branchName}
                    onClick={() => navigate(`/hr/employees?branch=${b.branchId ?? ""}`)}
                    className="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700 truncate">{b.branchName ?? "—"}</span>
                      <span className="text-sm font-bold text-gray-900 tabular-nums ml-2">{b.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{pct}% of total</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}