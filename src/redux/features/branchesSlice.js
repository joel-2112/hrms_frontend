import { createSlice } from "@reduxjs/toolkit";

const branchesSlice = createSlice({
  name: "branches",
  initialState: {
    items: [],
    loading: false,
    error: null,
    saving: false,
    meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
  },
  reducers: {
    // Saga triggers
    fetchBranchesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    createBranchRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    updateBranchRequest: (state) => {
      state.saving = true;
      state.error = null;
    },
    deleteBranchRequest: (state) => {
      state.saving = true;
      state.error = null;
    },

    // Success handlers
    fetchBranchesSuccess: (state, action) => {
      const payload = action.payload;
      const branches = payload?.data?.branches || payload?.branches || [];
      state.items = Array.isArray(branches) ? branches : [];
      state.meta = payload?.meta || payload?.data?.meta || state.meta;
      state.loading = false;
      state.error = null;
    },
    createBranchSuccess: (state, action) => {
      const branch = action.payload?.data?.branch || action.payload?.branch || action.payload;
      state.items = [branch, ...state.items];
      state.saving = false;
      state.error = null;
    },
    updateBranchSuccess: (state, action) => {
      const branch = action.payload?.data?.branch || action.payload?.branch || action.payload;
      const idx = state.items.findIndex((b) => b.id === branch.id);
      if (idx !== -1) {
        state.items[idx] = branch;
      }
      state.saving = false;
      state.error = null;
    },

    deleteBranchSuccess: (state, action) => {
      state.items = state.items.filter((b) => b.id !== action.payload);
      state.saving = false;
      state.error = null;
    },

    // Failure handler
    branchesFailure: (state, action) => {
      state.loading = false;
      state.saving = false;
      state.error = action.payload;
    },

    // Clear state
    clearBranches: (state) => {
      state.items = [];
      state.loading = false;
      state.saving = false;
      state.error = null;
      state.meta = { total: 0, page: 1, limit: 10, totalPages: 0 };
    },
  },
});

export const {
  fetchBranchesRequest,
  createBranchRequest,
  updateBranchRequest,
  deleteBranchRequest,
  fetchBranchesSuccess,
  createBranchSuccess,
  updateBranchSuccess,
  deleteBranchSuccess,
  branchesFailure,
  clearBranches,
} = branchesSlice.actions;

export default branchesSlice.reducer;

