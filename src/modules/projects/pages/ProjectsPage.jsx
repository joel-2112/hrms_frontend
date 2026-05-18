import { useEffect, useState } from "react";
import { useApi } from "../../../hooks/useApi";
import PageHeader from "../../../components/common/PageHeader";
import StatusPill from "../../../components/common/StatusPill";
import { formatDate, formatPercent } from "../../../utils/formatters";

export default function ProjectsPage() {
  const { get } = useApi();
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const d = await get("/projects"); if (d) setRows(d); })(); }, [get]);

  return (
    <div className="space-y-6">
      <PageHeader title="All projects" subtitle="Portfolio view of every active project." />
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-5 shadow-sm transition-base hover:shadow-elegant">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono text-muted-foreground">{p.id}</p>
                <h3 className="mt-1 font-semibold text-foreground">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.client} • Due {formatDate(p.due)}</p>
              </div>
              <StatusPill status={p.status} />
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-medium tabular-nums text-foreground">{formatPercent(p.progress)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gradient-primary transition-base" style={{ width: `${p.progress * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
