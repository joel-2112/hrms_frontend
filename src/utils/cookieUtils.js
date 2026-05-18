// Cookie helpers — never store auth tokens here, only non-sensitive prefs.
import Cookies from "universal-cookie";

const cookies = new Cookies();

export const getCookie = (name) => cookies.get(name);
export const setCookie = (name, value, opts = {}) =>
  cookies.set(name, value, { path: "/", sameSite: "strict", ...opts });
export const removeCookie = (name) => cookies.remove(name, { path: "/" });
