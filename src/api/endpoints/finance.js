import { request } from "../axiosConfig";

export const financeApi = {
  invoices: () => request("get", "/finance/invoices"),
  payments: () => request("get", "/finance/payments"),
  reports: () => request("get", "/finance/reports"),
};
