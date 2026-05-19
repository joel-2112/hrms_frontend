import { createSlice } from '@reduxjs/toolkit';

const departmentsSlice = createSlice({
  name: 'departments',
  initialState: {
    items: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    fetchDepartmentsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchDepartmentsSuccess: (state, action) => {
      const payload = action.payload;
      const departments =
        payload?.data?.data ||
        payload?.data?.departments ||
        payload?.departments ||
        payload?.data ||
        (Array.isArray(payload) ? payload : []);
      state.items = Array.isArray(departments) ? departments : [];
      state.loading = false;
    },
    departmentsFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    createDepartmentRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    createDepartmentSuccess: (state, action) => {
      const department = action.payload?.department || action.payload?.data || action.payload;
      state.items = Array.isArray(state.items) ? [department, ...state.items] : [department];
      state.saving = false;
    },
    updateDepartmentRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    updateDepartmentSuccess: (state, action) => {
      const department = action.payload?.department || action.payload?.data || action.payload;
      if (Array.isArray(state.items)) {
        const index = state.items.findIndex((dept) => dept?.id === department?.id);
        if (index !== -1) state.items[index] = department;
      }
      state.saving = false;
    },
    deleteDepartmentRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteDepartmentSuccess: (state, action) => {
      state.items = state.items.filter((dept) => dept.id !== action.payload);
      state.loading = false;
    },
  },
});

export const {
  fetchDepartmentsRequest,
  fetchDepartmentsSuccess,
  departmentsFailure,
  createDepartmentRequest,
  createDepartmentSuccess,
  updateDepartmentRequest,
  updateDepartmentSuccess,
  deleteDepartmentRequest,
  deleteDepartmentSuccess,
} = departmentsSlice.actions;

export default departmentsSlice.reducer;

