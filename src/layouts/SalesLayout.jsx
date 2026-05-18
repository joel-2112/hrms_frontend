import { ShoppingCart } from "lucide-react";
import ModuleLayout from "./ModuleLayout";

const tabs = [
  { label: "Orders", path: "/sales/orders", resource: "SalesOrder", action: "canRead" },
  { label: "Customers", path: "/sales/customers", resource: "Customer", action: "canRead" },
  { label: "Agents", path: "/sales/agents", resource: "SalesAgent", action: "canRead" },
];

export default function SalesLayout() {
  return (
    <ModuleLayout
      title="Sales"
      description="Orders, customers, and sales performance."
      icon={ShoppingCart}
      tabs={tabs}
      basePath="/sales"
      moduleLabel="Sales"
    />
  );
}
