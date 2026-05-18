import React, { useState, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";

import {
  FileText,
  Edit3,
  Trash2,
  Plus,
  Search,
  X,
  Check,
  FolderOpen,
  Tag,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

const DocumentType = () => {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selectedType, setSelectedType] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Identity",
    isRequired: false,
    hasExpiry: false,
    allowedExtensions: [],
    maxFileSizeKb: 5120,
    disabled: false,
  });
  const [extensionsInput, setExtensionsInput] = useState("");

  const { get, post, put, del, patch } = useApi();

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "Identity", label: "Identity" },
    { value: "Education", label: "Education" },
    { value: "Employment", label: "Employment" },
    { value: "Financial", label: "Financial" },
    { value: "Medical", label: "Medical" },
    { value: "Other", label: "Other" },
  ];

  const fetchDocumentTypes = async () => {
    try {
      setLoading(true);
      const response = await get("/documents/types");
      const list =
        response?.data?.data?.data || response?.data?.data || response?.data || [];
      setDocumentTypes(Array.isArray(list) ? list : []);
      setFilteredTypes(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error("Failed to fetch document types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    let filtered = documentTypes;

    if (searchTerm) {
      filtered = filtered.filter(
        (type) =>
          type.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (type.description &&
            type.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((type) => type.category === selectedCategory);
    }

    setFilteredTypes(filtered);
  }, [searchTerm, selectedCategory, documentTypes]);

  const openModal = (mode, type = null) => {
    setModalMode(mode);
    if (type) {
      setSelectedType(type);
      if (mode === "edit") {
        setFormData({
          name: type.name,
          allowedExtensions: type.allowedExtensions || [],
          maxFileSizeKb: type.maxFileSizeKb,
        });
        setExtensionsInput((type.allowedExtensions || []).join(", "));
      } else if (mode === "view") {
        setSelectedType(type);
      }
    } else if (mode === "add") {
      setFormData({
        name: "",
        description: "",
        category: "Identity",
        isRequired: false,
        hasExpiry: false,
        allowedExtensions: [],
        maxFileSizeKb: 5120,
        disabled: false,
      });
      setExtensionsInput("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedType(null);
    setIsDropdownOpen(false);
  };

  const handleSave = async () => {
    try {
      const extensions = extensionsInput
        .split(",")
        .map((ext) => ext.trim().toLowerCase())
        .filter((ext) => ext !== "");

      const data = {
        ...formData,
        allowedExtensions: extensions,
      };

      if (modalMode === "edit") {
        const response = await patch(`/documents/types/${selectedType.id}`, data);
        if (
          response?.data?.success ||
          response?.data?.data?.success ||
          response?.success
        ) {
          toast.success("Document type updated successfully");
          closeModal();
          fetchDocumentTypes();
        }
      } else {
        const response = await post("/documents/types", data);
        if (
          response?.data?.success ||
          response?.data?.data?.success ||
          response?.success
        ) {
          toast.success("Document type created successfully");
          closeModal();
          fetchDocumentTypes();
        }
      }
    } catch (err) {
      toast.error(
        `Failed to ${modalMode === "edit" ? "update" : "create"} document type`
      );
    }
  };

  const handleDeleteRequest = (type) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!typeToDelete) return;

    try {
      await del(`/documents/types/${typeToDelete.id}`);
      toast.success("Document type deleted successfully");
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
      fetchDocumentTypes();
    } catch (err) {
      toast.error("Failed to delete document type");
    }
  };

  const getCategoryLabel = (value) => {
    const category = categories.find((c) => c.value === value);
    return category ? category.label : value;
  };

  const stats = {
    total: documentTypes.length,
    active: documentTypes.filter((t) => !t.disabled).length,
    disabled: documentTypes.filter((t) => t.disabled).length,
    categories: new Set(documentTypes.map((t) => t.category)).size,
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(".category-dropdown")) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Types</h1>
          <p className="text-gray-500 mt-1">
            Manage document types and their configurations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Types</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Disabled</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.disabled}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <X className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Categories</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.categories}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search document types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
              />
            </div>

            <div className="relative category-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-52 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm text-gray-700">{getCategoryLabel(selectedCategory)}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => {
                        setSelectedCategory(category.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                        selectedCategory === category.value
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => openModal("add")}
              className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Type
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="text-gray-500 mt-4">Loading document types...</p>
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No document types found</p>
              <button
                onClick={() => openModal("add")}
                className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
              >
                Add your first type
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Extensions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max Size
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{type.name}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {type.allowedExtensions?.slice(0, 3).map((ext, idx) => (
                            <span
                              key={idx}
                              className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded"
                            >
                              {ext}
                            </span>
                          ))}
                          {type.allowedExtensions?.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{type.allowedExtensions.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {(type.maxFileSizeKb / 1024).toFixed(1)} MB
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => openModal("view", type)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal("edit", type)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(type)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && typeToDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteDialogOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Delete Document Type</h2>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete "{typeToDelete.name}"?
              </p>
            </div>
            <div className="px-6 py-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setTypeToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {modalMode === "view" && "Document Details"}
                    {modalMode === "edit" && "Edit Document Type"}
                    {modalMode === "add" && "Add Document Type"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {modalMode === "view" && "Complete information about this document type"}
                    {modalMode === "edit" && "Update the document type information"}
                    {modalMode === "add" && "Create a new document type"}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {modalMode === "view" && selectedType && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Name</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{selectedType.name}</p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Max File Size</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {(selectedType.maxFileSizeKb / 1024).toFixed(1)} MB
                      </p>
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-500 uppercase">Allowed Extensions</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {selectedType.allowedExtensions?.join(", ") || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(modalMode === "edit" || modalMode === "add") && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Passport, Visa"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Extensions</label>
                    <input
                      type="text"
                      value={extensionsInput}
                      onChange={(e) => setExtensionsInput(e.target.value)}
                      placeholder="pdf, jpg, png, docx"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
                    />
                    <p className="text-xs text-gray-400 mt-1">Comma-separated, without dots</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max File Size (KB)</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="number"
                        value={formData.maxFileSizeKb}
                        onChange={(e) =>
                          setFormData({ ...formData, maxFileSizeKb: parseInt(e.target.value) })
                        }
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
                      />
                      <span className="text-sm text-gray-500">KB</span>
                      <span className="text-sm text-gray-400">
                        ({Math.round(formData.maxFileSizeKb / 1024)} MB)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(modalMode === "edit" || modalMode === "add") && (
              <div className="px-6 pb-8 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-950 transition-colors shadow-sm"
                >
                  {modalMode === "edit" ? "Save Changes" : "Create Type"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentType;

