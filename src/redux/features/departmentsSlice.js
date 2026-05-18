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
      state.items = action.payload.data.departments;
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
      state.items = [action.payload.department, ...state.items];
      state.saving = false;
    },
    updateDepartmentRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    updateDepartmentSuccess: (state, action) => {
      const index = state.items.findIndex((dept) => dept.id === action.payload.department.id);
      if (index !== -1) state.items[index] = action.payload.department;
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

