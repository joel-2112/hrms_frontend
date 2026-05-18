import { Wallet } from "lucide-react";
import ModuleLayout from "./ModuleLayout";

const tabs = [
  { label: "Invoices", path: "/finance/invoices", resource: "Invoice", action: "canRead" },
  { label: "Payments", path: "/finance/payments", resource: "Payment", action: "canRead" },
  { label: "Reports", path: "/finance/reports", resource: "FinancialReport", action: "canReport" },
];

export default function FinanceLayout() {
  return (
    <ModuleLayout
      title="Finance"
      description="Invoices, payments, and financial reporting."
      icon={Wallet}
      tabs={tabs}
      basePath="/finance"
      moduleLabel="Finance"
    />
  );
}
