import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginRequest, initMeRequest } from "../redux/features/authSlice";

export function useAuth() {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);

  const login = useCallback((email, password) => dispatch(loginRequest({ email, password })), [dispatch]);
  const initMe = useCallback(() => dispatch(initMeRequest()), [dispatch]);

  return {
    ...auth,
    login,
    initMe,
  };
}

