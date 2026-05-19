/* DISABLED Mock API — Real backend now used.
   Uncomment if needed for offline dev. */

const sleep = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ---- Permission presets ----
const ALL_RESOURCES = [
  "Employee", "LeaveApplication", "SalarySlip", "Attendance",
  "JobOpening", "Appraisal", "Role", "Company", "Document",
  "Invoice", "Payment", "FinancialReport",
  "SalesOrder", "Customer", "SalesAgent",
  "Project", "Task", "Milestone",
];

const fullPerms = () =>
  ALL_RESOURCES.reduce((acc, r) => {
    acc[r] = {
      canRead: true, canCreate: true, canEdit: true,
      canDelete: true, canExport: true, canApprove: true, canReport: true,
    };
    return acc;
  }, {});

const hrManagerPerms = () => {
  const p = {};
  ["Employee", "LeaveApplication", "SalarySlip", "Attendance",
   "JobOpening", "Appraisal", "Company", "Document"].forEach((r) => {
    p[r] = { canRead: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, canApprove: true };
  });
  // Roles tab is hidden entirely (no canRead)
  return p;
};

const employeePerms = () => ({
  Employee: { canRead: true },
  LeaveApplication: { canRead: true, canCreate: true },
  SalarySlip: { canRead: true },
  Attendance: { canRead: true, canCreate: true },
  Document: { canRead: true },
  Project: { canRead: true },
  Task: { canRead: true, canEdit: true },
});

export const MOCK_USERS = {
  "admin@Ethiohr.com": {
    password: "admin",
    user: { id: "u-1", name: "Alex Morgan", email: "admin@Ethiohr.com", role: "Administrator", avatar: "AM" },
    permissions: fullPerms(),
  },
  "hr@Ethiohr.com": {
    password: "hr",
    user: { id: "u-2", name: "Priya Shah", email: "hr@Ethiohr.com", role: "HR Manager", avatar: "PS" },
    permissions: hrManagerPerms(),
  },
  "employee@Ethiohr.com": {
    password: "employee",
    user: { id: "u-3", name: "Diego Ruiz", email: "employee@Ethiohr.com", role: "Employee", avatar: "DR" },
    permissions: employeePerms(),
  },
};

// ---- Mock domain data ----
const employees = [
  { id: "E001", name: "Alex Morgan", email: "alex@Ethiohr.com", department: "Engineering", title: "VP Engineering", status: "Active", joinDate: "2021-03-14" },
  { id: "E002", name: "Priya Shah", email: "priya@Ethiohr.com", department: "People", title: "HR Manager", status: "Active", joinDate: "2020-08-02" },
  { id: "E003", name: "Diego Ruiz", email: "diego@Ethiohr.com", department: "Engineering", title: "Senior Engineer", status: "Active", joinDate: "2022-01-19" },
  { id: "E004", name: "Mei Tanaka", email: "mei@Ethiohr.com", department: "Design", title: "Product Designer", status: "Active", joinDate: "2023-05-30" },
  { id: "E005", name: "Sam O'Connor", email: "sam@Ethiohr.com", department: "Sales", title: "Account Executive", status: "On leave", joinDate: "2022-11-08" },
  { id: "E006", name: "Yuki Sato", email: "yuki@Ethiohr.com", department: "Finance", title: "Financial Analyst", status: "Active", joinDate: "2023-09-12" },
];

const leave = [
  { id: "L-1041", employee: "Diego Ruiz", type: "Annual", from: "2026-04-22", to: "2026-04-26", days: 5, status: "Pending" },
  { id: "L-1040", employee: "Mei Tanaka", type: "Sick", from: "2026-04-18", to: "2026-04-19", days: 2, status: "Approved" },
  { id: "L-1039", employee: "Sam O'Connor", type: "Annual", from: "2026-04-10", to: "2026-04-24", days: 14, status: "Approved" },
  { id: "L-1038", employee: "Yuki Sato", type: "Personal", from: "2026-04-15", to: "2026-04-15", days: 1, status: "Rejected" },
];

const payroll = [
  { id: "PS-2026-04-001", employee: "Alex Morgan", period: "Apr 2026", gross: 14500, net: 10120, status: "Paid" },
  { id: "PS-2026-04-002", employee: "Priya Shah", period: "Apr 2026", gross: 9800, net: 7140, status: "Paid" },
  { id: "PS-2026-04-003", employee: "Diego Ruiz", period: "Apr 2026", gross: 8400, net: 6180, status: "Pending" },
  { id: "PS-2026-04-004", employee: "Mei Tanaka", period: "Apr 2026", gross: 7200, net: 5340, status: "Pending" },
];

const attendance = [
  { id: "A-001", employee: "Alex Morgan", date: "2026-04-21", checkIn: "08:54", checkOut: "18:12", hours: 9.3 },
  { id: "A-002", employee: "Priya Shah", date: "2026-04-21", checkIn: "09:02", checkOut: "17:48", hours: 8.7 },
  { id: "A-003", employee: "Diego Ruiz", date: "2026-04-21", checkIn: "09:15", checkOut: "18:30", hours: 9.2 },
  { id: "A-004", employee: "Mei Tanaka", date: "2026-04-21", checkIn: "08:45", checkOut: "17:30", hours: 8.7 },
];

const recruitment = [
  { id: "JO-101", title: "Senior Backend Engineer", department: "Engineering", location: "Remote", applicants: 42, status: "Open" },
  { id: "JO-102", title: "Product Designer", department: "Design", location: "London", applicants: 28, status: "Open" },
  { id: "JO-103", title: "Sales Development Rep", department: "Sales", location: "New York", applicants: 64, status: "Interviewing" },
  { id: "JO-104", title: "Data Engineer", department: "Engineering", location: "Berlin", applicants: 19, status: "Open" },
];

const performance = [
  { id: "AP-001", employee: "Alex Morgan", cycle: "Q1 2026", rating: 4.8, status: "Completed" },
  { id: "AP-002", employee: "Priya Shah", cycle: "Q1 2026", rating: 4.6, status: "Completed" },
  { id: "AP-003", employee: "Diego Ruiz", cycle: "Q1 2026", rating: 4.4, status: "In review" },
  { id: "AP-004", employee: "Mei Tanaka", cycle: "Q1 2026", rating: 4.2, status: "Pending" },
];

const roles = [
  { id: "R-1", name: "Administrator", users: 3, scope: "Full system access" },
  { id: "R-2", name: "HR Manager", users: 5, scope: "HR module + reports" },
  { id: "R-3", name: "Finance Lead", users: 2, scope: "Finance module + approvals" },
  { id: "R-4", name: "Sales Manager", users: 8, scope: "Sales module + customers" },
  { id: "R-5", name: "Employee", users: 142, scope: "Self-service only" },
];

const organization = [
  { id: "C-1", name: "Ethiohr HQ", country: "United Kingdom", employees: 84, founded: 2018 },
  { id: "C-2", name: "Ethiohr North America", country: "United States", employees: 56, founded: 2020 },
  { id: "C-3", name: "Ethiohr APAC", country: "Singapore", employees: 38, founded: 2022 },
];

const documents = [
  { id: "D-1", title: "Employee Handbook 2026", category: "Policy", updated: "2026-01-12", size: "3.2 MB" },
  { id: "D-2", title: "Code of Conduct", category: "Policy", updated: "2025-11-04", size: "0.8 MB" },
  { id: "D-3", title: "Payroll Process SOP", category: "Process", updated: "2026-02-28", size: "1.4 MB" },
  { id: "D-4", title: "Onboarding Checklist", category: "Template", updated: "2026-03-15", size: "0.4 MB" },
];

const invoices = [
  { id: "INV-2026-0421", customer: "Northwind Inc.", amount: 18400, dueDate: "2026-05-05", status: "Sent" },
  { id: "INV-2026-0420", customer: "Globex Corp.", amount: 12200, dueDate: "2026-04-30", status: "Paid" },
  { id: "INV-2026-0419", customer: "Initech", amount: 6600, dueDate: "2026-04-25", status: "Overdue" },
  { id: "INV-2026-0418", customer: "Umbrella Group", amount: 24800, dueDate: "2026-05-12", status: "Draft" },
];

const payments = [
  { id: "PMT-9012", invoice: "INV-2026-0420", amount: 12200, method: "Bank transfer", date: "2026-04-19" },
  { id: "PMT-9011", invoice: "INV-2026-0415", amount: 8400, method: "Card", date: "2026-04-15" },
  { id: "PMT-9010", invoice: "INV-2026-0411", amount: 15600, method: "Bank transfer", date: "2026-04-09" },
];

const reports = [
  { id: "RPT-1", name: "Monthly P&L", period: "March 2026", value: 184200 },
  { id: "RPT-2", name: "Cash Flow Summary", period: "Q1 2026", value: 412000 },
  { id: "RPT-3", name: "AR Aging", period: "Apr 2026", value: 76400 },
];

const orders = [
  { id: "SO-5521", customer: "Northwind Inc.", amount: 18400, items: 12, status: "Confirmed", date: "2026-04-18" },
  { id: "SO-5520", customer: "Globex Corp.", amount: 9200, items: 6, status: "Shipped", date: "2026-04-16" },
  { id: "SO-5519", customer: "Initech", amount: 4400, items: 3, status: "Delivered", date: "2026-04-12" },
  { id: "SO-5518", customer: "Umbrella Group", amount: 24800, items: 18, status: "Processing", date: "2026-04-20" },
];

const customers = [
  { id: "C-001", name: "Northwind Inc.", industry: "Retail", contact: "Karen Lee", value: 184000 },
  { id: "C-002", name: "Globex Corp.", industry: "Manufacturing", contact: "Hank Scorpio", value: 92000 },
  { id: "C-003", name: "Initech", industry: "Software", contact: "Bill Lumbergh", value: 44000 },
  { id: "C-004", name: "Umbrella Group", industry: "Pharma", contact: "Ada Wong", value: 248000 },
];

const agents = [
  { id: "AG-1", name: "Sam O'Connor", region: "EMEA", deals: 24, quota: 0.92 },
  { id: "AG-2", name: "Lin Chen", region: "APAC", deals: 19, quota: 0.78 },
  { id: "AG-3", name: "Marco Rossi", region: "Americas", deals: 31, quota: 1.04 },
];

const projects = [
  { id: "PRJ-001", name: "Ethiohr Mobile App", client: "Internal", progress: 0.62, status: "On track", due: "2026-08-30" },
  { id: "PRJ-002", name: "Northwind Migration", client: "Northwind Inc.", progress: 0.34, status: "At risk", due: "2026-06-15" },
  { id: "PRJ-003", name: "Globex Data Warehouse", client: "Globex Corp.", progress: 0.88, status: "On track", due: "2026-05-02" },
  { id: "PRJ-004", name: "Umbrella ERP Rollout", client: "Umbrella Group", progress: 0.12, status: "Planning", due: "2026-12-01" },
];

const tasks = [
  { id: "T-2201", project: "Ethiohr Mobile App", title: "Design onboarding flow", assignee: "Mei Tanaka", priority: "High", status: "In progress" },
  { id: "T-2202", project: "Ethiohr Mobile App", title: "Implement push notifications", assignee: "Diego Ruiz", priority: "Medium", status: "Todo" },
  { id: "T-2203", project: "Northwind Migration", title: "Data mapping review", assignee: "Yuki Sato", priority: "High", status: "In progress" },
  { id: "T-2204", project: "Globex Data Warehouse", title: "Final QA pass", assignee: "Alex Morgan", priority: "Medium", status: "Review" },
];

const milestones = [
  { id: "M-1", project: "Ethiohr Mobile App", name: "Beta launch", date: "2026-06-15", status: "On track" },
  { id: "M-2", project: "Northwind Migration", name: "Pilot cutover", date: "2026-05-20", status: "At risk" },
  { id: "M-3", project: "Globex Data Warehouse", name: "Go-live", date: "2026-05-02", status: "Confirmed" },
];

const dataMap = {
  "/hr/employees": employees,
  "/hr/leave": leave,
  "/hr/payroll": payroll,
  "/hr/attendance": attendance,
  "/hr/recruitment": recruitment,
  "/hr/performance": performance,
  "/hr/roles": roles,
  "/hr/organization": organization,
  "/hr/documents": documents,
  "/finance/invoices": invoices,
  "/finance/payments": payments,
  "/finance/reports": reports,
  "/sales/orders": orders,
  "/sales/customers": customers,
  "/sales/agents": agents,
  "/projects": projects,
  "/projects/tasks": tasks,
  "/projects/milestones": milestones,
};

// In-memory "session" — simulates the HttpOnly cookie state on the backend
let activeSession = null;

export async function mockRequest(method, url, body) {
  await sleep(220);

  // ---- Auth ----
  if (url === "/auth/login" && method === "post") {
    const account = MOCK_USERS[body?.email?.toLowerCase?.()];
    if (!account || account.password !== body?.password) {
      const err = new Error("Invalid credentials");
      err.response = { status: 401, data: { message: "Invalid email or password" } };
      throw err;
    }
    activeSession = { user: account.user, permissions: account.permissions };
    return { data: activeSession };
  }

  if (url === "/auth/logout" && method === "post") {
    activeSession = null;
    return { data: { ok: true } };
  }

  if (url === "/auth/me" && method === "get") {
    if (!activeSession) {
      const err = new Error("Unauthenticated");
      err.response = { status: 401 };
      throw err;
    }
    return { data: activeSession };
  }

  if (url === "/auth/refresh" && method === "post") {
    if (!activeSession) {
      const err = new Error("No session");
      err.response = { status: 401 };
      throw err;
    }
    return { data: { ok: true } };
  }

  // ---- Domain endpoints ----
  if (method === "get" && dataMap[url]) {
    return { data: dataMap[url] };
  }

  const err = new Error(`Mock endpoint not found: ${method.toUpperCase()} ${url}`);
  err.response = { status: 404 };
  throw err;
}
