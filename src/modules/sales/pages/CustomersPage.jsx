import { useEffect, useState } from "react";
import { useApi } from "../../../hooks/useApi";
import PageHeader from "../../../components/common/PageHeader";
import DataTable from "../../../components/common/DataTable";
import { formatCurrency } from "../../../utils/formatters";

export default function CustomersPage() {
  const { get } = useApi();
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const d = await get("/sales/customers"); if (d) setRows(d); })(); }, [get]);

  const columns = [
    { key: "id", label: "ID", mono: true },
    { key: "name", label: "Customer" },
    { key: "industry", label: "Industry" },
    { key: "contact", label: "Primary contact" },
    { key: "value", label: "Lifetime value", align: "right", render: (r) => formatCurrency(r.value) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" subtitle="Accounts and lifetime value." />
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
