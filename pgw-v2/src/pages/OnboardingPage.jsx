import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { registerMerchant, loginMerchant, getMerchantProfile } from "../services/api";

const BASE_URL = '';

const s = {
  page: { minHeight: "100vh", background: "#0a0b0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", padding: "24px" },
  container: { width: "100%", maxWidth: "920px" },
  header: { textAlign: "center", marginBottom: "40px" },
  title: { fontSize: "28px", fontWeight: "600", color: "#60a5fa", letterSpacing: "0.05em" },
  subtitle: { fontSize: "12px", color: "#334155", marginTop: "8px", letterSpacing: "0.1em", textTransform: "uppercase" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  card: { background: "#0f1117", border: "1px solid #1e2235", borderRadius: "8px", padding: "28px" },
  cardTitle: { fontSize: "11px", color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "24px" },
  label: { fontSize: "11px", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px", display: "block" },
  input: (hasError) => ({ width: "100%", background: "#0a0b0f", border: `1px solid ${hasError ? "#7f1d1d" : "#1e2235"}`, borderRadius: "4px", padding: "10px 14px", fontSize: "13px", color: "#e2e8f0", outline: "none", marginBottom: "4px", fontFamily: "inherit", boxSizing: "border-box" }),
  fieldError: { fontSize: "10px", color: "#f87171", marginBottom: "10px", letterSpacing: "0.03em" },
  hint: { fontSize: "10px", color: "#334155", marginBottom: "14px", letterSpacing: "0.03em" },
  btn: (primary, disabled) => ({ width: "100%", padding: "12px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: disabled ? "not-allowed" : "pointer", border: primary ? "none" : "1px solid #1e2235", background: primary ? (disabled ? "#1e3a5f" : "#2563eb") : "#0f1117", color: primary ? "white" : "#64748b", fontFamily: "inherit", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px", opacity: disabled ? 0.7 : 1 }),
  linkBtn: { background: "none", border: "none", color: "#60a5fa", fontSize: "11px", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em", padding: "0", textDecoration: "underline" },
  success: { background: "#064e3b20", border: "1px solid #065f46", borderRadius: "4px", padding: "16px", marginTop: "12px" },
  successText: { fontSize: "12px", color: "#34d399", marginBottom: "6px" },
  apiKey: { background: "#0a0b0f", border: "1px solid #1e2235", borderRadius: "4px", padding: "10px", fontSize: "11px", color: "#60a5fa", wordBreak: "break-all", lineHeight: "1.6", fontFamily: "monospace" },
  error: { background: "#4c1d2420", border: "1px solid #7f1d1d", borderRadius: "4px", padding: "12px", marginTop: "12px", fontSize: "12px", color: "#f87171" },
  divider: { textAlign: "center", color: "#334155", margin: "14px 0", fontSize: "11px", letterSpacing: "0.05em" },
  tab: (active) => ({ flex: 1, padding: "8px", background: active ? "#1e2235" : "transparent", border: "1px solid #1e2235", borderRadius: "4px", color: active ? "#e2e8f0" : "#475569", fontSize: "11px", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.08em", textTransform: "uppercase" }),
  tabRow: { display: "flex", gap: "6px", marginBottom: "20px" },
};

// Email validation
const isValidEmail = (email) => {
  // Basic format check
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) return false;

  // Domain must have at least 3 chars before TLD
  const domain = email.split('@')[1];
  const parts = domain.split('.');
  const domainName = parts[parts.length - 2]; // e.g. "gmail" in gmail.com

  return domainName.length >= 3; // rejects gm.com, ab.com etc
};

const forgotPasswordApi = async (email) => {
  const res = await fetch(`${BASE_URL}/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
};

const resetPasswordApi = async (token, newPassword) => {
  const res = await fetch(`${BASE_URL}/v1/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Reset failed');
  }
  return res.json();
};

export default function OnboardingPage() {
  const { login } = useAuth();
  const [tab, setTab] = useState("login");

  // Register
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", callbackUrl: "" });
  const [regErrors, setRegErrors] = useState({});
  const [regResult, setRegResult] = useState(null);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Login
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset password
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetErrors, setResetErrors] = useState({});
  const [resetResult, setResetResult] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // ─── Register validation ───────────────
  const validateRegister = () => {
    const errors = {};
    if (!regForm.name.trim()) errors.name = "Business name is required";
    if (!regForm.email.trim()) errors.email = "Email is required";
    else if (!isValidEmail(regForm.email)) errors.email = "Please enter a valid email address";
    if (!regForm.password) errors.password = "Password is required";
    else if (regForm.password.length < 8) errors.password = "Password must be at least 8 characters";
    if (!regForm.callbackUrl.trim()) errors.callbackUrl = "Webhook callback URL is required"; // ← ADD
    else if (!regForm.callbackUrl.startsWith("https://")) errors.callbackUrl = "Callback URL must start with https://"; // ← ADD
    return errors;
  };

  const handleRegister = async () => {
    const errors = validateRegister();
    setRegErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setRegError(""); setRegLoading(true);
    try {
      const data = await registerMerchant(regForm);
      setRegResult(data);
      setLoginForm({ email: regForm.email, password: regForm.password });
    } catch (e) {
      setRegError(e.message);
    } finally {
      setRegLoading(false);
    }
  };

  // ─── Login validation ──────────────────
  const validateLogin = () => {
    const errors = {};
    if (!loginForm.email.trim()) errors.email = "Email is required";
    else if (!isValidEmail(loginForm.email)) errors.email = "Please enter a valid email address";
    if (!loginForm.password) errors.password = "Password is required";
    return errors;
  };

  const handleLogin = async () => {
    const errors = validateLogin();
    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setLoginError(""); setLoginLoading(true);
    try {
      const data = await loginMerchant(loginForm.email, loginForm.password);
      const profile = await getMerchantProfile(data.accessToken);
      login(data.accessToken, profile);
    } catch (e) {
      setLoginError("Invalid email or password. Please check your credentials and try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // ─── Forgot password ───────────────────
  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { setForgotEmailError("Email is required"); return; }
    if (!isValidEmail(forgotEmail)) { setForgotEmailError("Please enter a valid email address"); return; }
    setForgotEmailError(""); setForgotError(""); setForgotLoading(true);
    try {
      await forgotPasswordApi(forgotEmail);
      setForgotSent(true);
    } catch (e) {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── Reset password validation ─────────
  const validateReset = () => {
    const errors = {};
    if (!resetToken.trim()) errors.token = "Reset token is required";
    if (!resetPassword) errors.password = "New password is required";
    else if (resetPassword.length < 8) errors.password = "Password must be at least 8 characters";
    if (!resetConfirm) errors.confirm = "Please confirm your password";
    else if (resetPassword !== resetConfirm) errors.confirm = "Passwords do not match";
    return errors;
  };

  const handleResetPassword = async () => {
    const errors = validateReset();
    setResetErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setResetError(""); setResetLoading(true);
    try {
      await resetPasswordApi(resetToken, resetPassword);
      setResetResult("Password reset successful! Redirecting to login...");
      setTimeout(() => { setTab("login"); setResetResult(""); setForgotSent(false); }, 2500);
    } catch (e) {
      setResetError(e.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <div style={s.title}>⚡ Payment Gateway</div>
          <div style={s.subtitle}>Distributed Fintech Infrastructure · Spring Boot · Kafka · Redis</div>
        </div>

        <div style={s.grid}>
          {/* LEFT — Register */}
          <div style={s.card}>
            <div style={s.cardTitle}>📋 New merchant registration</div>

            <label style={s.label}>Business name <span style={{ color: "#f87171" }}>*</span></label>
            <input style={s.input(regErrors.name)} placeholder="e.g. Acme Technologies Pvt Ltd"
              value={regForm.name} onChange={(e) => { setRegForm({ ...regForm, name: e.target.value }); setRegErrors({ ...regErrors, name: "" }); }} />
            {regErrors.name && <div style={s.fieldError}>⚠ {regErrors.name}</div>}

            <label style={s.label}>Business email <span style={{ color: "#f87171" }}>*</span></label>
            <input style={s.input(regErrors.email)} type="email" placeholder="e.g. admin@acmetechnologies.com"
              value={regForm.email} onChange={(e) => { setRegForm({ ...regForm, email: e.target.value }); setRegErrors({ ...regErrors, email: "" }); }} />
            {regErrors.email && <div style={s.fieldError}>⚠ {regErrors.email}</div>}

            <label style={s.label}>Password <span style={{ color: "#f87171" }}>*</span></label>
            <input style={s.input(regErrors.password)} type="password" placeholder="Minimum 8 characters"
              value={regForm.password} onChange={(e) => { setRegForm({ ...regForm, password: e.target.value }); setRegErrors({ ...regErrors, password: "" }); }} />
            {regErrors.password && <div style={s.fieldError}>⚠ {regErrors.password}</div>}

            <label style={s.label}>Webhook callback URL <span style={{ color: "#f87171" }}>*</span></label>
<input style={s.input(regErrors.callbackUrl)}
  placeholder="e.g. https://acmetechnologies.com/webhooks/payment"
  value={regForm.callbackUrl}
  onChange={(e) => { setRegForm({ ...regForm, callbackUrl: e.target.value }); setRegErrors({ ...regErrors, callbackUrl: "" }); }} />
{regErrors.callbackUrl && <div style={s.fieldError}>⚠ {regErrors.callbackUrl}</div>}
<div style={s.hint}>URL where we POST payment notifications. Must start with https://</div>

            <button style={s.btn(true, regLoading)} onClick={handleRegister} disabled={regLoading}>
              {regLoading ? "Creating account..." : "Create merchant account"}
            </button>

            {regResult && (
              <div style={s.success}>
                <div style={s.successText}>✅ Account created successfully!</div>
                <div style={{ fontSize: "11px", color: "#475569", marginBottom: "6px" }}>Your API key (save this securely):</div>
                <div style={s.apiKey}>{regResult.apiKey}</div>
                <div style={{ fontSize: "10px", color: "#334155", marginTop: "8px" }}>Login credentials pre-filled →</div>
              </div>
            )}
            {regError && <div style={s.error}>❌ {regError}</div>}
          </div>

          {/* RIGHT — Login / Forgot */}
          <div style={s.card}>
            <div style={s.tabRow}>
              <button style={s.tab(tab === "login")} onClick={() => setTab("login")}>Login</button>
              <button style={s.tab(tab === "forgot")} onClick={() => setTab("forgot")}>Forgot password</button>
            </div>

            {/* LOGIN */}
            {tab === "login" && (
              <>
                <label style={s.label}>Registered email</label>
                <input style={s.input(loginErrors.email)} type="email" placeholder="e.g. admin@acmetechnologies.com"
                  value={loginForm.email}
                  onChange={(e) => { setLoginForm({ ...loginForm, email: e.target.value }); setLoginErrors({ ...loginErrors, email: "" }); }} />
                {loginErrors.email && <div style={s.fieldError}>⚠ {loginErrors.email}</div>}

                <label style={s.label}>Password</label>
                <input style={s.input(loginErrors.password)} type="password" placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); setLoginErrors({ ...loginErrors, password: "" }); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
                {loginErrors.password && <div style={s.fieldError}>⚠ {loginErrors.password}</div>}

                <div style={{ marginTop: "4px", marginBottom: "14px" }}></div>

                <button style={s.btn(true, loginLoading)} onClick={handleLogin} disabled={loginLoading}>
                  {loginLoading ? "Authenticating..." : "Login to dashboard"}
                </button>

                <div style={{ textAlign: "center" }}>
                  <button style={s.linkBtn} onClick={() => setTab("forgot")}>Forgot your password?</button>
                </div>

                {loginError && <div style={s.error}>❌ {loginError}</div>}

                <div style={s.divider}>── session valid for 24 hours ──</div>
              </>
            )}

            {/* FORGOT PASSWORD */}
            {tab === "forgot" && (
              <>
                {!forgotSent ? (
                  <>
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px", lineHeight: "1.8" }}>
                      Enter your registered email address. A secure reset token will be sent to your inbox, valid for 15 minutes.
                    </div>

                    <label style={s.label}>Registered email</label>
                    <input style={s.input(forgotEmailError)} type="email"
                      placeholder="e.g. admin@acmetechnologies.com"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotEmailError(""); }} />
                    {forgotEmailError && <div style={s.fieldError}>⚠ {forgotEmailError}</div>}

                    <div style={{ marginBottom: "14px" }}></div>

                    <button style={s.btn(true, forgotLoading)} onClick={handleForgotPassword} disabled={forgotLoading}>
                      {forgotLoading ? "Sending..." : "Send reset token"}
                    </button>

                    <div style={{ textAlign: "center" }}>
                      <button style={s.linkBtn} onClick={() => setTab("login")}>← Back to login</button>
                    </div>

                    {forgotError && <div style={s.error}>❌ {forgotError}</div>}
                  </>
                ) : (
                  <>
                    <div style={s.success}>
                      <div style={s.successText}>✅ Reset token sent to {forgotEmail}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.8", marginTop: "6px" }}>
                        Check your email inbox for the reset token. It will expire in 15 minutes.
                      </div>
                    </div>

                    <div style={{ marginTop: "20px" }}>
                      <label style={s.label}>Reset token</label>
                      <input style={s.input(resetErrors.token)} placeholder="Paste the token from your email"
                        value={resetToken} onChange={(e) => { setResetToken(e.target.value); setResetErrors({ ...resetErrors, token: "" }); }} />
                      {resetErrors.token && <div style={s.fieldError}>⚠ {resetErrors.token}</div>}

                      <label style={s.label}>New password</label>
                      <input style={s.input(resetErrors.password)} type="password" placeholder="Minimum 8 characters"
                        value={resetPassword} onChange={(e) => { setResetPassword(e.target.value); setResetErrors({ ...resetErrors, password: "" }); }} />
                      {resetErrors.password && <div style={s.fieldError}>⚠ {resetErrors.password}</div>}

                      <label style={s.label}>Confirm new password</label>
                      <input style={s.input(resetErrors.confirm)} type="password" placeholder="Re-enter your new password"
                        value={resetConfirm} onChange={(e) => { setResetConfirm(e.target.value); setResetErrors({ ...resetErrors, confirm: "" }); }} />
                      {resetErrors.confirm && <div style={s.fieldError}>⚠ {resetErrors.confirm}</div>}

                      <div style={{ marginBottom: "14px" }}></div>

                      <button style={s.btn(true, resetLoading)} onClick={handleResetPassword} disabled={resetLoading}>
                        {resetLoading ? "Resetting..." : "Reset password"}
                      </button>

                      <div style={{ textAlign: "center" }}>
                        <button style={s.linkBtn} onClick={() => { setForgotSent(false); setTab("login"); }}>← Back to login</button>
                      </div>

                      {resetResult && <div style={s.success}><div style={s.successText}>✅ {resetResult}</div></div>}
                      {resetError && <div style={s.error}>❌ {resetError}</div>}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}