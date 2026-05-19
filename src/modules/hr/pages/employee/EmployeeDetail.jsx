import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../../../api/axiosConfig";
import { usePermission } from "../../../../hooks/usePermission";
import {
  ArrowLeft,
  User,
  Building2,
  Briefcase,
  GraduationCap,
  Phone,
  MapPin,
  CreditCard,
  AlertTriangle,
  Mail,
  Calendar,
  Hash,
  Shield,
  ChevronRight,
  Pencil,
  ExternalLink,
  Loader2,
  Building,
  Layers,
  BadgeCheck,
  Landmark,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  FileText,
  File,
  Download,
  Eye,
  Upload,
  X,
  Image,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (val, fallback = "—") =>
  val === null || val === undefined || val === "" ? fallback : String(val);

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
const fmtCurrency = (amount, currency = "ETB") => {
  if (amount === null || amount === undefined || amount === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (kb) => {
  if (!kb) return "0 KB";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const initials = (e) => {
  if (!e) return "?";
  return (
    `${e.firstName?.[0] || ""}${e.lastName?.[0] || ""}`.toUpperCase() || "?"
  );
};

const avatarGradient = (name = "") => {
  const colors = [
    ["#1e3a5f", "#2e75b6"],
    ["#064e3b", "#059669"],
    ["#3b0764", "#7c3aed"],
    ["#7c2d12", "#ea580c"],
    ["#1e1b4b", "#4f46e5"],
    ["#134e4a", "#0d9488"],
  ];
  return colors[(name.charCodeAt(0) || 0) % colors.length];
};

const fullName = (e) =>
  [e.firstName, e.middleName, e.lastName].filter(Boolean).join(" ");

const extractDocuments = (res) => {
  const data = res?.data?.data?.data || res?.data?.data || res?.data || {};
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null)
    return Object.values(data).flat();
  return [];
};

const isImage = (mimeType) => mimeType && mimeType.startsWith("image/");

const API_BASE = import.meta.env.VITE_API_URL;

// ─── Preview Modal ───────────────────────────────────────────────────────────

function PreviewModal({ document: doc, onClose }) {
  if (!doc) return null;

  const fileUrl = `${API_BASE}/documents/${doc.id}/file`;
  const isPdf = doc.mimeType === "application/pdf";
  const isImageFile = isImage(doc.mimeType);
  const canPreview = isImageFile || isPdf;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0">
              {isImageFile ? (
                <Image className="w-5 h-5 text-neutral-600" />
              ) : isPdf ? (
                <FileText className="w-5 h-5 text-red-500" />
              ) : (
                <File className="w-5 h-5 text-neutral-600" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate">
                {doc.title || doc.fileName || "Untitled"}
              </h3>
              <p className="text-xs text-slate-400">
                {formatFileSize(doc.fileSizeKb)} ·{" "}
                {doc.mimeType || "Unknown type"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100 p-1">
          {canPreview ? (
            <>
              {isImageFile && (
                <div className="flex items-center justify-center min-h-[50vh]">
                  <img
                    src={fileUrl}
                    alt={doc.title || doc.fileName}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    onError={(e) => {
                      e.target.style.display = "none";
                      const fb =
                        e.target.parentElement?.querySelector(".img-fallback");
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                  <div className="img-fallback hidden flex-col items-center justify-center py-20 text-slate-400">
                    <Image className="w-16 h-16 mb-3 opacity-30" />
                    <p className="text-sm font-medium">Failed to load image</p>
                    <p className="text-xs mt-1">
                      The file may be corrupted or inaccessible.
                    </p>
                  </div>
                </div>
              )}
              {isPdf && (
                <div className="flex flex-col h-full min-h-[60vh]">
                  <iframe
                    src={fileUrl}
                    className="w-full flex-1 min-h-[60vh] rounded-lg border-0"
                    title={doc.title || doc.fileName}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 min-h-[50vh]">
              <File className="w-16 h-16 mb-3 opacity-30" />
              <p className="text-sm font-medium">
                Cannot preview this file type
              </p>
              <p className="text-xs mt-1 text-slate-400">
                {doc.mimeType || "Unknown format"}
              </p>
              <p className="text-xs mt-2 text-slate-400">
                Use the download button below to save and open the file locally.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 flex-shrink-0 bg-white">
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {doc.documentType?.name && (
              <span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded-md font-bold text-[10px] uppercase tracking-wider border border-neutral-250/70 shadow-sm">
                {doc.documentType.name}
              </span>
            )}
            {doc.status && (
              <span
                className={`px-2 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider border ${
                  doc.status === "Verified"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : doc.status === "Rejected"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : doc.status === "Expired"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {doc.status}
              </span>
            )}
            {doc.documentNumber && (
              <span className="px-2 py-1 bg-slate-100 text-slate-650 rounded-md font-mono text-[11px] border border-slate-200">
                {doc.documentNumber}
              </span>
            )}
            {doc.expiryDate && (
              <span
                className={`px-2 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider border ${
                  new Date(doc.expiryDate) < new Date()
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-slate-100 text-slate-650 border-slate-200"
                }`}
              >
                {new Date(doc.expiryDate) < new Date()
                  ? "Expired: "
                  : "Expires: "}
                {fmtDate(doc.expiryDate)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4" /> Open in new tab
            </a>
            <a
              href={fileUrl}
              download={doc.fileName}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#222222] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-800 transition-colors border border-neutral-800 focus:ring-2 focus:ring-[#89E900]/30 shadow-md"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon: Icon,
  accent, // ignored to keep a cohesive theme
  collapsed,
  onToggle,
  count,
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-5 py-4 border-b border-neutral-100 text-left transition-all duration-200 ${
        collapsed ? "pl-5 hover:bg-neutral-50/30" : "border-l-4 border-l-[#222222] pl-4 bg-neutral-50/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#222222] text-[#89E900] shadow-sm">
          <Icon className="w-4 h-4" />
        </span>
        <h3 className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
          collapsed ? "text-neutral-600 font-bold" : "text-neutral-900 font-extrabold"
        }`}>
          {title}
        </h3>
        {count != null && count > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#89E900]/15 text-[#222222] border border-[#89E900]/30 text-[10px] font-bold">
            {count}
          </span>
        )}
      </div>
      {collapsed ? (
        <ChevronDown className="w-4 h-4 text-neutral-450" />
      ) : (
        <ChevronUp className="w-4 h-4 text-neutral-450" />
      )}
    </button>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, value, mono = false, link = null }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
        {label}
      </dt>
      <dd
        className={`text-sm font-semibold text-neutral-800 leading-snug break-words ${
          mono
            ? "font-mono text-xs bg-neutral-50 border border-neutral-200 rounded-md px-2 py-1 inline-block"
            : ""
        }`}
      >
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#222222] border-b border-transparent hover:border-[#89E900] transition-all font-semibold"
          >
            {value}
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        ) : (
          fmt(value)
        )}
      </dd>
    </div>
  );
}

function Grid({ children, cols = 2 }) {
  const cls =
    cols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : cols === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  return <dl className={`grid ${cls} gap-x-6 gap-y-5`}>{children}</dl>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite } = usePermission("Employee");

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarTs, setAvatarTs] = useState(Date.now());

  const [documents, setDocuments] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);

  const [showIdentity, setShowIdentity] = useState(true);
  const [showOrg, setShowOrg] = useState(true);
  const [showEmployment, setShowEmployment] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showDocuments, setShowDocuments] = useState(true);
  const [showEducation, setShowEducation] = useState(true);
  const [showWorkExp, setShowWorkExp] = useState(true);
  const [showEmergency, setShowEmergency] = useState(true);
  const [showSystem, setShowSystem] = useState(false);

  const fetchEmployee = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const empRes = await apiClient.get(`/employees/${id}`);
      const data =
        empRes?.data?.data?.data || empRes?.data?.data || empRes?.data;
      setEmployee(data);

      const employeeNumber = data?.employeeNumber;
      if (employeeNumber) {
        const docsRes = await apiClient
          .get(`/documents/owner/Employee/${employeeNumber}`)
          .catch(() => ({ data: { data: {} } }));
        setDocuments(extractDocuments(docsRes));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load employee.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const getDocStatusBadge = (status) => {
    const styles = {
      Verified: "bg-green-50 text-green-700 border-green-200",
      Pending: "bg-amber-50 text-amber-700 border-amber-200",
      Rejected: "bg-red-50 text-red-700 border-red-200",
      Expired: "bg-gray-50 text-gray-500 border-gray-200",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${styles[status] || styles.Pending}`}
      >
        {status || "Pending"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-[#222222] animate-spin" />
        <p className="text-sm text-neutral-500 font-bold uppercase tracking-wider">
          Loading employee profile…
        </p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-neutral-800 uppercase tracking-wider">
            Failed to load employee
          </p>
          <p className="text-xs text-neutral-500 mt-1">{error}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 border border-neutral-200 rounded-xl px-4 py-2.5 bg-white hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neutral-600" /> Back
          </button>
          <button
            onClick={fetchEmployee}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#222222] hover:bg-neutral-800 rounded-xl px-4 py-2.5 transition-colors border border-neutral-800 focus:ring-2 focus:ring-[#89E900]/30 shadow-md"
          >
            <Loader2 className="w-3.5 h-3.5 text-white" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const e = employee;
  const name = fullName(e);
  const [g1, g2] = avatarGradient(name);

  return (
    <div className="flex flex-col gap-5 pb-12">
      {previewDoc && (
        <PreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Back bar */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-neutral-600 group-hover:-translate-x-0.5 transition-transform" />{" "}
          Employees
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 truncate max-w-xs bg-[#89E900]/15 text-[#222222] border border-[#89E900]/30 px-2.5 py-1 rounded-md">
          {name}
        </span>
      </div>

      {/* Hero Card */}
      <div className="bg-[#222222] border border-neutral-800 rounded-2xl shadow-xl relative overflow-hidden">
        {/* Soft geometric glows */}
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-[#89E900]/5 blur-[80px] pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 rounded-full bg-neutral-700/10 blur-[60px] pointer-events-none" />

        <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-5 relative z-10">
          {/* Clickable avatar for upload */}
          <div className="relative group">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="avatar-upload"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const formData = new FormData();
                formData.append("avatar", file);
                try {
                  const res = await apiClient.put(
                    `/employees/${id}/avatar`,
                    formData,
                  );
                  const updated =
                    res?.data?.data?.data || res?.data?.data || res?.data;
                  // Update employee state immediately with new image
                  if (updated?.image) {
                    setEmployee((prev) => ({ ...prev, image: updated.image }));
                  }
                  setAvatarTs(Date.now());
                  toast.success("Profile photo updated");
                  fetchEmployee();
                } catch (err) {
                  toast.error(
                    err?.response?.data?.message || "Failed to upload photo",
                  );
                }
                e.target.value = "";
              }}
            />
            <label
              htmlFor="avatar-upload"
              className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-[#222222] bg-[#89E900] shadow-md border border-white/10 flex-shrink-0 overflow-hidden relative group ${!e.image ? "select-none" : ""} ${canWrite ? "cursor-pointer" : "cursor-default"}`}
              title={canWrite ? "Click to upload profile photo" : ""}
            >
              {e.image ? (
                <img
                  src={`${API_BASE}/uploads/${e.image}?t=${avatarTs}`}
                  alt={name}
                  className="w-full h-full object-cover rounded-2xl"
                  onError={(err) => {
                    err.target.style.display = "none";
                    const fallback =
                      err.target.parentElement.querySelector(
                        ".avatar-fallback",
                      );
                    if (fallback) {
                      fallback.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <span
                className={`avatar-fallback ${e.image ? "hidden" : "flex"} w-full h-full items-center justify-center`}
              >
                {initials(e)}
              </span>
              {canWrite && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
              )}
            </label>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
              {name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-neutral-300 font-medium mt-1.5">
              {e.designation?.name && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                  {e.designation.name}
                </span>
              )}
              {e.department?.name && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                  {e.department.name}
                </span>
              )}
              {e.company?.name && (
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-neutral-400" />
                  {e.company.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-300 bg-neutral-800/60 border border-neutral-700/60 px-2.5 py-1 rounded-lg">
                <Hash className="w-3 h-3 text-[#89E900]" />
                {fmt(e.employeeNumber)}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${e.status === "Active" ? "bg-[#89E900]/15 text-[#89E900] border-[#89E900]/30" : "bg-neutral-800/60 text-neutral-455 border-neutral-700/60"}`}
              >
                {e.status}
              </span>
              {e.employmentType?.name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border bg-neutral-800/60 text-neutral-300 border-neutral-700/60">
                  {e.employmentType.name}
                </span>
              )}
              {e.employeeGrade?.name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border bg-neutral-800/60 text-neutral-300 border-neutral-700/60">
                  {e.employeeGrade.name}
                </span>
              )}
            </div>
          </div>
          {canWrite && (
            <button
              onClick={() => navigate(`/hr/employees/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#89E900] hover:bg-[#89E900]/90 text-[#222222] text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 shadow-lg border border-[#89E900]/20 flex-shrink-0"
            >
              <Pencil className="w-3.5 h-3.5 text-[#222222]" /> Edit Profile
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-neutral-850 divide-x divide-neutral-850 bg-neutral-900/40 relative z-10">
          {[
            {
              label: "Date of Joining",
              value: fmtDate(e.dateOfJoining),
              icon: Calendar,
            },
            {
              label: "Department",
              value: fmt(e.department?.name),
              icon: Building2,
            },
            {
              label: "Employment",
              value: fmt(e.employmentType?.name),
              icon: Layers,
            },
            {
              label: "Account",
              value: fmt(e.user?.status || e.status),
              icon: BadgeCheck,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col px-5 py-4">
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-450 mb-1 flex items-center gap-1">
                <Icon className="w-3 h-3 text-[#89E900]" />
                {label}
              </span>
              <span className="text-sm font-bold text-neutral-250 truncate">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Sections */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm overflow-hidden">
        {/* Personal Identity */}
        <SectionHeader
          title="Personal Identity"
          icon={User}
          collapsed={!showIdentity}
          onToggle={() => setShowIdentity((v) => !v)}
        />
        {showIdentity && (
          <div className="p-5 border-b border-neutral-100">
            <Grid>
              <Field label="First Name" value={e.firstName} />
              <Field label="Middle Name" value={e.middleName} />
              <Field label="Last Name" value={e.lastName} />
              <Field label="Salutation" value={e.salutation} />
              <Field label="Gender" value={e.gender} />
              <Field label="Marital Status" value={e.maritalStatus} />
              <Field
                label="National ID Number"
                value={e.nationalIdNumber}
              />
            </Grid>
          </div>
        )}

        {/* Organization */}
        <SectionHeader
          title="Organization Assignment"
          icon={Building2}
          collapsed={!showOrg}
          onToggle={() => setShowOrg((v) => !v)}
        />
        {showOrg && (
          <div className="p-5 border-b border-neutral-100">
            <Grid cols={3}>
              <Field
                label="Company"
                value={`${e.company?.name}${e.company?.abbr ? ` (${e.company.abbr})` : ""}`}
              />
              <Field label="Branch" value={e.branch?.name} />
              <Field label="Department" value={e.department?.name} />
              <Field label="Designation" value={e.designation?.name} />
              <Field label="Employment Type" value={e.employmentType?.name} />
              <Field label="Employee Grade" value={e.employeeGrade?.name} />
              <Field
                label="Reports To"
                value={
                  e.reportsTo
                    ? `${e.reportsTo.firstName} ${e.reportsTo.lastName}`
                    : null
                }
              />
            </Grid>
          </div>
        )}

        {/* Employment */}
        <SectionHeader
          title="Employment Details"
          icon={Calendar}
          collapsed={!showEmployment}
          onToggle={() => setShowEmployment((v) => !v)}
        />
        {showEmployment && (
          <div className="p-5 border-b border-neutral-100">
            <Grid>
              <Field label="Employee #" value={e.employeeNumber} mono />
              <Field label="Date of Joining" value={fmtDate(e.dateOfJoining)} />
              <Field
                label="Contract End Date"
                value={fmtDate(e.contractEndDate)}
              />
              <Field label="Relieving Date" value={fmtDate(e.relievingDate)} />
              <Field
                label="Encashment Date"
                value={fmtDate(e.encashmentDate)}
              />
              <Field label="Salary" value={fmtCurrency(e.salary)} />
              <Field
                label="Portfolio URL"
                value={e.portfolioUrl}
                link={e.portfolioUrl}
              />
              <Field
                label="GitHub URL"
                value={
                  e.githubUrl
                    ? e.githubUrl.replace("https://github.com/", "@")
                    : null
                }
                link={e.githubUrl}
              />
            </Grid>
          </div>
        )}

        {/* Contact */}
        <SectionHeader
          title="Contact Information"
          icon={Phone}
          collapsed={!showContact}
          onToggle={() => setShowContact((v) => !v)}
        />
        {showContact && (
          <div className="p-5 border-b border-neutral-100">
            <Grid>
              <Field
                label="Email"
                value={e.email}
                link={e.email ? `mailto:${e.email}` : null}
              />
              <Field
                label="Phone Number"
                value={e.phoneNumber}
                link={e.phoneNumber ? `tel:${e.phoneNumber}` : null}
              />
            </Grid>
          </div>
        )}

        {/* Address */}
        <SectionHeader
          title="Address"
          icon={MapPin}
          collapsed={!showAddress}
          onToggle={() => setShowAddress((v) => !v)}
        />
        {showAddress && (
          <div className="p-5 border-b border-neutral-100">
            <Grid cols={3}>
              <Field label="City" value={e.City} />
              <Field label="Region" value={e.Region} />
              <Field label="Zone" value={e.zone} />
              <Field label="Country" value={e.Country} />
              <Field label="Postal Code" value={e.currentPostalCode} />
            </Grid>
          </div>
        )}

        {/* Bank */}
        <SectionHeader
          title="Bank & Payment"
          icon={Landmark}
          collapsed={!showBank}
          onToggle={() => setShowBank((v) => !v)}
        />
        {showBank && (
          <div className="p-5 border-b border-neutral-100">
            <Grid>
              <Field label="Payment Method" value={e.paymentMethod} />
              <Field label="Bank Name" value={e.bankName} />
              <Field
                label="Bank Account Number"
                value={e.bankAccountNumber}
                mono
              />
              <Field label="Mobile Money Number" value={e.mobileMoneyNumber} />
            </Grid>
          </div>
        )}

        {/* Document Attachments */}
        <SectionHeader
          title="Document Attachments"
          icon={FileText}
          collapsed={!showDocuments}
          onToggle={() => setShowDocuments((v) => !v)}
          count={documents.length}
        />
        {showDocuments && (
          <div className="p-5 border-b border-neutral-100">
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:shadow-sm hover:border-neutral-350 transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 hover:bg-[#89E900]/20 border border-neutral-200 transition-all relative"
                        title="Preview"
                      >
                        {isImage(doc.mimeType) ? (
                          <img
                            src={`${API_BASE}/documents/${doc.id}/file`}
                            alt={doc.title}
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <File
                          className={`w-5 h-5 text-neutral-500 ${isImage(doc.mimeType) ? "hidden" : ""}`}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="text-sm font-bold text-neutral-800 truncate hover:text-black hover:underline transition-colors text-left"
                          >
                            {doc.title || doc.fileName || "Untitled"}
                          </button>
                          {getDocStatusBadge(doc.status)}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {doc.documentType?.name || "Document"}
                          {doc.documentNumber && ` · ${doc.documentNumber}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <span className="text-[11px] text-neutral-450 flex items-center gap-1">
                            <Upload className="w-3 h-3 text-[#89E900]" />
                            {formatFileSize(doc.fileSizeKb)}
                          </span>
                          {doc.issueDate && (
                            <span className="text-[11px] text-neutral-450 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#89E900]" />
                              Issued: {fmtDate(doc.issueDate)}
                            </span>
                          )}
                          {doc.expiryDate && (
                            <span
                              className={`text-[11px] flex items-center gap-1 ${new Date(doc.expiryDate) < new Date() ? "text-red-500 font-semibold" : "text-neutral-455"}`}
                            >
                              <AlertTriangle className="w-3 h-3 text-[#89E900]" />
                              Expires: {fmtDate(doc.expiryDate)}
                            </span>
                          )}
                        </div>
                        {doc.notes && (
                          <p className="text-xs text-neutral-450 mt-1.5 italic line-clamp-1">
                            {doc.notes}
                          </p>
                        )}
                        {doc.uploadedBy && (
                          <p className="text-[10px] text-neutral-400 mt-1">
                            Uploaded by {doc.uploadedBy.firstName}{" "}
                            {doc.uploadedBy.lastName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <a
                          href={`${API_BASE}/documents/${doc.id}/file`}
                          download={doc.fileName}
                          className="p-1.5 rounded-lg hover:bg-[#89E900]/10 text-neutral-450 hover:text-[#222222] transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 rounded-lg hover:bg-[#89E900]/10 text-neutral-450 hover:text-[#222222] transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-neutral-400 border-2 border-dashed border-neutral-200 rounded-lg">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-neutral-400" />
                No documents attached to this employee.
              </div>
            )}
          </div>
        )}

        {/* Education */}
        <SectionHeader
          title="Education"
          icon={GraduationCap}
          collapsed={!showEducation}
          onToggle={() => setShowEducation((v) => !v)}
        />
        {showEducation && (
          <div className="p-5 border-b border-neutral-100">
            {e.educationHistory?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {e.educationHistory.map((edu, i) => (
                  <div
                    key={edu.id || i}
                    className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:shadow-sm hover:border-neutral-350 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-neutral-200">
                        <GraduationCap className="w-5 h-5 text-[#222222]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-800 truncate">
                          {fmt(edu.institution)}
                        </p>
                        <p className="text-xs text-neutral-600 font-medium mt-0.5">
                          {fmt(edu.qualification)}
                        </p>
                        {edu.level && (
                          <p className="text-xs text-neutral-405 mt-0.5">
                            {edu.level}
                          </p>
                        )}
                        {(edu.fromDate || edu.toDate) && (
                          <p className="text-xs text-neutral-450 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#89E900]" />
                            {fmtDate(edu.fromDate)} — {fmtDate(edu.toDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-450 py-4 text-center">
                No education records on file.
              </p>
            )}
          </div>
        )}

        {/* External Work */}
        <SectionHeader
          title="Work Experience"
          icon={Briefcase}
          collapsed={!showWorkExp}
          onToggle={() => setShowWorkExp((v) => !v)}
        />
        {showWorkExp && (
          <div className="p-5 border-b border-neutral-100">
            {e.externalWorkHistory?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {e.externalWorkHistory.map((w, i) => (
                  <div
                    key={w.id || i}
                    className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:shadow-sm hover:border-neutral-350 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-neutral-200">
                        <Briefcase className="w-5 h-5 text-[#222222]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-800">
                          {fmt(w.companyName)}
                        </p>
                        <p className="text-xs text-neutral-600 font-medium mt-0.5">
                          {fmt(w.designation)}
                        </p>
                        <p className="text-xs text-neutral-450 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#89E900]" />
                          {fmtDate(w.fromDate)} — {fmtDate(w.toDate)}
                        </p>
                        {w.exitReason && (
                          <p className="text-xs text-neutral-450 mt-1">
                            Exit: {w.exitReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-450 py-4 text-center">
                No external work history.
              </p>
            )}
          </div>
        )}

        {/* Emergency Contacts */}
        <SectionHeader
          title="Emergency Contacts"
          icon={HeartPulse}
          collapsed={!showEmergency}
          onToggle={() => setShowEmergency((v) => !v)}
        />
        {showEmergency && (
          <div className="p-5 border-b border-neutral-100">
            {e.emergencyContacts?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {e.emergencyContacts.map((c, i) => (
                  <div
                    key={c.id || i}
                    className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:shadow-sm hover:border-neutral-350 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-neutral-800">
                          {fmt(c.fullName)}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {fmt(c.relationship)}
                        </p>
                      </div>
                      <HeartPulse className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    </div>
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-1.5 mt-2 text-xs text-neutral-600 hover:text-black font-semibold border-b border-transparent hover:border-[#89E900] w-fit transition-colors"
                      >
                        <Phone className="w-3 h-3 text-neutral-500" />
                        {c.phone}
                      </a>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-1.5 mt-1 text-xs text-neutral-600 hover:text-black font-semibold border-b border-transparent hover:border-[#89E900] w-fit transition-colors"
                      >
                        <Mail className="w-3 h-3 text-neutral-500" />
                        {c.email}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-450 py-4 text-center">
                No emergency contacts on file.
              </p>
            )}
          </div>
        )}

        {/* System Info */}
        <SectionHeader
          title="System & Account Info"
          icon={Shield}
          collapsed={!showSystem}
          onToggle={() => setShowSystem((v) => !v)}
        />
        {showSystem && (
          <div className="p-5">
            <Grid cols={2}>
              <Field label="User Email" value={e.user?.email} />
              <Field label="Account Status" value={e.user?.status} />
              <Field
                label="Last Login"
                value={fmtDateTime(e.user?.lastLogin)}
              />
              <Field
                label="Super User"
                value={e.user?.isSuperUser ? "Yes" : "No"}
              />
              <Field
                label="System Manager"
                value={e.user?.isSystemManager ? "Yes" : "No"}
              />
              <Field label="Role Profile" value={e.roleProfile?.name} />
            </Grid>
            <div className="mt-5 pt-4 border-t border-neutral-100">
              <Grid cols={2}>
                <Field label="Created At" value={fmtDateTime(e.createdAt)} />
                <Field label="Updated At" value={fmtDateTime(e.updatedAt)} />
              </Grid>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
