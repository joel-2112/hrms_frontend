import { useEffect, useState, useRef, useMemo } from "react";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import { Search, Shield, RefreshCw, X, Check, Plus, Trash2, Edit3, Save, Layers } from "lucide-react";
import { usePermission } from "../../../../hooks/usePermission";

// ─── Extractors ──────────────────────────────────────────────────────────────

const extractArray = (r) => {
  const arr = r?.data?.data;
  return Array.isArray(arr) ? arr : [];
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function RoleProfilesPage() {
  // All roles from API
  const [allRoles, setAllRoles] = useState([]);
  // All profiles from API
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { canCreate, canWrite,canDelete,canEdit } = usePermission("RoleProfile");

  // Search filter
  const [search, setSearch] = useState("");

  // ── Create / Edit form state ───────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null); // null = create mode
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [saving, setSaving] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, profilesRes] = await Promise.all([
        apiClient.get("/roles", { params: { includeDisabled: false, limit: 200 } }),
        apiClient.get("/roles/profiles", { params: { includeDisabled: false, limit: 200 } }),
      ]);
      setAllRoles(extractArray(rolesRes));
      setProfiles(extractArray(profilesRes));
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Open create form ──────────────────────────────────────────────────────
  const openCreateForm = () => {
    setEditingProfile(null);
    setFormName("");
    setFormDescription("");
    setSelectedRoleIds([]);
    setShowForm(true);
  };

  // ── Open edit form ────────────────────────────────────────────────────────
  const openEditForm = (profile) => {
    setEditingProfile(profile);
    setFormName(profile.name || "");
    setFormDescription(profile.description || "");
    setSelectedRoleIds((profile.roles || []).map(r => r.id));
    setShowForm(true);
  };

  // ── Close form ────────────────────────────────────────────────────────────
  const closeForm = () => {
    setShowForm(false);
    setEditingProfile(null);
  };

  // ── Toggle role selection ─────────────────────────────────────────────────
  const toggleRole = (roleId) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const selectAll = () => setSelectedRoleIds(allRoles.map(r => r.id));
  const unselectAll = () => setSelectedRoleIds([]);

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingProfile) {
        // Update existing profile
        await apiClient.patch(`/roles/profiles/${editingProfile.id}`, {
          name: formName.trim(),
          description: formDescription.trim(),
        });
        // Update roles for the profile
        await apiClient.put(`/roles/profiles/${editingProfile.id}/roles`, {
          roleIds: selectedRoleIds,
        });
      } else {
        // Create new profile
        await apiClient.post("/roles/profiles", {
          name: formName.trim(),
          description: formDescription.trim(),
          roleIds: selectedRoleIds,
        });
      }
      closeForm();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete profile ────────────────────────────────────────────────────────
  const handleDelete = async (profileId) => {
    if (!confirm("Are you sure you want to delete this role profile?")) return;
    try {
      await apiClient.delete(`/roles/profiles/${profileId}`);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete profile.");
    }
  };

  // ── Filter profiles by search ─────────────────────────────────────────────
  const filteredProfiles = useMemo(() => {
    if (!search.trim()) return profiles;
    const term = search.toLowerCase();
    return profiles.filter(p => p.name?.toLowerCase().includes(term));
  }, [profiles, search]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 pb-8">

      <PageHeader
        title="Role Profiles"
        subtitle="Group multiple roles into a profile. Assign a profile to a user to grant all its roles at once."
        icon={<Layers className="w-5 h-5" />}
      />

      {/* Error toast */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="px-2 py-0.5 border-none bg-transparent cursor-pointer text-red-800 font-medium text-xs">Dismiss</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            placeholder="Search profiles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {canCreate &&
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Role Profile
        </button>}
      </div>

      {/* ── Create / Edit Form ──────────────────────────────────── */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {editingProfile ? "Edit Role Profile" : "Create Role Profile"}
          </h3>

          {/* Name & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Profile Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="e.g., Senior Management"
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Brief description of this profile"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Roles checklist */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Allow Roles</label>
              <div className="flex gap-3">
                <button onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Select All</button>
                <button onClick={unselectAll} className="text-xs text-gray-500 hover:text-gray-700 font-medium">Unselect All</button>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 max-h-56 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-1 gap-x-4">
                {allRoles.map(role => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2.5 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="w-4 h-4 accent-blue-600 rounded flex-shrink-0"
                    />
                    <span className="truncate">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {selectedRoleIds.length} of {allRoles.length} roles selected
            </p>
          </div>

          {/* Form actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSave}
              disabled={!formName.trim() || saving}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-md transition-colors ${
                !formName.trim() || saving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              }`}
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : editingProfile ? "Update Profile" : "Save Profile"}
            </button>
            <button
              onClick={closeForm}
              className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Profiles List ──────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Role Profiles</h3>
          <span className="text-xs text-gray-500">{filteredProfiles.length} profile(s)</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-2.5 py-12 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-gray-400 text-sm">
            <Layers className="w-8 h-8 opacity-20" />
            <p>{search ? "No profiles match your search." : "No role profiles yet. Create one to get started."}</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Profile</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Roles</th>
              {canDelete||canWrite && <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[150px]">Actions</th>}
  </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((profile, i) => (
                <tr key={profile.id} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-3.5 py-3">
                    <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                    {profile.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{profile.description}</div>
                    )}
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(profile.roles || []).length === 0 ? (
                        <span className="text-xs text-gray-400 italic">No roles assigned</span>
                      ) : (
                        (profile.roles || []).map(role => (
                          <span key={role.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                            {role.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-1">
                     {canWrite&& <button
                        onClick={() => openEditForm(profile)}
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Edit profile"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>}
                      {canDelete&&
                      <button
                        onClick={() => handleDelete(profile.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                        title="Delete profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}