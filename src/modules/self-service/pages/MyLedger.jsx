import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "../../../api/axiosConfig";
import PageHeader from "../../../components/common/PageHeader";
import {
  BookOpen, Search, Loader2, Filter, ChevronDown, ChevronRight, ChevronLeft,
  X, Eye, PlusCircle, MinusCircle, DollarSign, Clock, FileText, Calendar,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractData = (res) => res?.data?.data || res?.data || {};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// ─── Constants ────────────────────────────────────────────────────────────────

const VOUCHER_CONFIG = {
  LeaveAllocation: { label: "Allocation", icon: PlusCircle, color: "text-green-500", bg: "bg-green-50" },
  LeaveApplication: { label: "Leave Taken", icon: MinusCircle, color: "text-red-500", bg: "bg-red-50" },
  LeaveEncashment: { label: "Encashment", icon: DollarSign, color: "text-amber-500", bg: "bg-amber-50" },
  CompensatoryLeaveRequest: { label: "Compensatory", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
};

const LEAVE_TYPE_COLORS = {
  "Annual Leave": "#534AB7", "Sick Leave": "#1D9E75", "Maternity Leave": "#D85A30",
  "Paternity Leave": "#0F6E56", "Emergency Leave": "#e97c0a", "Compensatory Leave": "#378ADD",
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MyLedger() {
  const [entries, setEntries] = useState([]);
  const [balances, setBalances] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("");
  const [voucherTypeFilter, setVoucherTypeFilter] = useState("");
  const [leaveTypes, setLeaveTypes] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Detail panel
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  //  FETCH DROPDOWNS
  // ═══════════════════════════════════════════════════════════════
  const fetchDropdowns = useCallback(async () => {
    try {
      const res = await apiClient.get("/leaves/leave-types");
      const types = res?.data?.data?.data || res?.data?.data || res?.data || [];
      setLeaveTypes(Array.isArray(types) ? types.filter(t => !t.disabled) : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

  // ═══════════════════════════════════════════════════════════════
  //  FETCH LEDGER
  // ═══════════════════════════════════════════════════════════════
  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (leaveTypeFilter) params.set("leaveTypeId", leaveTypeFilter);
      if (voucherTypeFilter) params.set("voucherType", voucherTypeFilter);

      const res = await apiClient.get(`/leaves/my-ledger?${params}`);
      const data = res?.data?.data || res?.data || {};

      let entriesData = data.data || [];
      setEntries(Array.isArray(entriesData) ? entriesData : []);
      setMeta(data.meta || null);
      setBalances(data.balances || []);
    } catch {
      toast.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, [page, limit, leaveTypeFilter, voucherTypeFilter]);

  useEffect(() => { fetchLedger(); }, [fetchLedger]);

  // ═══════════════════════════════════════════════════════════════
  //  CLIENT-SIDE SEARCH
  // ═══════════════════════════════════════════════════════════════
  const filteredEntries = search.trim()
    ? entries.filter(e =>
        e.leaveType?.name?.toLowerCase().includes(search.toLowerCase()) ||
        VOUCHER_CONFIG[e.voucherType]?.label?.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  // ═══════════════════════════════════════════════════════════════
  //  HANDLERS
  // ═══════════════════════════════════════════════════════════════
  const viewDetail = (entry) => {
    setSelectedEntry(entry);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedEntry(null);
  };

  const clearFilters = () => {
    setLeaveTypeFilter("");
    setVoucherTypeFilter("");
    setSearch("");
    setPage(1);
  };

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════
  const getVoucherIcon = (type) => {
    const config = VOUCHER_CONFIG[type];
    if (!config) return <FileText className="w-4 h-4 text-gray-400" />;
    const Icon = config.icon;
    return <Icon className={`w-4 h-4 ${config.color}`} />;
  };

  const getVoucherLabel = (type) => VOUCHER_CONFIG[type]?.label || type || "Unknown";

  return (
    <div className="flex flex-col gap-6 p-12 relative">
      <PageHeader
        title="My Ledger"
        subtitle="Your leave transaction history and audit trail"
        icon={<BookOpen className="w-5 h-5" />}
      />

      {/* Balance Cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {balances.map((b) => {
            const color = LEAVE_TYPE_COLORS[b.leaveTypeName] || "#6B7280";
            return (
              <div key={b.leaveTypeId} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{b.leaveTypeName}</div>
                <div className="text-2xl font-bold" style={{ color }}>{b.balance}</div>
                <div className="text-[10px] text-gray-400">days remaining</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input placeholder="Search entries..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400" />
        </div>

        <select value={leaveTypeFilter} onChange={(e) => { setLeaveTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400 text-gray-600">
          <option value="">All Leave Types</option>
          {leaveTypes.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
        </select>

        <select value={voucherTypeFilter} onChange={(e) => { setVoucherTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400 text-gray-600">
          <option value="">All Voucher Types</option>
          {Object.entries(VOUCHER_CONFIG).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
        </select>

        {(leaveTypeFilter || voucherTypeFilter || search) && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}

        <span className="text-xs text-gray-400 ml-auto">
          {meta?.total || 0} entr{meta?.total !== 1 ? "ies" : "y"}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading ledger...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BookOpen className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-sm">No ledger entries found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[50px]">Type</th>
                    <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Voucher</th>
                    <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Leave Type</th>
                    <th className="text-center py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[80px]">Days</th>
                    <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Valid From</th>
                    <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Valid To</th>
                    <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="text-center py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[80px]">Status</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[60px]">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          {getVoucherIcon(entry.voucherType)}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs font-medium text-gray-700">{getVoucherLabel(entry.voucherType)}</span>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{entry.voucherNo?.substring(0, 8) || "—"}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700">
                          {entry.leaveType?.name || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-sm font-bold ${(entry.leaves || 0) > 0 ? "text-green-600" : (entry.leaves || 0) < 0 ? "text-red-600" : "text-gray-500"}`}>
                          {(entry.leaves || 0) > 0 ? "+" : ""}{entry.leaves}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(entry.fromDate)}</td>
                      <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(entry.toDate)}</td>
                      <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(entry.createdAt)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          entry.isExpired ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-600 border border-green-200"
                        }`}>
                          {entry.isExpired ? "Expired" : "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => viewDetail(entry)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Page {meta.page} of {meta.totalPages}</span>
                <div className="flex items-center gap-1">
                  <button disabled={meta.page === 1} onClick={() => setPage(p => p - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-gray-500 px-2">{meta.page}</span>
                  <button disabled={!meta.hasNext} onClick={() => setPage(p => p + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-30">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════════ DETAIL PANEL ═══════════════ */}
      {detailOpen && selectedEntry && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={closeDetail} />
          <div className="fixed top-20 right-6 z-50 h-auto w-full max-w-xs bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Ledger Entry Detail</h3>
                <p className="text-[10px] text-gray-400 font-mono">{selectedEntry.id?.substring(0, 8)}</p>
              </div>
              <button onClick={closeDetail} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <DetailRow label="Voucher Type" value={getVoucherLabel(selectedEntry.voucherType)} />
              <DetailRow label="Leave Type" value={selectedEntry.leaveType?.name || "—"} />
              <DetailRow label="Voucher No" value={selectedEntry.voucherNo?.substring(0, 8) || "—"} mono />
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

// ─── Detail Row ──────────────────────────────────────────────────────────────

function DetailRow({ label, value, highlight, mono }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={`text-[11px] font-medium ${mono ? "font-mono text-gray-500" : ""} ${highlight ? "text-blue-600 font-semibold" : "text-gray-800"}`}>
        {value}
      </span>
    </div>
  );
}