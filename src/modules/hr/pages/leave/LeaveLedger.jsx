import { useEffect, useState, useCallback } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  Search, Loader2, User, BookOpen, RefreshCw,
  PlusCircle, MinusCircle, DollarSign, Clock, FileText,
  Eye, X, ChevronDown,
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

const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const VOUCHER_TYPES = [
  { value: "", label: "All Types" },
  { value: "LeaveApplication", label: "Leave Taken" },
  { value: "LeaveEncashment", label: "Encashment" },
  { value: "CompensatoryLeaveRequest", label: "Compensatory" },
  { value: "LeaveAllocation", label: "Allocation" },
  { value: "Expiration", label: "Expired" },
];

const getVoucherIcon = (type) => {
  switch (type) {
    case "LeaveAllocation": return <PlusCircle className="w-4 h-4 text-green-500" />;
    case "LeaveApplication": return <MinusCircle className="w-4 h-4 text-red-500" />;
    case "LeaveEncashment": return <DollarSign className="w-4 h-4 text-amber-500" />;
    case "CompensatoryLeaveRequest": return <Clock className="w-4 h-4 text-blue-500" />;
    case "Expiration": return <Clock className="w-4 h-4 text-gray-400" />;
    default: return <FileText className="w-4 h-4 text-gray-400" />;
  }
};

const getVoucherLabel = (type) => {
  switch (type) {
    case "LeaveAllocation": return "Allocation";
    case "LeaveApplication": return "Leave Taken";
    case "LeaveEncashment": return "Encashment";
    case "CompensatoryLeaveRequest": return "Compensatory";
    case "Expiration": return "Expired";
    default: return type || "Unknown";
  }
};

export default function LeaveLedger() {
  const { canRead } = usePermission("LeaveLedgerEntry");

  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [selectedVoucherType, setSelectedVoucherType] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [empRes, typeRes] = await Promise.all([
        apiClient.get("/employees?limit=500"),
        apiClient.get("/leaves/leave-types"),
      ]);
      setEmployees(extractArray(empRes));
      setLeaveTypes(extractArray(typeRes).filter((t) => !t.disabled && t.isActive));
    } catch {
      toast.error("Failed to load data");
    }
  }, []);

  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (selectedEmployee) params.set("employeeId", selectedEmployee);
      if (selectedLeaveType) params.set("leaveTypeId", selectedLeaveType);
      if (selectedVoucherType) params.set("voucherType", selectedVoucherType);

      const res = await apiClient.get(`/leaves/ledgers?${params}`);
      const data = extractArray(res);
      setEntries(Array.isArray(data) ? data : []);
      setMeta(res?.data?.meta || res?.data?.data?.meta || null);
    } catch {
      toast.error("Failed to load ledger");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, selectedLeaveType, selectedVoucherType, page]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const getEmployeeName = (id) => {
    const e = employees.find((emp) => emp.id === id);
    return e ? `${e.firstName} ${e.lastName}` : id;
  };

  const getLeaveTypeName = (id) => leaveTypes.find((t) => t.id === id)?.name || id;

  const filteredEmployees = employeeSearch.trim()
    ? employees.filter((e) => {
        const q = employeeSearch.toLowerCase();
        const name = `${e.firstName} ${e.lastName}`.toLowerCase();
        return name.includes(q) || e.employeeNumber?.toLowerCase().includes(q);
      }).slice(0, 30)
    : employees.slice(0, 30);

  const viewDetail = (entry) => { setSelectedEntry(entry); setDetailOpen(true); };

  // Group entries by voucherType for display
  const groupedEntries = entries.reduce((acc, entry) => {
    const key = entry.voucherType || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5 pb-10 relative">
      <PageHeader
        title="Leave Ledger"
        subtitle="Immutable audit trail of all leave transactions"
        icon={<BookOpen className="w-5 h-5" />}
      />

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Employee picker */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Employee</label>
            {selectedEmployee ? (
              <div className="flex items-center justify-between px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-green-50">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-gray-900 font-medium">{getEmployeeName(selectedEmployee)}</span>
                </div>
                <button onClick={() => { setSelectedEmployee(""); setPage(1); }}
                  className="text-gray-400 hover:text-red-500">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text" value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Search employee..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                />
                {employeeSearch && filteredEmployees.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                    {filteredEmployees.map((e) => (
                      <button key={e.id}
                        onClick={() => { setSelectedEmployee(e.id); setEmployeeSearch(""); setPage(1); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-bold">
                          {(e.firstName?.charAt(0) || "") + (e.lastName?.charAt(0) || "")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{e.firstName} {e.lastName}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{e.employeeNumber}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Leave type */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Leave Type</label>
            <select value={selectedLeaveType} onChange={(e) => { setSelectedLeaveType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400">
              <option value="">All Types</option>
              {leaveTypes.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>

          {/* Voucher type */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Transaction Type</label>
            <select value={selectedVoucherType} onChange={(e) => { setSelectedVoucherType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400">
              {VOUCHER_TYPES.map((vt) => (<option key={vt.value} value={vt.value}>{vt.label}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Ledger Entries</h3>
          </div>
          <span className="text-xs text-gray-400">{meta?.total || entries.length} entries</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BookOpen className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-sm">No ledger entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Grouped by voucher type */}
            {Object.entries(groupedEntries).map(([voucherType, items]) => (
              <div key={voucherType}>
                <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  {getVoucherIcon(voucherType)}
                  <span className="text-xs font-semibold text-gray-600">{getVoucherLabel(voucherType)}</span>
                  <span className="text-[10px] text-gray-400">({items.length})</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Employee</th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Leave Type</th>
                      <th className="text-center py-2 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-[70px]">Days</th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Period</th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="text-center py-2 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-[70px]">Status</th>
                      <th className="text-center py-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[8px] font-bold">
                              {(entry.employee?.firstName?.charAt(0) || "") + (entry.employee?.lastName?.charAt(0) || "?")}
                            </div>
                            <span className="text-xs font-medium text-gray-900">
                              {entry.employee ? `${entry.employee.firstName} ${entry.employee.lastName}` : getEmployeeName(entry.employeeId)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-600">{entry.leaveType?.name || getLeaveTypeName(entry.leaveTypeId)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-xs font-bold ${(entry.leaves || 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                            {(entry.leaves || 0) > 0 ? "+" : ""}{entry.leaves || 0}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-gray-500">{fmtDate(entry.fromDate)} – {fmtDate(entry.toDate)}</td>
                        <td className="py-2.5 px-3 text-[11px] text-gray-500">{fmtDateTime(entry.createdAt)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold ${entry.isExpired ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                            {entry.isExpired ? "Expired" : "Active"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button onClick={() => viewDetail(entry)} className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600">
                            <Eye className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Page {meta.page} of {meta.totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="px-3 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30">Prev</button>
              <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}
                className="px-3 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {detailOpen && selectedEntry && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setDetailOpen(false)} />
          <div className="fixed top-20 right-6 z-50 w-full max-w-xs bg-white shadow-2xl rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Ledger Entry Detail</h3>
                <p className="text-[10px] text-gray-400 font-mono">{selectedEntry.id?.substring(0, 8)}</p>
              </div>
              <button onClick={() => setDetailOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <DetailRow label="Type" value={getVoucherLabel(selectedEntry.voucherType)} />
              <DetailRow label="Voucher No" value={selectedEntry.voucherNo?.substring(0, 8) || "—"} mono />
              <DetailRow label="Employee" value={getEmployeeName(selectedEntry.employeeId)} />
              <DetailRow label="Leave Type" value={getLeaveTypeName(selectedEntry.leaveTypeId)} />
              <DetailRow label="Days" value={`${(selectedEntry.leaves || 0) > 0 ? "+" : ""}${selectedEntry.leaves || 0}`} highlight />
              <DetailRow label="From" value={fmtDate(selectedEntry.fromDate)} />
              <DetailRow label="To" value={fmtDate(selectedEntry.toDate)} />
              <DetailRow label="Status" value={selectedEntry.isExpired ? "Expired" : "Active"} />
              <DetailRow label="Created" value={fmtDateTime(selectedEntry.createdAt)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value, highlight, mono }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={`text-[11px] font-medium ${mono ? "font-mono text-gray-500" : ""} ${highlight ? "text-blue-600 font-semibold" : "text-gray-800"}`}>{value}</span>
    </div>
  );
}