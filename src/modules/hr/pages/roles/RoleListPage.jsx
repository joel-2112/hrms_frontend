import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePermission } from "../../../../hooks/usePermission";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Search,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  Users,
  AlertTriangle,
  Shield,
  Settings,
  Pencil,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchRolesRequest,
  createRoleRequest,
  updateRoleRequest,
  clearRoles,
} from "../../../../redux/features/rolesSlice";

const TYPE_OPTIONS = ["All types", "System", "Custom"];
const STATUS_OPTIONS = ["All status", "Active", "Disabled"];

const TYPE_BADGE = {
  System: "bg-primary/10 text-primary border-primary/20",
  Custom: "bg-muted text-muted-foreground border-border",
};

const PAGE_SIZE = 6;

export default function RoleListPage() {
  const dispatch = useDispatch();
  const { canCreate, canWrite,canDelete,canEdit } = usePermission("Role");

  // Redux state
  const { items: roles, loading, saving, error, meta } = useSelector((state) => state.roles);

  // Local UI state
  const [draftRole, setDraftRole] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [viewMode, setViewMode] = useState("card");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch roles on mount and when filters change
  useEffect(() => {
    dispatch(fetchRolesRequest({
      page: currentPage,
      limit: PAGE_SIZE,
      search: searchTerm || undefined,
      includeDisabled: statusFilter === "All status" ? undefined : statusFilter === "Disabled",
    }));
  }, [dispatch, currentPage, searchTerm, statusFilter]);

  // Clear roles on unmount
  useEffect(() => {
    return () => {
      dispatch(clearRoles());
    };
  }, [dispatch]);

  const handleEditRole = (role) => {
    setDraftRole({ ...role });
    setIsEditing(true);
  };

  const handleCreateNewRole = () => {
    setDraftRole({
      id: `temp-${Date.now()}`,
      name: "",
      type: "Custom",
      status: "Active",
      description: "",
      usersCount: 0,
      isSystemRole: false,
      disabled: false,
    });
    setIsEditing(true);
    toast.info("New role — fill in the details and save");
  };

  const handleSave = () => {
    if (!draftRole || !draftRole.name?.trim()) return;

    const isNew = String(draftRole.id).startsWith("temp-");
    const body = {
      name: draftRole.name,
      isSystemRole: draftRole.type === "System",
      disabled: draftRole.status === "Disabled",
    };

    if (isNew) {
      dispatch(createRoleRequest(body));
    } else {
      dispatch(updateRoleRequest({ id: draftRole.id, ...body }));
    }

    setIsEditing(false);
    setDraftRole(null);
    setCurrentPage(1);
  };

  const handleClose = () => {
    setIsEditing(false);
    setDraftRole(null);
  };

  const updateDraft = (updates) => {
    setDraftRole((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const isSystemRole = draftRole?.type === "System";
  const isDisabled = draftRole?.status === "Disabled";
  const isNewRole = draftRole ? String(draftRole.id).startsWith("temp-") : false;

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-12rem)] gap-0">
      <div className="w-full flex flex-col">
        <div className="p-5 border-b border-border">
          <h1 className="text-xl font-semibold text-foreground">Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define what each role can see and do across the system.
          </p>
        </div>

        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-border bg-muted/30">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 w-full"
            />
          </div>
          <div className="flex gap-2 w-full sm:flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 flex-1">
                  {typeFilter}
                  <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {TYPE_OPTIONS.map((t) => (
                  <DropdownMenuItem
                    key={t}
                    onClick={() => {
                      setTypeFilter(t);
                      setCurrentPage(1);
                    }}
                  >
                    {t}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 flex-1">
                  {statusFilter}
                  <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {STATUS_OPTIONS.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setCurrentPage(1);
                    }}
                  >
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:flex items-center border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("card")}
                className={cn(
                  "px-2.5 py-1.5 transition-colors",
                  viewMode === "card"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "px-2.5 py-1.5 transition-colors",
                  viewMode === "table"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <TableIcon className="h-4 w-4" />
              </button>
            </div>

            {canCreate && (
              <Button
                size="sm"
                className="h-9 gap-1 flex-1"
                onClick={handleCreateNewRole}
                title="New role"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New role</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mb-3 opacity-40 animate-pulse" />
              <p className="text-sm">Loading roles…</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm">No roles found.</p>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {roles.map((role) => {
                const isActive =
                  isEditing && draftRole && draftRole.id === role.id;
                return (
                  <div
                    key={role.id}
                    className={cn(
                      "w-full text-left rounded-lg border p-4 transition-all hover:shadow-sm flex items-start gap-3",
                      isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card hover:bg-slate-400/40"
                    )}
                  >
                    <div
                      className={cn(
                        "w-1 self-stretch rounded-full",
                        isActive ? "bg-primary" : "bg-transparent"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={cn(
                            "font-medium truncate",
                            isActive ? "text-primary" : "text-foreground"
                          )}
                        >
                          {role.name || "Unnamed Role"}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                              TYPE_BADGE[role.type] || TYPE_BADGE.Custom
                            )}
                          >
                            {role.type || "Custom"}
                          </span>
                         {canWrite&& <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditRole(role);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {role.description || "No description"}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {role.usersCount ?? 0}{" "}
                          user
                          {(role.usersCount ?? 0) !== 1 ? "s" : ""}
                        </span>
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            role.status === "Active"
                              ? "bg-success"
                              : "bg-destructive"
                          )}
                        />
                        {role.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      ROLE
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      TYPE
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                      USERS
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      STATUS
                    </th>
                  {canWrite||canDelete &&  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                      ACTIONS
                    </th>
                    }
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {roles.map((role) => {
                    const isActive =
                      isEditing && draftRole && draftRole.id === role.id;
                    return (
                      <tr
                        key={role.id}
                        className={cn(
                          "transition-colors",
                          isActive ? "bg-primary/5" : "hover:bg-slate-400/40"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-1 h-8 rounded-full",
                                isActive ? "bg-primary" : "bg-transparent"
                              )}
                            />
                            <span
                              className={cn(
                                "font-medium",
                                isActive ? "text-primary" : "text-foreground"
                              )}
                            >
                              {role.name || "Unnamed Role"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                              TYPE_BADGE[role.type] || TYPE_BADGE.Custom
                            )}
                          >
                            {role.type || "Custom"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {role.usersCount ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                role.status === "Active"
                                  ? "bg-success"
                                  : "bg-destructive"
                              )}
                            />
                            <span
                              className={cn(
                                role.status === "Active"
                                  ? "text-foreground"
                                  : "text-destructive"
                              )}
                            >
                              {role.status}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                        {canWrite &&  <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEditRole(role)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(meta.page - 1) * meta.limit + 1} -{" "}
              {Math.min(meta.page * meta.limit, meta.total)} of{" "}
              {meta.total} roles
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(1)}
                disabled={meta.page <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={page === meta.page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() =>
                  setCurrentPage((p) => Math.min(meta.totalPages, p + 1))
                }
                disabled={meta.page >= meta.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(meta.totalPages)}
                disabled={meta.page >= meta.totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* SHEET - right-side panel for editing/creating roles */}
      <Sheet open={isEditing} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent
          side="right"
          className="!inset-y-4 !right-4 !w-[360px] !max-w-[360px] rounded-lg border shadow-sm p-0 gap-0 flex flex-col h-fit"
        >
          <SheetHeader className="pb-4 border-b border-border p-5">
            <SheetTitle>
              {isNewRole ? "New Role" : "Edit Role"}
            </SheetTitle>
            <SheetDescription>
              {isNewRole
                ? "Fill in the details for the new role."
                : "Edit role configuration and proceed to permissions."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role Name
              </Label>
              <Input
                value={draftRole?.name || ""}
                onChange={(e) => updateDraft({ name: e.target.value })}
                placeholder="Enter role name"
                className="mt-1.5"
                disabled={isSystemRole && !isNewRole}
              />
              {isSystemRole && !isNewRole && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  System role names cannot be changed.
                </p>
              )}
            </div>

            {/* <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role Type
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="mt-1.5 w-full justify-between h-10"
                  >
                    <span className="flex items-center gap-2">
                      {draftRole?.type === "System" && (
                        <Shield className="h-4 w-4 text-primary" />
                      )}
                      {draftRole?.type === "Custom" && (
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      )}
                      {draftRole?.type || "Custom"}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {["System", "Custom"].map((t) => (
                    <DropdownMenuItem
                      key={t}
                      onClick={() => updateDraft({ type: t })}
                      className="flex items-center gap-2"
                    >
                      {t === "System" && (
                        <Shield className="h-4 w-4 text-primary" />
                      )}
                      {t === "Custom" && (
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      )}
                      {t}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div> */}

            {/* <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Status</p>
                <p className="text-xs text-muted-foreground">
                  {draftRole?.status === "Active"
                    ? "Role is currently enabled"
                    : "Role is currently disabled"}
                </p>
              </div>
              <Switch
                checked={draftRole?.status === "Active"}
                onCheckedChange={(checked) =>
                  updateDraft({ status: checked ? "Active" : "Disabled" })
                }
              />
            </div> */}

            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </Label>
              <Textarea
                value={draftRole?.description || ""}
                onChange={(e) => updateDraft({ description: e.target.value })}
                placeholder="Describe what this role is for..."
                className="mt-1.5 min-h-[80px] resize-none"
              />
            </div>

            {isSystemRole && (
              <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 flex gap-2.5">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-warning">
                    System Role
                  </p>
                  <p className="text-[11px] text-warning/80 mt-0.5">
                    System roles cannot be deleted or renamed. You may change
                    the type and description.
                  </p>
                </div>
              </div>
            )}

            {isDisabled && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex gap-2.5">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-destructive">
                    Role Disabled
                  </p>
                  <p className="text-[11px] text-destructive/80 mt-0.5">
                    Disabled roles block all user access immediately. Users
                    with this role will lose permissions.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-muted/50 border border-border p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                After saving, the role will appear in the list and you can
                proceed to the{" "}
                <strong className="text-foreground">permission matrix</strong>{" "}
                to assign resource access.
              </p>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t border-border p-5 gap-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Close
            </Button>
            <Button
              className="flex-1 gap-1"
              disabled={saving || !canEdit || !draftRole?.name?.trim()}
              onClick={handleSave}
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  Save
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

