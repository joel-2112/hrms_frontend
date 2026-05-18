import { request } from "../axiosConfig";

export const authApi = {
  login: (email, password) => request("post", "/auth/login", { email, password }),
  logout: () => request("post", "/auth/logout"),
  refresh: () => request("post", "/auth/me"),
};
