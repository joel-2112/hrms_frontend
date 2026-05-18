import { createSlice } from "@reduxjs/toolkit";

const getInitialCollapsed = () => {
  try {
    return localStorage.getItem("sidebarCollapsed") === "true";
  } catch {
    return false;
  }
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen: false,
    theme: "light",
    sidebarCollapsed: getInitialCollapsed(),
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      try {
        localStorage.setItem("sidebarCollapsed", String(state.sidebarCollapsed));
      } catch {
        // ignore storage errors
      }
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
      try {
        localStorage.setItem("sidebarCollapsed", String(action.payload));
      } catch {
        // ignore storage errors
      }
    },
    toggleMobileSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileSidebar,
  setSidebarOpen,
  setTheme,
} = uiSlice.actions;
export default uiSlice.reducer;

