export const formatCurrency = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n ?? 0);

export const formatNumber = (n) => new Intl.NumberFormat("en-US").format(n ?? 0);

export const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export const formatPercent = (v) => `${Math.round((v ?? 0) * 100)}%`;
