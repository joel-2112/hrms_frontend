import React, { useState, useEffect, useCallback, useRef } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
};

const baseUrl = "https://api.erp.eyuelkassahun.com";

// Check if file is an image
const isImageFile = (filename) => {
  return filename?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
};

// Get icon based on file/folder type
const getFileIcon = (filename, type) => {
  if (type === "folder") return "📁";
  if (isImageFile(filename)) return null;
  const ext = filename?.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "📄";
  return "📎";
};

// Input Field Component
const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  error,
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-50 ${
        error
          ? "border-red-300 focus:border-red-400"
          : "border-gray-200 focus:border-blue-400"
      }`}
    />
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

// Select Field Component
const SelectField = ({
  label,
  value,
  onChange,
  options,
  required,
  placeholder,
  error,
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-50 ${
        error
          ? "border-red-300 focus:border-red-400"
          : "border-gray-200 focus:border-blue-400"
      }`}
    >
      <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name || opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

// Sidebar Folder Item Component
const SidebarFolderItem = ({
  item,
  level,
  expandedFolders,
  onToggle,
  onSelect,
  selectedPath,
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedFolders.has(item.path);
  const isSelected = selectedPath === item.path;

  return (
    <div>
      <div
        className={cn(
          `flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors`,
          isSelected
            ? "bg-blue-100 text-blue-700"
            : "hover:bg-gray-100 text-gray-700",
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        onClick={() => onSelect(item.path)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(item.path);
            }}
            className="p-0.5 hover:bg-gray-200 rounded focus:outline-none"
          >
            {isExpanded ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        <svg
          className="w-5 h-5 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        <span className="text-sm font-medium truncate flex-1">{item.name}</span>
        {hasChildren && (
          <span className="text-xs text-gray-400">
            ({item.children.length})
          </span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {item.children.map((child) => (
            <SidebarFolderItem
              key={child.path}
              item={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Document Upload Form Modal Component
const DocumentUploadModal = ({
  isOpen,
  onClose,
  onUpload,
  documentTypes = [],
}) => {
  const [formData, setFormData] = useState({
    documentTypeId: "",
    file: null,
    title: "",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        file: "File size must be less than 10MB",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      file,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
    }));
    if (errors.file) setErrors((prev) => ({ ...prev, file: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.documentTypeId)
      newErrors.documentTypeId = "Document type is required";
    if (!formData.file) newErrors.file = "File is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setUploading(true);
    try {
      await onUpload(formData);
      // Reset form and close modal only on success
      setFormData({
        documentTypeId: "",
        file: null,
        title: "",
        documentNumber: "",
        issueDate: "",
        expiryDate: "",
        notes: "",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    } catch (error) {
      // Error is already handled in parent
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Upload Document
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(90vh-120px)] space-y-4">
          <SelectField
            label="Document Type"
            value={formData.documentTypeId}
            onChange={(e) => handleChange("documentTypeId", e.target.value)}
            options={documentTypes}
            required
            error={errors.documentTypeId}
            placeholder="Select document type..."
          />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              File <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-sm text-gray-500 hover:text-indigo-600">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                {formData.file ? formData.file.name : "Choose file"}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              {formData.file && (
                <span className="text-xs text-gray-400">
                  {formatFileSize(formData.file.size)}
                </span>
              )}
            </div>
            {errors.file && (
              <p className="text-xs text-red-500 mt-0.5">{errors.file}</p>
            )}
          </div>

          <InputField
            label="Title"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Display name (optional)"
          />

          <InputField
            label="Document Number"
            value={formData.documentNumber}
            onChange={(e) => handleChange("documentNumber", e.target.value)}
            placeholder="e.g. DOC-2024-001"
          />

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Issue Date"
              type="date"
              value={formData.issueDate}
              onChange={(e) => handleChange("issueDate", e.target.value)}
            />
            <InputField
              label="Expiry Date"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => handleChange("expiryDate", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-400 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            )}
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentManagment = () => {
  const [treeData, setTreeData] = useState(null);
  const [folderContents, setFolderContents] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedPath, setSelectedPath] = useState("");
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingContents, setLoadingContents] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);

  const { get, post, del } = useApi();
  const { toast } = useToast();

  const cache = useRef(new Map());

  // Load document types on mount
  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        const response = await get("/documents/types");
        const data = response?.data?.data || response?.data || [];
        setDocumentTypes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading document types:", error);
      }
    };
    loadDocumentTypes();
  }, [get]);

  const toDisplayPath = (apiPath) => {
    if (!apiPath) return "";
    if (apiPath.startsWith("/uploads")) return apiPath;
    return `/uploads/${apiPath}`;
  };

  const toApiPath = (displayPath) => {
    if (!displayPath) return "";
    return displayPath.replace("/uploads/", "");
  };

  const loadExplorer = useCallback(async () => {
    try {
      setLoadingTree(true);
      const response = await get("/documents/explorer");
      const data = response?.data?.data;

      if (data) {
        const processNode = (node) => {
          const processedNode = {
            ...node,
            path: toDisplayPath(node.path),
            type: "folder",
          };
          if (node.children && node.children.length > 0) {
            processedNode.children = node.children.map((child) =>
              processNode(child),
            );
          } else {
            processedNode.children = [];
          }
          return processedNode;
        };

        const processedData = processNode(data);
        setTreeData(processedData);
        const initialPath = toDisplayPath(data.path);
        setSelectedPath(initialPath);
        setExpandedFolders(new Set([initialPath]));

        if (processedData.children) {
          setFolderContents(processedData.children);
          cache.current.set(initialPath, processedData.children);
        }
      }
    } catch (error) {
      console.error("Error loading tree:", error);
      // toast({
      //   title: "Error",
      //   description: "Failed to load document tree",
      //   variant: "destructive",
      // });
    } finally {
      setLoadingTree(false);
    }
  }, [get, toast]);

  const loadDirectory = useCallback(
    async (displayPath) => {
      if (cache.current.has(displayPath)) {
        setFolderContents(cache.current.get(displayPath));
        return;
      }

      try {
        setLoadingContents(true);
        const apiPath = toApiPath(displayPath);
        const encodedPath = encodeURIComponent(apiPath);
        const response = await get(
          `/documents/explorer/directory?path=${encodedPath}`,
        );
        const data = response?.data?.data;

        if (data) {
          const contents = (data.children || []).map((child) => ({
            ...child,
            path: toDisplayPath(child.path),
            type: child.type || (child.children ? "folder" : "file"),
          }));
          cache.current.set(displayPath, contents);
          setFolderContents(contents);

          if (treeData && displayPath !== "/uploads") {
            const updateTreeChildren = (node, targetPath, newChildren) => {
              if (node.path === targetPath) {
                node.children = newChildren.filter(
                  (child) => child.type === "folder",
                );
                return true;
              }
              if (node.children) {
                for (let child of node.children) {
                  if (updateTreeChildren(child, targetPath, newChildren))
                    return true;
                }
              }
              return false;
            };
            const newTreeData = { ...treeData };
            updateTreeChildren(newTreeData, displayPath, contents);
            setTreeData(newTreeData);
          }
        } else {
          setFolderContents([]);
        }
      } catch (error) {
        console.error("Error loading directory:", error);
        // toast({
        //   title: "Error",
        //   description: "Failed to load folder contents",
        //   variant: "destructive",
        // });
        setFolderContents([]);
      } finally {
        setLoadingContents(false);
      }
    },
    [get, treeData, toast],
  );

  const handleDownload = (file) => {
    const fileUrl = `/documents/file?path=${encodeURIComponent(toApiPath(file.path))}`;
    window.open(fileUrl, "_blank");
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const handleDelete = async (file) => {
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      const documentId = file.id || file.documentId;

      try {
        const response = await del(`/documents/${documentId}`);

        if (response?.data?.success) {
          toast({
            title: "Success",
            description: "File deleted successfully",
          });
          cache.current.delete(selectedPath);
          await loadDirectory(selectedPath);
        } else {
          throw new Error("Delete failed");
        }
      } catch (error) {
        console.error("Error deleting file:", error);
        // toast({
        //   title: "Error",
        //   description: "Failed to delete file",
        //   variant: "destructive",
        // });
      }
    }
  };

  const handleFileUpload = async (documentData) => {
    try {
      const formData = new FormData();

      // Get the current path (e.g., "/uploads/Employee/Medical/EMP-2026-0002")
      const currentPath = toApiPath(selectedPath);

      // Parse the path to extract voucherType and voucherNo
      const pathParts = currentPath.split("/").filter((part) => part);

      let voucherType = "";
      let voucherNo = "";

      // Extract voucherType (first part)
      if (pathParts.length >= 1) {
        voucherType = pathParts[1];
      }

      // Extract voucherNo (last part - usually looks like EMP-2026-0002 or similar)
      if (pathParts.length >= 2) {
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart.match(/^[A-Z]+-\d{4}-\d+$/i) || lastPart.match(/^EMP-/i)) {
          voucherNo = lastPart;
        }
      }

      // If voucherNo still empty, try to find any part that looks like an ID
      if (!voucherNo) {
        for (const part of pathParts) {
          if (part.match(/^[A-Z]+-\d{4}-\d+$/i) || part.match(/^EMP-/i)) {
            voucherNo = part;
            break;
          }
        }
      }

      // Append all form data
      formData.append("file", documentData.file);
      formData.append("path", currentPath);
      formData.append("voucherType", voucherType || "Employee");
      formData.append("voucherNo", voucherNo || "UNKNOWN");
      formData.append("documentTypeId", documentData.documentTypeId);

      if (documentData.title) formData.append("title", documentData.title);
      if (documentData.documentNumber)
        formData.append("documentNumber", documentData.documentNumber);
      if (documentData.issueDate)
        formData.append("issueDate", documentData.issueDate);
      if (documentData.expiryDate)
        formData.append("expiryDate", documentData.expiryDate);
      if (documentData.notes) formData.append("notes", documentData.notes);

      const response = await post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log(response, "hello");
      if (response?.success) {
        // Show beautiful success toast
        toast({
          title: "Document Uploaded Successfully! 🎉",
          description: (
            <div className="mt-2">
              <p className="text-sm">
                <strong>{documentData.file.name}</strong> has been uploaded to:
              </p>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                {voucherType}/{documentData.documentTypeId}/{voucherNo}
              </p>
            </div>
          ),
          duration: 2000,
        });

        // Clear cache and refresh the directory
        cache.current.delete(selectedPath);
        await loadDirectory(selectedPath);

        return true;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      // toast({
      //   title: "Upload Failed",
      //   description:
      //     error?.response?.data?.message ||
      //     "Failed to upload document. Please try again.",
      //   variant: "destructive",
      // });
      throw error;
    }
  };

  useEffect(() => {
    loadExplorer();
  }, [loadExplorer]);

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFolderClick = (path) => {
    setSelectedPath(path);
    loadDirectory(path);
    const newExpanded = new Set(expandedFolders);
    const parts = path.split("/").filter(Boolean);
    let current = "";
    parts.forEach((part) => {
      current += "/" + part;
      newExpanded.add(current);
    });
    setExpandedFolders(newExpanded);
  };

  const getBreadcrumb = () => {
    if (!selectedPath) return [];
    const parts = selectedPath.split("/").filter(Boolean);
    return parts.map((part, index) => {
      const path = "/" + parts.slice(0, index + 1).join("/");
      return { name: part, path };
    });
  };

  const breadcrumb = getBreadcrumb();
  const folders = folderContents.filter((item) => item.type === "folder");
  const files = folderContents.filter((item) => item.type !== "folder");

  // Check if current folder is "avatars" to disable upload
  const isAvatarsFolder = selectedPath.split("/").pop() === "avatars";

  if (loadingTree) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading document tree...
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
        {/* Left Sidebar */}
        <div className="w-70 bg-white border-r border-gray-200 flex flex-col">
          <div className="pr-4 pt-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              Folder Structure
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Browse folders and subfolders
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {treeData && (
              <SidebarFolderItem
                item={treeData}
                level={0}
                expandedFolders={expandedFolders}
                onToggle={toggleFolder}
                onSelect={handleFolderClick}
                selectedPath={selectedPath}
              />
            )}
          </div>
        </div>

        {/* Right Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2 text-sm mb-2">
              <span
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => handleFolderClick("/uploads")}
              >
                Home
              </span>
              {breadcrumb.slice(1).map((item) => (
                <React.Fragment key={item.path}>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span
                    className="cursor-pointer hover:text-gray-800"
                    onClick={() => handleFolderClick(item.path)}
                  >
                    {item.name}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {selectedPath.split("/").pop() || "Uploads"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {folders.length} folders, {files.length} files
            </p>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {loadingContents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-gray-100 rounded-lg h-32"
                  />
                ))}
              </div>
            ) : folderContents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <svg
                  className="w-24 h-24 text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-500 text-lg">Empty folder</p>
                <p className="text-gray-400 text-sm mt-1">
                  This folder has no contents
                </p>
                {!isAvatarsFolder && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add New Document
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Folders */}
                {folders.map((item) => (
                  <div
                    key={item.path}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer group hover:border-blue-300"
                    onClick={() => handleFolderClick(item.path)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">
                          {getFileIcon(item.name, item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">Folder</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Files */}
                {files.map((item) => (
                  <div
                    key={item.path}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {isImageFile(item.name) ? (
                          <img
                            src={`${baseUrl}${item.path}`}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Crect x='2' y='2' width='20' height='20' rx='2.18'%3E%3C/rect%3E%3Cpath d='M7 2v20M17 2v20M2 12h20'%3E%3C/path%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 flex items-center justify-center text-4xl bg-gray-50 rounded-lg">
                            {getFileIcon(item.name, item.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(item.size)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item);
                            }}
                            title="Download"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </button>
                          <button
                            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(item);
                            }}
                            title="Preview"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add File Card - Opens the modal form (disabled for avatars folder) */}
                {files.length > 0 && !isAvatarsFolder && (
                  <div
                    onClick={() => setIsUploadModalOpen(true)}
                    className={cn(
                      "bg-white rounded-lg border-2 border-dashed border-gray-300 p-4 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group",
                    )}
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="text-4xl text-gray-400 group-hover:text-blue-500 transition-colors">
                        +
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                          Add New Document
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Click to upload with details
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleFileUpload}
        documentTypes={documentTypes}
      />

      {/* Preview Modal */}
      {isPreviewOpen && previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{previewFile.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(previewFile)}
                  className="p-2 text-gray-500 hover:text-blue-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(previewFile)}
                  className="p-2 text-gray-500 hover:text-red-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewFile.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                <img
                  src={`${baseUrl}${previewFile.path}`}
                  alt={previewFile.name}
                  className="max-w-full h-auto mx-auto"
                />
              )}
              {previewFile.name.match(/\.(mp4|mov)$/i) && (
                <video
                  controls
                  className="max-w-full mx-auto"
                  src={`${baseUrl}${previewFile.path}`}
                />
              )}
              {previewFile.name.match(/\.pdf$/i) && (
                <iframe
                  src={`${baseUrl}${previewFile.path}`}
                  title={previewFile.name}
                  className="border-0 w-full h-[80vh]"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentManagment;
