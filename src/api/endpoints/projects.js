import { request } from "../axiosConfig";

export const projectsApi = {
  list: () => request("get", "/projects"),
  tasks: () => request("get", "/projects/tasks"),
  milestones: () => request("get", "/projects/milestones"),
};
