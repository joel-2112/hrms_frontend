import axios from "axios";
import { mockRequest } from "./mock";
const baseUrl = import.meta.env.VITE_API_URL;
const USE_MOCK = false;

export const apiClient = axios.create({
  baseURL: baseUrl,
  // baseURL: "https://api.erp.teamworksc.com",
  timeout: 30000,
  withCredentials: true, 
});

// Request interceptor — set Content-Type only for non-FormData requests
apiClient.interceptors.request.use(
  (config) => {
    // Only set JSON Content-Type if the data is NOT FormData
    if (config.data && !(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    // For FormData, let the browser set the correct multipart Content-Type with boundary
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto-refresh on 401, otherwise pass through
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;

    if (status === 401 && !original._retry) {
      // No refresh endpoint - logout instead
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  },
);

// Real request fn
export async function request(method, url, data) {
  const res = await apiClient.request({ method, url, data });
  return res;
}