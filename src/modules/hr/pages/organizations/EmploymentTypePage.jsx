import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../../../components/common/PageHeader";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Checkbox } from "../../../../components/ui/checkbox";
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
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchEmploymentTypesRequest,
  createEmploymentTypeRequest,
  updateEmploymentTypeRequest,
  deleteEmploymentTypeRequest,
} from "../../../../redux/features/employmentTypesSlice";
import { usePermission } from "../../../../hooks/usePermission";

const PAGE_SIZE = 10;

export default function EmploymentTypePage() {
  const dispatch = useDispatch();
  const types = useSelector((state) => state.employmentTypes.items || []);
  const loading = useSelector((state) => state.employmentTypes.loading);
  const saving = useSelector((state) => state.employmentTypes.saving);
  const deleting = useSelector((state) => state.employmentTypes.deleting);
  const error = useSelector((state) => state.employmentTypes.error);
  const { canCreate, canWrite, canDelete } = usePermission("EmploymentType");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchEmploymentTypesRequest());
  }, [dispatch]);

  const filteredTypes = types.filter(
    (type) =>
      type.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredTypes.length / PAGE_SIZE) || 1;
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedTypes = filteredTypes.slice(startIdx, startIdx + PAGE_SIZE);

  const openModal = (type = null, viewOnly = false) => {
    if (type) {
      if (viewOnly) {
        setIsViewMode(true);
        setEditingType(type);
        setForm({
          name: type.name || "",
          description: type.description || "",
        });
      } else {
        if (!canWrite) {
          toast.error("You don't have permission to edit employment types");
          return;
        }
        setIsViewMode(false);
        setEditingType(type);
        setForm({
          name: type.name || "",
          description: type.description || "",
        });
      }
    } else {
      if (!canCreate) {
        toast.error("You don't have permission to create employment types");
        return;
      }
      setIsViewMode(false);
      setEditingType(null);
      setForm({
        name: "",
        description: "",
      });
    }
    setIsOpen(true);
  };

  const handleDeleteClick = (e, type) => {
    e.stopPropagation();
    if (!canDelete) {
      toast.error("You don't have permission to delete employment types");
      return;
    }
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!typeToDelete) return;

    try {
      await dispatch(deleteEmploymentTypeRequest({ id: typeToDelete.id }));
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
      toast.success(`${typeToDelete.name} deleted successfully`);
      setTimeout(() => dispatch(fetchEmploymentTypesRequest()), 500);
    } catch (err) {
      toast.error("Failed to delete employment type");
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Type name is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || "",
    };

    if (editingType) {
      dispatch(
        updateEmploymentTypeRequest({
          id: editingType.id,
          ...payload,
        }),
      );
      toast.success("Employment type updated successfully");
    } else {
      dispatch(createEmploymentTypeRequest(payload));
      toast.success("Employment type created successfully");
    }
    setIsOpen(false);
    setTimeout(() => dispatch(fetchEmploymentTypesRequest()), 500);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch(fetchEmploymentTypesRequest())}
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
        title="Employment Types"
        subtitle={`${filteredTypes.length} types`}
        actions={
          canCreate && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => openModal()}
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              Add Employment Type
            </Button>
          )
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employment types..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                Type
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
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
                  Loading...
                </td>
              </tr>
            ) : paginatedTypes.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-sm text-muted-foreground"
                >
                  No employment types found
                </td>
              </tr>
            ) : (
              paginatedTypes.map((type) => (
                <tr
                  key={type.id}
                  className="transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => openModal(type, true)}
                >
                  <td className="px-6 py-4 font-medium">{type.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {type.description || "—"}
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
                              openModal(type, false);
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
                            onClick={(e) => handleDeleteClick(e, type)}
                            disabled={deleting}
                            title="Delete"
                          >
                            {deleting && typeToDelete?.id === type.id ? (
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
      {filteredTypes.length > 0 && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {startIdx + 1} -{" "}
            {Math.min(startIdx + PAGE_SIZE, filteredTypes.length)} of{" "}
            {filteredTypes.length} types
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <span className="text-xs">‹</span>
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
              <span className="text-xs">›</span>
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employment Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the employment type "
              {typeToDelete?.name}"?
              <div className="mt-3 p-3 bg-warning/10 rounded-md border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning inline mr-2" />
                <span className="text-sm">
                  This action cannot be undone. Employees with this employment
                  type will need to be reassigned.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setTypeToDelete(null)}
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
                "Delete Employment Type"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Employment Type Form Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-[95vw] sm:w-[560px] h-fit my-8 mr-4 rounded-xl"
        >
          <SheetHeader>
            <SheetTitle>
              {isViewMode
                ? "Employment Type Details"
                : editingType
                  ? "Edit Employment Type"
                  : "Add Employment Type"}
            </SheetTitle>
            <SheetDescription>
              {isViewMode
                ? `Viewing details of "${editingType?.name || ""}"`
                : editingType
                  ? "Update employment type details."
                  : "Add a new employment type to the list."}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Type Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Full-time, Part-time, Contract"
                disabled={isViewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Brief description of the employment type..."
                disabled={isViewMode}
              />
            </div>
          </div>
          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {isViewMode && canWrite && (
              <Button onClick={() => openModal(editingType, false)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {!isViewMode && editingType && (
              <>
                {/* {canDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsOpen(false);
                      setTypeToDelete(editingType);
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
            {!isViewMode && !editingType && (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Employment Type"
                )}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
