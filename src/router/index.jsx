import { createBrowserRouter, Navigate, useRouteError } from "react-router-dom";
import AuthGuard from "../components/guards/AuthGuard";
import PermissionGuard from "../components/guards/PermissionGuard";
import AppShell from "../layouts/AppShell";
import AuthLayout from "../layouts/AuthLayout";
import HRLayout from "../layouts/HRLayout";
import EmployeeSelfServiceLayout from "../layouts/EmployeeSelfServiceLayout";
import FinanceLayout from "../layouts/FinanceLayout";
import SalesLayout from "../layouts/SalesLayout";
import ProjectsLayout from "../layouts/ProjectsLayout";

import Login from "../pages/Login";
import Forbidden from "../pages/Forbidden";
import NotFound from "../pages/NotFound";

import RoleListPage from "../modules/hr/pages/roles/RoleListPage";
import RoleProfilesPage from "../modules/hr/pages/roles/RoleProfilesPage";
import UserRolesPage from "../modules/hr/pages/roles/UserRolesPage";
import UserPermissionsPage from "../modules/hr/pages/roles/UserPermissionsPage";
import RolePermissionsPage from "../modules/hr/pages/roles/RolePermissionsPage";
import CompaniesPage from "../modules/hr/pages/organizations/CompaniesPage";
import BranchesPage from "../modules/hr/pages/organizations/BranchesPage";
import EmploymentTypePage from "../modules/hr/pages/organizations/EmploymentTypePage";
import DepartmentPage from "../modules/hr/pages/organizations/DepartmentPage";
import DesignationsPage from "../modules/hr/pages/organizations/DesignationsPage";
import EmploymentGradePage from "../modules/hr/pages/organizations/EmploymentGradePage";

import InvoicesPage from "../modules/finance/pages/InvoicesPage";
import PaymentsPage from "../modules/finance/pages/PaymentsPage";
import ReportsPage from "../modules/finance/pages/ReportsPage";

import OrdersPage from "../modules/sales/pages/OrdersPage";
import CustomersPage from "../modules/sales/pages/CustomersPage";
import AgentsPage from "../modules/sales/pages/AgentsPage";

import ProjectsPage from "../modules/projects/pages/ProjectsPage";
import TasksPage from "../modules/projects/pages/TasksPage";
import MilestonesPage from "../modules/projects/pages/MilestonesPage";
import StaffingPlansPage from "../modules/hr/pages/recruitment/StaffingPlanePage";
import JobRequisitionsPage from "../modules/hr/pages/recruitment/JobRequisitionsPage";
import EmployeeDashboard from "../modules/hr/pages/employee/EmployeeDashboard";
import EmployeeList from "../modules/hr/pages/employee/EmployeeList";
import EmployeeCreate from "../modules/hr/pages/employee/EmployeeCreate";
import EmployeeDetail from "../modules/hr/pages/employee/EmployeeDetail";
import EmployeeEdit from "../modules/hr/pages/employee/EmployeeEdit";
import HomePage from "../pages/HomePage";
import LeaveDashboard from "../modules/hr/pages/leave/LeaveDashboard ";
import LeaveApplications from "../modules/hr/pages/leave/LeaveApplications";
import LeaveTypes from "../modules/hr/pages/leave/LeaveTypes";
import LeaveLedger from "../modules/hr/pages/leave/LeaveLedger";
import LeavePeriods from "../modules/hr/pages/leave/LeavePeriods";
import LeaveEncashments from "../modules/hr/pages/leave/LeaveEncashments";
import LeaveCompensatory from "../modules/hr/pages/leave/LeaveCompensatory";
import LeaveBlockLists from "../modules/hr/pages/leave/LeaveBlockLists";
import LeaveHolidayLists from "../modules/hr/pages/leave/LeaveHolidayLists";
import DocumentManagment from "../modules/hr/pages/document/DocumentManagment";
import Compliance from "../modules/hr/pages/document/Compliance";
import DocumentType from "../modules/hr/pages/document/DocumentType";

// Self-Service / My Profile
import MyLeave from "../modules/self-service/pages/MyLeave";
import MyLedger from "../modules/self-service/pages/MyLedger";
import MyDocuments from "../modules/self-service/pages/MyDocuments";
import MyDetails from "../modules/self-service/pages/MyDetails";
import FirstTimeSetupWizard from "../pages/FirstTimeSetupWizard";
import BlockedWaitingForIT from "../pages/BlockedWaitingForIT";

function ErrorBoundary() {
  const error = useRouteError();
  console.error("Router caught error:", error);
  const message =
    error?.message || error?.toString?.() || "An unexpected error occurred.";
  const stack = error?.stack || "";
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <h1 className="text-2xl font-bold text-destructive">
        Something went wrong
      </h1>
      <p className="text-muted-foreground max-w-lg">{message}</p>
      {stack && (
        <pre className="text-left text-xs text-muted-foreground bg-muted p-4 rounded max-w-2xl w-full overflow-auto max-h-60">
          {stack}
        </pre>
      )}
      <button
        onClick={() => window.location.reload()}
        className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Refresh page
      </button>
    </div>
  );
}

const guard = (resource, element, action = "canRead") => (
  <PermissionGuard resource={resource} action={action}>
    {element}
  </PermissionGuard>
);

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    errorElement: <ErrorBoundary />,
    children: [{ path: "/login", element: <Login /> }],
  },
  {
    element: <AuthGuard />,
    errorElement: <ErrorBoundary />,
    children: [
      // Onboarding routes must not be inside the AppShell tree (permissions gating can delay rendering)
      { path: "setup", element: <FirstTimeSetupWizard /> },
      { path: "blocked", element: <BlockedWaitingForIT /> },
      {
        element: <AppShell />,
        errorElement: <ErrorBoundary />,
        children: [
          { index: true, element: <HomePage /> },

          // ═══════════════ SELF-SERVICE — MY PROFILE ═══════════════
          {
            path: "my/profile/leave",
            element: guard("LeaveApplication", <MyLeave />, "canReadSelf"),
          },
          {
            path: "my/profile/ledger",
            element: guard("LeaveLedgerEntry", <MyLedger />, "canReadSelf"),
          },
          {
            path: "my/profile/documents",
            element: guard("Document", <MyDocuments />, "canReadSelf"),
          },
          {
            path: "my/profile/details",
            element: guard("Employee", <MyDetails />, "canReadSelf"),
          },

          // ═══════════════ HR ═══════════════
          {
            path: "hr",
            element: <HRLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="/hr/employees/list" replace />,
              },
              {
                path: "employees/list",
                element: guard("Employee", <EmployeeList />),
              },
              {
                path: "employees/new",
                element: guard("Employee", <EmployeeCreate />),
              },
              {
                path: "employees/:id",
                element: guard("Employee", <EmployeeDetail />),
              },
              {
                path: "employees/:id/edit",
                element: guard("Employee", <EmployeeEdit />),
              },
              {
                path: "employees/dashboard",
                element: guard("Employee", <EmployeeDashboard />),
              },
              
              {
                path: "recruitment/staffing-plans",
                element: guard("StaffingPlan", <StaffingPlansPage />),
              },
              {
                path: "recruitment/job-requisitions",
                element: guard("JobRequisition", <JobRequisitionsPage />),
              },
             
              { path: "roles", element: guard("Role", <RoleListPage />) },
              { path: "roles/list", element: guard("Role", <RoleListPage />) },
              {
                path: "roles/profiles",
                element: guard("RoleProfile", <RoleProfilesPage />),
              },
              {
                path: "roles/user-roles",
                element: guard("UserRole", <UserRolesPage />),
              },
              {
                path: "roles/user-permissions",
                element: guard("UserPermission", <UserPermissionsPage />),
              },
              {
                path: "roles/permissions",
                element: guard("RolePermission", <RolePermissionsPage />),
              },
              {
                path: "roles/assignments",
                element: guard("RoleAssignment", <RoleListPage />, "canWrite"),
              },
              {
                path: "roles/templates",
                element: guard("RoleTemplate", <RoleListPage />),
              },
              {
                path: "organization/companies",
                element: guard("Company", <CompaniesPage />),
              },
              {
                path: "organization/branches",
                element: guard("Branch", <BranchesPage />),
              },
              {
                path: "organization/departments",
                element: guard("Department", <DepartmentPage />),
              },
              {
                path: "organization/designations",
                element: guard("Designation", <DesignationsPage />),
              },
              {
                path: "organization/employment-types",
                element: guard("EmploymentType", <EmploymentTypePage />),
              },
              {
                path: "organization/employee-grades",
                element: guard("EmployeeGrade", <EmploymentGradePage />),
              },
              // Documents
              {
                path: "documents/types",
                element: <DocumentType />,
              },
              {
                path: "documents/managmenet",
                element: guard("DocumentManagment", <DocumentManagment />),
              },
              {
                path: "documents/compliance",
                element: guard("Document", <Compliance />),
              },
              // Leave
              {
                path: "leave/dashboard",
                element: guard("LeaveApplication", <LeaveDashboard />),
              },
              {
                path: "leave/applications",
                element: guard("LeaveApplication", <LeaveApplications />),
              },
              {
                path: "leave/types",
                element: guard("LeaveType", <LeaveTypes />),
              },
              {
                path: "leave/ledger",
                element: guard("LeaveLedger", <LeaveLedger />),
              },
              {
                path: "leave/periods",
                element: guard("LeavePeriod", <LeavePeriods />),
              },
              {
                path: "leave/encashments",
                element: guard("LeaveEncashment", <LeaveEncashments />),
              },
              {
                path: "leave/compensatory",
                element: guard("LeaveCompensatory", <LeaveCompensatory />),
              },
              {
                path: "leave/block-lists",
                element: guard("LeaveBlockList", <LeaveBlockLists />),
              },
              {
                path: "leave/holidays",
                element: guard("LeaveHoliday", <LeaveHolidayLists />),
              },
            ],
          },

          // ═══════════════ FINANCE ═══════════════
          {
            path: "finance",
            element: <FinanceLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="/finance/invoices" replace />,
              },
              { path: "invoices", element: guard("Invoice", <InvoicesPage />) },
              { path: "payments", element: guard("Payment", <PaymentsPage />) },
              {
                path: "reports",
                element: guard("FinancialReport", <ReportsPage />, "canReport"),
              },
            ],
          },

          // ═══════════════ SALES ═══════════════
          {
            path: "sales",
            element: <SalesLayout />,
            children: [
              { index: true, element: <Navigate to="/sales/orders" replace /> },
              { path: "orders", element: guard("SalesOrder", <OrdersPage />) },
              {
                path: "customers",
                element: guard("Customer", <CustomersPage />),
              },
              { path: "agents", element: guard("SalesAgent", <AgentsPage />) },
            ],
          },

          // ═══════════════ PROJECTS ═══════════════
          {
            path: "projects",
            element: <ProjectsLayout />,
            children: [
              { index: true, element: guard("Project", <ProjectsPage />) },
              { path: "tasks", element: guard("Task", <TasksPage />) },
              {
                path: "milestones",
                element: guard("Milestone", <MilestonesPage />),
              },
            ],
          },

          { path: "403", element: <Forbidden /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);
