import React, { useEffect, useState } from "react";
import PageHeader from "../../../../components/common/PageHeader";
import { StatCard } from "../../../../components/common/StatCard";
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
import { Textarea } from "../../../../components/ui/textarea";
import { Label } from "../../../../components/ui/label";
import { Switch } from "../../../../components/ui/switch";
import { Badge } from "../../../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";
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
  Plus,
  Pencil,
  X,
  Building2,
  Users,
  Trash2,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Grid3X3,
  List,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import {
  createDepartmentRequest,
  deleteDepartmentRequest,
  fetchDepartmentsRequest,
  updateDepartmentRequest,
} from "../../../../redux/features/departmentsSlice";
import { fetchCompaniesRequest } from "../../../../redux/features/companiesSlice";
import { usePermission } from "../../../../hooks/usePermission";

const DepartmentPage = () => {
  const dispatch = useDispatch();
  const departmentsState = useSelector((state) => state.departments || {});
  const departments = departmentsState.items || [];
  const loading = departmentsState.loading || false;
  const saving = departmentsState.saving || false;
  const deleting = departmentsState.deleting || false;
  const companiesState = useSelector((state) => state.companies || {});
  const companies = companiesState.items || [];
  const { canCreate, canWrite, canDelete } = usePermission("Department");

  const [isOpen, setIsOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null);
  const [form, setForm] = useState({
    name: "",
    companyId: "",
    parentDepartmentId: null,
    disabled: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const PAGE_SIZE = 6;

  useEffect(() => {
    dispatch(fetchDepartmentsRequest({}));
    dispatch(fetchCompaniesRequest({}));
  }, [dispatch]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.company?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredDepartments.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedDepartments = filteredDepartments.slice(
    startIdx,
    startIdx + PAGE_SIZE,
  );

  const openNew = () => {
    if (!canCreate) return;
    setIsNew(true);
    setSelectedDept(null);
    setForm({
      name: "",
      companyId: "",
      parentDepartmentId: null,
      disabled: false,
    });
    setIsOpen(true);
  };

  const openEdit = (dept) => {
    if (!canWrite) return;
    setIsNew(false);
    setSelectedDept(dept);
    setForm({
      name: dept.name || "",
      companyId: dept.companyId || "",
      parentDepartmentId: dept.parentDepartmentId || null,
      disabled: dept.disabled || false,
    });
    setIsOpen(true);
  };

  const handleDeleteClick = (e, dept) => {
    e.stopPropagation();
    if (!canDelete) return;
    setDepartmentToDelete(dept);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!departmentToDelete) return;
    
    try {
      await dispatch(deleteDepartmentRequest({ id: departmentToDelete.id }));
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
      toast.success(`${departmentToDelete.name} deleted successfully`);
    } catch (err) {
      toast.error("Failed to delete department");
    }
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Department name is required");
      return;
    }
    if (!form.companyId) {
      toast.error("Company is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      companyId: form.companyId,
      parentDepartmentId: form.parentDepartmentId || null,
      disabled: form.disabled,
    };

    if (isNew) {
      dispatch(createDepartmentRequest(payload));
      toast.success("Department created successfully");
    } else if (selectedDept) {
      dispatch(
        updateDepartmentRequest({
          id: selectedDept.id,
          ...payload,
        }),
      );
      toast.success("Department updated successfully");
    }

    setIsOpen(false);
  };

  const totalDepartments = departments.length;
  const activeDepts = departments.filter((d) => !d.disabled).length;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Departments"
        subtitle={`${totalDepartments} departments`}
        actions={
          canCreate && (
            <Button onClick={openNew} disabled={loading || saving}>
              <Plus className="mr-2 h-4 w-4" />
              New Department
            </Button>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          label="Total Departments" 
          value={totalDepartments} 
          icon={Building2}
          accent="primary"
        />
        <StatCard 
          label="Active" 
          value={activeDepts} 
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard 
          label="Inactive" 
          value={totalDepartments - activeDepts} 
          icon={AlertTriangle}
          accent="warning"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search departments or companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
         <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("grid")}
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
       
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedDepartments.map((dept) => (
            <div
              key={dept.id}
              className={cn(
                "border rounded-lg p-6 hover:shadow-md transition-all group",
                canWrite && "cursor-pointer hover:border-primary/30"
              )}
              onClick={() => canWrite && openEdit(dept)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg group-hover:text-primary">
                    {dept.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {dept.company?.name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dept.company?.zone && (
                      <Badge variant="outline" className="text-xs">
                        Zone: {dept.company.zone}
                      </Badge>
                    )}
                    {dept.company?.country && (
                      <Badge variant="outline" className="text-xs">
                        Country: {dept.company.country}
                      </Badge>
                    )}
                    {dept.company?.code && (
                      <Badge variant="outline" className="text-xs">
                        Code: {dept.company.code}
                      </Badge>
                    )}
                    {dept.company?.dateOfIncorporation && (
                      <Badge variant="outline" className="text-xs">
                        Since: {dept.company.dateOfIncorporation}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={dept.disabled ? "secondary" : "default"}
                    className="whitespace-nowrap"
                  >
                    {dept.disabled ? "Inactive" : "Active"}
                  </Badge>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteClick(e, dept)}
                      disabled={deleting}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && viewMode === "list" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                  Department
                </th>
                <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                  Company Info
                </th>
                <th className="px-6 py-3 text-center font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
               {canWrite || canDelete && <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedDepartments.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-muted-foreground"
                  >
                    No departments found
                  </td>
                </tr>
              ) : (
                paginatedDepartments.map((dept) => (
                  <tr
                    key={dept.id}
                    className={cn(
                      "transition-colors",
                      canWrite && "hover:bg-muted/50 cursor-pointer"
                    )}
                    onClick={() => canWrite && openEdit(dept)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium">{dept.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {dept.company?.name || "unknown company"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          Country: {dept.company?.country || "Ethiopia"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Zone: {dept.company?.zone || "Addis Ababa"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          City: {dept.company?.city || "Bole"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={dept.disabled ? "secondary" : "default"}>
                        {dept.disabled ? "Inactive" : "Active"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canWrite && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(dept);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                            onClick={(e) => handleDeleteClick(e, dept)}
                            disabled={deleting}
                          >
                            {deleting && departmentToDelete?.id === dept.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filteredDepartments.length > 0 && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {startIdx + 1} -{" "}
            {Math.min(startIdx + PAGE_SIZE, filteredDepartments.length)} of{" "}
            {filteredDepartments.length} departments
          </p>
          <div className="flex items-center gap-1">
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the department "{departmentToDelete?.name}"?
              <div className="mt-2 p-3 bg-warning/10 rounded-md border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning inline mr-2" />
                This action cannot be undone. All employees in this department will need to be reassigned.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setDepartmentToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Department"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Department Form Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right"     className="w-[95vw] sm:w-[560px] h-fit my-auto mr-4 rounded-xl">
          <SheetHeader>
            <SheetTitle>{isNew ? "New Department" : "Edit Department"}</SheetTitle>
            <SheetDescription>
              {isNew
                ? "Create a new department within your organization."
                : `Edit ${form.name || selectedDept?.name || "department"} details`}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Human Resources, IT, Finance"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyId">Company *</Label>
              <select
                id="companyId"
                value={form.companyId}
                onChange={(e) => handleChange("companyId", e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-ring"
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
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || saving || !form.name.trim() || !form.companyId}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isNew ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>{isNew ? "Create Department" : "Update Department"}</>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DepartmentPage;