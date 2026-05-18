import { useEffect, useState } from "react";
import { useApi } from "../../../hooks/useApi";
import PageHeader from "../../../components/common/PageHeader";
import { StatCard } from "../../../components/common/StatCard";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";

export default function ReportsPage() {
  const { get } = useApi();
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const d = await get("/finance/reports"); if (d) setRows(d); })(); }, [get]);

  return (
    <div className="space-y-6">
      <PageHeader title="Financial reports" subtitle="Aggregated KPIs and statements." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <StatCard key={r.id} label={r.name} value={formatCurrency(r.value)} hint={r.period} icon={TrendingUp} accent="primary" />
        ))}
      </div>
    </div>
  );
}
