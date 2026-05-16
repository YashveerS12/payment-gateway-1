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
  UserPlus: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>),
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
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: error ? "#ef4444" : "#9ca3af", pointerEvents: "none" }}>{icon}</div>
        {children}
      </div>
      {error && <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", color: "#ef4444", fontSize: "11px" }}><Icon.AlertCircle />{error}</div>}
      {hint && !error && <div style={{ marginTop: "4px", color: "#9ca3af", fontSize: "11px" }}>{hint}</div>}
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 12px", marginTop: "10px", color: "#dc2626", fontSize: "12px" }}>
      <Icon.AlertCircle />{message}
    </div>
  );
}

function inputStyle(hasError) {
  return {
    width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 38px",
    fontSize: "13px", fontFamily: "inherit",
    border: `1.5px solid ${hasError ? "#fca5a5" : "#e2e8f0"}`,
    borderRadius: "8px", outline: "none", background: hasError ? "#fff5f5" : "white",
    color: "#0f172a",
  };
}

export default function OnboardingPage() {
  const { login } = useAuth();

  // view: "login" | "forgot" | "reset" | "register"
  const [view, setView] = useState("login");

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

  const handleRegister = async () => {
    const e = {};
    if (!regForm.name.trim()) e.name = "Business name is required";
    if (!regForm.email.trim()) e.email = "Email is required";
    else if (!isValidEmail(regForm.email)) e.email = "Please enter a valid email";
    if (!regForm.password) e.password = "Password is required";
    else if (regForm.password.length < 8) e.password = "Minimum 8 characters";
    if (!regForm.callbackUrl.trim()) e.callbackUrl = "Webhook URL is required";
    else if (!regForm.callbackUrl.startsWith("https://")) e.callbackUrl = "Must start with https://";
    setRegErrors(e);
    if (Object.keys(e).length > 0) return;
    setRegError(""); setRegLoading(true);
    try {
      const data = await registerMerchant(regForm);
      setRegResult(data);
      setLoginForm({ email: regForm.email, password: regForm.password });
    } catch (err) { setRegError(err.message); } finally { setRegLoading(false); }
  };

  const handleLogin = async () => {
    const e = {};
    if (!loginForm.email.trim()) e.email = "Email is required";
    else if (!isValidEmail(loginForm.email)) e.email = "Please enter a valid email";
    if (!loginForm.password) e.password = "Password is required";
    setLoginErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoginError(""); setLoginLoading(true);
    try {
      const data = await loginMerchant(loginForm.email, loginForm.password);
      const profile = await getMerchantProfile(data.accessToken);
      login(data.accessToken, profile);
    } catch (err) { setLoginError("Invalid email or password."); } finally { setLoginLoading(false); }
  };

  const handleForgot = async () => {
    if (!forgotEmail.trim()) { setForgotEmailError("Email is required"); return; }
    if (!isValidEmail(forgotEmail)) { setForgotEmailError("Please enter a valid email"); return; }
    setForgotEmailError(""); setForgotError(""); setForgotLoading(true);
    try { await forgotPasswordApi(forgotEmail); setView("reset"); }
    catch (err) { setForgotError("Something went wrong."); } finally { setForgotLoading(false); }
  };

  const handleReset = async () => {
    const e = {};
    if (!resetToken.trim()) e.token = "Token is required";
    if (!resetPass) e.password = "Password is required";
    else if (resetPass.length < 8) e.password = "Minimum 8 characters";
    if (!resetConfirm) e.confirm = "Confirm your password";
    else if (resetPass !== resetConfirm) e.confirm = "Passwords do not match";
    setResetErrors(e);
    if (Object.keys(e).length > 0) return;
    setResetError(""); setResetLoading(true);
    try {
      await resetPasswordApi(resetToken, resetPass);
      setResetResult("Password reset successful!");
      setTimeout(() => { setView("login"); setResetResult(""); }, 2000);
    } catch (err) { setResetError(err.message); } finally { setResetLoading(false); }
  };

  const btnPrimary = (loading) => ({
    width: "100%", padding: "11px 20px", borderRadius: "8px", border: "none",
    background: loading ? "#93c5fd" : "#3b82f6", color: "white",
    fontSize: "13px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
  });

  const btnSecondary = {
    width: "100%", marginTop: "8px", padding: "10px",
    background: "none", border: "1px solid #e2e8f0", borderRadius: "8px",
    color: "#64748b", fontSize: "13px", cursor: "pointer", fontFamily: "inherit",
  };

  const linkBtn = (color) => ({
    background: "none", border: "none", color: color || "#3b82f6", fontSize: "12px",
    cursor: "pointer", fontFamily: "inherit", fontWeight: "500", padding: 0,
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* Left panel — always visible */}
      <div style={{ width: "380px", background: "#0f172a", display: "flex", flexDirection: "column", padding: "40px", flexShrink: 0, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(circle at 20% 20%, #1e3a5f 0%, transparent 50%), radial-gradient(circle at 80% 80%, #1a1f35 0%, transparent 50%)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
            <div style={{ width: "32px", height: "32px", background: "#3b82f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><Icon.Zap /></div>
            <span style={{ color: "white", fontSize: "17px", fontWeight: "700" }}>PayGateway</span>
          </div>

          <h1 style={{ color: "white", fontSize: "26px", fontWeight: "700", lineHeight: "1.3", margin: "0 0 12px" }}>Distributed Payment Infrastructure</h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6", margin: "0 0 32px" }}>Enterprise-grade payment processing with real-time webhooks, reconciliation, and merchant isolation.</p>

          {[
            { icon: <Icon.Shield />, title: "Bank-grade Security", desc: "JWT, BCrypt, rate limiting" },
            { icon: <Icon.Zap />, title: "Real-time Events", desc: "Apache Kafka streaming" },
            { icon: <Icon.Check />, title: "Idempotent Payments", desc: "Redis duplicate prevention" },
            { icon: <Icon.Key />, title: "Webhook Delivery", desc: "Exponential backoff retry" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <div style={{ color: "#3b82f6", marginTop: "2px", flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ color: "white", fontSize: "13px", fontWeight: "600" }}>{f.title}</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>{f.desc}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: "auto", borderTop: "1px solid #1e293b", paddingTop: "20px" }}>
            <div style={{ color: "#475569", fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>Built with</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {["Spring Boot", "Kafka", "PostgreSQL", "Redis", "React", "Docker", "AWS"].map(t => (
                <span key={t} style={{ padding: "3px 8px", background: "#1e293b", borderRadius: "4px", color: "#94a3b8", fontSize: "10px" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — single card, switches view */}
      <div style={{ flex: 1, background: "#f8f9fb", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>

            {/* ──── LOGIN ──── */}
            {view === "login" && (
              <>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>Welcome back</h2>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 24px" }}>Sign in to your merchant dashboard</p>

                <Field label="Email" icon={<Icon.Mail />} error={loginErrors.email}>
                  <input style={inputStyle(loginErrors.email)} type="email" placeholder="admin@company.com"
                    value={loginForm.email}
                    onChange={(e) => { setLoginForm({ ...loginForm, email: e.target.value }); setLoginErrors({ ...loginErrors, email: "" }); }} />
                </Field>

                <Field label="Password" icon={<Icon.Lock />} error={loginErrors.password}>
                  <input style={inputStyle(loginErrors.password)} type="password" placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); setLoginErrors({ ...loginErrors, password: "" }); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
                </Field>

                <div style={{ textAlign: "right", marginTop: "-6px", marginBottom: "16px" }}>
                  <button onClick={() => setView("forgot")} style={linkBtn()}>Forgot password?</button>
                </div>

                <button onClick={handleLogin} disabled={loginLoading} style={btnPrimary(loginLoading)}>
                  {loginLoading ? "Signing in..." : <><span>Sign in</span><Icon.ArrowRight /></>}
                </button>

                {loginError && <ErrorBox message={loginError} />}

                <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13px", color: "#64748b" }}>
                  Don't have an account?{" "}
                  <button onClick={() => setView("register")} style={linkBtn()}>Create account</button>
                </div>

                <div style={{ marginTop: "16px", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ color: "#94a3b8" }}><Icon.Shield /></div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Session expires in 24 hours · Secured with JWT</span>
                </div>
              </>
            )}

            {/* ──── FORGOT PASSWORD ──── */}
            {view === "forgot" && (
              <>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>Forgot password</h2>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 24px", lineHeight: "1.6" }}>
                  Enter your email and we'll send a secure reset token valid for 15 minutes.
                </p>

                <Field label="Registered email" icon={<Icon.Mail />} error={forgotEmailError}>
                  <input style={inputStyle(forgotEmailError)} type="email" placeholder="admin@company.com"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotEmailError(""); }} />
                </Field>

                <button onClick={handleForgot} disabled={forgotLoading} style={btnPrimary(forgotLoading)}>
                  {forgotLoading ? "Sending..." : <><span>Send reset token</span><Icon.ArrowRight /></>}
                </button>
                <button onClick={() => setView("login")} style={btnSecondary}>Back to sign in</button>

                {forgotError && <ErrorBox message={forgotError} />}
              </>
            )}

            {/* ──── RESET PASSWORD ──── */}
            {view === "reset" && (
              <>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px", marginBottom: "20px", display: "flex", gap: "10px" }}>
                  <div style={{ color: "#16a34a", flexShrink: 0, marginTop: "1px" }}><Icon.Check /></div>
                  <div>
                    <div style={{ color: "#15803d", fontSize: "13px", fontWeight: "600" }}>Token sent to {forgotEmail}</div>
                    <div style={{ color: "#166534", fontSize: "12px" }}>Check inbox. Expires in 15 minutes.</div>
                  </div>
                </div>

                <Field label="Reset token" icon={<Icon.Key />} error={resetErrors.token}>
                  <input style={inputStyle(resetErrors.token)} placeholder="Paste token from email"
                    value={resetToken} onChange={(e) => { setResetToken(e.target.value); setResetErrors({ ...resetErrors, token: "" }); }} />
                </Field>
                <Field label="New password" icon={<Icon.Lock />} error={resetErrors.password}>
                  <input style={inputStyle(resetErrors.password)} type="password" placeholder="Minimum 8 characters"
                    value={resetPass} onChange={(e) => { setResetPass(e.target.value); setResetErrors({ ...resetErrors, password: "" }); }} />
                </Field>
                <Field label="Confirm password" icon={<Icon.Lock />} error={resetErrors.confirm}>
                  <input style={inputStyle(resetErrors.confirm)} type="password" placeholder="Re-enter password"
                    value={resetConfirm} onChange={(e) => { setResetConfirm(e.target.value); setResetErrors({ ...resetErrors, confirm: "" }); }} />
                </Field>

                <button onClick={handleReset} disabled={resetLoading} style={btnPrimary(resetLoading)}>
                  {resetLoading ? "Resetting..." : "Reset password"}
                </button>
                <button onClick={() => setView("login")} style={btnSecondary}>Back to sign in</button>

                {resetResult && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px", marginTop: "10px", color: "#15803d", fontSize: "13px" }}>{resetResult}</div>}
                {resetError && <ErrorBox message={resetError} />}
              </>
            )}

            {/* ──── REGISTER ──── */}
            {view === "register" && (
              <>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>Create account</h2>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 24px" }}>Get started with your payment infrastructure</p>

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
                  <input style={inputStyle(regErrors.callbackUrl)} placeholder="https://yourapp.com/webhooks"
                    value={regForm.callbackUrl} onChange={(e) => { setRegForm({ ...regForm, callbackUrl: e.target.value }); setRegErrors({ ...regErrors, callbackUrl: "" }); }} />
                </Field>

                <button onClick={handleRegister} disabled={regLoading} style={btnPrimary(regLoading)}>
                  {regLoading ? "Creating..." : <><span>Create account</span><Icon.ArrowRight /></>}
                </button>

                {regResult && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px", marginTop: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <div style={{ color: "#16a34a" }}><Icon.Check /></div>
                      <span style={{ color: "#15803d", fontSize: "13px", fontWeight: "600" }}>Account created</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#166534", marginBottom: "6px", fontWeight: "500" }}>Your API Key:</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "white", border: "1px solid #d1fae5", borderRadius: "6px", padding: "8px 10px" }}>
                      <code style={{ fontSize: "10px", color: "#065f46", flex: 1, wordBreak: "break-all", fontFamily: "monospace" }}>{regResult.apiKey}</code>
                      <button onClick={() => { navigator.clipboard.writeText(regResult.apiKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#16a34a" : "#6b7280", flexShrink: 0 }}>
                        {copied ? <Icon.Check /> : <Icon.Copy />}
                      </button>
                    </div>
                  </div>
                )}
                {regError && <ErrorBox message={regError} />}

                <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13px", color: "#64748b" }}>
                  Already have an account?{" "}
                  <button onClick={() => setView("login")} style={linkBtn()}>Sign in</button>
                </div>
              </>
            )}

          </div>

          <div style={{ textAlign: "center", marginTop: "16px", fontSize: "11px", color: "#94a3b8" }}>
            Deployed on AWS EC2 · Distributed microservices
          </div>
        </div>
      </div>
    </div>
  );
}