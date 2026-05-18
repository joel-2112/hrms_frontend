import { useEffect, useState } from "react";
import { useApi } from "../../../hooks/useApi";
import PageHeader from "../../../components/common/PageHeader";
import DataTable from "../../../components/common/DataTable";
import { formatCurrency, formatDate } from "../../../utils/formatters";

export default function PaymentsPage() {
  const { get } = useApi();
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const d = await get("/finance/payments"); if (d) setRows(d); })(); }, [get]);

  const columns = [
    { key: "id", label: "Payment", mono: true },
    { key: "invoice", label: "Invoice", mono: true },
    { key: "amount", label: "Amount", align: "right", render: (r) => formatCurrency(r.amount) },
    { key: "method", label: "Method" },
    { key: "date", label: "Date", render: (r) => formatDate(r.date) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Incoming payments and reconciliation." />
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
