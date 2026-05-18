import { FolderKanban } from "lucide-react";
import ModuleLayout from "./ModuleLayout";

const tabs = [
  { label: "All Projects", path: "/projects", resource: "Project", action: "canRead", exact: true },
  { label: "My Tasks", path: "/projects/tasks", resource: "Task", action: "canRead" },
  { label: "Milestones", path: "/projects/milestones", resource: "Milestone", action: "canRead" },
];

export default function ProjectsLayout() {
  return (
    <ModuleLayout
      title="Projects"
      description="Plan, track, and deliver work across the organisation."
      icon={FolderKanban}
      tabs={tabs}
      basePath="/projects"
      moduleLabel="Projects"
    />
  );
}
