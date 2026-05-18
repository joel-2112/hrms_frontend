import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Payload contract (backend):
// - /auth/create-username expects { email, tempPassword, username }
// - /auth/change-password expects { email, tempPassword, newPassword }
// If your backend uses different key names, update the body fields below.

export default function FirstTimeSetupWizard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const { state } = location;

  const email = state?.email || "";
  const tempPassword = state?.tempPassword || "";
  const employeeId = state?.employeeId || "";


  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [employeeIdInput, setEmployeeIdInput] = useState(employeeId);


  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const passwordStrength = useMemo(() => {
    const pwd = newPassword;
    const minLenOk = pwd.length >= 8;
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    return { minLenOk, hasNumber, hasSpecial, ok: minLenOk && hasNumber && hasSpecial };
  }, [newPassword]);

  const canSubmitUsername = useMemo(
    () =>
      !!email &&
      !!tempPassword &&
      username.trim().length > 0 &&
      employeeIdInput.trim().length > 0,
    [email, tempPassword, username, employeeIdInput]
  );


  const canSubmitPassword = useMemo(
    () =>
      !!email &&
      !!tempPassword &&
      passwordStrength.ok &&
      newPassword === confirmPassword,
    [email, tempPassword, passwordStrength.ok, newPassword, confirmPassword]
  );


  useEffect(() => {
    if (!email || !tempPassword) {
      navigate("/login", { replace: true });
    }
  }, [email, tempPassword, navigate]);

  async function createUsername() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://api.erp.eyuelkassahun.com/auth/create-username", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), employeeId: employeeIdInput, email, tempPassword }),
      });


      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to create username");
      }

      setStep(2);
    } catch (e) {
      setError(e.message || "Failed to create username");
    } finally {
      setLoading(false);
    }
  }

  async function changePasswordAndLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://api.erp.eyuelkassahun.com/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tempPassword, newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to change password");
      }

      // After successful setup, log in with new credentials.
      // The backend contract might require login with username instead of email.
      // If your backend requires username, keep the email field as-is and change below.
      await login(username.trim(), newPassword);

      // login will redirect via Login.jsx effect
    } catch (e) {
      setError(e.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">First-time setup</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete the steps below to activate your account.
        </p>

        <div className="mt-6 flex items-center gap-3 text-sm">
          <div className={step === 1 ? "font-semibold" : "text-muted-foreground"}>Step 1</div>
          <div className="h-px flex-1 bg-border" />
          <div className={step === 2 ? "font-semibold" : "text-muted-foreground"}>Step 2</div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Create username</span>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                autoComplete="username"
              />
            </label>

            <div>
              <label className="block">
                <span className="text-sm font-medium">Employee ID</span>
                <input
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={employeeIdInput}
                  onChange={(e) => setEmployeeIdInput(e.target.value)}
                  placeholder="e.g. E001"
                  autoComplete="off"
                />
              </label>
            </div>

            <button
              type="button"
              disabled={!canSubmitUsername || loading}
              onClick={createUsername}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-base hover:shadow-glow disabled:opacity-60"
            >
              {loading ? "Saving…" : "Continue"}
            </button>

          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Change password</span>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Confirm password</span>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
              />
            </label>

            <button
              type="button"
              disabled={!canSubmitPassword || loading}
              onClick={changePasswordAndLogin}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-base hover:shadow-glow disabled:opacity-60"
            >
              {loading ? "Updating…" : "Finish setup"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

