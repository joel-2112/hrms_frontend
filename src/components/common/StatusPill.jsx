import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  Active: "bg-success/10 text-success",
  "On leave": "bg-warning/10 text-warning",
  Pending: "bg-warning/10 text-warning",
  "In review": "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
  Paid: "bg-success/10 text-success",
  Sent: "bg-primary/10 text-primary",
  Overdue: "bg-destructive/10 text-destructive",
  Draft: "bg-muted text-muted-foreground",
  Confirmed: "bg-primary/10 text-primary",
  Shipped: "bg-accent/10 text-accent",
  Delivered: "bg-success/10 text-success",
  Processing: "bg-warning/10 text-warning",
  Open: "bg-success/10 text-success",
  Interviewing: "bg-primary/10 text-primary",
  Completed: "bg-success/10 text-success",
  "On track": "bg-success/10 text-success",
  "At risk": "bg-warning/10 text-warning",
  Planning: "bg-muted text-muted-foreground",
  "In progress": "bg-primary/10 text-primary",
  Todo: "bg-muted text-muted-foreground",
  Review: "bg-accent/10 text-accent",
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/10 text-warning",
  Low: "bg-muted text-muted-foreground",
};

export default function StatusPill({ status, className }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      STATUS_STYLES[status] || "bg-muted text-muted-foreground",
      className,
    )}>
      {status}
    </span>
  );
}
