import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePermission } from "../../../../hooks/usePermission";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "../../../../components/ui/sheet";
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
import { toast } from "sonner";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";

import PageHeader from "../../../../components/common/PageHeader";
import { StatCard } from "../../../../components/common/StatCard";
import { Card, CardContent, CardFooter } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";

import {
  Building2,
  Landmark,
  Users,
  Briefcase,
  UserCheck,
  GitBranch,
  Coins,
  Receipt,
  Eye,
  Pencil,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  fetchCompaniesRequest,
  createCompanyRequest,
  updateCompanyRequest,
  deleteCompanyRequest,
  companiesFailure,
} from "../../../../redux/features/companiesSlice";

const emptyForm = {
  name: "",
  abbreviation: "",
  country: "Ethiopia",
  region: "",
  zone: "",
  city: "",
  code: "",
  taxId: "",
  dateOfEstablishment: "",
};

function transformCompany(c) {
  return {
    ...c,
    code: c.code || "",
    region: c.region || "",
    zone: c.zone || "",
    city: c.city || "",
    employees: c.employees || 0,
    branches: c.branches || 0,
    type: c.isGroup ? "Group Company" : "Standalone",
    taxType: c.taxId?.startsWith("VAT") ? "VAT" : "TOT",
  };
}

export default function CompaniesPage() {
  const dispatch = useDispatch();

  const companiesRaw = useSelector((state) => state.companies.items);
  const companiesLoading = useSelector((state) => state.companies.loading);
  const companiesError = useSelector((state) => state.companies.error);
  const companiesSaving = useSelector((state) => state.companies.saving);
  const companiesDeleting = useSelector((state) => state.companies.deleting);
  const { canCreate, canWrite, canDelete } = usePermission("Company");
  const companies = React.useMemo(
    () =>
      Array.isArray(companiesRaw) ? companiesRaw.map(transformCompany) : [],
    [companiesRaw],
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchCompaniesRequest());
  }, [dispatch]);

  const openNew = () => {
    setIsNew(true);
    setSelectedCompany(null);
    setForm({ ...emptyForm });
    setIsOpen(true);
  };

  const openEdit = (company) => {
    setIsNew(false);
    setSelectedCompany(company);
    setForm({
      name: company.name || "",
      abbreviation: company.abbreviation || "",
      country: company.country || "Ethiopia",
      region: company.region || "",
      zone: company.zone || "",
      city: company.city || "",
      code: company.code || "",
      taxId: company.taxId || "",
      dateOfEstablishment: company.dateOfEstablishment || "",
    });
    setIsOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    try {
      if (isNew) {
        dispatch(createCompanyRequest(form));
      } else {
        dispatch(updateCompanyRequest({ id: selectedCompany.id, ...form }));
      }
      setIsOpen(false);
      setTimeout(() => dispatch(fetchCompaniesRequest()), 500);
    } catch (err) {
      // Error handled in saga
    }
  };

  const handleDeleteClick = (e, company) => {
    e.stopPropagation(); // Prevent opening the edit sheet
    if (company.employees > 0) {
      toast.error("Cannot delete company with employees");
      return;
    }
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      await dispatch(deleteCompanyRequest({ id: companyToDelete.id }));
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
      setTimeout(() => dispatch(fetchCompaniesRequest()), 500);
    } catch (err) {
      // Error handled in saga
    }
  };

  const refetchCompanies = () => {
    dispatch(fetchCompaniesRequest());
  };

  return (
    <div className="space-y-6">
      {canCreate && (
        <PageHeader
          title="Companies"
          subtitle={`${companies.length} legal entities`}
          actions={
            <Button
              size="sm"
              className="gap-1.5"
              onClick={openNew}
              disabled={companiesLoading}
            >
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          }
        />
      )}

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Legal entities"
          value={companies.length}
          hint="Active companies"
          icon={Building2}
          accent="primary"
        />
        <StatCard
          label="Total employees"
          value={companies.reduce((sum, c) => sum + (c.employees || 0), 0)}
          hint="All companies"
          icon={Users}
          accent="success"
        />
        <StatCard
          label="Total branches"
          value={companies.reduce((sum, c) => sum + (c.branches || 0), 0)}
          hint="All locations"
          icon={Landmark}
          accent="accent"
        />
        <StatCard
          label="Departments"
          value={6}
          hint="Across entities"
          icon={Briefcase}
          accent="secondary"
        />
      </div>

      {companiesError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{companiesError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refetchCompanies}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Company Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {companiesLoading ? (
          <div className="col-span-full grid place-items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : companies.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No companies found.{" "}
            <Button
              variant="link"
              onClick={refetchCompanies}
              className="h-auto p-0"
            >
              Refresh
            </Button>
          </div>
        ) : (
          companies.map((c) => (
            <Card
              key={c.id}
              className={cn(
                "group relative rounded-xl border-border bg-card shadow-sm transition-all hover:shadow-elegant",
                canWrite && "hover:border-primary/30 cursor-pointer",
              )}
              onClick={canWrite ? () => openEdit(c) : undefined}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      {c.code || c.id.toUpperCase()}
                    </div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {c.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {c.type || `${c.region || c.country} • ${c.city || ""}`}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
                  <div className="space-y-1 p-2.5 rounded-lg bg-muted/60">
                    <div className="text-xs font-medium text-muted-foreground">
                      Region
                    </div>
                    <div className="text-sm font-medium">{c.region || "-"}</div>
                  </div>
                  <div className="space-y-1 p-2.5 rounded-lg bg-muted/60">
                    <div className="text-xs font-medium text-muted-foreground">
                      Zone
                    </div>
                    <div className="text-sm font-medium">{c.zone || "-"}</div>
                  </div>
                  <div className="space-y-1 p-2.5 rounded-lg bg-muted/60">
                    <div className="text-xs font-medium text-muted-foreground">
                      City
                    </div>
                    <div className="text-sm font-medium">{c.city || "-"}</div>
                  </div>
                  {c.taxId && (
                    <div className="space-y-1 p-2.5 rounded-lg bg-muted/60">
                      <div className="text-xs font-medium text-muted-foreground">
                        Tax ID
                      </div>
                      <div className="text-sm font-medium">{c.taxId}</div>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-start gap-2 p-5 pt-3 border-t border-border/50">
                {canWrite && (
                  <Button
                    size="sm"
                    className="gap-1.5 h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(c);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={
                      c.employees > 0 ||
                      companiesSaving ||
                      (companiesDeleting && companyToDelete?.id === c.id)
                    }
                    className="gap-1.5 h-8"
                    onClick={(e) => handleDeleteClick(e, c)}
                  >
                    {companiesDeleting && companyToDelete?.id === c.id ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              company "{companyToDelete?.name}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setCompanyToDelete(null)}
              disabled={companiesDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={companiesDeleting}
            >
              {companiesDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="!inset-y-4 !right-4 !h-[calc(100vh-2rem)] !w-[95vw] rounded-xl border shadow-elevated sm:!w-[560px] md:!max-w-none flex flex-col p-0 gap-0"
        >
          <SheetHeader className="shrink-0 border-b border-border px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-base font-semibold">
                  {isNew ? "New Company" : "Edit Company"}
                </SheetTitle>
                <SheetDescription>
                  {isNew
                    ? "Create a new legal entity."
                    : `Editing ${form.name || selectedCompany?.name || ""}`}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Company name
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Teamwork IT Solution PLC"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Code
                </Label>
                <Input
                  value={form.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  placeholder="001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Country
                </Label>
                <Input
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="Ethiopia"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Region
                </Label>
                <Input
                  value={form.region}
                  onChange={(e) => handleChange("region", e.target.value)}
                  placeholder="Addis Ababa"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Zone
                </Label>
                <Input
                  value={form.zone}
                  onChange={(e) => handleChange("zone", e.target.value)}
                  placeholder="East"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  City
                </Label>
                <Input
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Addis Ababa"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tax ID
                </Label>
                <Input
                  value={form.taxId}
                  onChange={(e) => handleChange("taxId", e.target.value)}
                  placeholder="VAT123456"
                />
              </div> */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Abbreviation
                </Label>
                <Input
                  value={form.abbreviation}
                  onChange={(e) => handleChange("abbreviation", e.target.value)}
                  placeholder="ABC"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium tracking-wider text-muted-foreground">
                Established Date
              </Label>
              <Input
                type="date"
                value={form.dateOfEstablishment}
                onChange={(e) =>
                  handleChange("dateOfEstablishment", e.target.value)
                }
              />
            </div>

            {!isNew && selectedCompany?.employees > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/20 p-3">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning">
                  Cannot delete company with employees assigned
                </p>
              </div>
            )}
          </div>

          <SheetFooter className="shrink-0 border-t border-border px-6 py-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={companiesSaving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={companiesSaving}>
              {companiesSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  {isNew ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>
                  <Building2 className="mr-1.5 h-3.5 w-3.5" />
                  {isNew ? "Create" : "Update"}
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
