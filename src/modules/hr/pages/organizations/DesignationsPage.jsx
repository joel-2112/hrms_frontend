import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../../../components/common/PageHeader";
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
  Pencil,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  fetchDesignationsRequest,
  createDesignationRequest,
  updateDesignationRequest,
  deleteDesignationRequest,
} from "../../../../redux/features/designationsSlice";
import { usePermission } from "../../../../hooks/usePermission";

const emptyForm = {
  name: "",
  jobFunction: "",
};

function transformDesignation(d) {
  return {
    ...d,
    title: d.name || "",
    function: d.jobFunction || "",
  };
}

export default function DesignationsPage() {
  const dispatch = useDispatch();

  const designationsRaw = useSelector((state) => state.designations.items);
  const designationsLoading = useSelector(
    (state) => state.designations.loading,
  );
  const designationsSaving = useSelector((state) => state.designations.saving);
  const designationsDeleting = useSelector(
    (state) => state.designations.deleting,
  );
  const { canCreate, canWrite, canDelete } = usePermission("Designation");

  const designations = React.useMemo(
    () =>
      Array.isArray(designationsRaw)
        ? designationsRaw.map(transformDesignation)
        : [],
    [designationsRaw],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [isDesignationOpen, setIsDesignationOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [designationForm, setDesignationForm] = useState({ ...emptyForm });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designationToDelete, setDesignationToDelete] = useState(null);

  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchDesignationsRequest());
  }, [dispatch]);

  const filteredDesignations = designations.filter(
    (d) =>
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.function?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredDesignations.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedDesignations = filteredDesignations.slice(
    startIdx,
    startIdx + PAGE_SIZE,
  );

  const openNewModal = () => {
    if (!canCreate) return;
    setIsNew(true);
    setIsViewMode(false);
    setSelectedDesignation(null);
    setDesignationForm({ name: "", jobFunction: "" });
    setIsDesignationOpen(true);
  };

  const openEditModal = (designation) => {
    if (!canWrite) return;
    setIsNew(false);
    setIsViewMode(false);
    setSelectedDesignation(designation);
    setDesignationForm({
      name: designation.name || "",
      jobFunction: designation.jobFunction || "",
    });
    setIsDesignationOpen(true);
  };

  const openViewModal = (designation) => {
    setIsNew(false);
    setIsViewMode(true);
    setSelectedDesignation(designation);
    setDesignationForm({
      name: designation.name || "",
      jobFunction: designation.jobFunction || "",
    });
    setIsDesignationOpen(true);
  };

  const handleDeleteClick = (e, designation) => {
    e.stopPropagation();
    if (!canDelete) return;
    setDesignationToDelete(designation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!designationToDelete) return;

    try {
      await dispatch(deleteDesignationRequest({ id: designationToDelete.id }));
      setDeleteDialogOpen(false);
      setDesignationToDelete(null);
      toast.success(`${designationToDelete.name} deleted successfully`);
      setTimeout(() => dispatch(fetchDesignationsRequest()), 500);
    } catch (err) {
      toast.error("Failed to delete designation");
    }
  };

  const handleDesignationSave = () => {
    if (!designationForm.name.trim()) {
      toast.error("Title is required");
      return;
    }

    if (isNew) {
      dispatch(createDesignationRequest(designationForm));
      toast.success("Designation created successfully");
    } else {
      dispatch(
        updateDesignationRequest({
          id: selectedDesignation.id,
          ...designationForm,
        }),
      );
      toast.success("Designation updated successfully");
    }
    setIsDesignationOpen(false);
    setTimeout(() => dispatch(fetchDesignationsRequest()), 500);
  };

  const refetch = () => {
    dispatch(fetchDesignationsRequest());
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Designations"
        subtitle={`${filteredDesignations.length} designations`}
        actions={
          canCreate && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={openNewModal}
              disabled={designationsLoading}
            >
              <Plus className="h-4 w-4" />
              Add Designation
            </Button>
          )
        }
      />

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search designations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                Title
              </th>
              <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                Function
              </th>
              {(canWrite || canDelete) && (
                <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {designationsLoading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
                  Loading...
                </td>
              </tr>
            ) : paginatedDesignations.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-sm text-muted-foreground"
                >
                  No designations found
                </td>
              </tr>
            ) : (
              paginatedDesignations.map((designation) => (
                <tr
                  key={designation.id}
                  className="transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => openViewModal(designation)}
                >
                  <td className="px-6 py-4 font-medium">{designation.title}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {designation.function || "—"}
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
                              openEditModal(designation);
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
                            onClick={(e) => handleDeleteClick(e, designation)}
                            disabled={designationsDeleting}
                            title="Delete"
                          >
                            {designationsDeleting &&
                            designationToDelete?.id === designation.id ? (
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
      {filteredDesignations.length > 0 && !designationsLoading && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {startIdx + 1} -{" "}
            {Math.min(startIdx + PAGE_SIZE, filteredDesignations.length)} of{" "}
            {filteredDesignations.length} designations
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
            <AlertDialogTitle>Delete Designation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the designation "
              {designationToDelete?.name}"?
              <div className="mt-3 p-3 bg-warning/10 rounded-md border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning inline mr-2" />
                <span className="text-sm">
                  This action cannot be undone. Employees with this designation
                  will need to be reassigned.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDesignationToDelete(null)}
              disabled={designationsDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={designationsDeleting}
            >
              {designationsDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Designation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Designation Modal */}
      <Sheet open={isDesignationOpen} onOpenChange={setIsDesignationOpen}>
        <SheetContent
          side="right"
          className="w-[95vw] sm:w-[560px] h-fit my-8 mr-4 rounded-xl"
        >
          <SheetHeader>
            <SheetTitle>
              {isNew
                ? "Add Designation"
                : isViewMode
                  ? "Designation Details"
                  : "Edit Designation"}
            </SheetTitle>
            <SheetDescription>
              {isNew
                ? "Add a new designation to the list."
                : isViewMode
                  ? `Viewing details of "${selectedDesignation?.name || ""}"`
                  : `Editing "${selectedDesignation?.name || ""}"`}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Content Creator, Software Engineer"
                value={designationForm.name}
                onChange={(e) =>
                  setDesignationForm({
                    ...designationForm,
                    name: e.target.value,
                  })
                }
                disabled={isViewMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobFunction">Job Function</Label>
              <Input
                id="jobFunction"
                placeholder="e.g. Social Media, Frontend Development"
                value={designationForm.jobFunction}
                onChange={(e) =>
                  setDesignationForm({
                    ...designationForm,
                    jobFunction: e.target.value,
                  })
                }
                disabled={isViewMode}
              />
            </div>
          </div>
          <SheetFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDesignationOpen(false)}
            >
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {isViewMode && canWrite && (
              <Button onClick={() => openEditModal(selectedDesignation)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {!isNew && !isViewMode && (
              <Button
                onClick={handleDesignationSave}
                disabled={designationsSaving}
              >
                {designationsSaving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            )}
            {isNew && (
              <Button
                onClick={handleDesignationSave}
                disabled={designationsSaving}
              >
                {designationsSaving ? (
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
