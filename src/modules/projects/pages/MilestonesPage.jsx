import { useEffect, useState } from "react";
import { useApi } from "../../../hooks/useApi";
import PageHeader from "../../../components/common/PageHeader";
import DataTable from "../../../components/common/DataTable";
import StatusPill from "../../../components/common/StatusPill";
import { formatDate } from "../../../utils/formatters";

export default function MilestonesPage() {
  const { get } = useApi();
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const d = await get("/projects/milestones"); if (d) setRows(d); })(); }, [get]);

  const columns = [
    { key: "id", label: "ID", mono: true },
    { key: "name", label: "Milestone" },
    { key: "project", label: "Project" },
    { key: "date", label: "Target date", render: (r) => formatDate(r.date) },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Milestones" subtitle="Major checkpoints across all projects." />
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
