import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../../../components/common/PageHeader";
import DataTable from "../../../../components/common/DataTable";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "../../../../components/ui/sheet";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  MapPin,
  Phone,
  Mail,
  Building2,
  Landmark,
  Globe,
  Home,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  AlertTriangle,
  Grid3X3,
  List,
  Users,
  Loader2,
  Store,
  Eye,
  Calendar,
  Hash,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  fetchBranchesRequest,
  createBranchRequest,
  updateBranchRequest,
  deleteBranchRequest,
} from "../../../../redux/features/branchesSlice";
import { fetchCompaniesRequest } from "../../../../redux/features/companiesSlice";
import { usePermission } from "../../../../hooks/usePermission";

const emptyForm = {
  name: "",
  companyId: "",
  code: "",
  country: "",
  region: "",
  zone: "",
  city: "",
  phone: "",
  email: "",
  address: "",
  dateOfIncorporation: "",
};

function StatusBadge({ status }) {
  const disabled = status?.disabled ?? false;
  const isActive = !disabled;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        isActive ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
      )}
    >
      {isActive ? "Active" : "Disabled"}
    </span>
  );
}

function transformBranch(branch, companies) {
  const company = companies.find((c) => c.id === branch.companyId);
  return {
    ...branch,
    company,
    companyName: company ? company.name : "Unknown",
    employeesCount: branch.employees?.length || 0,
    disabled: branch.disabled,
  };
}

export default function BranchesPage() {
  const dispatch = useDispatch();

  const branchesRaw = useSelector((state) => state.branches.items);
  const branchesLoading = useSelector((state) => state.branches.loading);
  const branchesError = useSelector((state) => state.branches.error);
  const branchesSaving = useSelector((state) => state.branches.saving);
  const branchesDeleting = useSelector((state) => state.branches.deleting);

  const companies = useSelector((state) => state.companies.items || []);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [viewMode, setViewMode] = useState("list");
  const [companyFilter, setCompanyFilter] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  const { canCreate, canWrite, canDelete } = usePermission("Branch");

  useEffect(() => {
    dispatch(fetchBranchesRequest({ companyId: companyFilter || undefined }));
    dispatch(fetchCompaniesRequest({}));
  }, [dispatch, companyFilter]);

  const branches = React.useMemo(
    () =>
      Array.isArray(branchesRaw)
        ? branchesRaw.map((b) => transformBranch(b, companies))
        : [],
    [branchesRaw, companies],
  );

  const filteredRows = branches.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.companyName.toLowerCase().includes(search.toLowerCase()) ||
      r.code?.toLowerCase().includes(search.toLowerCase()) ||
      r.city?.toLowerCase().includes(search.toLowerCase()),
  );

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE) || 1;
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedRows = filteredRows.slice(startIdx, startIdx + PAGE_SIZE);

  // Modern smart columns structure
  const columns = [
    {
      key: "info",
      label: "BRANCH INFORMATION",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Store className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <Hash className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {row.code || "No code"}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "company",
      label: "COMPANY",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {row.company?.name || row.companyName}
          </span>
        </div>
      ),
    },
    {
      key: "location",
      label: "LOCATION",
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">{row.city || "-"}</span>
          </div>
          <div className="flex items-center gap-2 ml-5">
            <span className="text-xs text-muted-foreground">
              {row.zone && `${row.zone}, `}
              {row.region || "-"}
            </span>
          </div>
        </div>
      ),
    },
    // {
    //   key: "contact",
    //   label: "CONTACT",
    //   render: (row) => (
    //     <div className="space-y-1">
    //       {row.phone && (
    //         <div className="flex items-center gap-2">
    //           <Phone className="h-3 w-3 text-muted-foreground" />
    //           <span className="text-xs">{row.phone}</span>
    //         </div>
    //       )}
    //       {row.email && (
    //         <div className="flex items-center gap-2">
    //           <Mail className="h-3 w-3 text-muted-foreground" />
    //           <span className="text-xs text-muted-foreground">{row.email}</span>
    //         </div>
    //       )}
    //       {!row.phone && !row.email && (
    //         <span className="text-xs text-muted-foreground">
    //           No contact info
    //         </span>
    //       )}
    //     </div>
    //   ),
    // },
    // {
    //   key: "staff",
    //   label: "STAFF",
    //   render: (row) => (
    //     <div className="flex items-center gap-2">
    //       <Users className="h-3.5 w-3.5 text-muted-foreground" />
    //       <span className="text-sm font-semibold">{row.employeesCount || 0}</span>
    //       <span className="text-xs text-muted-foreground">
    //         {row.employeesCount === 1 ? "member" : "members"}
    //       </span>
    //     </div>
    //   ),
    // },
  ];

  const openNew = () => {
    if (!canCreate) return;
    setIsNew(true);
    setSelectedBranch(null);
    setForm({ ...emptyForm });
    setIsOpen(true);
  };

  const openEdit = (branch) => {
    if (!canWrite) return;
    setIsNew(false);
    setSelectedBranch(branch);
    setForm({
      name: branch.name || "",
      companyId: branch.companyId || "",
      code: branch.code || "",
      country: branch.country || "",
      region: branch.region || "",
      zone: branch.zone || "",
      city: branch.city || "",
      phone: branch.phone || "",
      email: branch.email || "",
      address: branch.address || "",
      dateOfIncorporation: branch.dateOfIncorporation || "",
    });
    setIsOpen(true);
  };

  const handleDeleteClick = (e, branch) => {
    e.stopPropagation();
    if (!canDelete) return;
    setBranchToDelete(branch);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!branchToDelete) return;

    try {
      await dispatch(deleteBranchRequest({ id: branchToDelete.id }));
      setDeleteDialogOpen(false);
      setBranchToDelete(null);
      toast.success(`${branchToDelete.name} deleted successfully`);
      setTimeout(() => dispatch(fetchBranchesRequest()), 500);
    } catch (err) {
      toast.error("Failed to delete branch");
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Branch name is required");
      return;
    }
    if (!form.companyId) {
      toast.error("Company is required");
      return;
    }

    try {
      if (isNew) {
        await dispatch(createBranchRequest(form));
        toast.success("Branch created successfully");
      } else {
        await dispatch(updateBranchRequest({ id: selectedBranch.id, ...form }));
        toast.success("Branch updated successfully");
      }
      setIsOpen(false);
      setTimeout(() => dispatch(fetchBranchesRequest()), 500);
    } catch (err) {
      toast.error(
        isNew ? "Failed to create branch" : "Failed to update branch",
      );
    }
  };

  const refetchBranches = () => {
    dispatch(fetchBranchesRequest());
  };

  if (branchesError) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-sm text-destructive">{branchesError}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={refetchBranches}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        subtitle={`${filteredRows.length} locations · ${companies.length} companies`}
        actions={
          canCreate && (
            <Button size="sm" className="gap-1.5" onClick={openNew}>
              <Plus className="h-4 w-4" />
              New Branch
            </Button>
          )
        }
      />

      {/* Search & Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, company, or city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        {/* View Toggle */}
        <div className="flex gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Company Filter Dropdown */}
        <div className="w-full sm:w-64">
          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All Companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {branchesLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* List View */}
      {!branchesLoading && viewMode === "list" && (
        <>
          <DataTable
            columns={columns}
            rows={paginatedRows}
            actions={
              canWrite || canDelete
                ? (row) => (
                    <div className="flex items-center justify-end gap-1">
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 gap-1.5 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {/* <span className="hidden sm:inline">Edit</span> */}
                        </Button>
                      )}
                      {canDelete && row.employeesCount === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                          onClick={(e) => handleDeleteClick(e, row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {/* <span className="hidden sm:inline">Delete</span> */}
                        </Button>
                      )}
                    </div>
                  )
                : undefined
            }
          />

          {/* Pagination */}
          {filteredRows.length > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground text-center sm:text-left">
                Showing {startIdx + 1} -{" "}
                {Math.min(startIdx + PAGE_SIZE, filteredRows.length)} of{" "}
                {filteredRows.length} branches
              </p>
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Grid View */}
      {!branchesLoading && viewMode === "grid" && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedRows.map((branch) => (
              <div
                key={branch.id}
                onClick={() => canWrite && openEdit(branch)}
                className={cn(
                  "group rounded-xl border p-5 shadow-sm transition-all hover:shadow-elegant",
                  canWrite && "cursor-pointer hover:border-primary/30",
                  !canWrite && "cursor-default",
                  "border-border bg-card",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-foreground">
                        {branch.name}
                      </h4>
                    </div>
                    {branch.code && (
                      <div className="flex items-center gap-1 mt-1">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {branch.code}
                        </p>
                      </div>
                    )}
                  </div>
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 shrink-0 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(branch);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-start gap-2 text-sm">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-muted-foreground text-xs">Company</p>
                      <p className="font-medium text-sm">
                        {branch.company?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-muted-foreground text-xs">Location</p>
                      <p className="text-sm">{branch.city || "-"}</p>
                      {(branch.zone || branch.region) && (
                        <p className="text-xs text-muted-foreground">
                          {branch.zone && `${branch.zone}, `}
                          {branch.region}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Staff</p>
                      <p className="font-semibold text-sm">
                        {branch.employeesCount || 0}
                      </p>
                    </div>
                  </div>

                  {branch.phone && (
                    <div className="flex items-start gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-muted-foreground text-xs">Phone</p>
                        <p className="text-xs">{branch.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {branch.address && (
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {branch.address}
                    </p>
                  </div>
                )}

                {canDelete && branch.employeesCount === 0 && (
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 gap-1.5 text-primary hover:text-destructive hover:bg-primary/10 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(e, branch);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Branch
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredRows.length > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground text-center sm:text-left">
                Showing {startIdx + 1} -{" "}
                {Math.min(startIdx + PAGE_SIZE, filteredRows.length)} of{" "}
                {filteredRows.length} branches
              </p>
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* No Results */}
      {!branchesLoading && filteredRows.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No branches found</p>
          {canCreate && (
            <Button variant="link" onClick={openNew} className="mt-2">
              Create your first branch
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the branch "{branchToDelete?.name}
              "?
              {branchToDelete?.employeesCount > 0 && (
                <div className="mt-2 p-2 bg-warning/10 rounded border border-warning/20">
                  <AlertTriangle className="h-4 w-4 text-warning inline mr-2" />
                  This branch has {branchToDelete.employeesCount} staff
                  member(s). They will need to be reassigned before deletion.
                </div>
              )}
              {(!branchToDelete?.employeesCount ||
                branchToDelete?.employeesCount === 0) && (
                <div className="mt-2">
                  This action cannot be undone. All data associated with this
                  branch will be permanently removed.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setBranchToDelete(null)}
              disabled={branchesDeleting}
            >
              Cancel
            </AlertDialogCancel>
            {branchToDelete?.employeesCount === 0 && (
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={branchesDeleting}
              >
                {branchesDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Branch"
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Branch Form Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="!inset-y-4 !right-4 !h-[calc(100vh-2rem)] !w-[95vw] rounded-xl border shadow-elevated sm:!w-[560px] md:!max-w-none flex flex-col p-0 gap-0"
        >
          <SheetHeader className="shrink-0 border-b border-border px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-base font-semibold">
                  {isNew ? "New Branch" : "Edit Branch"}
                </SheetTitle>
                <SheetDescription>
                  {isNew
                    ? "Create a new branch location."
                    : `Editing ${form.name || selectedBranch?.name || ""}`}
                </SheetDescription>
              </div>
              {/* <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button> */}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Branch Name *
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Head Office"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Company *
              </label>
              <select
                value={form.companyId}
                onChange={(e) => handleChange("companyId", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Code
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="code"
                    value={form.code}
                    onChange={(e) => handleChange("code", e.target.value)}
                    placeholder="e.g. BRT-001"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Date of Incorporation
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="dateOfIncorporation"
                    value={form.dateOfIncorporation}
                    onChange={(e) =>
                      handleChange("dateOfIncorporation", e.target.value)
                    }
                    type="date"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Country
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="country"
                    value={form.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    placeholder="e.g. Ethiopia"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Region
                </label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="region"
                    value={form.region}
                    onChange={(e) => handleChange("region", e.target.value)}
                    placeholder="e.g. Addis Ababa"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Zone
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="zone"
                    value={form.zone}
                    onChange={(e) => handleChange("zone", e.target.value)}
                    placeholder="e.g. East"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="city"
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="e.g. Addis Ababa"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="phone"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+251-XXX-XXXX"
                    className="pl-10"
                  />
                </div>
              </div> */}
              {/* <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="branch@company.com"
                    className="pl-10"
                  />
                </div>
              </div> */}
            </div>

            {/* <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  name="address"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Full branch address"
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={3}
                />
              </div>
            </div> */}

            {!isNew && selectedBranch?.employeesCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/20 p-3">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div className="text-xs text-warning">
                  <p className="font-medium">Cannot delete this branch</p>
                  <p>
                    This branch has {selectedBranch.employeesCount} staff
                    member(s) assigned. Reassign them before deletion.
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <Users className="h-3 w-3 inline mr-1" />
              Branch manager and staff can be assigned after the branch is
              saved, from the Employee module.
            </p>
          </div>

          <SheetFooter className="shrink-0 border-t border-border px-6 py-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={branchesSaving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={branchesSaving}>
              {branchesSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  {isNew ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>
                  <Store className="mr-1.5 h-3.5 w-3.5" />
                  {isNew ? "Create Branch" : "Update Branch"}
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
