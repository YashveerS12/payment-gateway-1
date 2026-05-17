import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { registerMerchant, loginMerchant, getMerchantProfile } from "../services/api";
import { c, radius, Icon, Button, Input, Field, Badge, StatusDot } from "../ui/theme";

const BASE_URL = '';

// ─── Local validation + extra API calls (unchanged from original) ─────
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

// ─── Tiny inline UI helpers specific to this page ──────────
function ErrorBox({ message }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      background: c.dangerBg, border: "1px solid #FCA5A5",
      borderRadius: radius.lg, padding: "10px 12px", marginTop: "12px",
      color: c.dangerText, fontSize: "12.5px",
    }}>
      <Icon.Alert size={14} />{message}
    </div>
  );
}

function SuccessBox({ children, style }) {
  return (
    <div style={{
      background: c.successBg, border: `1px solid ${c.successBorder}`,
      borderRadius: radius.lg, padding: "12px 14px",
      color: c.successText, fontSize: "12.5px", ...style,
    }}>{children}</div>
  );
}

function LinkBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", color: c.indigo, fontSize: "13px",
      cursor: "pointer", fontFamily: "inherit", fontWeight: 500, padding: 0,
      textDecoration: "underline", textUnderlineOffset: "3px",
    }}>{children}</button>
  );
}

// ─── Decorative ambient background (concentric rings + dotgrid) ────
function AmbientBackdrop() {
  return (
    <>
      <div className="pg-dotgrid" style={{
        position: "absolute", inset: 0, opacity: 0.5,
      }} />
      <div className="pg-fade-radial" style={{ position: "absolute", inset: 0 }} />
      <svg style={{ position: "absolute", top: "60px", left: "80px", width: "280px", height: "280px", opacity: 0.18 }} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="none" stroke={c.indigo} strokeWidth="0.5"/>
        <circle cx="100" cy="100" r="60" fill="none" stroke={c.indigo} strokeWidth="0.5"/>
        <circle cx="100" cy="100" r="40" fill="none" stroke={c.indigo} strokeWidth="0.5"/>
        <circle cx="100" cy="100" r="20" fill="none" stroke={c.indigo} strokeWidth="0.5"/>
      </svg>
      <svg style={{ position: "absolute", bottom: "40px", right: "60px", width: "240px", height: "240px", opacity: 0.15 }} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="none" stroke={c.successDeep} strokeWidth="0.5"/>
        <circle cx="100" cy="100" r="65" fill="none" stroke={c.successDeep} strokeWidth="0.5"/>
        <circle cx="100" cy="100" r="40" fill="none" stroke={c.successDeep} strokeWidth="0.5"/>
      </svg>
    </>
  );
}

// ─── Header (logo + secondary nav, common to all views) ────
function AuthHeader({ rightSlot }) {
  return (
    <div style={{
      position: "relative", padding: "22px 32px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
        <div style={{
          width: "30px", height: "30px", background: c.ink, borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF",
        }}><Icon.Bolt size={18} /></div>
        <span style={{ fontSize: "15px", fontWeight: 500, color: c.text, letterSpacing: "-0.01em" }}>PayGateway</span>
      </div>
      {rightSlot}
    </div>
  );
}

// ─── Auth card wrapper (frosted) ───────────────────────────
function AuthCard({ children, style }) {
  return (
    <div style={{
      background: c.surface, border: `1px solid ${c.border}`,
      borderRadius: "16px", padding: "28px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(10,10,10,0.04)",
      ...style,
    }}>{children}</div>
  );
}

// ═════════════════════════════════════════════════════════════
//  Main component
// ═════════════════════════════════════════════════════════════
export default function OnboardingPage() {
  const { login } = useAuth();
  const [view, setView] = useState("login"); // "login" | "forgot" | "reset" | "register"

  // ─── Register state ──────────────────────────────────────
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", callbackUrl: "" });
  const [regErrors, setRegErrors] = useState({});
  const [regResult, setRegResult] = useState(null);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // ─── Login state ─────────────────────────────────────────
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ─── Forgot state ────────────────────────────────────────
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // ─── Reset state ─────────────────────────────────────────
  const [resetToken, setResetToken] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetErrors, setResetErrors] = useState({});
  const [resetResult, setResetResult] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // ─── Handlers (unchanged from original) ──────────────────
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

  // ─── Top-right header content (changes per view) ────────
  const headerRight = view === "login" ? (
    <div style={{ display: "flex", gap: "20px", alignItems: "center", fontSize: "13px", color: c.textMuted }}>
      <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: c.successText }}>
        <StatusDot /> All systems normal
      </span>
    </div>
  ) : view === "register" ? (
    <div style={{ fontSize: "13px", color: c.textMuted }}>
      Already have an account?{" "}
      <LinkBtn onClick={() => setView("login")}>Sign in</LinkBtn>
    </div>
  ) : (
    <button onClick={() => setView("login")} style={{
      background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: c.textMuted,
      display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: "inherit", padding: 0,
    }}>
      <Icon.ArrowLeft size={14} /> Back to sign in
    </button>
  );

  return (
    <div style={{
      minHeight: "100vh", position: "relative",
      background: c.bg, overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <AmbientBackdrop />

      {/* Foreground stack */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <AuthHeader rightSlot={headerRight} />

        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "30px 20px 60px",
        }}>
          <div style={{ width: "100%", maxWidth: view === "register" ? "440px" : "400px" }}>

            {/* ═══ LOGIN ═══════════════════════════════════ */}
            {view === "login" && (
              <>
                <div style={{ textAlign: "center", marginBottom: "26px" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "4px 12px", background: "rgba(255,255,255,0.7)",
                    border: `1px solid ${c.border}`, borderRadius: radius.pill,
                    fontSize: "11.5px", color: "#44403C", fontWeight: 500,
                    marginBottom: "20px", backdropFilter: "blur(8px)",
                  }}>
                    <Icon.ShieldCheck size={13} />
                    <span>PCI DSS compliant · SOC 2 Type II</span>
                  </div>
                  <h1 style={{ fontSize: "30px", fontWeight: 500, letterSpacing: "-0.025em",
                                margin: "0 0 8px", lineHeight: 1.15, color: c.text }}>
                    Sign in to PayGateway
                  </h1>
                  <p style={{ fontSize: "14px", color: c.textDim, margin: 0 }}>
                    Welcome back. Access your merchant dashboard.
                  </p>
                </div>

                <AuthCard>
                  <Field label="Email" error={loginErrors.email}>
                    <Input icon={<Icon.Mail size={15} />} type="email" placeholder="admin@company.com"
                      hasError={!!loginErrors.email}
                      value={loginForm.email}
                      onChange={(e) => { setLoginForm({ ...loginForm, email: e.target.value }); setLoginErrors({ ...loginErrors, email: "" }); }} />
                  </Field>

                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "12.5px", fontWeight: 500, color: "#44403C" }}>Password</label>
                      <LinkBtn onClick={() => setView("forgot")}>Forgot password?</LinkBtn>
                    </div>
                    <Input icon={<Icon.Lock size={15} />} type="password" placeholder="Enter your password"
                      hasError={!!loginErrors.password}
                      value={loginForm.password}
                      onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); setLoginErrors({ ...loginErrors, password: "" }); }}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
                    {loginErrors.password && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "5px", color: c.dangerText, fontSize: "11.5px" }}>
                        <Icon.Alert size={12} />{loginErrors.password}
                      </div>
                    )}
                  </div>

                  <Button variant="primary" size="lg" style={{ width: "100%", marginTop: "8px" }}
                    onClick={handleLogin} disabled={loginLoading} loading={loginLoading}
                    iconRight={!loginLoading && <Icon.ArrowRight size={14} />}>
                    {loginLoading ? "Signing in" : "Sign in"}
                  </Button>

                  {loginError && <ErrorBox message={loginError} />}
                </AuthCard>

                <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: c.textDim }}>
                  New to PayGateway?{" "}
                  <button onClick={() => setView("register")} style={{
                    background: "none", border: "none", color: c.text, cursor: "pointer",
                    fontWeight: 500, fontSize: "13px", fontFamily: "inherit",
                    textDecoration: "underline", textUnderlineOffset: "3px",
                  }}>Create an account →</button>
                </div>

                <div style={{
                  marginTop: "20px", padding: "10px 14px",
                  background: "rgba(255,255,255,0.7)", border: `1px solid ${c.border}`,
                  borderRadius: radius.lg, display: "flex", alignItems: "center", gap: "8px",
                  backdropFilter: "blur(8px)",
                }}>
                  <Icon.Shield size={14} />
                  <span style={{ fontSize: "11.5px", color: c.textMuted }}>
                    Session expires in 24 hours · Secured with JWT
                  </span>
                </div>
              </>
            )}

            {/* ═══ FORGOT ══════════════════════════════════ */}
            {view === "forgot" && (
              <>
                <div style={{ textAlign: "center", marginBottom: "26px" }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "14px",
                    background: c.surface, border: `1px solid ${c.border}`,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "18px", color: c.indigo,
                  }}><Icon.Key size={24} /></div>
                  <h1 style={{ fontSize: "26px", fontWeight: 500, letterSpacing: "-0.025em",
                                margin: "0 0 8px", lineHeight: 1.2, color: c.text }}>
                    Forgot your password?
                  </h1>
                  <p style={{ fontSize: "14px", color: c.textDim, margin: 0, lineHeight: 1.55 }}>
                    Enter your registered email and we'll send a secure reset token valid for 15 minutes.
                  </p>
                </div>

                <AuthCard>
                  <Field label="Registered email" error={forgotEmailError}>
                    <Input icon={<Icon.Mail size={15} />} type="email" placeholder="admin@company.com"
                      hasError={!!forgotEmailError}
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotEmailError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleForgot()} />
                  </Field>

                  <Button variant="primary" size="lg" style={{ width: "100%", marginTop: "4px", marginBottom: "8px" }}
                    onClick={handleForgot} disabled={forgotLoading} loading={forgotLoading}
                    iconRight={!forgotLoading && <Icon.Send size={13} />}>
                    {forgotLoading ? "Sending" : "Send reset token"}
                  </Button>
                  <Button variant="light" size="lg" style={{ width: "100%" }} onClick={() => setView("login")}>
                    Cancel
                  </Button>

                  {forgotError && <ErrorBox message={forgotError} />}
                </AuthCard>

                <div style={{
                  marginTop: "16px", padding: "12px 14px",
                  background: "rgba(255,255,255,0.7)", border: `1px solid ${c.border}`,
                  borderRadius: radius.lg, display: "flex", gap: "10px",
                  backdropFilter: "blur(8px)",
                }}>
                  <div style={{ color: c.indigo, flexShrink: 0, marginTop: "1px" }}><Icon.Info size={15} /></div>
                  <div style={{ fontSize: "12px", color: "#57534E", lineHeight: 1.55 }}>
                    For your security, reset tokens expire in 15 minutes and can only be used once. Check your spam folder if the email doesn't arrive.
                  </div>
                </div>
              </>
            )}

            {/* ═══ RESET ═══════════════════════════════════ */}
            {view === "reset" && (
              <>
                <div style={{ textAlign: "center", marginBottom: "22px" }}>
                  <h1 style={{ fontSize: "26px", fontWeight: 500, letterSpacing: "-0.025em",
                                margin: "0 0 8px", lineHeight: 1.2, color: c.text }}>
                    Reset your password
                  </h1>
                  <p style={{ fontSize: "14px", color: c.textDim, margin: 0 }}>
                    Paste the token from your email and choose a new password.
                  </p>
                </div>

                <AuthCard>
                  <SuccessBox style={{ marginBottom: "18px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <Icon.Check size={15} />
                    <div>
                      <div style={{ fontWeight: 500 }}>Token sent to {forgotEmail || "your email"}</div>
                      <div style={{ fontSize: "11.5px", marginTop: "2px", color: "#065F46" }}>
                        Check your inbox · expires in 15 minutes
                      </div>
                    </div>
                  </SuccessBox>

                  <Field label="Reset token" error={resetErrors.token}>
                    <Input icon={<Icon.Key size={15} />} placeholder="Paste token from email"
                      hasError={!!resetErrors.token}
                      value={resetToken}
                      onChange={(e) => { setResetToken(e.target.value); setResetErrors({ ...resetErrors, token: "" }); }} />
                  </Field>
                  <Field label="New password" error={resetErrors.password}>
                    <Input icon={<Icon.Lock size={15} />} type="password" placeholder="Minimum 8 characters"
                      hasError={!!resetErrors.password}
                      value={resetPass}
                      onChange={(e) => { setResetPass(e.target.value); setResetErrors({ ...resetErrors, password: "" }); }} />
                  </Field>
                  <Field label="Confirm password" error={resetErrors.confirm}>
                    <Input icon={<Icon.Lock size={15} />} type="password" placeholder="Re-enter password"
                      hasError={!!resetErrors.confirm}
                      value={resetConfirm}
                      onChange={(e) => { setResetConfirm(e.target.value); setResetErrors({ ...resetErrors, confirm: "" }); }}
                      onKeyDown={(e) => e.key === "Enter" && handleReset()} />
                  </Field>

                  <Button variant="primary" size="lg" style={{ width: "100%", marginTop: "4px", marginBottom: "8px" }}
                    onClick={handleReset} disabled={resetLoading} loading={resetLoading}>
                    {resetLoading ? "Resetting" : "Reset password"}
                  </Button>
                  <Button variant="light" size="lg" style={{ width: "100%" }} onClick={() => setView("login")}>
                    Back to sign in
                  </Button>

                  {resetResult && (
                    <SuccessBox style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon.Check size={14} />{resetResult}
                    </SuccessBox>
                  )}
                  {resetError && <ErrorBox message={resetError} />}
                </AuthCard>
              </>
            )}

            {/* ═══ REGISTER ════════════════════════════════ */}
            {view === "register" && (
              <>
                <div style={{ textAlign: "center", marginBottom: "22px" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "4px 12px", background: "rgba(255,255,255,0.7)",
                    border: `1px solid ${c.border}`, borderRadius: radius.pill,
                    fontSize: "11.5px", color: "#44403C", fontWeight: 500,
                    marginBottom: "18px", backdropFilter: "blur(8px)",
                  }}>
                    <span style={{ color: c.indigo, display: "flex" }}><Icon.Bolt size={13} /></span>
                    <span>No setup fees · pay per transaction</span>
                  </div>
                  <h1 style={{ fontSize: "28px", fontWeight: 500, letterSpacing: "-0.025em",
                                margin: "0 0 8px", lineHeight: 1.2, color: c.text }}>
                    Create your account
                  </h1>
                  <p style={{ fontSize: "14px", color: c.textDim, margin: 0 }}>
                    Start accepting payments in minutes.
                  </p>
                </div>

                <AuthCard>
                  <Field label="Business name" error={regErrors.name}>
                    <Input icon={<Icon.Building size={15} />} placeholder="Acme Technologies Pvt Ltd"
                      hasError={!!regErrors.name}
                      value={regForm.name}
                      onChange={(e) => { setRegForm({ ...regForm, name: e.target.value }); setRegErrors({ ...regErrors, name: "" }); }} />
                  </Field>
                  <Field label="Business email" error={regErrors.email}>
                    <Input icon={<Icon.Mail size={15} />} type="email" placeholder="admin@acmetechnologies.com"
                      hasError={!!regErrors.email}
                      value={regForm.email}
                      onChange={(e) => { setRegForm({ ...regForm, email: e.target.value }); setRegErrors({ ...regErrors, email: "" }); }} />
                  </Field>
                  <Field label="Password" error={regErrors.password}>
                    <Input icon={<Icon.Lock size={15} />} type="password" placeholder="Minimum 8 characters"
                      hasError={!!regErrors.password}
                      value={regForm.password}
                      onChange={(e) => { setRegForm({ ...regForm, password: e.target.value }); setRegErrors({ ...regErrors, password: "" }); }} />
                  </Field>
                  <Field label="Webhook callback URL" error={regErrors.callbackUrl} hint="We'll send payment events here · must start with https://">
                    <Input icon={<Icon.Link size={15} />} placeholder="https://yourapp.com/webhooks"
                      hasError={!!regErrors.callbackUrl}
                      value={regForm.callbackUrl}
                      onChange={(e) => { setRegForm({ ...regForm, callbackUrl: e.target.value }); setRegErrors({ ...regErrors, callbackUrl: "" }); }} />
                  </Field>

                  <Button variant="primary" size="lg" style={{ width: "100%", marginTop: "4px" }}
                    onClick={handleRegister} disabled={regLoading} loading={regLoading}
                    iconRight={!regLoading && <Icon.ArrowRight size={14} />}>
                    {regLoading ? "Creating" : "Create account"}
                  </Button>

                  {regResult && (
                    <div style={{
                      background: c.successBg, border: `1px solid ${c.successBorder}`,
                      borderRadius: radius.lg, padding: "14px", marginTop: "14px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                        <Icon.Check size={15} />
                        <span style={{ color: c.successText, fontSize: "13px", fontWeight: 500 }}>
                          Account created — save your API key
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#065F46", marginBottom: "6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        API key
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        background: c.surface, border: `1px solid ${c.successBorder}`,
                        borderRadius: radius.md, padding: "8px 10px",
                      }}>
                        <code style={{ fontSize: "11px", color: "#065F46", flex: 1,
                                        wordBreak: "break-all", fontFamily: "'JetBrains Mono', monospace" }}>
                          {regResult.apiKey}
                        </code>
                        <button onClick={() => {
                          navigator.clipboard.writeText(regResult.apiKey);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }} style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: copied ? c.successText : c.textDim, flexShrink: 0,
                          display: "flex", alignItems: "center", padding: "4px",
                        }}>
                          {copied ? <Icon.Check size={14} /> : <Icon.Copy size={14} />}
                        </button>
                      </div>
                      <div style={{ fontSize: "11px", color: "#065F46", marginTop: "8px" }}>
                        Store it securely — this is the only time we show it.
                      </div>
                    </div>
                  )}
                  {regError && <ErrorBox message={regError} />}
                </AuthCard>

                <div style={{ marginTop: "14px", fontSize: "11.5px", color: c.textDim, textAlign: "center", lineHeight: 1.55 }}>
                  By creating an account you agree to our{" "}
                  <a style={{ color: c.text, cursor: "pointer", textDecoration: "underline" }}>Terms</a>{" "}and{" "}
                  <a style={{ color: c.text, cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</a>.
                </div>
              </>
            )}

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "22px", fontSize: "11px", color: c.textFaint }}>
              Deployed on AWS EC2 · Distributed microservices
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
