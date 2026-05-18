import { createSlice } from "@reduxjs/toolkit";

function transformPayload(raw) {
  if (!raw) return { isSuperUser: false, isSystemManager: false, map: {} };

  const isSuperUser = !!raw.isSuperUser;
  const isSystemManager = !!raw.isSystemManager;

  const map = {};
  const arr = raw.permissions || [];
  arr.forEach((p) => {
    if (p.resourceName) {
      map[p.resourceName] = p;
    }
  });

  return { isSuperUser, isSystemManager, map };
}

const permissionsSlice = createSlice({
  name: "permissions",
  initialState: { isSuperUser: false, isSystemManager: false, map: {}, loaded: false },
  reducers: {
    setPermissions: (state, action) => {
      const { isSuperUser, isSystemManager, map } = transformPayload(action.payload);
      state.isSuperUser = isSuperUser;
      state.isSystemManager = isSystemManager;
      state.map = map;
      state.loaded = true;
    },
    clearPermissions: (state) => {
      state.isSuperUser = false;
      state.isSystemManager = false;
      state.map = {};
      state.loaded = false;
    },
  },
});

export const { setPermissions, clearPermissions } = permissionsSlice.actions;
export default permissionsSlice.reducer;

