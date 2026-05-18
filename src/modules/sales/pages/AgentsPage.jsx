import { useEffect, useState } from "react";
import { useApi } from "../../../hooks/useApi";
import PageHeader from "../../../components/common/PageHeader";
import DataTable from "../../../components/common/DataTable";
import { formatPercent } from "../../../utils/formatters";

export default function AgentsPage() {
  const { get } = useApi();
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const d = await get("/sales/agents"); if (d) setRows(d); })(); }, [get]);

  const columns = [
    { key: "id", label: "ID", mono: true },
    { key: "name", label: "Agent" },
    { key: "region", label: "Region" },
    { key: "deals", label: "Deals", align: "right" },
    { key: "quota", label: "Quota attainment", align: "right", render: (r) => (
      <span className={r.quota >= 1 ? "font-semibold text-success" : "text-foreground"}>{formatPercent(r.quota)}</span>
    ) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Agents" subtitle="Performance against quota by sales agent." />
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
