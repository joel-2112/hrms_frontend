import { createSlice } from "@reduxjs/toolkit";

const designationsSlice = createSlice({
  name: "designations",
  initialState: {
    items: [],
    loading: false,
    error: null,
    saving: false,
    meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
  },
  reducers: {
    // Saga triggers
    fetchDesignationsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    createDesignationRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    updateDesignationRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    deleteDesignationRequest: (state) => {
      state.saving = true;
      state.error = null;
    },

    // Success handlers
    fetchDesignationsSuccess: (state, action) => {
      const payload = action.payload;
      const designations = payload?.data?.designations || payload?.designations || [];
      state.items = Array.isArray(designations) ? designations : [];
      state.meta = payload?.meta || payload?.data?.meta || state.meta;
      state.loading = false;
      state.error = null;
    },
    createDesignationSuccess: (state, action) => {
      const designation = action.payload?.data?.designation || action.payload?.designation || action.payload;
      state.items = [designation, ...state.items];
      state.saving = false;
      state.error = null;
    },
    updateDesignationSuccess: (state, action) => {
      const designation = action.payload?.data?.designation || action.payload?.designation || action.payload;
      const idx = state.items.findIndex((d) => d.id === designation.id);
      if (idx !== -1) {
        state.items[idx] = designation;
      }
      state.saving = false;
      state.error = null;
    },
    deleteDesignationSuccess: (state, action) => {
      state.items = state.items.filter((d) => d.id !== action.payload);
      state.saving = false;
      state.error = null;
    },

    // Failure handler
    designationsFailure: (state, action) => {
      state.loading = false;
      state.saving = false;
      state.error = action.payload;
    },

    // Clear state
    clearDesignations: (state) => {
      state.items = [];
      state.loading = false;
      state.saving = false;
      state.error = null;
      state.meta = { total: 0, page: 1, limit: 10, totalPages: 0 };
    },
  },
});

export const {
  fetchDesignationsRequest,
  createDesignationRequest,
  updateDesignationRequest,
  deleteDesignationRequest,
  fetchDesignationsSuccess,
  createDesignationSuccess,
  updateDesignationSuccess,
  deleteDesignationSuccess,
  designationsFailure,
  clearDesignations,
} = designationsSlice.actions;

export default designationsSlice.reducer;
