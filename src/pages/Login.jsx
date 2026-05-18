import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSelector } from "react-redux";
import { Globe, LayoutGrid, Loader2 } from "lucide-react";
import { navConfig } from "../components/navigation/navConfig";

export default function Login() {
  const { i18n, t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const permissionsLoaded = useSelector((s) => s.permissions?.loaded);
  const permMap = useSelector((s) => s.permissions?.flatMap || s.permissions?.map || {});
  const isSuperUser = useSelector(
    (s) => s.auth?.user?.isSuperUser || s.permissions?.isSuperUser
  );

  const lastLogin = useSelector((s) => s.auth?.user?.lastLogin);
  const needWorkEmail = useSelector((s) => s.auth?.user?.needWorkEmail);

  // Walk the nav config and find the first route the user can access
  const getDefaultRoute = useCallback(() => {
    if (isSuperUser) {
      const firstModule = navConfig(t)?.[0];
      const firstChild = firstModule?.children?.[0];
      return firstChild?.path || "/hr/employees/dashboard";
    }

    const walk = (items) => {
      for (const item of items) {
        // Check children first (depth-first)
        if (item.children?.length) {
          const childRoute = walk(item.children);
          if (childRoute) return childRoute;
        }

        // Check own permission
        const ownVisible = !item.resource || permMap[item.resource]?.[item.action || "canRead"];

        // If this item is visible and has a path, use it
        if (ownVisible && item.path) {
          return item.path;
        }
      }
      return null;
    };

    return walk(navConfig(t)) || "/403";
  }, [isSuperUser, permMap, t]);

  useEffect(() => {
    if (isAuthenticated && permissionsLoaded) {
      if (needWorkEmail===true) {
        navigate("/blocked", { replace: true, state: { email } });
        return;
      }

      if (lastLogin == null) {
        navigate("/setup", {
          replace: true,
          state: {
            email,
            tempPassword: password,
            lastLogin,
            needWorkEmail,
          },
        });
        return;
      }

      const to = getDefaultRoute();
      navigate(to, { replace: true });
    }
  }, [isAuthenticated, permissionsLoaded, navigate, location, getDefaultRoute, email, password, lastLogin, needWorkEmail]);

  const onSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(next);
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left — brand panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-blue-950 p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Teamwork IT Solution ERP</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            One workspace for HR, finance, sales and projects.
          </h1>
          <p className="mt-4 text-base text-primary-foreground/80">
            Role-aware access keeps every team focused on what they need — and nothing they don't.
          </p>
        </div>

        <div className="text-xs text-primary-foreground/60">
          © 2026 Teamwork IT Solution. All rights reserved.
        </div>

        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
                <LayoutGrid className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold tracking-tight">teamwork ERP</span>
            </div>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-base"
            >
              <Globe className="h-3.5 w-3.5" />
              {i18n.language === 'en' ? 'አማርኛ' : 'English'}
            </button>
          </div>

          <div className="hidden lg:flex justify-end mb-6">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-base"
            >
              <Globe className="h-3.5 w-3.5" />
              {i18n.language === 'en' ? 'አማርኛ' : 'English'}
            </button>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('login.signInTitle')}
          </h2>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                {t('login.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                {t('login.password')}
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoComplete="current-password"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] -translate-y-1/2 text-muted-foreground hover:text-foreground transition-base"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-base hover:shadow-glow disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}