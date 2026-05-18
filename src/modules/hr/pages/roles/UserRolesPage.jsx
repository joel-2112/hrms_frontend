import { useEffect, useState, useMemo, useCallback } from "react";
import { usePermission } from "../../../../hooks/usePermission";
import { useApi } from "../../../../hooks/useApi";
import { apiClient } from "../../../../api/axiosConfig";
import {
  Search,
  ChevronDown,
  Users,
  Shield,
  UserCheck,
  Settings,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StatCard } from "../../../../components/common/StatCard";
import StatusPill from "../../../../components/common/StatusPill";

const STATUS_OPTIONS = ["All status", "Active", "Inactive"];

function getInitials(firstName, middleName, lastName) {
  const parts = [firstName, middleName, lastName].filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

function getFullName(user) {
  return (
    [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(" ") || "Unnamed"
  );
}

const PAGE_SIZE = 6;

export default function UserRolesPage() {
  const { canSetPermissions } = usePermission("UserRole");
  const { get, post, del, loading } = useApi();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [selectedUser, setSelectedUser] = useState(null);
  const [draftRoles, setDraftRoles] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    const res = await get("/roles/users/with-roles", {
      page: currentPage,
      limit: PAGE_SIZE,
    });
    if (res?.success) {
      setRows(res.data || []);
      setMeta(
        res.meta || { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 },
      );
    }
  }, [get, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    const res = await get("/roles");
    if (res?.success) {
      const rolesData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      setAvailableRoles(rolesData);
    }
    setRolesLoading(false);
  }, [get]);

  const fetchProfiles = useCallback(async () => {
    setProfilesLoading(true);
    const res = await get("/roles/profiles");
    if (res?.success) {
      const profilesData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      setAvailableProfiles(profilesData);
    }
    setProfilesLoading(false);
  }, [get]);

  useEffect(() => {
    if (sheetOpen && availableRoles.length === 0) fetchRoles();
  }, [sheetOpen, availableRoles.length, fetchRoles]);

  useEffect(() => {
    if (sheetOpen && availableProfiles.length === 0) fetchProfiles();
  }, [sheetOpen, availableProfiles.length, fetchProfiles]);

  const roleOptions = useMemo(
    () => ["All roles", ...availableRoles.map((r) => r.name)],
    [availableRoles],
  );

  const stats = useMemo(
    () => ({
      total: meta.total || rows.length,
      superUsers: rows.filter((r) => r.isSuperUser).length,
      multiRole: rows.filter((r) => r.roles?.length > 1).length,
    }),
    [rows, meta.total],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const fullName = getFullName(row).toLowerCase();
      const matchesSearch =
        !search ||
        fullName.includes(search.toLowerCase()) ||
        row.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole =
        roleFilter === "All roles" ||
        row.roles?.some((r) => r.name === roleFilter);
      const matchesStatus =
        statusFilter === "All status" || row.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [rows, search, roleFilter, statusFilter]);

  const handleManage = (user) => {
    setSelectedUser(user);
    setDraftRoles(
      user.roles ? user.roles.map((r) => ({ id: r.id, name: r.name })) : [],
    );
    setSheetOpen(true);
  };

  const toggleRole = (role) => {
    setDraftRoles((prev) => {
      const exists = prev.some((r) => r.id === role.id);
      if (exists) {
        return prev.filter((r) => r.id !== role.id);
      } else {
        return [...prev, { id: role.id, name: role.name }];
      }
    });
  };

  // Toggle role profile - adds/removes all roles in the profile
  const toggleProfile = (profile) => {
    setDraftRoles((prev) => {
      const profileRoleIds = (profile.roles || []).map((r) => r.id);
      const hasAllRoles = profileRoleIds.every((roleId) =>
        prev.some((r) => r.id === roleId),
      );

      if (hasAllRoles) {
        // Remove all roles from this profile
        return prev.filter((r) => !profileRoleIds.includes(r.id));
      } else {
        // Add all roles from this profile (merge, avoiding duplicates)
        const newRoles = profile.roles
          .filter((role) => !prev.some((r) => r.id === role.id))
          .map((role) => ({ id: role.id, name: role.name }));
        return [...prev, ...newRoles];
      }
    });
  };

  const hasChanges = useMemo(() => {
    if (!selectedUser) return false;
    const originalIds = (selectedUser.roles || [])
      .map((r) => r.id)
      .sort()
      .join(",");
    const draftIds = draftRoles
      .map((r) => r.id)
      .sort()
      .join(",");
    return originalIds !== draftIds;
  }, [selectedUser, draftRoles]);

  // ── Save: PUT replaces all roles at once ──────────────────────────
  const handleSave = async () => {
    if (!selectedUser || !hasChanges) return;
    setSaving(true);
    try {
      const roleIds = draftRoles.map((r) => r.id);
      const res = await apiClient.put(`/roles/users/${selectedUser.id}/roles`, {
        roleIds,
      });

      if (res.data?.success) {
        await fetchUsers();
        toast.success(`Roles updated for ${getFullName(selectedUser)}`);
        setSheetOpen(false);
      } else {
        toast.error(res.data?.message || "Failed to save roles");
      }
    } catch (err) {
      console.error("Save roles error:", err);
      toast.error(err?.response?.data?.message || "Failed to save roles");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSheetOpen(false);
    setSelectedUser(null);
    setDraftRoles([]);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">User Roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign and revoke roles per user — changes apply immediately to all{" "}
          {stats.total} users
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total users"
            value={stats.total}
            icon={Users}
            accent="primary"
          />
          <StatCard
            label="SuperUsers"
            value={stats.superUsers}
            icon={Shield}
            accent="warning"
          />
          <StatCard
            label="Multi-role users"
            value={stats.multiRole}
            icon={UserCheck}
            accent="success"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {roleFilter} <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {roleOptions.map((r) => (
                <DropdownMenuItem key={r} onClick={() => setRoleFilter(r)}>
                  {r}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {statusFilter} <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {STATUS_OPTIONS.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                USER
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                ASSIGNED ROLES
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                STATUS
              </th>
              {canSetPermissions && (
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  ACTIONS
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={canSetPermissions ? 4 : 3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={canSetPermissions ? 4 : 3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-400/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                        {getInitials(
                          row.firstName,
                          row.middleName,
                          row.lastName,
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {getFullName(row)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.email || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.roles?.length > 0 ? (
                        row.roles.map((role) => {
                          const roleClass = role.isSystemRole
                            ? "bg-warning/10 text-warning"
                            : role.name === "General Manager"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground";
                          return (
                            <span
                              key={role.id || role.name}
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleClass}`}
                            >
                              {role.name}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No roles
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={row.status || "Active"} />
                  </td>
                  {canSetPermissions && (
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManage(row)}
                        className="gap-1"
                      >
                        <Settings className="h-3.5 w-3.5" /> Manage
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.total > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30 rounded-xl">
          <p className="text-xs text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} -{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} users
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
              ),
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

      {/* Role Management Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <SheetContent
          side="right"
          className="w-[400px] sm:w-[540px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Manage Roles</SheetTitle>
            <SheetDescription>
              {selectedUser
                ? `Assign or revoke roles for ${getFullName(selectedUser)}`
                : "Select a user"}
            </SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="py-6 space-y-6">
              {/* Selected count */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h4 className="text-sm font-medium text-foreground">
                  Selected ({draftRoles.length})
                </h4>
                <div className="mt-2 flex flex-wrap gap-1">
                  {draftRoles.length > 0 ? (
                    draftRoles.map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {role.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </div>
              </div>

              {/* Role Profiles */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">
                  Role Profiles
                </h4>
                {profilesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : availableProfiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No profiles available.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {availableProfiles.map((profile) => {
                      const profileRoleIds = (profile.roles || []).map(
                        (r) => r.id,
                      );
                      const isProfileSelected =
                        profileRoleIds.length > 0 &&
                        profileRoleIds.every((roleId) =>
                          draftRoles.some((r) => r.id === roleId),
                        );

                      return (
                        <div
                          key={profile.id}
                          className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/40 cursor-pointer"
                          onClick={() => toggleProfile(profile)}
                        >
                          <Checkbox
                            checked={isProfileSelected}
                            onCheckedChange={() => toggleProfile(profile)}
                            className="mt-0.5 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <Label className="text-sm font-medium text-foreground cursor-pointer">
                              {profile.name}
                            </Label>
                            {(profile.roles || []).length > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {(profile.roles || [])
                                  .map((r) => r.name)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Available Roles */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">
                  Available Roles
                </h4>
                {rolesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (
                  <div className="space-y-1.5">
                    {availableRoles.map((role) => {
                      const isAssigned = draftRoles.some(
                        (r) => r.id === role.id,
                      );
                      return (
                        <div
                          key={role.id}
                          className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/40 cursor-pointer"
                          onClick={() => toggleRole(role)}
                        >
                          <Checkbox
                            checked={isAssigned}
                            onCheckedChange={() => toggleRole(role)}
                            className="mt-0.5 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <Label className="text-sm font-medium text-foreground cursor-pointer">
                              {role.name}
                            </Label>
                            {role.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {role.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <SheetFooter className="pt-2 gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              disabled={!canSetPermissions || !hasChanges || saving}
              onClick={handleSave}
              className="gap-1"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Check className="h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
