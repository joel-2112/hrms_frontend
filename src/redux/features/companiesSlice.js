import { createSlice } from "@reduxjs/toolkit";

const companiesSlice = createSlice({
  name: "companies",
  initialState: {
    items: [],
    loading: false,
    error: null,
    saving: false,
    meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
  },
  reducers: {
    // Saga triggers
    fetchCompaniesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    createCompanyRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    updateCompanyRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    deleteCompanyRequest: (state) => {
      state.saving = true;
      state.error = null;
    },

    // Success handlers
    fetchCompaniesSuccess: (state, action) => {
      const payload = action.payload;
      const companies = payload?.data?.companies || payload?.companies || payload || [];
      state.items = Array.isArray(companies) ? companies : [];
      state.meta = payload?.meta || payload?.data?.meta || state.meta;
      state.loading = false;
      state.error = null;
    },
    createCompanySuccess: (state, action) => {
      const company = action.payload?.company || action.payload;
      state.items = [company, ...state.items];
      state.saving = false;
      state.error = null;
    },
    updateCompanySuccess: (state, action) => {
      const company = action.payload?.company || action.payload;
      const idx = state.items.findIndex((c) => c.id === company.id);
      if (idx !== -1) {
        state.items[idx] = company;
      }
      state.saving = false;
      state.error = null;
    },
    deleteCompanySuccess: (state, action) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
      state.saving = false;
      state.error = null;
    },

    // Failure handler
    companiesFailure: (state, action) => {
      state.loading = false;
      state.saving = false;
      state.error = action.payload;
    },

    // Clear state
    clearCompanies: (state) => {
      state.items = [];
      state.loading = false;
      state.saving = false;
      state.error = null;
      state.meta = { total: 0, page: 1, limit: 10, totalPages: 0 };
    },
  },
});

export const {
  fetchCompaniesRequest,
  createCompanyRequest,
  updateCompanyRequest,
  deleteCompanyRequest,
  fetchCompaniesSuccess,
  createCompanySuccess,
  updateCompanySuccess,
  deleteCompanySuccess,
  companiesFailure,
  clearCompanies,
} = companiesSlice.actions;

export default companiesSlice.reducer;

