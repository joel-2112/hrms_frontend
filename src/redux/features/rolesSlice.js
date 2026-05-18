import { createSlice } from "@reduxjs/toolkit";

const rolesSlice = createSlice({
  name: "roles",
  initialState: {
    items: [],
    loading: false,
    error: null,
    saving: false,
    meta: { total: 0, page: 1, limit: 5, totalPages: 0 },
  },
  reducers: {
    // Saga triggers
    fetchRolesRequest: (state, action) => {
      state.loading = true;
      state.error = null;
    },
    createRoleRequest: (state, action) => {
      state.saving = true;
      state.error = null;
    },
    updateRoleRequest: (state, action) => {
      state.saving = true;
      state.error = null;
    },
    deleteRoleRequest: (state, action) => {
      state.saving = true;
      state.error = null;
    },

    // Success handlers
    fetchRolesSuccess: (state, action) => {
      state.items = action.payload.data || [];
      state.meta = action.payload.meta || state.meta;
      state.loading = false;
      state.error = null;
    },
    createRoleSuccess: (state, action) => {
      state.items = [action.payload, ...state.items];
      state.saving = false;
      state.error = null;
    },
    updateRoleSuccess: (state, action) => {
      const idx = state.items.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
      state.saving = false;
      state.error = null;
    },
    deleteRoleSuccess: (state, action) => {
      state.items = state.items.filter((r) => r.id !== action.payload);
      state.saving = false;
      state.error = null;
    },

    // Failure handler
    rolesFailure: (state, action) => {
      state.loading = false;
      state.saving = false;
      state.error = action.payload;
    },

    // Clear state
    clearRoles: (state) => {
      state.items = [];
      state.loading = false;
      state.saving = false;
      state.error = null;
      state.meta = { total: 0, page: 1, limit: 5, totalPages: 0 };
    },
  },
});

export const {
  fetchRolesRequest,
  createRoleRequest,
  updateRoleRequest,
  deleteRoleRequest,
  fetchRolesSuccess,
  createRoleSuccess,
  updateRoleSuccess,
  deleteRoleSuccess,
  rolesFailure,
  clearRoles,
} = rolesSlice.actions;

export default rolesSlice.reducer;
