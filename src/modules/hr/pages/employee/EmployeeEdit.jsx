import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";
import { apiClient } from "../../../../api/axiosConfig";
import {
  ArrowLeft, User, Building2, Briefcase, GraduationCap,
  Phone, MapPin, CreditCard, AlertTriangle, Save, X, Pencil, ExternalLink,
  Loader2, Edit3, Calendar, Mail, Plus, ChevronDown, ChevronUp,
  Building, Landmark, HeartPulse, Upload, File, Trash2, Eye, FileText, Image,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (val, fallback = "—") =>
  val === null || val === undefined || val === "" ? fallback : String(val);

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const formatFileSize = (kb) => {
  if (!kb) return "0 KB";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const initials = (e) => `${e?.firstName?.[0] ?? ""}${e?.lastName?.[0] ?? ""}`.toUpperCase() || "?";

const avatarGradient = (name = "") => {
  const colors = [
    ["#1e3a5f", "#2e75b6"], ["#064e3b", "#059669"], ["#3b0764", "#7c3aed"],
    ["#7c2d12", "#ea580c"], ["#1e1b4b", "#4f46e5"], ["#134e4a", "#0d9488"],
  ];
  return colors[(name.charCodeAt(0) || 0) % colors.length];
};

const fullName = (e) => [e.firstName, e.middleName, e.lastName].filter(Boolean).join(" ");

const extractData = (res) =>
  res?.data?.data?.data || res?.data?.data || res?.data || {};

const extractArray = (res) => {
  const data = res?.data?.data?.data || res?.data?.data || res?.data || [];
  return Array.isArray(data) ? data : [];
};

const API_BASE = import.meta.env.VITE_API_URL;

const isImage = (mimeType) => mimeType && mimeType.startsWith('image/');

// ─── Edit Section Header ─────────────────────────────────────────────────────

function EditSectionHeader({ title, icon: Icon, accent = "#222222", collapsed, onToggle, editing, onEditToggle, saving }) {
  return (
    <div className={`w-full flex items-center justify-between px-5 py-4 border-b border-neutral-100 text-left transition-all duration-200 ${
      !collapsed ? "border-l-4 border-l-[#222222] pl-4 bg-neutral-50/30" : "pl-5"
    }`}>
      <button onClick={onToggle} className="flex items-center gap-3 flex-1 text-left hover:opacity-90">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#222222] text-[#89E900] shadow-sm">
          <Icon className="w-4 h-4" />
        </span>
        <h3 className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
          !collapsed ? "text-neutral-900 font-extrabold" : "text-neutral-600"
        }`}>{title}</h3>
      </button>
      <div className="flex items-center gap-2">
        {!editing ? (
          <button onClick={onEditToggle} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-colors shadow-sm">
            <Edit3 className="w-3 h-3 text-[#222222]" /> Edit
          </button>
        ) : (
          <button onClick={onEditToggle} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-[#222222] hover:bg-neutral-800 disabled:opacity-50 transition-colors border border-neutral-800 focus:ring-2 focus:ring-[#89E900]/40 shadow-sm">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 text-[#89E900]" />}
            {saving ? "Saving…" : "Save"}
          </button>
        )}
        <span className={`transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}>
          <ChevronDown className="w-4 h-4 text-neutral-400" />
        </span>
      </div>
    </div>
  );
}

// ─── Field components ────────────────────────────────────────────────────────

function InputField({ label, name, value, onChange, type = "text", placeholder, disabled }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">{label}</label>
      <input type={type} name={name} value={value ?? ""} onChange={onChange} placeholder={placeholder} disabled={disabled}
        className={`w-full px-3.5 py-2 text-sm border rounded-lg bg-white outline-none transition-all duration-200 ${
          disabled 
            ? "bg-neutral-50 text-neutral-400 border-neutral-100 cursor-not-allowed" 
            : "text-neutral-900 border-neutral-200 hover:border-neutral-300 focus:border-[#222222] focus:ring-2 focus:ring-[#89E900]/30"
        }`} />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, placeholder, disabled }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">{label}</label>
      <select name={name} value={value ?? ""} onChange={onChange} disabled={disabled}
        className={`w-full px-3.5 py-2 text-sm border rounded-lg bg-white outline-none transition-all duration-200 ${
          disabled 
            ? "bg-neutral-50 text-neutral-400 border-neutral-100 cursor-not-allowed" 
            : "text-neutral-900 border-neutral-200 hover:border-neutral-300 focus:border-[#222222] focus:ring-2 focus:ring-[#89E900]/30"
        }`}>
        <option value="">{placeholder || "Select"}</option>
        {options.map((opt) => (<option key={opt.id} value={opt.id}>{opt.name || opt.label}</option>))}
      </select>
    </div>
  );
}

function DisplayField({ label, value, mono = false, link = null }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 mb-1">{label}</dt>
      <dd className={`text-sm font-semibold text-neutral-800 leading-snug break-words ${
        mono ? "font-mono text-xs bg-neutral-50 border border-neutral-200 rounded-md px-2 py-1 inline-block text-neutral-700" : ""
      }`}>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-neutral-850 hover:text-black border-b border-transparent hover:border-[#89E900] transition-all">
            {value}
            <ExternalLink className="w-3 h-3 opacity-60 text-neutral-500" />
          </a>
        ) : fmt(value)}
      </dd>
    </div>
  );
}

function Grid({ children, cols = 2 }) {
  const cls = cols === 2 ? "grid-cols-1 sm:grid-cols-2" : cols === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  return <dl className={`grid ${cls} gap-x-6 gap-y-5`}>{children}</dl>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite } = usePermission("Employee");
  const docPerms = usePermission("Document");

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({});

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [employeeGrades, setEmployeeGrades] = useState([]);
  const [managers, setManagers] = useState([]);

  // Document state
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [newDocument, setNewDocument] = useState(null);

  const [showIdentity, setShowIdentity] = useState(true);
  const [showOrg, setShowOrg] = useState(true);
  const [showEmployment, setShowEmployment] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showDocuments, setShowDocuments] = useState(true);
  const [showEducation, setShowEducation] = useState(false);
  const [showWorkExp, setShowWorkExp] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const [editing, setEditing] = useState({
    identity: false, org: false, employment: false,
    contact: false, address: false, bank: false,
  });
  const [form, setForm] = useState({});
  const [education, setEducation] = useState([]);
  const [externalWork, setExternalWork] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [
        empRes, compRes, branchRes, deptRes, desigRes,
        empTypeRes, gradeRes, managerRes, docTypeRes,
      ] = await Promise.all([
        apiClient.get(`/employees/${id}`),
        apiClient.get("/organizations/companies?limit=100"),
        apiClient.get("/organizations/branches?limit=200"),
        apiClient.get("/organizations/departments?limit=200"),
        apiClient.get("/organizations/designations?limit=300"),
        apiClient.get("/organizations/employment-types?limit=50"),
        apiClient.get("/organizations/employee-grades?limit=50"),
        apiClient.get("/employees?limit=200"),
        apiClient.get("/documents/types"),
      ]);

      const emp = extractData(empRes);
      setEmployee(emp);
      setForm({
        firstName: emp.firstName || "", middleName: emp.middleName || "", lastName: emp.lastName || "",
        salutation: emp.salutation || "", gender: emp.gender || "", maritalStatus: emp.maritalStatus || "",
        nationalIdNumber: emp.nationalIdNumber || "", companyId: emp.companyId || "", branchId: emp.branchId || "",
        departmentId: emp.departmentId || "", designationId: emp.designationId || "",
        employmentTypeId: emp.employmentTypeId || "", employeeGradeId: emp.employeeGradeId || "",
        reportsToId: emp.reportsToId || "", dateOfJoining: emp.dateOfJoining || "",
        contractEndDate: emp.contractEndDate || "", portfolioUrl: emp.portfolioUrl || "",
        githubUrl: emp.githubUrl || "", email: emp.email || "", phoneNumber: emp.phoneNumber || "",
        City: emp.City || "", Region: emp.Region || "", zone: emp.zone || "", Country: emp.Country || "",
        currentPostalCode: emp.currentPostalCode || "", bankName: emp.bankName || "",
        bankAccountNumber: emp.bankAccountNumber || "", mobileMoneyNumber: emp.mobileMoneyNumber || "",
        paymentMethod: emp.paymentMethod || "Bank Transfer",
      });
      setEducation(emp.educationHistory || []);
      setExternalWork(emp.externalWorkHistory || []);
      setEmergencyContacts(emp.emergencyContacts || []);
      setCompanies(extractArray(compRes));
      setBranches(extractArray(branchRes));
      setDepartments(extractArray(deptRes));
      setDesignations(extractArray(desigRes));
      setEmploymentTypes(extractArray(empTypeRes));
      setEmployeeGrades(extractArray(gradeRes));
      setManagers(extractArray(managerRes));
      setDocumentTypes(extractArray(docTypeRes));

      // ✅ Fetch documents using employeeNumber
      const employeeNumber = emp?.employeeNumber;
      if (employeeNumber) {
        const docsRes = await apiClient
          .get(`/documents/owner/Employee/${employeeNumber}`)
          .catch(() => ({ data: { data: {} } }));
        
        // Flatten grouped documents
        const data = docsRes?.data?.data?.data || docsRes?.data?.data || docsRes?.data || {};
        const flatDocs = Array.isArray(data) ? data : Object.values(data).flat();
        setDocuments(flatDocs);
      }
    } catch {
      setError("Failed to load employee data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleChange = (e) => { const { name, value } = e.target; setForm((p) => ({ ...p, [name]: value })); };

  const handleSaveSection = async (section) => {
    setSaving((p) => ({ ...p, [section]: true }));
    try {
      const fields = {
        identity: ["firstName","middleName","lastName","salutation","gender","maritalStatus","nationalIdNumber"],
        org: ["companyId","branchId","departmentId","designationId","employmentTypeId","employeeGradeId","reportsToId"],
        employment: ["dateOfJoining","contractEndDate","portfolioUrl","githubUrl"],
        contact: ["email","phoneNumber"],
        address: ["City","Region","zone","Country","currentPostalCode"],
        bank: ["bankName","bankAccountNumber","mobileMoneyNumber","paymentMethod"],
      };
      const payload = {};
      fields[section].forEach((f) => { if (form[f] !== undefined && form[f] !== "") payload[f] = form[f]; });
      await apiClient.patch(`/employees/${id}`, payload);
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} updated`);
      setEditing((p) => ({ ...p, [section]: false }));
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update");
    } finally {
      setSaving((p) => ({ ...p, [section]: false }));
    }
  };

  const handleSaveSubRecord = async (type, recordId, data) => {
    try {
      await apiClient.patch(`/employees/${id}/${type}/${recordId}`, data);
      toast.success("Updated");
      fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
  };

  const handleDeleteSubRecord = async (type, recordId) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiClient.delete(`/employees/${id}/${type}/${recordId}`);
      toast.success("Deleted");
      fetchAll();
    } catch (err) { toast.error("Failed to delete"); }
  };

  // ── Document handlers ──────────────────────────────────────────────────────
  const handleUploadDocument = async () => {
    if (!newDocument?.file || !newDocument?.documentTypeId) {
      toast.error("Please select a document type and file");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("documentTypeId", newDocument.documentTypeId);
      formData.append("voucherType", "Employee");
      formData.append("voucherNo", employee.employeeNumber || id);
      if (newDocument.title) formData.append("title", newDocument.title);
      if (newDocument.documentNumber) formData.append("documentNumber", newDocument.documentNumber);
      if (newDocument.issueDate) formData.append("issueDate", newDocument.issueDate);
      if (newDocument.expiryDate) formData.append("expiryDate", newDocument.expiryDate);
      if (newDocument.notes) formData.append("notes", newDocument.notes);
      formData.append("file", newDocument.file);

      await apiClient.post("/documents", formData);
      toast.success("Document uploaded");
      setNewDocument(null);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm("Delete this document?")) return;
    try {
      await apiClient.delete(`/documents/${documentId}`);
      toast.success("Document deleted");
      fetchAll();
    } catch (err) { toast.error("Failed to delete document"); }
  };

  const startNewDocument = () => {
    setNewDocument({
      documentTypeId: "", file: null, title: "",
      documentNumber: "", issueDate: "", expiryDate: "", notes: "",
    });
    setShowDocuments(true);
  };

  // ── Sub-record CRUD helpers ───────────────────────────────────────────────
  const addEducation = () => setEducation([...education, { level: "", qualification: "", institution: "", majorOrField: "", fromDate: "", toDate: "", grade: "" }]);
  const updateEducation = (idx, field, value) => { const u = [...education]; u[idx] = { ...u[idx], [field]: value }; setEducation(u); };
  const removeEducation = (idx) => setEducation(education.filter((_, i) => i !== idx));

  const addExternalWork = () => setExternalWork([...externalWork, { companyName: "", designation: "", employmentType: "", fromDate: "", toDate: "", country: "", city: "", exitReason: "" }]);
  const updateExternalWork = (idx, field, value) => { const u = [...externalWork]; u[idx] = { ...u[idx], [field]: value }; setExternalWork(u); };
  const removeExternalWork = (idx) => setExternalWork(externalWork.filter((_, i) => i !== idx));

  const addEmergencyContact = () => setEmergencyContacts([...emergencyContacts, { fullName: "", relationship: "", phone: "", alternatePhone: "", email: "" }]);
  const updateEmergencyContact = (idx, field, value) => { const u = [...emergencyContacts]; u[idx] = { ...u[idx], [field]: value }; setEmergencyContacts(u); };
  const removeEmergencyContact = (idx) => setEmergencyContacts(emergencyContacts.filter((_, i) => i !== idx));

  const filteredBranches = form.companyId ? branches.filter((b) => b.companyId === form.companyId) : branches;
  const filteredDepartments = form.companyId ? departments.filter((d) => d.companyId === form.companyId) : departments;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-sm text-slate-400 font-medium">Loading employee profile…</p>
    </div>
  );

  if (error || !employee) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-red-400" /></div>
      <p className="text-base font-bold text-slate-700">Failed to load employee</p>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50"><ArrowLeft className="w-4 h-4" /> Back</button>
    </div>
  );

  const name = fullName(employee);
  const [g1, g2] = avatarGradient(name);

  return (
    <div className="flex flex-col gap-5 pb-12">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors bg-white border border-neutral-250 hover:bg-neutral-50 px-2.5 py-1.5 rounded-lg shadow-sm">
          <ArrowLeft className="w-3.5 h-3.5 text-[#222222]" /> Back
        </button>
        <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">/ Profile Editor</span>
      </div>

      <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-[#222222] text-white shadow-md">
        <div className="p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-[#222222] bg-[#89E900] flex-shrink-0 shadow-sm border border-white/10 select-none">
            {initials(employee)}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none">{name}</h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mt-2 bg-neutral-800/60 px-2.5 py-1 rounded-md border border-neutral-700/30 inline-block">
              {employee.designation?.name || "No Designation"} · {employee.employeeNumber}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* ═══════════════ Identity ═══════════════ */}
        <EditSectionHeader title="Personal Identity" icon={User} accent="#2e75b6" collapsed={!showIdentity} onToggle={() => setShowIdentity(v => !v)}
          editing={editing.identity} onEditToggle={() => editing.identity ? handleSaveSection("identity") : setEditing(p => ({ ...p, identity: true }))} saving={saving.identity} />
        {showIdentity && (
          <div className="p-5 border-b border-slate-50">
            {editing.identity ? (
              <Grid cols={3}>
                <InputField label="First Name" value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} />
                <InputField label="Middle Name" value={form.middleName} onChange={(e) => setForm(p => ({ ...p, middleName: e.target.value }))} />
                <InputField label="Last Name" value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} />
                <SelectField label="Salutation" value={form.salutation} onChange={(e) => setForm(p => ({ ...p, salutation: e.target.value }))}
                  options={[{ id: "Mr", name: "Mr" }, { id: "Mrs", name: "Mrs" }, { id: "Ms", name: "Ms" }, { id: "Dr", name: "Dr" }, { id: "Prof", name: "Prof" }]} />
                <SelectField label="Gender" value={form.gender} onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}
                  options={[{ id: "Male", name: "Male" }, { id: "Female", name: "Female" }, { id: "Non-binary", name: "Non-binary" }]} />
                <SelectField label="Marital Status" value={form.maritalStatus} onChange={(e) => setForm(p => ({ ...p, maritalStatus: e.target.value }))}
                  options={[{ id: "Single", name: "Single" }, { id: "Married", name: "Married" }, { id: "Divorced", name: "Divorced" }, { id: "Widowed", name: "Widowed" }]} />
                <InputField label="National ID Number" value={form.nationalIdNumber} onChange={(e) => setForm(p => ({ ...p, nationalIdNumber: e.target.value }))} />
              </Grid>
            ) : (
              <Grid cols={3}>
                <DisplayField label="First Name" value={employee.firstName} /><DisplayField label="Middle Name" value={employee.middleName} />
                <DisplayField label="Last Name" value={employee.lastName} /><DisplayField label="Salutation" value={employee.salutation} />
                <DisplayField label="Gender" value={employee.gender} /><DisplayField label="Marital Status" value={employee.maritalStatus} />
                <DisplayField label="National ID Number" value={employee.nationalIdNumber} mono />
              </Grid>
            )}
          </div>
        )}

        {/* ═══════════════ Organization ═══════════════ */}
        <EditSectionHeader title="Organization Assignment" icon={Building2} accent="#7c3aed" collapsed={!showOrg} onToggle={() => setShowOrg(v => !v)}
          editing={editing.org} onEditToggle={() => editing.org ? handleSaveSection("org") : setEditing(p => ({ ...p, org: true }))} saving={saving.org} />
        {showOrg && (
          <div className="p-5 border-b border-slate-50">
            {editing.org ? (
              <Grid cols={3}>
                <SelectField label="Company" value={form.companyId} onChange={(e) => setForm(p => ({ ...p, companyId: e.target.value }))} options={companies} />
                <SelectField label="Branch" value={form.branchId} onChange={(e) => setForm(p => ({ ...p, branchId: e.target.value }))} options={filteredBranches} />
                <SelectField label="Department" value={form.departmentId} onChange={(e) => setForm(p => ({ ...p, departmentId: e.target.value }))} options={filteredDepartments} />
                <SelectField label="Designation" value={form.designationId} onChange={(e) => setForm(p => ({ ...p, designationId: e.target.value }))} options={designations} />
                <SelectField label="Employment Type" value={form.employmentTypeId} onChange={(e) => setForm(p => ({ ...p, employmentTypeId: e.target.value }))} options={employmentTypes} />
                <SelectField label="Employee Grade" value={form.employeeGradeId} onChange={(e) => setForm(p => ({ ...p, employeeGradeId: e.target.value }))} options={employeeGrades} />
                <SelectField label="Reports To" value={form.reportsToId} onChange={(e) => setForm(p => ({ ...p, reportsToId: e.target.value }))}
                  options={managers.filter(m => m.id !== id).map(m => ({ id: m.id, name: `${m.firstName} ${m.lastName} (${m.employeeNumber})` }))} />
              </Grid>
            ) : (
              <Grid cols={3}>
                <DisplayField label="Company" value={`${employee.company?.name}${employee.company?.abbr ? ` (${employee.company.abbr})` : ""}`} />
                <DisplayField label="Branch" value={employee.branch?.name} /><DisplayField label="Department" value={employee.department?.name} />
                <DisplayField label="Designation" value={employee.designation?.name} /><DisplayField label="Employment Type" value={employee.employmentType?.name} />
                <DisplayField label="Employee Grade" value={employee.employeeGrade?.name} />
                <DisplayField label="Reports To" value={employee.reportsTo ? `${employee.reportsTo.firstName} ${employee.reportsTo.lastName}` : null} />
              </Grid>
            )}
          </div>
        )}

        {/* ═══════════════ Employment ═══════════════ */}
        <EditSectionHeader title="Employment Details" icon={Calendar} accent="#059669" collapsed={!showEmployment} onToggle={() => setShowEmployment(v => !v)}
          editing={editing.employment} onEditToggle={() => editing.employment ? handleSaveSection("employment") : setEditing(p => ({ ...p, employment: true }))} saving={saving.employment} />
        {showEmployment && (
          <div className="p-5 border-b border-slate-50">
            {editing.employment ? (
              <Grid>
                <InputField label="Date of Joining" type="date" value={form.dateOfJoining} onChange={(e) => setForm(p => ({ ...p, dateOfJoining: e.target.value }))} />
                <InputField label="Contract End Date" type="date" value={form.contractEndDate} onChange={(e) => setForm(p => ({ ...p, contractEndDate: e.target.value }))} />
                <InputField label="Portfolio URL" value={form.portfolioUrl} onChange={(e) => setForm(p => ({ ...p, portfolioUrl: e.target.value }))} />
                <InputField label="GitHub URL" value={form.githubUrl} onChange={(e) => setForm(p => ({ ...p, githubUrl: e.target.value }))} />
              </Grid>
            ) : (
              <Grid>
                <DisplayField label="Employee #" value={employee.employeeNumber} mono />
                <DisplayField label="Date of Joining" value={fmtDate(employee.dateOfJoining)} />
                <DisplayField label="Contract End Date" value={fmtDate(employee.contractEndDate)} />
                <DisplayField label="Portfolio URL" value={employee.portfolioUrl} link={employee.portfolioUrl} />
                <DisplayField label="GitHub URL" value={employee.githubUrl ? employee.githubUrl.replace("https://github.com/", "@") : null} link={employee.githubUrl} />
              </Grid>
            )}
          </div>
        )}

        {/* ═══════════════ Contact ═══════════════ */}
        <EditSectionHeader title="Contact Information" icon={Phone} accent="#e97c0a" collapsed={!showContact} onToggle={() => setShowContact(v => !v)}
          editing={editing.contact} onEditToggle={() => editing.contact ? handleSaveSection("contact") : setEditing(p => ({ ...p, contact: true }))} saving={saving.contact} />
        {showContact && (
          <div className="p-5 border-b border-slate-50">
            {editing.contact ? (
              <Grid><InputField label="Email" type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
                <InputField label="Phone Number" value={form.phoneNumber} onChange={(e) => setForm(p => ({ ...p, phoneNumber: e.target.value }))} /></Grid>
            ) : (
              <Grid><DisplayField label="Email" value={employee.email} link={employee.email ? `mailto:${employee.email}` : null} />
                <DisplayField label="Phone Number" value={employee.phoneNumber} link={employee.phoneNumber ? `tel:${employee.phoneNumber}` : null} /></Grid>
            )}
          </div>
        )}

        {/* ═══════════════ Address ═══════════════ */}
        <EditSectionHeader title="Address" icon={MapPin} accent="#059669" collapsed={!showAddress} onToggle={() => setShowAddress(v => !v)}
          editing={editing.address} onEditToggle={() => editing.address ? handleSaveSection("address") : setEditing(p => ({ ...p, address: true }))} saving={saving.address} />
        {showAddress && (
          <div className="p-5 border-b border-slate-50">
            {editing.address ? (
              <Grid cols={3}><InputField label="City" value={form.City} onChange={(e) => setForm(p => ({ ...p, City: e.target.value }))} />
                <InputField label="Region" value={form.Region} onChange={(e) => setForm(p => ({ ...p, Region: e.target.value }))} />
                <InputField label="Zone" value={form.zone} onChange={(e) => setForm(p => ({ ...p, zone: e.target.value }))} />
                <InputField label="Country" value={form.Country} onChange={(e) => setForm(p => ({ ...p, Country: e.target.value }))} />
                <InputField label="Postal Code" value={form.currentPostalCode} onChange={(e) => setForm(p => ({ ...p, currentPostalCode: e.target.value }))} /></Grid>
            ) : (
              <Grid cols={3}><DisplayField label="City" value={employee.City} /><DisplayField label="Region" value={employee.Region} />
                <DisplayField label="Zone" value={employee.zone} /><DisplayField label="Country" value={employee.Country} />
                <DisplayField label="Postal Code" value={employee.currentPostalCode} /></Grid>
            )}
          </div>
        )}

        {/* ═══════════════ Bank ═══════════════ */}
        <EditSectionHeader title="Bank & Payment" icon={Landmark} accent="#7c3aed" collapsed={!showBank} onToggle={() => setShowBank(v => !v)}
          editing={editing.bank} onEditToggle={() => editing.bank ? handleSaveSection("bank") : setEditing(p => ({ ...p, bank: true }))} saving={saving.bank} />
        {showBank && (
          <div className="p-5 border-b border-slate-50">
            {editing.bank ? (
              <Grid>
                <SelectField label="Payment Method" value={form.paymentMethod} onChange={(e) => setForm(p => ({ ...p, paymentMethod: e.target.value }))}
                  options={[{ id: "Bank Transfer", name: "Bank Transfer" }, { id: "Tele Birr", name: "Tele Birr" }, { id: "Cheque", name: "Cheque" }, { id: "Cash", name: "Cash" }]} />
                <InputField label="Bank Name" value={form.bankName} onChange={(e) => setForm(p => ({ ...p, bankName: e.target.value }))} />
                <InputField label="Bank Account Number" value={form.bankAccountNumber} onChange={(e) => setForm(p => ({ ...p, bankAccountNumber: e.target.value }))} />
                <InputField label="Mobile Money Number" value={form.mobileMoneyNumber} onChange={(e) => setForm(p => ({ ...p, mobileMoneyNumber: e.target.value }))} />
              </Grid>
            ) : (
              <Grid><DisplayField label="Payment Method" value={employee.paymentMethod} /><DisplayField label="Bank Name" value={employee.bankName} />
                <DisplayField label="Bank Account Number" value={employee.bankAccountNumber} mono />
                <DisplayField label="Mobile Money Number" value={employee.mobileMoneyNumber} /></Grid>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            DOCUMENT ATTACHMENTS
        ═══════════════════════════════════════════════════════════════════════ */}
        <div className={`w-full flex items-center justify-between px-5 py-4 border-b border-neutral-100 text-left transition-all duration-200 ${
          !showDocuments ? "pl-5" : "border-l-4 border-l-[#222222] pl-4 bg-neutral-50/30"
        }`}>
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#222222] text-[#89E900] shadow-sm">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
              !showDocuments ? "text-neutral-600" : "text-neutral-900 font-extrabold"
            }`}>Document Attachments</h3>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#89E900]/15 text-[#222222] border border-[#89E900]/30 text-[10px] font-bold">
              {documents.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {docPerms.canCreate && (
              <button type="button" onClick={startNewDocument} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#222222] bg-[#89E900]/10 hover:bg-[#89E900]/20 rounded-lg transition-colors border border-[#89E900]/30 shadow-sm">
                <Upload className="w-3 h-3 text-[#222222]" /> Upload
              </button>
            )}
            <button type="button" onClick={() => setShowDocuments(v => !v)}>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showDocuments ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {showDocuments && (
          <div className="p-5 border-b border-slate-50">
            {/* New document upload form */}
            {newDocument && (
              <div className="mb-4 p-4 border-2 border-dashed border-neutral-250 rounded-lg bg-neutral-50/40 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <SelectField label="Document Type" value={newDocument.documentTypeId}
                    onChange={(e) => setNewDocument(p => ({ ...p, documentTypeId: e.target.value }))}
                    options={documentTypes} placeholder="Select type..." />
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5 flex items-center gap-0.5">File</label>
                    {newDocument.file ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <File className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                        <span className="text-sm text-neutral-700 truncate flex-1">{newDocument.file.name}</span>
                        <span className="text-xs text-neutral-500">{formatFileSize(newDocument.file.size / 1024)}</span>
                        <button type="button" onClick={() => setNewDocument(p => ({ ...p, file: null }))} className="text-neutral-450 hover:text-neutral-700"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-neutral-200 rounded-lg cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-200 text-sm text-neutral-450 hover:text-neutral-900 font-medium">
                        <Upload className="w-4 h-4" /> Choose file
                        <input type="file" className="hidden" onChange={(e) => setNewDocument(p => ({ ...p, file: e.target.files[0], title: p.title || e.target.files[0]?.name?.replace(/\.[^/.]+$/, "") || "" }))} />
                      </label>
                    )}
                  </div>
                  <InputField label="Title" value={newDocument.title} onChange={(e) => setNewDocument(p => ({ ...p, title: e.target.value }))} placeholder="Display name" />
                  <InputField label="Document Number" value={newDocument.documentNumber} onChange={(e) => setNewDocument(p => ({ ...p, documentNumber: e.target.value }))} placeholder="e.g. PASS-2024-001" />
                  <InputField label="Issue Date" type="date" value={newDocument.issueDate} onChange={(e) => setNewDocument(p => ({ ...p, issueDate: e.target.value }))} />
                  <InputField label="Expiry Date" type="date" value={newDocument.expiryDate} onChange={(e) => setNewDocument(p => ({ ...p, expiryDate: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
                  <button type="button" onClick={handleUploadDocument}
                    className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#222222] hover:bg-neutral-800 rounded-lg transition-all duration-200 border border-neutral-800 focus:ring-2 focus:ring-[#89E900]/30 shadow-sm">
                    Upload Document
                  </button>
                  <button type="button" onClick={() => setNewDocument(null)}
                    className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Existing documents list */}
            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50/50 hover:border-neutral-350 transition-all duration-200">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                       <a
                         href={`${API_BASE}/documents/${doc.id}/file`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 hover:bg-[#89E900]/20 transition-all duration-200 border border-neutral-200"
                       >
                         {isImage(doc.mimeType) ? (
                           <img src={`${API_BASE}/documents/${doc.id}/file`} alt={doc.title} className="w-full h-full object-cover rounded-lg" />
                         ) : (
                           <File className="w-4 h-4 text-neutral-500" />
                         )}
                       </a>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{doc.title || doc.fileName || "Untitled"}</p>
                        <p className="text-xs text-slate-400">
                          {doc.documentType?.name || "Document"} · {formatFileSize(doc.fileSizeKb)}
                          {doc.documentNumber && ` · ${doc.documentNumber}`}
                          {doc.expiryDate && ` · Expires: ${fmtDate(doc.expiryDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a href={`${API_BASE}/documents/${doc.id}/file`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-[#89E900]/10 text-neutral-400 hover:text-[#222222] transition-colors" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <a href={`${API_BASE}/documents/${doc.id}/file`} download={doc.fileName}
                        className="p-1.5 rounded hover:bg-[#89E900]/10 text-neutral-400 hover:text-[#222222] transition-colors" title="Download">
                        <FileText className="w-3.5 h-3.5" />
                      </a>
                      {docPerms.canDelete && (
                        <button type="button" onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No documents attached.</p>
            )}
          </div>
          
        )}

               {/* ═══════════════ Education ═══════════════ */}
        <div className={`w-full flex items-center justify-between px-5 py-4 border-b border-neutral-100 text-left transition-all duration-200 ${
          !showEducation ? "pl-5" : "border-l-4 border-l-[#222222] pl-4 bg-neutral-50/30"
        }`}>
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#222222] text-[#89E900] shadow-sm">
              <GraduationCap className="w-4 h-4" />
            </span>
            <h3 className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
              !showEducation ? "text-neutral-600" : "text-neutral-900 font-extrabold"
            }`}>Education</h3>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#89E900]/15 text-[#222222] border border-[#89E900]/30 text-[10px] font-bold">
              {education.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={addEducation}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-colors shadow-sm">
              <Plus className="w-3 h-3 text-[#222222]" /> Add
            </button>
            <button type="button" onClick={() => setShowEducation(v => !v)}>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showEducation ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
        {showEducation && (
          <div className="p-5 border-b border-slate-50">
            {education.length > 0 ? (
              <div className="space-y-3">
                {education.map((edu, idx) => {
                  const isNew = !edu.id;
                  const updateEdu = (f, v) => { const u = [...education]; u[idx] = { ...u[idx], [f]: v }; setEducation(u); };
                  return (
                    <div key={edu.id || `new-edu-${idx}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 border border-slate-200 rounded-lg">
                      <SelectField label="Level" value={edu.level || ""} onChange={(e) => updateEdu("level", e.target.value)}
                        options={[
                          { id: "Primary", name: "Primary" }, { id: "Secondary", name: "Secondary" },
                          { id: "Certificate", name: "Certificate" }, { id: "Diploma", name: "Diploma" },
                          { id: "Bachelor", name: "Bachelor" }, { id: "Postgraduate Diploma", name: "Postgrad Diploma" },
                          { id: "Master", name: "Master" }, { id: "Doctorate", name: "Doctorate" },
                          { id: "Professional", name: "Professional" },
                        ]} />
                      <InputField label="Qualification" value={edu.qualification || ""} onChange={(e) => updateEdu("qualification", e.target.value)} placeholder="e.g. BSc Computer Science" />
                      <InputField label="Institution" value={edu.institution || ""} onChange={(e) => updateEdu("institution", e.target.value)} placeholder="University name" />
                      <InputField label="Major / Field" value={edu.majorOrField || ""} onChange={(e) => updateEdu("majorOrField", e.target.value)} placeholder="e.g. Software Engineering" />
                      <InputField label="From" type="date" value={edu.fromDate || ""} onChange={(e) => updateEdu("fromDate", e.target.value)} />
                      <InputField label="To" type="date" value={edu.toDate || ""} onChange={(e) => updateEdu("toDate", e.target.value)} />
                      <InputField label="Grade" value={edu.grade || ""} onChange={(e) => updateEdu("grade", e.target.value)} placeholder="e.g. 3.8 GPA" />
                      <div className="flex items-end gap-2">
                        {isNew ? (
                          <button type="button" onClick={async () => {
                            try {
                              await apiClient.post(`/employees/${id}/education`, {
                                level: edu.level, qualification: edu.qualification, institution: edu.institution,
                                majorOrField: edu.majorOrField, fromDate: edu.fromDate, toDate: edu.toDate, grade: edu.grade,
                              });
                              toast.success("Education added");
                              fetchAll();
                            } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
                          }} className="text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-black border-b-2 border-transparent hover:border-[#89E900] transition-all">Save</button>
                        ) : (
                          <button type="button" onClick={() => handleSaveSubRecord("education", edu.id, {
                            level: edu.level, qualification: edu.qualification, institution: edu.institution,
                            majorOrField: edu.majorOrField, fromDate: edu.fromDate, toDate: edu.toDate, grade: edu.grade,
                          })} className="text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-black border-b-2 border-transparent hover:border-[#89E900] transition-all">Update</button>
                        )}
                        <button type="button" onClick={() => {
                          if (isNew) setEducation(prev => prev.filter((_, i) => i !== idx));
                          else handleDeleteSubRecord("education", edu.id);
                        }} className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-700 transition-all ml-auto">{isNew ? "Cancel" : "Remove"}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No education records.</p>
            )}
          </div>
        )}

        {/* ═══════════════ Work Experience ═══════════════ */}
        <div className={`w-full flex items-center justify-between px-5 py-4 border-b border-neutral-100 text-left transition-all duration-200 ${
          !showWorkExp ? "pl-5" : "border-l-4 border-l-[#222222] pl-4 bg-neutral-50/30"
        }`}>
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#222222] text-[#89E900] shadow-sm">
              <Briefcase className="w-4 h-4" />
            </span>
            <h3 className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
              !showWorkExp ? "text-neutral-600" : "text-neutral-900 font-extrabold"
            }`}>Work Experience</h3>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#89E900]/15 text-[#222222] border border-[#89E900]/30 text-[10px] font-bold">
              {externalWork.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={addExternalWork}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-colors shadow-sm">
              <Plus className="w-3 h-3 text-[#222222]" /> Add
            </button>
            <button type="button" onClick={() => setShowWorkExp(v => !v)}>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showWorkExp ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
        {showWorkExp && (
          <div className="p-5 border-b border-slate-50">
            {externalWork.length > 0 ? (
              <div className="space-y-3">
                {externalWork.map((work, idx) => {
                  const isNew = !work.id;
                  const updateWork = (f, v) => { const u = [...externalWork]; u[idx] = { ...u[idx], [f]: v }; setExternalWork(u); };
                  return (
                    <div key={work.id || `new-work-${idx}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 border border-slate-200 rounded-lg">
                      <InputField label="Company Name" value={work.companyName || ""} onChange={(e) => updateWork("companyName", e.target.value)} placeholder="Previous employer" />
                      <InputField label="Designation" value={work.designation || ""} onChange={(e) => updateWork("designation", e.target.value)} placeholder="Job title" />
                      <SelectField label="Employment Type" value={work.employmentType || ""} onChange={(e) => updateWork("employmentType", e.target.value)}
                        options={[
                          { id: "Full-time", name: "Full-time" }, { id: "Part-time", name: "Part-time" },
                          { id: "Contract", name: "Contract" }, { id: "Internship", name: "Internship" },
                          { id: "Freelance", name: "Freelance" }, { id: "Other", name: "Other" },
                        ]} />
                      <InputField label="From" type="date" value={work.fromDate || ""} onChange={(e) => updateWork("fromDate", e.target.value)} />
                      <InputField label="To" type="date" value={work.toDate || ""} onChange={(e) => updateWork("toDate", e.target.value)} />
                      <InputField label="Country" value={work.country || ""} onChange={(e) => updateWork("country", e.target.value)} />
                      <InputField label="City" value={work.city || ""} onChange={(e) => updateWork("city", e.target.value)} />
                      <InputField label="Exit Reason" value={work.exitReason || ""} onChange={(e) => updateWork("exitReason", e.target.value)} placeholder="Reason for leaving" />
                      <div className="flex items-end gap-2">
                        {isNew ? (
                          <button type="button" onClick={async () => {
                            try {
                              await apiClient.post(`/employees/${id}/external-work`, {
                                companyName: work.companyName, designation: work.designation,
                                employmentType: work.employmentType, fromDate: work.fromDate,
                                toDate: work.toDate, country: work.country, city: work.city, exitReason: work.exitReason,
                              });
                              toast.success("Work experience added");
                              fetchAll();
                            } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
                          }} className="text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-black border-b-2 border-transparent hover:border-[#89E900] transition-all">Save</button>
                        ) : (
                          <button type="button" onClick={() => handleSaveSubRecord("external-work", work.id, {
                            companyName: work.companyName, designation: work.designation,
                            employmentType: work.employmentType, fromDate: work.fromDate,
                            toDate: work.toDate, country: work.country, city: work.city, exitReason: work.exitReason,
                          })} className="text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-black border-b-2 border-transparent hover:border-[#89E900] transition-all">Update</button>
                        )}
                        <button type="button" onClick={() => {
                          if (isNew) setExternalWork(prev => prev.filter((_, i) => i !== idx));
                          else handleDeleteSubRecord("external-work", work.id);
                        }} className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-700 transition-all ml-auto">{isNew ? "Cancel" : "Remove"}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No work experience records.</p>
            )}
          </div>
        )}

        {/* ═══════════════ Emergency Contacts ═══════════════ */}
        <div className={`w-full flex items-center justify-between px-5 py-4 border-b border-neutral-100 text-left transition-all duration-200 ${
          !showEmergency ? "pl-5" : "border-l-4 border-l-[#222222] pl-4 bg-neutral-50/30"
        }`}>
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#222222] text-[#89E900] shadow-sm">
              <HeartPulse className="w-4 h-4" />
            </span>
            <h3 className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
              !showEmergency ? "text-neutral-600" : "text-neutral-900 font-extrabold"
            }`}>Emergency Contacts</h3>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#89E900]/15 text-[#222222] border border-[#89E900]/30 text-[10px] font-bold">
              {emergencyContacts.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={addEmergencyContact}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-colors shadow-sm">
              <Plus className="w-3 h-3 text-[#222222]" /> Add
            </button>
            <button type="button" onClick={() => setShowEmergency(v => !v)}>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showEmergency ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
        {showEmergency && (
          <div className="p-5">
            {emergencyContacts.length > 0 ? (
              <div className="space-y-3">
                {emergencyContacts.map((contact, idx) => {
                  const isNew = !contact.id;
                  const updateContact = (f, v) => { const u = [...emergencyContacts]; u[idx] = { ...u[idx], [f]: v }; setEmergencyContacts(u); };
                  return (
                    <div key={contact.id || `new-contact-${idx}`} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border border-slate-200 rounded-lg">
                      <InputField label="Full Name" value={contact.fullName || ""} onChange={(e) => updateContact("fullName", e.target.value)} placeholder="Contact full name" />
                      <SelectField label="Relationship" value={contact.relationship || ""} onChange={(e) => updateContact("relationship", e.target.value)}
                        options={[
                          { id: "Spouse", name: "Spouse" }, { id: "Parent", name: "Parent" },
                          { id: "Sibling", name: "Sibling" }, { id: "Child", name: "Child" },
                          { id: "Friend", name: "Friend" }, { id: "Guardian", name: "Guardian" },
                          { id: "Other", name: "Other" },
                        ]} />
                      <InputField label="Phone" value={contact.phone || ""} onChange={(e) => updateContact("phone", e.target.value)} placeholder="Primary phone" />
                      <InputField label="Alternate Phone" value={contact.alternatePhone || ""} onChange={(e) => updateContact("alternatePhone", e.target.value)} placeholder="Secondary phone" />
                      <InputField label="Email" type="email" value={contact.email || ""} onChange={(e) => updateContact("email", e.target.value)} placeholder="Contact email" />
                      <div className="flex items-end gap-2">
                        {isNew ? (
                          <button type="button" onClick={async () => {
                            try {
                              await apiClient.post(`/employees/${id}/emergency-contacts`, {
                                fullName: contact.fullName, relationship: contact.relationship,
                                phone: contact.phone, alternatePhone: contact.alternatePhone, email: contact.email,
                              });
                              toast.success("Contact added");
                              fetchAll();
                            } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
                          }} className="text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-black border-b-2 border-transparent hover:border-[#89E900] transition-all">Save</button>
                        ) : (
                          <button type="button" onClick={() => handleSaveSubRecord("emergency-contacts", contact.id, {
                            fullName: contact.fullName, relationship: contact.relationship,
                            phone: contact.phone, alternatePhone: contact.alternatePhone, email: contact.email,
                          })} className="text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-black border-b-2 border-transparent hover:border-[#89E900] transition-all">Update</button>
                        )}
                        <button type="button" onClick={() => {
                          if (isNew) setEmergencyContacts(prev => prev.filter((_, i) => i !== idx));
                          else handleDeleteSubRecord("emergency-contacts", contact.id);
                        }} className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-700 transition-all ml-auto">{isNew ? "Cancel" : "Remove"}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No emergency contacts.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}