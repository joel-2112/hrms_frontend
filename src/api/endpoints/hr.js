import {request} from '../axiosConfig';

export const hrApi = {
  // Companies
  getAllCompanies: (params) => request("get", "/organizations/companies", params),
  createCompany: (data) => request("post", "/organizations/companies", data),
  updateCompany: (id, data) => request("put", `/organizations/companies/${id}`, data),
  getCompanyById: (id) => request("get", `/organizations/companies/${id}`),
  deleteCompany: (id) => request("delete", `/organizations/companies/${id}`),

  // Branches
  getAllBranches: (params) => request("get", "/organizations/branches", params),
  createBranch: (data) => request("post", "/organizations/branches", data),
  updateBranch: (id, data) => request("put", `/organizations/branches/${id}`, data),
  getBranchById: (id) => request("get", `/organizations/branches/${id}`),
  deleteBranch: (id) => request("delete", `/organizations/branches/${id}`),

  // Departments
  getAllDepartments: (params) => request("get", "/organizations/departments", params),
  createDepartment: (data) => request("post", "/organizations/departments", data),
  updateDepartment: (id, data) => request("patch", `/organizations/departments/${id}`, data),
  getDepartmentById: (id) => request("get", `/organizations/departments/${id}`),
  deleteDepartment: (id) => request("delete", `/organizations/departments/${id}`),

  // Designations
  getAllDesignations: (params) => request("get", "/organizations/designations", params),
  createDesignation: (data) => request("post", "/organizations/designations", data),
  updateDesignation: (id, data) => request("patch", `/organizations/designations/${id}`, data),
  getDesignationById: (id) => request("get", `/organizations/designations/${id}`),
  deleteDesignation: (id) => request("delete", `/organizations/designations/${id}`),

  // Employment Types
  getAllEmploymentTypes: (params) => request("get", "/organizations/employment-types", params),
  createEmploymentType: (data) => request("post", "/organizations/employment-types", data),
  updateEmploymentType: (id, data) => request("patch", `/organizations/employment-types/${id}`, data),
  getEmploymentTypeById: (id) => request("get", `/organizations/employment-types/${id}`),
  deleteEmploymentType: (id) => request("delete", `/organizations/employment-types/${id}`),

  // Employee Grades
  getAllEmployeeGrades: (params) => request("get", "/organizations/employee-grades", params),
  createEmployeeGrade: (data) => request("post", "/organizations/employee-grades", data),
  updateEmployeeGrade: (id, data) => request("patch", `/organizations/employee-grades/${id}`, data),
  getEmployeeGradeById: (id) => request("get", `/organizations/employee-grades/${id}`),
  deleteEmployeeGrade: (id) => request("delete", `/organizations/employee-grades/${id}`),

  // Document Explorer
  getDocumentExplorer: () => request("get", "/documents/explorer"),
  getDirectoryContents: (path) => request("get", `/documents/explorer/directory?path=${path}`),

  // Document Types
  getDocumentTypes: () => request("get", "/documents/types"),

};



