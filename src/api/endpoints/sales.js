import { request } from "../axiosConfig";

export const salesApi = {
  orders: () => request("get", "/sales/orders"),
  customers: () => request("get", "/sales/customers"),
  agents: () => request("get", "/sales/agents"),
};
