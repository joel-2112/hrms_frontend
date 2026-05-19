import { createSlice } from '@reduxjs/toolkit';

const employeeGradesSlice = createSlice({
  name: 'employeeGrades',
  initialState: {
    items: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    fetchEmployeeGradesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchEmployeeGradesSuccess: (state, action) => {
      const payload = action.payload;
      const grades =
        payload?.data?.data ||
        payload?.data?.grades ||
        payload?.grades ||
        payload?.data ||
        (Array.isArray(payload) ? payload : []);
      state.items = Array.isArray(grades) ? grades : [];
      state.loading = false;
      state.error = null;
    },
    employeeGradesFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    createEmployeeGradeRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    createEmployeeGradeSuccess: (state, action) => {
      const grade = action.payload?.data || action.payload?.grade || action.payload;
      state.items = Array.isArray(state.items) ? [grade, ...state.items] : [grade];
      state.saving = false;
    },
    updateEmployeeGradeRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    updateEmployeeGradeSuccess: (state, action) => {
      const grade = action.payload?.data || action.payload?.grade || action.payload;
      if (Array.isArray(state.items)) {
        const idx = state.items.findIndex((g) => g?.id === grade?.id);
        if (idx !== -1) {
          state.items[idx] = grade;
        }
      }
      state.saving = false;
    },
    deleteEmployeeGradeRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    deleteEmployeeGradeSuccess: (state, action) => {
      state.items = state.items.filter((g) => g.id !== action.payload);
      state.saving = false;
    },
    clearEmployeeGrades: (state) => {
      state.items = [];
      state.loading = false;
      state.saving = false;
      state.error = null;
    },
  },
});

export const {
  fetchEmployeeGradesRequest,
  fetchEmployeeGradesSuccess,
  employeeGradesFailure,
  createEmployeeGradeRequest,
  createEmployeeGradeSuccess,
  updateEmployeeGradeRequest,
  updateEmployeeGradeSuccess,
  deleteEmployeeGradeRequest,
  deleteEmployeeGradeSuccess,
  clearEmployeeGrades,
} = employeeGradesSlice.actions;

export default employeeGradesSlice.reducer;
