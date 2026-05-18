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

const API_BASE = "http://localhost:3000";

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
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              {isImageFile ? (
                <Image className="w-5 h-5 text-indigo-600" />
              ) : isPdf ? (
                <FileText className="w-5 h-5 text-red-500" />
              ) : (
                <File className="w-5 h-5 text-indigo-600" />
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
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium">
                {doc.documentType.name}
              </span>
            )}
            {doc.status && (
              <span
                className={`px-2 py-1 rounded-md font-medium ${doc.status === "Verified" ? "bg-green-50 text-green-700" : doc.status === "Rejected" ? "bg-red-50 text-red-700" : doc.status === "Expired" ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-600"}`}
              >
                {doc.status}
              </span>
            )}
            {doc.documentNumber && (
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-mono text-[11px]">
                {doc.documentNumber}
              </span>
            )}
            {doc.expiryDate && (
              <span
                className={`px-2 py-1 rounded-md font-medium ${new Date(doc.expiryDate) < new Date() ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Open in new tab
            </a>
            <a
              href={fileUrl}
              download={doc.fileName}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
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
  accent = "#2e75b6",
  collapsed,
  onToggle,
  count,
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100"
    >
      <div className="flex items-center gap-3">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18` }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </span>
        <h3 className="text-sm font-bold text-slate-700 tracking-tight">
          {title}
        </h3>
        {count != null && count > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
            {count}
          </span>
        )}
      </div>
      {collapsed ? (
        <ChevronDown className="w-4 h-4 text-slate-400" />
      ) : (
        <ChevronUp className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, value, mono = false, link = null }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
        {label}
      </dt>
      <dd
        className={`text-sm font-medium text-slate-800 leading-snug break-words ${mono ? "font-mono text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 inline-block" : ""}`}
      >
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
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
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">
          Loading employee profile…
        </p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-slate-700">
            Failed to load employee
          </p>
          <p className="text-sm text-slate-400 mt-1">{error}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={fetchEmployee}
            className="flex items-center gap-2 text-sm text-white bg-blue-600 rounded-xl px-4 py-2 hover:bg-blue-700 transition-colors font-medium"
          >
            <Loader2 className="w-4 h-4" /> Retry
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
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />{" "}
          Employees
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-sm text-slate-800 font-semibold truncate max-w-xs">
          {name}
        </span>
      </div>

      {/* Hero Card */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
        <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
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
              className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg flex-shrink-0 overflow-hidden ${!e.image ? "select-none" : ""} ${canWrite ? "cursor-pointer" : "cursor-default"}`}
              style={{
                background: e.image
                  ? "transparent"
                  : `linear-gradient(135deg, ${g1}, ${g2})`,
                letterSpacing: "-1px",
              }}
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
                      fallback.parentElement.style.background = `linear-gradient(135deg, ${g1}, ${g2})`;
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
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
              {name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 font-medium mt-1">
              {e.designation?.name && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {e.designation.name}
                </span>
              )}
              {e.department?.name && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {e.department.name}
                </span>
              )}
              {e.company?.name && (
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {e.company.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                <Hash className="w-3 h-3" />
                {fmt(e.employeeNumber)}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${e.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
              >
                {e.status}
              </span>
              {e.employmentType?.name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                  {e.employmentType.name}
                </span>
              )}
              {e.employeeGrade?.name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border bg-violet-50 text-violet-700 border-violet-200">
                  {e.employeeGrade.name}
                </span>
              )}
            </div>
          </div>
          {canWrite && (
            <button
              onClick={() => navigate(`/hr/employees/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex-shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-slate-100 divide-x divide-slate-100">
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
            <div key={label} className="flex flex-col px-5 py-3.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {label}
              </span>
              <span className="text-sm font-bold text-slate-800 truncate">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Sections */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Personal Identity */}
        <SectionHeader
          title="Personal Identity"
          icon={User}
          accent="#2e75b6"
          collapsed={!showIdentity}
          onToggle={() => setShowIdentity((v) => !v)}
        />
        {showIdentity && (
          <div className="p-5 border-b border-slate-50">
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
          accent="#7c3aed"
          collapsed={!showOrg}
          onToggle={() => setShowOrg((v) => !v)}
        />
        {showOrg && (
          <div className="p-5 border-b border-slate-50">
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
          accent="#059669"
          collapsed={!showEmployment}
          onToggle={() => setShowEmployment((v) => !v)}
        />
        {showEmployment && (
          <div className="p-5 border-b border-slate-50">
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
          accent="#e97c0a"
          collapsed={!showContact}
          onToggle={() => setShowContact((v) => !v)}
        />
        {showContact && (
          <div className="p-5 border-b border-slate-50">
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
          accent="#059669"
          collapsed={!showAddress}
          onToggle={() => setShowAddress((v) => !v)}
        />
        {showAddress && (
          <div className="p-5 border-b border-slate-50">
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
          accent="#7c3aed"
          collapsed={!showBank}
          onToggle={() => setShowBank((v) => !v)}
        />
        {showBank && (
          <div className="p-5 border-b border-slate-50">
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
          accent="#6366f1"
          collapsed={!showDocuments}
          onToggle={() => setShowDocuments((v) => !v)}
          count={documents.length}
        />
        {showDocuments && (
          <div className="p-5 border-b border-slate-50">
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-indigo-200 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 hover:bg-indigo-200 transition-colors relative"
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
                          className={`w-5 h-5 text-indigo-600 ${isImage(doc.mimeType) ? "hidden" : ""}`}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="text-sm font-bold text-slate-800 truncate hover:text-indigo-600 transition-colors text-left"
                          >
                            {doc.title || doc.fileName || "Untitled"}
                          </button>
                          {getDocStatusBadge(doc.status)}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {doc.documentType?.name || "Document"}
                          {doc.documentNumber && ` · ${doc.documentNumber}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            {formatFileSize(doc.fileSizeKb)}
                          </span>
                          {doc.issueDate && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Issued: {fmtDate(doc.issueDate)}
                            </span>
                          )}
                          {doc.expiryDate && (
                            <span
                              className={`text-[11px] flex items-center gap-1 ${new Date(doc.expiryDate) < new Date() ? "text-red-500 font-semibold" : "text-slate-400"}`}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Expires: {fmtDate(doc.expiryDate)}
                            </span>
                          )}
                        </div>
                        {doc.notes && (
                          <p className="text-xs text-slate-400 mt-1.5 italic line-clamp-1">
                            {doc.notes}
                          </p>
                        )}
                        {doc.uploadedBy && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Uploaded by {doc.uploadedBy.firstName}{" "}
                            {doc.uploadedBy.lastName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <a
                          href={`${API_BASE}/documents/${doc.id}/file`}
                          download={doc.fileName}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 transition-colors"
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
              <div className="text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No documents attached to this employee.
              </div>
            )}
          </div>
        )}

        {/* Education */}
        <SectionHeader
          title="Education"
          icon={GraduationCap}
          accent="#2e75b6"
          collapsed={!showEducation}
          onToggle={() => setShowEducation((v) => !v)}
        />
        {showEducation && (
          <div className="p-5 border-b border-slate-50">
            {e.educationHistory?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {e.educationHistory.map((edu, i) => (
                  <div
                    key={edu.id || i}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {fmt(edu.institution)}
                        </p>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          {fmt(edu.qualification)}
                        </p>
                        {edu.level && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {edu.level}
                          </p>
                        )}
                        {(edu.fromDate || edu.toDate) && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {fmtDate(edu.fromDate)} — {fmtDate(edu.toDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">
                No education records on file.
              </p>
            )}
          </div>
        )}

        {/* External Work */}
        <SectionHeader
          title="Work Experience"
          icon={Briefcase}
          accent="#059669"
          collapsed={!showWorkExp}
          onToggle={() => setShowWorkExp((v) => !v)}
        />
        {showWorkExp && (
          <div className="p-5 border-b border-slate-50">
            {e.externalWorkHistory?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {e.externalWorkHistory.map((w, i) => (
                  <div
                    key={w.id || i}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                          {fmt(w.companyName)}
                        </p>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          {fmt(w.designation)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(w.fromDate)} — {fmtDate(w.toDate)}
                        </p>
                        {w.exitReason && (
                          <p className="text-xs text-slate-400 mt-1">
                            Exit: {w.exitReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">
                No external work history.
              </p>
            )}
          </div>
        )}

        {/* Emergency Contacts */}
        <SectionHeader
          title="Emergency Contacts"
          icon={HeartPulse}
          accent="#e92020"
          collapsed={!showEmergency}
          onToggle={() => setShowEmergency((v) => !v)}
        />
        {showEmergency && (
          <div className="p-5 border-b border-slate-50">
            {e.emergencyContacts?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {e.emergencyContacts.map((c, i) => (
                  <div
                    key={c.id || i}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {fmt(c.fullName)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {fmt(c.relationship)}
                        </p>
                      </div>
                      <HeartPulse className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    </div>
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:underline font-medium"
                      >
                        <Phone className="w-3 h-3" />
                        {c.phone}
                      </a>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-1.5 mt-1 text-xs text-blue-600 hover:underline font-medium"
                      >
                        <Mail className="w-3 h-3" />
                        {c.email}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">
                No emergency contacts on file.
              </p>
            )}
          </div>
        )}

        {/* System Info */}
        <SectionHeader
          title="System & Account Info"
          icon={Shield}
          accent="#2e75b6"
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
            <div className="mt-5 pt-4 border-t border-slate-100">
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
