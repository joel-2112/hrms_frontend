import { useEffect, useState } from "react";
import { useApi } from "../../../hooks/useApi";
import PageHeader from "../../../components/common/PageHeader";
import DataTable from "../../../components/common/DataTable";
import StatusPill from "../../../components/common/StatusPill";
import { formatCurrency, formatDate } from "../../../utils/formatters";

export default function OrdersPage() {
  const { get } = useApi();
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const d = await get("/sales/orders"); if (d) setRows(d); })(); }, [get]);

  const columns = [
    { key: "id", label: "Order", mono: true },
    { key: "customer", label: "Customer" },
    { key: "items", label: "Items", align: "right" },
    { key: "amount", label: "Amount", align: "right", render: (r) => formatCurrency(r.amount) },
    { key: "date", label: "Date", render: (r) => formatDate(r.date) },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="All sales orders and fulfilment status." />
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
