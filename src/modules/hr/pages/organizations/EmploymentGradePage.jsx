import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../../../components/common/PageHeader";
import DataTable from "../../../../components/common/DataTable";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
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
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  fetchEmployeeGradesRequest,
  createEmployeeGradeRequest,
  updateEmployeeGradeRequest,
  deleteEmployeeGradeRequest,
} from "../../../../redux/features/employeeGradesSlice";
import { usePermission } from "../../../../hooks/usePermission";

const PAGE_SIZE = 10;

export default function EmploymentGradePage() {
  const dispatch = useDispatch();
  const grades = useSelector((state) => state.employeeGrades.items || []);
  const loading = useSelector((state) => state.employeeGrades.loading);
  const saving = useSelector((state) => state.employeeGrades.saving);
  const deleting = useSelector((state) => state.employeeGrades.deleting);
  const error = useSelector((state) => state.employeeGrades.error);
  const { canCreate, canWrite, canDelete } = usePermission("EmployeeGrade");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: ""
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchEmployeeGradesRequest());
  }, [dispatch]);

  const filteredGrades = grades.filter((g) =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGrades.length / PAGE_SIZE) || 1;
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedGrades = filteredGrades.slice(startIdx, startIdx + PAGE_SIZE);

  const openModal = (grade = null, viewOnly = false) => {
    if (grade) {
      if (viewOnly) {
        setIsViewMode(true);
        setEditingGrade(grade);
        setForm({
          name: grade.name || "",
          description: grade.description || ""
        });
      } else {
        if (!canWrite) {
          toast.error("You don't have permission to edit grades");
          return;
        }
        setIsViewMode(false);
        setEditingGrade(grade);
        setForm({
          name: grade.name || "",
          description: grade.description || ""
        });
      }
    } else {
      if (!canCreate) {
        toast.error("You don't have permission to create grades");
        return;
      }
      setIsViewMode(false);
      setEditingGrade(null);
      setForm({
        name: "",
        description: ""
      });
    }
    setIsOpen(true);
  };

  const handleDeleteClick = (e, grade) => {
    e.stopPropagation();
    if (!canDelete) {
      toast.error("You don't have permission to delete grades");
      return;
    }
    setGradeToDelete(grade);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!gradeToDelete) return;
    
    try {
      await dispatch(deleteEmployeeGradeRequest({ id: gradeToDelete.id }));
      setDeleteDialogOpen(false);
      setGradeToDelete(null);
      toast.success(`${gradeToDelete.name} deleted successfully`);
      setTimeout(() => dispatch(fetchEmployeeGradesRequest()), 500);
    } catch (err) {
      toast.error("Failed to delete grade");
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Grade name is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || ""
    };

    if (editingGrade) {
      dispatch(updateEmployeeGradeRequest({
        id: editingGrade.id,
        ...payload,
      }));
      toast.success("Grade updated successfully");
    } else {
      dispatch(createEmployeeGradeRequest(payload));
      toast.success("Grade created successfully");
    }
    setIsOpen(false);
    setTimeout(() => dispatch(fetchEmployeeGradesRequest()), 500);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => dispatch(fetchEmployeeGradesRequest())} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Grades"
        subtitle={`${filteredGrades.length} grades`}
        actions={
          canCreate && (
            <Button
              size="sm"
              className="gap-1.5 h-10 shrink-0"
              onClick={() => openModal()}
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              Add Grade
            </Button>
          )
        }
      />

      {/* Search Row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search grades..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table - Custom HTML table for better UI */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                Grade
              </th>
              <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </th>
              {(canWrite || canDelete) && (
                <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
                  Loading...
                </td>
              </tr>
            ) : paginatedGrades.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No grades found
                </td>
              </tr>
            ) : (
              paginatedGrades.map((grade) => (
                <tr 
                  key={grade.id} 
                  className="transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => openModal(grade, true)}
                >
                  <td className="px-6 py-4 font-medium">{grade.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {grade.description || "—"}
                  </td>
                  {(canWrite || canDelete) && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canWrite && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(grade, false);
                            }}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                            onClick={(e) => handleDeleteClick(e, grade)}
                            disabled={deleting}
                            title="Delete"
                          >
                            {deleting && gradeToDelete?.id === grade.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredGrades.length > 0 && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {startIdx + 1} - {Math.min(startIdx + PAGE_SIZE, filteredGrades.length)} of {filteredGrades.length} grades
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
            <AlertDialogTitle>Delete Grade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the grade "{gradeToDelete?.name}"?
              <div className="mt-3 p-3 bg-warning/10 rounded-md border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning inline mr-2" />
                <span className="text-sm">
                  This action cannot be undone. Employees with this grade will need to be reassigned.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setGradeToDelete(null)}
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
                "Delete Grade"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Grade Form Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right"           className="w-[95vw] sm:w-[560px] h-fit my-8 mr-4 rounded-xl">
          <SheetHeader>
            <SheetTitle>
              {isViewMode 
                ? "Grade Details" 
                : editingGrade 
                  ? "Edit Grade" 
                  : "Add Grade"}
            </SheetTitle>
            <SheetDescription>
              {isViewMode 
                ? `Viewing details of "${editingGrade?.name || ""}"`
                : editingGrade 
                  ? "Update grade details." 
                  : "Add a new employee grade."}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Grade Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Grade A, Grade B, Junior Level"
                disabled={isViewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Brief description of the grade..."
                disabled={isViewMode}
              />
            </div>
          </div>
          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {isViewMode && canWrite && (
              <Button onClick={() => openModal(editingGrade, false)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {!isViewMode && editingGrade && (
              <>
                {/* {canDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsOpen(false);
                      setGradeToDelete(editingGrade);
                      setDeleteDialogOpen(true);
                    }}
                    disabled={saving}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                )} */}
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </Button>
              </>
            )}
            {!isViewMode && !editingGrade && (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}