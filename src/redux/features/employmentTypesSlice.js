import { createSlice } from '@reduxjs/toolkit';

const employmentTypesSlice = createSlice({
  name: 'employmentTypes',
  initialState: {
    items: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    fetchEmploymentTypesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchEmploymentTypesSuccess: (state, action) => {
      const payload = action.payload;
      const types =
        payload?.data?.data ||
        payload?.data?.employmentTypes ||
        payload?.employmentTypes ||
        payload?.data ||
        (Array.isArray(payload) ? payload : []);
      state.items = Array.isArray(types) ? types : [];
      state.loading = false;
      state.error = null;
    },
    employmentTypesFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    createEmploymentTypeRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    createEmploymentTypeSuccess: (state, action) => {
      const type = action.payload?.data || action.payload?.employmentType || action.payload;
      state.items = Array.isArray(state.items) ? [type, ...state.items] : [type];
      state.saving = false;
    },
    updateEmploymentTypeRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    updateEmploymentTypeSuccess: (state, action) => {
      const type = action.payload?.data || action.payload?.employmentType || action.payload;
      if (Array.isArray(state.items)) {
        const idx = state.items.findIndex((t) => t?.id === type?.id);
        if (idx !== -1) {
          state.items[idx] = type;
        }
      }
      state.saving = false;
    },
    deleteEmploymentTypeRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    deleteEmploymentTypeSuccess: (state, action) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
      state.saving = false;
    },
    clearEmploymentTypes: (state) => {
      state.items = [];
      state.loading = false;
      state.saving = false;
      state.error = null;
    },
  },
});

export const {
  fetchEmploymentTypesRequest,
  fetchEmploymentTypesSuccess,
  employmentTypesFailure,
  createEmploymentTypeRequest,
  createEmploymentTypeSuccess,
  updateEmploymentTypeRequest,
  updateEmploymentTypeSuccess,
  deleteEmploymentTypeRequest,
  deleteEmploymentTypeSuccess,
  clearEmploymentTypes,
} = employmentTypesSlice.actions;

export default employmentTypesSlice.reducer;
