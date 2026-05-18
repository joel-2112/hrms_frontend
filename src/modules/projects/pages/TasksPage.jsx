import { useEffect, useState } from "react";
import { useApi } from "../../../hooks/useApi";
import PageHeader from "../../../components/common/PageHeader";
import DataTable from "../../../components/common/DataTable";
import StatusPill from "../../../components/common/StatusPill";

export default function TasksPage() {
  const { get } = useApi();
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const d = await get("/projects/tasks"); if (d) setRows(d); })(); }, [get]);

  const columns = [
    { key: "id", label: "Task", mono: true },
    { key: "title", label: "Title" },
    { key: "project", label: "Project" },
    { key: "assignee", label: "Assignee" },
    { key: "priority", label: "Priority", render: (r) => <StatusPill status={r.priority} /> },
    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="My tasks" subtitle="Work items assigned across all projects." />
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
