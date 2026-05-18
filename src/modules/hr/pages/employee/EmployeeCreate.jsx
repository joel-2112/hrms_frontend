import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import PageHeader from "../../../../components/common/PageHeader";
import {
  UserPlus,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Building2,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Link2,
  AlertCircle,
  RefreshCw,
  Users,
  Calendar,
  Shield,
  BookOpen,
  GraduationCap,
  Heart,
  UserCheck,
  ClipboardList,
  Upload,
  File,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

// ─── extract data from API responses ─────────────────────────────────────────
const extractArray = (res) => {
  const data = res?.data?.data?.data || res?.data?.data || res?.data || [];
  return Array.isArray(data) ? data : [];
};

// ─── format file size ───────────────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
};

// ─── input components ────────────────────────────────────────────────────────
function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  error,
  disabled,
}) {
  return (
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
        disabled={disabled}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-50 ${
          disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""
        } ${
          error
            ? "border-red-300 focus:border-red-400"
            : "border-gray-200 focus:border-blue-400"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required,
  placeholder,
  error,
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-50 ${
          error
            ? "border-red-300 focus:border-red-400"
            : "border-gray-200 focus:border-blue-400"
        }`}
      >
        <option value="">{placeholder || ` ${label.toLowerCase()}`}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name || opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function SectionHeader({ title, icon, collapsed, onToggle, count }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {count != null && count > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {count}
          </span>
        )}
      </div>
      {collapsed ? (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );
}

// ─── main component ──────────────────────────────────────────────────────────
export default function EmployeeCreate({ onCancel }) {
  const navigate = useNavigate();
  const { canCreate } = usePermission("Employee");

  // ── form state — Basic Info ────────────────────────────────────────────────
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    salutation: "",
    gender: "",
    nationality: "",
    dateOfBirth: "",
    maritalStatus: "",
    companyId: "",
    branchId: "",
    departmentId: "",
    designationId: "",
    employmentTypeId: "",
    employeeGradeId: "",
    reportsToId: "",
    dateOfJoining: "",
    salary: "",
    contractEndDate: "",
    portfolioUrl: "",
    githubUrl: "",
    City: "",

    Region: "",
    zone: "",
    Country: "",
    currentPostalCode: "",
    bankName: "",
    bankAccountNumber: "",
    mobileMoneyNumber: "",
    paymentMethod: "Bank Transfer",
    tinNumber: "", // Add this
    nationalIdNumber: "",
    email: "", // working email
    personalEmail: "", // alternative personal email (already exists but needs to be separate)
    needWorkEmail: false, // approver flag for IT assignment
    phoneNumber: "", // personal phone number (already exists)
    alternativePhoneNumber: "", // secondary phone number
  });

  const [education, setEducation] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [externalWork, setExternalWork] = useState([]);

  // ── Document attachments state ────────────────────────────────────────────
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // ── Independent collapsible toggles ────────────────────────────────────────
  const [showIdentity, setShowIdentity] = useState(true);
  const [showOrg, setShowOrg] = useState(true);
  const [showEmployment, setShowEmployment] = useState(true);
  const [showContact, setShowContact] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showBank, setShowBank] = useState(true);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showEducationSection, setShowEducationSection] = useState(true);
  const [showWorkExpSection, setShowWorkExpSection] = useState(true);
  const [showEmergencySection, setShowEmergencySection] = useState(true);

  // ── dropdown data ─────────────────────────────────────────────────────────
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [employeeGrades, setEmployeeGrades] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loadingOpts, setLoadingOpts] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [
          compRes,
          branchRes,
          deptRes,
          desigRes,
          empTypeRes,
          gradeRes,
          empRes,
          docTypeRes,
        ] = await Promise.all([
          apiClient.get("/organizations/companies?limit=100"),
          apiClient.get("/organizations/branches?limit=200"),
          apiClient.get("/organizations/departments?limit=200"),
          apiClient.get("/organizations/designations?limit=300"),
          apiClient.get("/organizations/employment-types?limit=50"),
          apiClient.get("/organizations/employee-grades?limit=50"),
          apiClient.get("/employees?limit=200"),
          apiClient.get("/documents/types"),
        ]);
        setCompanies(compRes?.data?.data?.companies || extractArray(compRes));
        setBranches(branchRes?.data?.data?.branches || extractArray(branchRes));
        setDepartments(
          deptRes?.data?.data?.departments || extractArray(deptRes),
        );
        setDesignations(
          desigRes?.data?.data?.designations || extractArray(desigRes),
        );
        setEmploymentTypes(
          empTypeRes?.data?.data?.employmentTypes || extractArray(empTypeRes),
        );
        setEmployeeGrades(
          gradeRes?.data?.data?.employeeGrades || extractArray(gradeRes),
        );
        setManagers(extractArray(empRes));
        setDocumentTypes(extractArray(docTypeRes));
      } catch {
        toast.error("Failed to load form options");
      } finally {
        setLoadingOpts(false);
      }
    })();
  }, []);

  const filteredBranches = form.companyId
    ? branches.filter((b) => b.companyId === form.companyId)
    : branches;
  const filteredDepartments = form.companyId
    ? departments.filter((d) => d.companyId === form.companyId)
    : departments;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.middleName.trim()) errs.middleName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    if (!form.companyId) errs.companyId = "Required";
    if (!form.dateOfJoining) errs.dateOfJoining = "Required";

    // Optional: Add email validation if needed
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Valid email required";
    }
    if (form.personalEmail && !/\S+@\S+\.\S+/.test(form.personalEmail)) {
      errs.personalEmail = "Valid email required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // const validate = () => {
  //   const errs = {};
  //   if (!form.firstName.trim()) errs.firstName = "Required";
  //   if (!form.middleName.trim()) errs.middleName = "Required";
  //   if (!form.lastName.trim()) errs.lastName = "Required";
  //   if (!form.companyId) errs.companyId = "Required";
  //   if (!form.dateOfJoining) errs.dateOfJoining = "Required";
  //   setErrors(errs);
  //   return Object.keys(errs).length === 0;
  // };

  // ── Document handlers ──────────────────────────────────────────────────────
  const addDocument = () =>
    setDocuments([
      ...documents,
      {
        tempId: Date.now().toString(),
        documentTypeId: "",
        file: null,
        title: "",
        documentNumber: "",
        issueDate: "",
        expiryDate: "",
        notes: "",
      },
    ]);

  const updateDocument = (idx, field, value) => {
    const u = [...documents];
    u[idx] = { ...u[idx], [field]: value };
    setDocuments(u);
  };

  const removeDocument = (idx) =>
    setDocuments(documents.filter((_, i) => i !== idx));

  const handleFileSelect = (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const u = [...documents];
    u[idx] = {
      ...u[idx],
      file,
      title: u[idx].title || file.name.replace(/\.[^/.]+$/, ""),
    };
    setDocuments(u);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      // ═══════════════════════════════════════════════════════════════
      //  1. CREATE EMPLOYEE
      // ═══════════════════════════════════════════════════════════════
      // const payload = { ...form };

      // Object.keys(payload).forEach((k) => {
      //   if (payload[k] === "" || payload[k] === null) delete payload[k];
      // });
      const payload = { ...form };
      Object.keys(payload).forEach((k) => {
        // Keep boolean false values, remove only empty strings/null
        if (payload[k] === "" || payload[k] === null) {
          delete payload[k];
        }
        // Don't delete boolean values (true/false)
        if (typeof payload[k] === "boolean") {
          return; // Keep as is
        }
      });

      console.log("📤 Creating employee:", payload);
      const res = await apiClient.post("/employees", payload);
      console.log("📥 Full response:", res.data);

      // Fix: go deeper into the nested response
      const responseData =
        res.data?.data?.data || // 3 levels deep: { success, data: { data: { id } } }
        res.data?.data || // 2 levels deep: { success, data: { id } }
        res.data; // 1 level deep: { id }

      const employeeId = responseData?.id;
      const employeeNumber =
        responseData?.employeeNumber ||
        responseData?.employee_number ||
        `EMP-${employeeId?.slice(0, 8)}`;

      console.log("🆔 Employee ID:", employeeId);
      console.log("🔢 Employee Number:", employeeNumber);

      if (!employeeId) {
        console.error(
          "❌ Could not extract employee ID from response:",
          res.data,
        );
        throw new Error(
          "No employee ID returned from server — check response structure",
        );
      }

      // ═══════════════════════════════════════════════════════════════
      //  2. UPLOAD EDUCATION RECORDS
      // ═══════════════════════════════════════════════════════════════
      let educationCount = 0;
      const educationErrors = [];

      for (const edu of education) {
        if (!edu.institution || !edu.qualification) continue;

        try {
          await apiClient.post(`/employees/${employeeId}/education`, edu);
          educationCount++;
        } catch (eduErr) {
          const errMsg = eduErr?.response?.data?.message || eduErr.message;
          educationErrors.push(`${edu.institution}: ${errMsg}`);
          console.error("❌ [EmployeeCreate] Education upload failed:", errMsg);
        }
      }

      if (educationErrors.length > 0) {
        console.warn("⚠️ [EmployeeCreate] Education errors:", educationErrors);
      }
      console.log("✅ [EmployeeCreate] Education uploaded:", educationCount);

      // ═══════════════════════════════════════════════════════════════
      //  3. UPLOAD WORK EXPERIENCE
      // ═══════════════════════════════════════════════════════════════
      let workCount = 0;
      const workErrors = [];

      for (const work of externalWork) {
        if (!work.companyName || !work.fromDate) continue;

        try {
          await apiClient.post(`/employees/${employeeId}/external-work`, work);
          workCount++;
        } catch (workErr) {
          const errMsg = workErr?.response?.data?.message || workErr.message;
          workErrors.push(`${work.companyName}: ${errMsg}`);
          console.error(
            "❌ [EmployeeCreate] Work experience upload failed:",
            errMsg,
          );
        }
      }

      if (workErrors.length > 0) {
        console.warn("⚠️ [EmployeeCreate] Work experience errors:", workErrors);
      }
      console.log("✅ [EmployeeCreate] Work experience uploaded:", workCount);

      // ═══════════════════════════════════════════════════════════════
      //  4. UPLOAD EMERGENCY CONTACTS
      // ═══════════════════════════════════════════════════════════════
      let contactCount = 0;
      const contactErrors = [];

      for (const contact of emergencyContacts) {
        if (!contact.fullName || !contact.relationship || !contact.phone)
          continue;

        try {
          await apiClient.post(
            `/employees/${employeeId}/emergency-contacts`,
            contact,
          );
          contactCount++;
        } catch (contactErr) {
          const errMsg =
            contactErr?.response?.data?.message || contactErr.message;
          contactErrors.push(`${contact.fullName}: ${errMsg}`);
          console.error(
            "❌ [EmployeeCreate] Emergency contact upload failed:",
            errMsg,
          );
        }
      }

      if (contactErrors.length > 0) {
        console.warn(
          "⚠️ [EmployeeCreate] Emergency contact errors:",
          contactErrors,
        );
      }
      console.log(
        "✅ [EmployeeCreate] Emergency contacts uploaded:",
        contactCount,
      );

      // 5. UPLOAD DOCUMENT ATTACHMENTS
      let uploadedDocs = 0;
      const documentErrors = [];

      for (const doc of documents) {
        if (!doc.file || !doc.documentTypeId) {
          console.warn("⚠️ Skipping document — missing file or type:", doc);
          continue;
        }

        try {
          const formData = new FormData();

          // ✅ TEXT FIELDS FIRST (multer's destination function needs these)
          formData.append("documentTypeId", doc.documentTypeId);
          formData.append("voucherType", "Employee");
          formData.append("voucherNo", employeeNumber);
          if (doc.title) formData.append("title", doc.title);
          if (doc.documentNumber)
            formData.append("documentNumber", doc.documentNumber);
          if (doc.issueDate) formData.append("issueDate", doc.issueDate);
          if (doc.expiryDate) formData.append("expiryDate", doc.expiryDate);
          if (doc.notes) formData.append("notes", doc.notes);

          // ✅ FILE LAST
          formData.append("file", doc.file);

          console.log("📄 Uploading document:", {
            fileName: doc.file.name,
            fileSize: doc.file.size,
            documentTypeId: doc.documentTypeId,
            voucherType: "Employee",
            voucherNo: employeeNumber,
          });

          // ✅ DO NOT set Content-Type header — let axios handle it
          const docRes = await apiClient.post("/documents", formData);

          console.log("✅ Document uploaded:", docRes.data);
          uploadedDocs++;
        } catch (docErr) {
          const errMsg = docErr?.response?.data?.message || docErr.message;
          documentErrors.push(`${doc.title || doc.file.name}: ${errMsg}`);
          console.error("❌ Document upload failed:", {
            fileName: doc.file?.name,
            error: errMsg,
            status: docErr?.response?.status,
            data: docErr?.response?.data,
          });
        }
      }
      // ═══════════════════════════════════════════════════════════════
      //  6. SHOW RESULT & NAVIGATE
      // ═══════════════════════════════════════════════════════════════
      const totalErrors = [
        ...educationErrors,
        ...workErrors,
        ...contactErrors,
        ...documentErrors,
      ];

      if (totalErrors.length > 0) {
        console.warn(
          "⚠️ [EmployeeCreate] Some items failed to upload:",
          totalErrors,
        );

        if (uploadedDocs === 0 && documents.length > 0) {
          toast.warning(
            `Employee created but all ${documents.length} document(s) failed. You can attach them from the employee profile.`,
          );
        } else if (totalErrors.length > 0) {
          toast.success(
            `Employee created with ${educationCount} education, ${workCount} work exp., ${contactCount} contacts & ${uploadedDocs} documents. ${totalErrors.length} item(s) failed.`,
          );
        }
      } else {
        toast.success(
          `Employee created successfully with all details — pending GM approval`,
        );
      }

      console.log(
        "🧭 [EmployeeCreate] Navigating to:",
        `/hr/employees/${employeeId}`,
      );

      // Small delay to ensure backend has finished processing
      setTimeout(() => {
        navigate(`/hr/employees/${employeeId}`);
      }, 500);
    } catch (err) {
      console.error("❌ [EmployeeCreate] Fatal error:", {
        message: err.message,
        response: err?.response?.data,
        status: err?.response?.status,
        stack: err.stack,
      });

      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err.message ||
          "Failed to create employee",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Education CRUD ─────────────────────────────────────────────────────────
  const addEducation = () =>
    setEducation([
      ...education,
      {
        level: "",
        qualification: "",
        institution: "",
        majorOrField: "",
        fromDate: "",
        toDate: "",
        grade: "",
        certificateUrl: "",
      },
    ]);
  const updateEducation = (idx, field, value) => {
    const u = [...education];
    u[idx] = { ...u[idx], [field]: value };
    setEducation(u);
  };
  const removeEducation = (idx) =>
    setEducation(education.filter((_, i) => i !== idx));

  // ── Work Experience CRUD ───────────────────────────────────────────────────
  const addExternalWork = () =>
    setExternalWork([
      ...externalWork,
      {
        companyName: "",
        designation: "",
        department: "",
        employmentType: "",
        fromDate: "",
        toDate: "",
        exitReason: "",
        country: "",
        city: "",
      },
    ]);
  const updateExternalWork = (idx, field, value) => {
    const u = [...externalWork];
    u[idx] = { ...u[idx], [field]: value };
    setExternalWork(u);
  };
  const removeExternalWork = (idx) =>
    setExternalWork(externalWork.filter((_, i) => i !== idx));

  // ── Emergency Contact CRUD ─────────────────────────────────────────────────
  const addEmergencyContact = () =>
    setEmergencyContacts([
      ...emergencyContacts,
      {
        fullName: "",
        relationship: "",
        phone: "",
        alternatePhone: "",
        personalEmail: "",
      },
    ]);
  const updateEmergencyContact = (idx, field, value) => {
    const u = [...emergencyContacts];
    u[idx] = { ...u[idx], [field]: value };
    setEmergencyContacts(u);
  };
  const removeEmergencyContact = (idx) =>
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== idx));

  if (!canCreate) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Shield className="w-12 h-12 opacity-20 mb-4" />
        <p className="text-sm font-medium text-gray-500">
          You don't have permission to create employees.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="New Employee"
        subtitle="Create a comprehensive employee record with all supporting details"
        icon={<UserPlus className="w-5 h-5" />}
        actions={
          <button
            onClick={onCancel || (() => navigate("/hr/employees/list"))}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        }
      />

      {loadingOpts ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading options...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ═══════════════════════════════════════════════════════════════════════════
              BASIC INFORMATION
          ═══════════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Basic Information
                  </h3>
                  <p className="text-xs text-gray-500">
                    Core employee identity, organization, and contact details
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Identity */}
            <SectionHeader
              title="Personal Identity"
              icon={<Users className="w-4 h-4" />}
              collapsed={!showIdentity}
              onToggle={() => setShowIdentity((v) => !v)}
            />
            {showIdentity && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-b border-gray-50">
                <InputField
                  label="First Name"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  error={errors.firstName}
                  placeholder="e.g. Kedir"
                />
                <InputField
                  label="Middle Name"
                  name="middleName"
                  required
                  error={errors.middleName}
                  value={form.middleName}
                  onChange={handleChange}
                  placeholder="e.g. Abebe"
                />
                <InputField
                  label="Last Name"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  error={errors.lastName}
                  placeholder="e.g. Seid"
                />
                <SelectField
                  label="Salutation"
                  name="salutation"
                  value={form.salutation}
                  onChange={handleChange}
                  options={[
                    { id: "Mr", name: "Mr" },
                    { id: "Mrs", name: "Mrs" },
                    { id: "Ms", name: "Ms" },
                    { id: "Dr", name: "Dr" },
                    { id: "Prof", name: "Prof" },
                  ]}
                />
                <SelectField
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  options={[
                    { id: "Male", name: "Male" },
                    { id: "Female", name: "Female" },
                    { id: "Non-binary", name: "Non-binary" },
                  ]}
                />
                <SelectField
                  label="Marital Status"
                  name="maritalStatus"
                  value={form.maritalStatus}
                  onChange={handleChange}
                  options={[
                    { id: "Single", name: "Single" },
                    { id: "Married", name: "Married" },
                    { id: "Divorced", name: "Divorced" },
                    { id: "Widowed", name: "Widowed" },
                  ]}
                />
                <InputField
                  label="National ID Number"
                  name="nationalIdNumber"
                  value={form.nationalIdNumber}
                  onChange={handleChange}
                  placeholder="Government-issued ID"
                />
                <InputField
                  label="Nationality"
                  name="nationality"
                  value={form.nationality}
                  onChange={handleChange}
                  placeholder="e.g. Ethiopian"
                />
                <InputField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  placeholder="YYYY-MM-DD"
                />
              </div>
            )}

            {/* Organization Assignment - Enhanced Version */}
            <SectionHeader
              title="Organization Assignment"
              icon={<Building2 className="w-4 h-4" />}
              collapsed={!showOrg}
              onToggle={() => setShowOrg((v) => !v)}
            />
            {showOrg && (
              <div className="p-5 space-y-6 border-b border-gray-50">
                {/* Company and Branch Assignment Section */}
                <div className="bg-gray-50/50 rounded-lg ">
                  <h4 className="text-xs font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" />
                    Location Assignment
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SelectField
                      label="Company"
                      name="companyId"
                      value={form.companyId}
                      onChange={handleChange}
                      options={companies}
                      required
                      error={errors.companyId}
                    />

                    <SelectField
                      label="Work Location Type"
                      name="branchType"
                      value={form.branchType}
                      onChange={(e) => {
                        handleChange(e);
                        if (e.target.value !== "branch") {
                          setForm((prev) => ({ ...prev, branchId: "" }));
                        }
                      }}
                      options={[
                        { id: "head_office", name: " Head Office" },
                        { id: "branch", name: " Branch Office" },
                        { id: "remote", name: " Remote / Work from Home" },
                      ]}
                      placeholder="Select work location type"
                    />

                    {form.branchType === "branch" && (
                      <SelectField
                        label="Select Branch"
                        name="branchId"
                        value={form.branchId}
                        onChange={handleChange}
                        options={filteredBranches}
                        placeholder="Choose branch"
                        required
                      />
                    )}
                  </div>

                  {/* Status messages */}
                  {form.branchType === "head_office" && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                      <Check className="w-3.5 h-3.5" />
                      Assigned to Corporate Head Office
                    </div>
                  )}

                  {form.branchType === "remote" && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                      <Check className="w-3.5 h-3.5" />
                      Remote employee - no branch assignment needed
                    </div>
                  )}
                </div>

                {/* Organizational Hierarchy Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <SelectField
                    label="Department"
                    name="departmentId"
                    value={form.departmentId}
                    onChange={handleChange}
                    options={filteredDepartments}
                    placeholder="Optional"
                  />

                  <SelectField
                    label="Designation"
                    name="designationId"
                    value={form.designationId}
                    onChange={handleChange}
                    options={designations}
                    placeholder="Optional"
                  />

                  <SelectField
                    label="Employment Type"
                    name="employmentTypeId"
                    value={form.employmentTypeId}
                    onChange={handleChange}
                    options={employmentTypes}
                    placeholder="Optional"
                  />

                  <SelectField
                    label="Employee Grade"
                    name="employeeGradeId"
                    value={form.employeeGradeId}
                    onChange={handleChange}
                    options={employeeGrades}
                    placeholder="Optional"
                  />

                  <SelectField
                    label="Reports To"
                    name="reportsToId"
                    value={form.reportsToId}
                    onChange={handleChange}
                    options={managers.map((m) => ({
                      id: m.id,
                      name: `${m.firstName} ${m.lastName} (${m.employeeNumber || ""})`,
                    }))}
                    placeholder="Optional"
                  />
                </div>
              </div>
            )}
            {/* Employment Details */}
            <SectionHeader
              title="Employment Details"
              icon={<Calendar className="w-4 h-4" />}
              collapsed={!showEmployment}
              onToggle={() => setShowEmployment((v) => !v)}
            />
            {showEmployment && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-50">
                <InputField
                  label="Date of Joining"
                  name="dateOfJoining"
                  type="date"
                  value={form.dateOfJoining}
                  onChange={handleChange}
                  required
                  error={errors.dateOfJoining}
                />
                <InputField
                  label="Gross Salary (ETB)"
                  name="salary"
                  type="number"
                  value={form.salary}
                  onChange={handleChange}
                  placeholder="Monthly salary in ETB"
                  required
                  error={errors.salary}
                />
                <InputField
                  label="Contract End Date"
                  name="contractEndDate"
                  type="date"
                  value={form.contractEndDate}
                  onChange={handleChange}
                  placeholder="For fixed-term contracts"
                />
                <InputField
                  label="Portfolio URL"
                  name="portfolioUrl"
                  value={form.portfolioUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/..."
                />
                <InputField
                  label="GitHub URL"
                  name="githubUrl"
                  value={form.githubUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/..."
                />
              </div>
            )}

            {/* Contact Information */}
            <SectionHeader
              title="Contact Information"
              icon={<Mail className="w-4 h-4" />}
              collapsed={!showContact}
              onToggle={() => setShowContact((v) => !v)}
            />
            {showContact && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-50">
                <InputField
                  label="Work Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="work@company.com"
                  comment="working email — typically mirrors User.email"
                />

                <InputField
                  label="Personal Email"
                  name="personalEmail"
                  type="email"
                  value={form.personalEmail}
                  onChange={handleChange}
                  placeholder="personal@email.com"
                  comment="alternative personal email for emergency contact"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="needWorkEmail"
                    id="needWorkEmail"
                    checked={form.needWorkEmail}
                    onChange={(e) => {
                      console.log("Checkbox changed to:", e.target.checked); // Debug log
                      setForm((prev) => ({
                        ...prev,
                        needWorkEmail: e.target.checked,
                      }));
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="needWorkEmail"
                    className="text-xs font-medium text-gray-600"
                  >
                    Need Work Email Assigned by IT
                  </label>
                </div>
                <div className="text-xs text-gray-400 -mt-1 mb-2 col-span-2">
                  Set by approver — if checked, employee needs work email
                  assigned by IT before login
                </div>

                <InputField
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="Primary phone number"
                />

                <InputField
                  label="Alternative Phone Number"
                  name="alternativePhoneNumber"
                  type="tel"
                  value={form.alternativePhoneNumber}
                  onChange={handleChange}
                  placeholder="Secondary phone number for emergency"
                />
              </div>
            )}

            {/* Address */}
            <SectionHeader
              title="Address"
              icon={<MapPin className="w-4 h-4" />}
              collapsed={!showAddress}
              onToggle={() => setShowAddress((v) => !v)}
            />
            {showAddress && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 border-b border-gray-50">
                <InputField
                  label="Country"
                  name="Country"
                  value={form.Country}
                  onChange={handleChange}
                  placeholder="e.g. Ethiopia"
                />
                <InputField
                  label="Region/State"
                  name="Region"
                  value={form.Region}
                  onChange={handleChange}
                  placeholder="e.g. Addis Ababa"
                />
                <InputField
                  label="Zone"
                  name="zone"
                  value={form.zone}
                  onChange={handleChange}
                  placeholder="e.g. Kirkos"
                />
                <InputField
                  label="City/Woreda"
                  name="City"
                  value={form.City}
                  onChange={handleChange}
                  placeholder="e.g. Addis Ababa"
                />
                <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-xs text-gray-400 -mt-2">
                  <MapPin className="w-3 h-3 inline-block mr-1" />
                  Complete address helps with emergency contact and document
                  delivery
                </div>
              </div>
            )}

            {/* Bank & Payment */}
            <SectionHeader
              title="Bank & Payment"
              icon={<CreditCard className="w-4 h-4" />}
              collapsed={!showBank}
              onToggle={() => setShowBank((v) => !v)}
            />
            {showBank && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" />
                      Bank Account Information
                    </h4>
                  </div>

                  <InputField
                    label="Bank Name"
                    name="bankName"
                    value={form.bankName}
                    onChange={handleChange}
                    placeholder="e.g. Commercial Bank of Ethiopia"
                  />

                  <InputField
                    label="Bank Account Number"
                    name="bankAccountNumber"
                    value={form.bankAccountNumber}
                    onChange={handleChange}
                    placeholder="Enter account number"
                  />

                  <InputField
                    label="TIN Number (Tax ID)"
                    name="tinNumber"
                    value={form.tinNumber}
                    onChange={handleChange}
                    placeholder="e.g. 0012345678"
                  />

                  {/* <InputField
                    label="Gross Salary"
                    name="salary"
                    type="number"
                    step="0.01"
                    value={form.salary}
                    onChange={handleChange}
                    placeholder="Monthly gross salary in ETB"
                    required
                    error={errors.salary}
                  /> */}
                </div>

                <div className="text-xs text-gray-400 flex items-center gap-2 mt-2">
                  <CreditCard className="w-3 h-3" />
                  Current gross salary for payroll processing
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════════
              DOCUMENT ATTACHMENTS (NEW)
          ═══════════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Document Attachments
                  </h3>
                  <p className="text-xs text-gray-500">
                    Upload scanned copies of ID, certificates, CV, and other
                    required documents
                  </p>
                </div>
              </div>
            </div>

            <SectionHeader
              title="Attached Documents"
              icon={<File className="w-4 h-4" />}
              collapsed={!showDocuments}
              onToggle={() => setShowDocuments((v) => !v)}
              count={documents.length}
            />

            {showDocuments && (
              <div className="p-5">
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No documents attached yet.
                    <br />
                    <span className="text-xs">
                      Upload scanned ID, certificates, CV, and other supporting
                      documents.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4 mb-4">
                    {documents.map((doc, idx) => (
                      <div
                        key={doc.tempId}
                        className="relative border border-gray-200 rounded-lg p-4"
                      >
                        <button
                          type="button"
                          onClick={() => removeDocument(idx)}
                          className="absolute top-3 right-3 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Document Type */}
                          <SelectField
                            label="Document Type"
                            value={doc.documentTypeId}
                            onChange={(e) =>
                              updateDocument(
                                idx,
                                "documentTypeId",
                                e.target.value,
                              )
                            }
                            options={documentTypes}
                            placeholder="Select type..."
                          />

                          {/* File Upload */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              File
                            </label>
                            {doc.file ? (
                              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                <File className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span className="text-sm text-green-700 truncate flex-1">
                                  {doc.file.name}
                                </span>
                                <span className="text-xs text-green-500">
                                  {formatFileSize(doc.file.size)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDocument(idx, "file", null)
                                  }
                                  className="text-green-400 hover:text-green-600"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-sm text-gray-400 hover:text-indigo-600">
                                <Upload className="w-4 h-4" />
                                Choose file
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleFileSelect(idx, e)}
                                />
                              </label>
                            )}
                          </div>

                          {/* Title */}
                          <InputField
                            label="Title"
                            value={doc.title}
                            onChange={(e) =>
                              updateDocument(idx, "title", e.target.value)
                            }
                            placeholder="Display name (defaults to filename)"
                          />

                          {/* Document Number */}
                          <InputField
                            label="Document Number"
                            value={doc.documentNumber}
                            onChange={(e) =>
                              updateDocument(
                                idx,
                                "documentNumber",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. PASS-2024-001234"
                          />

                          {/* Issue Date */}
                          <InputField
                            label="Issue Date"
                            type="date"
                            value={doc.issueDate}
                            onChange={(e) =>
                              updateDocument(idx, "issueDate", e.target.value)
                            }
                          />

                          {/* Expiry Date */}
                          <InputField
                            label="Expiry Date"
                            type="date"
                            value={doc.expiryDate}
                            onChange={(e) =>
                              updateDocument(idx, "expiryDate", e.target.value)
                            }
                          />

                          {/* Notes */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Notes
                            </label>
                            <textarea
                              value={doc.notes}
                              onChange={(e) =>
                                updateDocument(idx, "notes", e.target.value)
                              }
                              placeholder="Any additional notes..."
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-400 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addDocument}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Attach document
                </button>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════════
              EDUCATION
          ═══════════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-violet-100 text-violet-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Education
                  </h3>
                  <p className="text-xs text-gray-500">
                    Academic qualifications and professional certifications
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              {education.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                  No education records added yet.
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  {education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="relative border border-gray-200 rounded-lg p-4"
                    >
                      <button
                        type="button"
                        onClick={() => removeEducation(idx)}
                        className="absolute top-3 right-3 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SelectField
                          label="Level"
                          value={edu.level}
                          onChange={(e) =>
                            updateEducation(idx, "level", e.target.value)
                          }
                          options={[
                            { id: "Primary", name: "Primary" },
                            { id: "Secondary", name: "Secondary" },
                            { id: "Certificate", name: "Certificate" },
                            { id: "Diploma", name: "Diploma" },
                            { id: "Bachelor", name: "Bachelor" },
                            { id: "Master", name: "Master" },
                            { id: "Doctorate", name: "Doctorate" },
                            { id: "Professional", name: "Professional" },
                          ]}
                        />
                        <InputField
                          label="Qualification"
                          value={edu.qualification}
                          onChange={(e) =>
                            updateEducation(
                              idx,
                              "qualification",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. BSc Computer Science"
                        />
                        <InputField
                          label="Institution"
                          value={edu.institution}
                          onChange={(e) =>
                            updateEducation(idx, "institution", e.target.value)
                          }
                          placeholder="University name"
                        />
                        <InputField
                          label="Major / Field"
                          value={edu.majorOrField}
                          onChange={(e) =>
                            updateEducation(idx, "majorOrField", e.target.value)
                          }
                          placeholder="e.g. Software Engineering"
                        />
                        <InputField
                          label="From Date"
                          type="date"
                          value={edu.fromDate}
                          onChange={(e) =>
                            updateEducation(idx, "fromDate", e.target.value)
                          }
                        />
                        <InputField
                          label="To Date"
                          type="date"
                          value={edu.toDate}
                          onChange={(e) =>
                            updateEducation(idx, "toDate", e.target.value)
                          }
                        />
                        <InputField
                          label="Grade"
                          value={edu.grade}
                          onChange={(e) =>
                            updateEducation(idx, "grade", e.target.value)
                          }
                          placeholder="e.g. 3.8 GPA"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={addEducation}
                className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add education
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════════
              WORK EXPERIENCE
          ═══════════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Work Experience
                  </h3>
                  <p className="text-xs text-gray-500">
                    Previous employment history from other organizations
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              {externalWork.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                  No work experience records added yet.
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  {externalWork.map((work, idx) => (
                    <div
                      key={idx}
                      className="relative border border-gray-200 rounded-lg p-4"
                    >
                      <button
                        type="button"
                        onClick={() => removeExternalWork(idx)}
                        className="absolute top-3 right-3 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InputField
                          label="Company Name"
                          value={work.companyName}
                          onChange={(e) =>
                            updateExternalWork(
                              idx,
                              "companyName",
                              e.target.value,
                            )
                          }
                          placeholder="Previous employer"
                        />
                        <InputField
                          label="Designation"
                          value={work.designation}
                          onChange={(e) =>
                            updateExternalWork(
                              idx,
                              "designation",
                              e.target.value,
                            )
                          }
                          placeholder="Job title"
                        />
                        <SelectField
                          label="Employment Type"
                          value={work.employmentType}
                          onChange={(e) =>
                            updateExternalWork(
                              idx,
                              "employmentType",
                              e.target.value,
                            )
                          }
                          options={[
                            { id: "Full-time", name: "Full-time" },
                            { id: "Part-time", name: "Part-time" },
                            { id: "Contract", name: "Contract" },
                            { id: "Internship", name: "Internship" },
                            { id: "Freelance", name: "Freelance" },
                          ]}
                        />
                        <InputField
                          label="From Date"
                          type="date"
                          value={work.fromDate}
                          onChange={(e) =>
                            updateExternalWork(idx, "fromDate", e.target.value)
                          }
                        />
                        <InputField
                          label="To Date"
                          type="date"
                          value={work.toDate}
                          onChange={(e) =>
                            updateExternalWork(idx, "toDate", e.target.value)
                          }
                        />
                        <InputField
                          label="Country"
                          value={work.country}
                          onChange={(e) =>
                            updateExternalWork(idx, "country", e.target.value)
                          }
                        />
                        <InputField
                          label="City"
                          value={work.city}
                          onChange={(e) =>
                            updateExternalWork(idx, "city", e.target.value)
                          }
                        />
                        <InputField
                          label="Exit Reason"
                          value={work.exitReason}
                          onChange={(e) =>
                            updateExternalWork(
                              idx,
                              "exitReason",
                              e.target.value,
                            )
                          }
                          placeholder="Reason for leaving"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={addExternalWork}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add work experience
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════════
              EMERGENCY CONTACTS
          ═══════════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Emergency Contacts
                  </h3>
                  <p className="text-xs text-gray-500">
                    People to notify in case of emergency
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              {emergencyContacts.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                  No emergency contacts added yet.
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  {emergencyContacts.map((contact, idx) => (
                    <div
                      key={idx}
                      className="relative border border-gray-200 rounded-lg p-4"
                    >
                      <button
                        type="button"
                        onClick={() => removeEmergencyContact(idx)}
                        className="absolute top-3 right-3 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InputField
                          label="Full Name"
                          value={contact.fullName}
                          onChange={(e) =>
                            updateEmergencyContact(
                              idx,
                              "fullName",
                              e.target.value,
                            )
                          }
                          placeholder="Contact full name"
                        />
                        <SelectField
                          label="Relationship"
                          value={contact.relationship}
                          onChange={(e) =>
                            updateEmergencyContact(
                              idx,
                              "relationship",
                              e.target.value,
                            )
                          }
                          options={[
                            { id: "Spouse", name: "Spouse" },
                            { id: "Parent", name: "Parent" },
                            { id: "Sibling", name: "Sibling" },
                            { id: "Child", name: "Child" },
                            { id: "Friend", name: "Friend" },
                            { id: "Guardian", name: "Guardian" },
                          ]}
                        />
                        <InputField
                          label="Phone"
                          value={contact.phone}
                          onChange={(e) =>
                            updateEmergencyContact(idx, "phone", e.target.value)
                          }
                          placeholder="Primary phone"
                        />
                        <InputField
                          label="Alternate Phone"
                          value={contact.alternatePhone}
                          onChange={(e) =>
                            updateEmergencyContact(
                              idx,
                              "alternatePhone",
                              e.target.value,
                            )
                          }
                          placeholder="Secondary phone"
                        />
                        <InputField
                          label="Personal Email"
                          type="email"
                          value={contact.personalEmail}
                          onChange={(e) =>
                            updateEmergencyContact(
                              idx,
                              "personalEmail",
                              e.target.value,
                            )
                          }
                          placeholder="Contact personalEmail"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={addEmergencyContact}
                className="flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add emergency contact
              </button>
            </div>
          </div>

          {/* ── Submit ────────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel || (() => navigate("/hr/employees/list"))}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Creating..." : "Create Employee"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
