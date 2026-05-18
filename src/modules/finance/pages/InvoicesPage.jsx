import { useEffect, useState } from "react";
import { Plus, Download } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { useApi } from "../../../hooks/useApi";
import PageHeader from "../../../components/common/PageHeader";
import DataTable from "../../../components/common/DataTable";
import StatusPill from "../../../components/common/StatusPill";
import { StatCard } from "../../../components/common/StatCard";
import { Receipt, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { toast } from "sonner";

export default function InvoicesPage() {
  const { canCreate, canExport } = usePermission("Invoice");
  const { get } = useApi();
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const d = await get("/finance/invoices"); if (d) setRows(d); })(); }, [get]);

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const overdue = rows.filter((r) => r.status === "Overdue").length;
  const paid = rows.filter((r) => r.status === "Paid").length;

  const columns = [
    { key: "id", label: "Invoice", mono: true },
    { key: "customer", label: "Customer" },
    { key: "amount", label: "Amount", align: "right", render: (r) => formatCurrency(r.amount) },
    { key: "dueDate", label: "Due", render: (r) => formatDate(r.dueDate) },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="All issued invoices, statuses, and balances."
        actions={
          <>
            {canExport && (
              <button onClick={() => toast.success("Invoices exported")} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-base hover:bg-muted">
                <Download className="h-4 w-4" /> Export
              </button>
            )}
            {canCreate && (
              <button onClick={() => toast.info("New invoice (demo)")} className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-base hover:shadow-glow">
                <Plus className="h-4 w-4" /> New invoice
              </button>
            )}
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total billed" value={formatCurrency(total)} icon={Receipt} />
        <StatCard label="Paid" value={paid} icon={CheckCircle2} accent="success" />
        <StatCard label="Overdue" value={overdue} icon={AlertCircle} accent="destructive" />
      </div>
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
