import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { registerMerchant, loginMerchant, getMerchantProfile } from "../services/api";

const BASE_URL = '';

const Icon = {
  Building: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>),
  Mail: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>),
  Lock: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
  Link: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>),
  Check: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  AlertCircle: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>),
  Zap: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
  Copy: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>),
  ArrowRight: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>),
  Shield: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
  Key: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>),
};

const isValidEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) return false;
  const parts = email.split('@');
  const domainParts = parts[1].toLowerCase().split('.');
  return domainParts[0].length >= 3;
};

const forgotPasswordApi = async (email) => {
  const res = await fetch(`${BASE_URL}/v1/auth/forgot-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
};

const resetPasswordApi = async (token, newPassword) => {
  const res = await fetch(`${BASE_URL}/v1/auth/reset-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword })
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Reset failed'); }
  return res.json();
};

function Field({ label, icon, error, hint, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: error ? "#ef4444" : "#9ca3af", pointerEvents: "none" }}>{icon}</div>
        {children}
      </div>
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "5px", color: "#ef4444", fontSize: "12px" }}>
          <Icon.AlertCircle />{error}
        </div>
      )}
      {hint && !error && <div style={{ marginTop: "5px", color: "#9ca3af", fontSize: "12px" }}>{hint}</div>}
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", marginTop: "12px", color: "#dc2626", fontSize: "13px" }}>
      <Icon.AlertCircle />{message}
    </div>
  );
}

function inputStyle(hasError) {
  return {
    width: "100%", boxSizing: "border-box", padding: "11px 12px 11px 40px",
    fontSize: "14px", fontFamily: "inherit",
    border: `1.5px solid ${hasError ? "#fca5a5" : "#e2e8f0"}`,
    borderRadius: "8px", outline: "none", background: hasError ? "#fff5f5" : "white",
    color: "#0f172a",
  };
}

function PrimaryBtn({ loading, children, onClick }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: "100%", padding: "12px 20px", borderRadius: "8px", border: "none",
      background: loading ? "#93c5fd" : "#3b82f6", color: "white",
      fontSize: "14px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
      fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    }}>
      {children}
    </button>
  );
}

function SecondaryBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "block", width: "100%", marginTop: "10px", padding: "12px",
      background: "none", border: "1px solid #e2e8f0", borderRadius: "8px",
      color: "#64748b", fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
    }}>
      {children}
    </button>
  );
}

export default function OnboardingPage() {
  const { login } = useAuth();
  const [tab, setTab] = useState("login");

  // Register
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", callbackUrl: "" });
  const [regErrors, setRegErrors] = useState({});
  const [regResult, setRegResult] = useState(null);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Login
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Forgot
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset
  const [resetToken, setResetToken] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetErrors, setResetErrors] = useState({});
  const [resetResult, setResetResult] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const validateRegister = () => {
    const e = {};
    if (!regForm.name.trim()) e.name = "Business name is required";
    if (!regForm.email.trim()) e.email = "Email is required";
    else if (!isValidEmail(regForm.email)) e.email = "Please enter a valid email address";
    if (!regForm.password) e.password = "Password is required";
    else if (regForm.password.length < 8) e.password = "Password must be at least 8 characters";
    if (!regForm.callbackUrl.trim()) e.callbackUrl = "Webhook URL is required";
    else if (!regForm.callbackUrl.startsWith("https://")) e.callbackUrl = "URL must start with https://";
    return e;
  };

  const handleRegister = async () => {
    const e = validateRegister(); setRegErrors(e);
    if (Object.keys(e).length > 0) return;
    setRegError(""); setRegLoading(true);
    try {
      const data = await registerMerchant(regForm);
      setRegResult(data);
      setLoginForm({ email: regForm.email, password: regForm.password });
    } catch (err) { setRegError(err.message); } finally { setRegLoading(false); }
  };

  const validateLogin = () => {
    const e = {};
    if (!loginForm.email.trim()) e.email = "Email is required";
    else if (!isValidEmail(loginForm.email)) e.email = "Please enter a valid email address";
    if (!loginForm.password) e.password = "Password is required";
    return e;
  };

  const handleLogin = async () => {
    const e = validateLogin(); setLoginErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoginError(""); setLoginLoading(true);
    try {
      const data = await loginMerchant(loginForm.email, loginForm.password);
      const profile = await getMerchantProfile(data.accessToken);
      login(data.accessToken, profile);
    } catch (err) { setLoginError("Invalid email or password. Please try again."); } finally { setLoginLoading(false); }
  };

  const handleForgot = async () => {
    if (!forgotEmail.trim()) { setForgotEmailError("Email is required"); return; }
    if (!isValidEmail(forgotEmail)) { setForgotEmailError("Please enter a valid email address"); return; }
    setForgotEmailError(""); setForgotError(""); setForgotLoading(true);
    try { await forgotPasswordApi(forgotEmail); setForgotSent(true); }
    catch (err) { setForgotError("Something went wrong. Please try again."); } finally { setForgotLoading(false); }
  };

  const handleReset = async () => {
    const e = {};
    if (!resetToken.trim()) e.token = "Reset token is required";
    if (!resetPass) e.password = "New password is required";
    else if (resetPass.length < 8) e.password = "Password must be at least 8 characters";
    if (!resetConfirm) e.confirm = "Please confirm your password";
    else if (resetPass !== resetConfirm) e.confirm = "Passwords do not match";
    setResetErrors(e);
    if (Object.keys(e).length > 0) return;
    setResetError(""); setResetLoading(true);
    try {
      await resetPasswordApi(resetToken, resetPass);
      setResetResult("Password reset successful. Redirecting...");
      setTimeout(() => { setTab("login"); setResetResult(""); setForgotSent(false); }, 2500);
    } catch (err) { setResetError(err.message); } finally { setResetLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* Left dark panel */}
      <div style={{ width: "420px", background: "#0f172a", display: "flex", flexDirection: "column", padding: "48px", flexShrink: 0, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(circle at 20% 20%, #1e3a5f 0%, transparent 50%), radial-gradient(circle at 80% 80%, #1a1f35 0%, transparent 50%)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "56px" }}>
            <div style={{ width: "36px", height: "36px", background: "#3b82f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><Icon.Zap /></div>
            <span style={{ color: "white", fontSize: "18px", fontWeight: "700", letterSpacing: "-0.02em" }}>PayGateway</span>
          </div>

          <h1 style={{ color: "white", fontSize: "30px", fontWeight: "700", lineHeight: "1.25", letterSpacing: "-0.03em", margin: "0 0 16px" }}>Distributed Payment Infrastructure</h1>
          <p style={{ color: "#94a3b8", fontSize: "15px", lineHeight: "1.6", margin: "0 0 40px" }}>Enterprise-grade payment processing with real-time webhooks, reconciliation, and merchant isolation.</p>

          {[
            { icon: <Icon.Shield />, title: "Bank-grade Security", desc: "JWT auth, BCrypt hashing, rate limiting" },
            { icon: <Icon.Zap />, title: "Real-time Events", desc: "Apache Kafka event streaming" },
            { icon: <Icon.Check />, title: "Idempotent Payments", desc: "Redis-backed duplicate prevention" },
            { icon: <Icon.Key />, title: "Webhook Delivery", desc: "Exponential backoff retry logic" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ color: "#3b82f6", marginTop: "2px", flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ color: "white", fontSize: "14px", fontWeight: "600", marginBottom: "2px" }}>{f.title}</div>
                <div style={{ color: "#64748b", fontSize: "13px" }}>{f.desc}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: "auto", borderTop: "1px solid #1e293b", paddingTop: "24px" }}>
            <div style={{ color: "#475569", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>Tech Stack</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {["Spring Boot", "Kafka", "PostgreSQL", "Redis", "React", "Docker", "AWS"].map(t => (
                <span key={t} style={{ padding: "4px 10px", background: "#1e293b", borderRadius: "4px", color: "#94a3b8", fontSize: "11px", fontWeight: "500" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right white panel */}
      <div style={{ flex: 1, background: "#f8f9fb", overflowY: "auto", padding: "40px 48px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "480px" }}>

          {/* LOGIN / FORGOT Card */}
          <div style={{ background: "white", borderRadius: "16px", padding: "36px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.02em", margin: "0 0 4px" }}>Welcome back</h2>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px" }}>Sign in to your merchant dashboard</p>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "2px solid #f1f5f9", marginBottom: "24px" }}>
              {[{ id: "login", label: "Sign in" }, { id: "forgot", label: "Forgot password" }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding: "0 0 12px", marginRight: "24px", background: "none", border: "none",
                  cursor: "pointer", fontSize: "14px", fontWeight: "600", fontFamily: "inherit",
                  color: tab === t.id ? "#0f172a" : "#94a3b8",
                  borderBottom: tab === t.id ? "2px solid #3b82f6" : "2px solid transparent",
                  marginBottom: "-2px",
                }}>{t.label}</button>
              ))}
            </div>

            {/* LOGIN */}
            {tab === "login" && (
              <>
                <Field label="Email address" icon={<Icon.Mail />} error={loginErrors.email}>
                  <input style={inputStyle(loginErrors.email)} type="email" placeholder="admin@acmetechnologies.com"
                    value={loginForm.email}
                    onChange={(e) => { setLoginForm({ ...loginForm, email: e.target.value }); setLoginErrors({ ...loginErrors, email: "" }); }} />
                </Field>

                <Field label="Password" icon={<Icon.Lock />} error={loginErrors.password}>
                  <input style={inputStyle(loginErrors.password)} type="password" placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); setLoginErrors({ ...loginErrors, password: "" }); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
                </Field>

                <div style={{ textAlign: "right", marginTop: "-8px", marginBottom: "20px" }}>
                  <button onClick={() => setTab("forgot")} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", fontWeight: "500" }}>
                    Forgot password?
                  </button>
                </div>

                <PrimaryBtn loading={loginLoading} onClick={handleLogin}>
                  {loginLoading ? "Signing in..." : <><span>Sign in to dashboard</span><Icon.ArrowRight /></>}
                </PrimaryBtn>

                {loginError && <ErrorBox message={loginError} />}

                <div style={{ marginTop: "16px", padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ color: "#94a3b8" }}><Icon.Shield /></div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Session expires in 24 hours · Secured with JWT</span>
                </div>
              </>
            )}

            {/* FORGOT — step 1 */}
            {tab === "forgot" && !forgotSent && (
              <>
                <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px", lineHeight: "1.6" }}>
                  Enter your registered email. We'll send a secure reset token valid for 15 minutes.
                </p>
                <Field label="Registered email" icon={<Icon.Mail />} error={forgotEmailError}>
                  <input style={inputStyle(forgotEmailError)} type="email" placeholder="admin@acmetechnologies.com"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotEmailError(""); }} />
                </Field>
                <PrimaryBtn loading={forgotLoading} onClick={handleForgot}>
                  {forgotLoading ? "Sending..." : <><span>Send reset token</span><Icon.ArrowRight /></>}
                </PrimaryBtn>
                <SecondaryBtn onClick={() => setTab("login")}>Back to sign in</SecondaryBtn>
                {forgotError && <ErrorBox message={forgotError} />}
              </>
            )}

            {/* FORGOT — step 2 */}
            {tab === "forgot" && forgotSent && (
              <>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px", marginBottom: "20px", display: "flex", gap: "10px" }}>
                  <div style={{ color: "#16a34a", flexShrink: 0, marginTop: "1px" }}><Icon.Check /></div>
                  <div>
                    <div style={{ color: "#15803d", fontSize: "14px", fontWeight: "600", marginBottom: "3px" }}>Reset token sent</div>
                    <div style={{ color: "#166534", fontSize: "13px" }}>Check your inbox at {forgotEmail}. Token expires in 15 minutes.</div>
                  </div>
                </div>

                <Field label="Reset token" icon={<Icon.Key />} error={resetErrors.token}>
                  <input style={inputStyle(resetErrors.token)} placeholder="Paste token from your email"
                    value={resetToken} onChange={(e) => { setResetToken(e.target.value); setResetErrors({ ...resetErrors, token: "" }); }} />
                </Field>
                <Field label="New password" icon={<Icon.Lock />} error={resetErrors.password}>
                  <input style={inputStyle(resetErrors.password)} type="password" placeholder="Minimum 8 characters"
                    value={resetPass} onChange={(e) => { setResetPass(e.target.value); setResetErrors({ ...resetErrors, password: "" }); }} />
                </Field>
                <Field label="Confirm password" icon={<Icon.Lock />} error={resetErrors.confirm}>
                  <input style={inputStyle(resetErrors.confirm)} type="password" placeholder="Re-enter new password"
                    value={resetConfirm} onChange={(e) => { setResetConfirm(e.target.value); setResetErrors({ ...resetErrors, confirm: "" }); }} />
                </Field>

                <PrimaryBtn loading={resetLoading} onClick={handleReset}>
                  {resetLoading ? "Resetting..." : "Reset password"}
                </PrimaryBtn>
                <SecondaryBtn onClick={() => { setForgotSent(false); setTab("login"); }}>Back to sign in</SecondaryBtn>

                {resetResult && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px", marginTop: "12px", color: "#15803d", fontSize: "14px" }}>{resetResult}</div>}
                {resetError && <ErrorBox message={resetError} />}
              </>
            )}
          </div>

          {/* REGISTER Card */}
          <div style={{ background: "white", borderRadius: "16px", padding: "36px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.02em", margin: "0 0 4px" }}>Create merchant account</h2>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px" }}>Get started with your payment infrastructure</p>

            <Field label="Business name" icon={<Icon.Building />} error={regErrors.name}>
              <input style={inputStyle(regErrors.name)} placeholder="Acme Technologies Pvt Ltd"
                value={regForm.name} onChange={(e) => { setRegForm({ ...regForm, name: e.target.value }); setRegErrors({ ...regErrors, name: "" }); }} />
            </Field>

            <Field label="Business email" icon={<Icon.Mail />} error={regErrors.email}>
              <input style={inputStyle(regErrors.email)} type="email" placeholder="admin@acmetechnologies.com"
                value={regForm.email} onChange={(e) => { setRegForm({ ...regForm, email: e.target.value }); setRegErrors({ ...regErrors, email: "" }); }} />
            </Field>

            <Field label="Password" icon={<Icon.Lock />} error={regErrors.password}>
              <input style={inputStyle(regErrors.password)} type="password" placeholder="Minimum 8 characters"
                value={regForm.password} onChange={(e) => { setRegForm({ ...regForm, password: e.target.value }); setRegErrors({ ...regErrors, password: "" }); }} />
            </Field>

            <Field label="Webhook callback URL" icon={<Icon.Link />} error={regErrors.callbackUrl} hint="Must start with https://">
              <input style={inputStyle(regErrors.callbackUrl)} placeholder="https://yourapp.com/webhooks/payment"
                value={regForm.callbackUrl} onChange={(e) => { setRegForm({ ...regForm, callbackUrl: e.target.value }); setRegErrors({ ...regErrors, callbackUrl: "" }); }} />
            </Field>

            <PrimaryBtn loading={regLoading} onClick={handleRegister}>
              {regLoading ? "Creating account..." : <><span>Create account</span><Icon.ArrowRight /></>}
            </PrimaryBtn>

            {regResult && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "16px", marginTop: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <div style={{ color: "#16a34a" }}><Icon.Check /></div>
                  <span style={{ color: "#15803d", fontSize: "14px", fontWeight: "600" }}>Account created successfully</span>
                </div>
                <div style={{ fontSize: "12px", color: "#166534", marginBottom: "8px", fontWeight: "500" }}>Your API Key — save this securely:</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", border: "1px solid #d1fae5", borderRadius: "6px", padding: "10px 12px" }}>
                  <code style={{ fontSize: "11px", color: "#065f46", flex: 1, wordBreak: "break-all", fontFamily: "monospace" }}>{regResult.apiKey}</code>
                  <button onClick={() => { navigator.clipboard.writeText(regResult.apiKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#16a34a" : "#6b7280", flexShrink: 0 }}>
                    {copied ? <Icon.Check /> : <Icon.Copy />}
                  </button>
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>Login credentials pre-filled above</div>
              </div>
            )}
            {regError && <ErrorBox message={regError} />}
          </div>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "#94a3b8" }}>
            Deployed on AWS EC2 · Distributed microservices architecture
          </div>
        </div>
      </div>
    </div>
  );
}