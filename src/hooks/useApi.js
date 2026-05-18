import { useCallback, useState } from "react";
import { request } from "../api/axiosConfig";
import { toast } from "sonner";

export function useApi(module = null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = useCallback(async (method, url, body) => {
    setLoading(true);
    setError(null);
    try {
      const res = await request(method, url, body);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Request failed";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint, params) => {
    const apiObj = module ? require(`../api/endpoints/${module}.js`) : null;
    const url = apiObj ? apiObj[endpoint]() : endpoint;
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== null && v !== ""
          )
        ).toString()
      : "";
    return call("get", url + qs);
  }, [call, module]);

  const post = useCallback((url, body) => call("post", url, body), [call]);
  const put = useCallback((url, body) => call("put", url, body), [call]);
    const patch = useCallback((url, body) => call("patch", url, body), [call]);

  const del = useCallback((url) => call("delete", url), [call]);

  return {
    loading,
    error,
    get,
    post,
    patch,
    put,
    del,
  };
}

//this is commmentn