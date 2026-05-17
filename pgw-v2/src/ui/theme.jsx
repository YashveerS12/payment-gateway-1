// ─────────────────────────────────────────────────────────────
//  PayGateway design system — central tokens + primitives
//  Reused across every page so the look stays consistent.
// ─────────────────────────────────────────────────────────────

export const c = {
  // surfaces
  bg:        "#FAFAF9",     // page background (warm off-white)
  surface:   "#FFFFFF",     // cards
  surfaceMuted: "#F5F5F4",  // chips, hovers, dividers
  surfaceSubtle: "#FAFAF9", // alt rows, inset boxes

  // borders
  border:    "#E7E5E4",
  borderStrong: "#D6D3D1",
  divider:   "#F5F5F4",

  // text
  text:      "#0A0A0A",     // primary
  textMuted: "#525252",     // secondary
  textDim:   "#78716C",     // tertiary
  textFaint: "#A8A29E",     // disabled / placeholder

  // brand
  ink:       "#0A0A0A",     // primary button bg
  inkHover:  "#27272A",
  indigo:    "#4F46E5",
  indigoHover: "#4338CA",
  indigoBg:  "#EEF2FF",     // light indigo tint

  // semantic
  successText: "#047857",
  successBg:   "#ECFDF5",
  successBorder: "#A7F3D0",
  successDeep: "#10B981",

  warningText: "#92400E",
  warningBg:   "#FEF3C7",
  warningDeep: "#F59E0B",

  dangerText: "#B91C1C",
  dangerBg:   "#FEE2E2",
  dangerDeep: "#EF4444",

  infoText:   "#1D4ED8",
  infoBg:     "#DBEAFE",
};

export const font = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
  mono: "'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace",
};

export const radius = { sm: "6px", md: "8px", lg: "10px", xl: "12px", xxl: "16px", pill: "999px" };

// ─── Tabler-style outline icons (single source) ──────────────
// Strokes inherit color via currentColor; size with the `size` prop.
const ic = (size, children) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

export const Icon = {
  Bolt:        ({ size = 16 }) => ic(size, <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />),
  Dashboard:   ({ size = 16 }) => ic(size, <><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></>),
  Card:        ({ size = 16 }) => ic(size, <><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></>),
  File:        ({ size = 16 }) => ic(size, <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></>),
  Webhook:     ({ size = 16 }) => ic(size, <><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/></>),
  Logout:      ({ size = 16 }) => ic(size, <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></>),
  ArrowRight:  ({ size = 16 }) => ic(size, <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>),
  ArrowLeft:   ({ size = 16 }) => ic(size, <><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>),
  ChevronLeft: ({ size = 16 }) => ic(size, <path d="m15 18-6-6 6-6" />),
  ChevronRight:({ size = 16 }) => ic(size, <path d="m9 18 6-6-6-6" />),
  Menu:        ({ size = 18 }) => ic(size, <><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></>),
  Check:       ({ size = 14 }) => ic(size, <polyline points="20 6 9 17 4 12" />),
  X:           ({ size = 14 }) => ic(size, <><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></>),
  Plus:        ({ size = 14 }) => ic(size, <><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></>),
  Mail:        ({ size = 16 }) => ic(size, <><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>),
  Lock:        ({ size = 16 }) => ic(size, <><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>),
  Building:    ({ size = 16 }) => ic(size, <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>),
  Link:        ({ size = 16 }) => ic(size, <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>),
  Key:         ({ size = 16 }) => ic(size, <><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></>),
  Shield:      ({ size = 16 }) => ic(size, <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />),
  ShieldCheck: ({ size = 16 }) => ic(size, <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>),
  Search:      ({ size = 16 }) => ic(size, <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>),
  Refresh:     ({ size = 14 }) => ic(size, <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>),
  Copy:        ({ size = 14 }) => ic(size, <><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></>),
  Download:    ({ size = 14 }) => ic(size, <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></>),
  Play:        ({ size = 14 }) => ic(size, <polygon points="5 3 19 12 5 21 5 3" />),
  Info:        ({ size = 14 }) => ic(size, <><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></>),
  Alert:       ({ size = 14 }) => ic(size, <><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></>),
  Clock:       ({ size = 14 }) => ic(size, <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),
  Bank:        ({ size = 16 }) => ic(size, <><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></>),
  Send:        ({ size = 14 }) => ic(size, <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>),
  Trash:       ({ size = 14 }) => ic(size, <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>),
  Database:    ({ size = 14 }) => ic(size, <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></>),
  TrendingUp:  ({ size = 14 }) => ic(size, <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>),
  Dots:        ({ size = 14 }) => ic(size, <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>),
  Settings:    ({ size = 16 }) => ic(size, <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  Book:        ({ size = 16 }) => ic(size, <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>),
  Mobile:      ({ size = 18 }) => ic(size, <><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></>),
  Activity:    ({ size = 16 }) => ic(size, <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />),
  Selector:    ({ size = 14 }) => ic(size, <><polyline points="8 7 12 3 16 7"/><polyline points="8 17 12 21 16 17"/></>),
  Eye:         ({ size = 14 }) => ic(size, <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>),
  EyeOff:      ({ size = 14 }) => ic(size, <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></>),
};

// ─── Primitive components ────────────────────────────────────

export function Card({ children, padded = true, style, ...rest }) {
  return (
    <div style={{
      background: c.surface, border: `1px solid ${c.border}`,
      borderRadius: radius.xl, padding: padded ? "20px" : 0, ...style,
    }} {...rest}>{children}</div>
  );
}

export function Button({ variant = "primary", size = "md", icon, iconRight, loading, disabled, children, style, ...rest }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
    fontFamily: "inherit", fontWeight: 500, cursor: (disabled || loading) ? "not-allowed" : "pointer",
    borderRadius: radius.lg, transition: "all 0.15s ease", whiteSpace: "nowrap",
    opacity: (disabled || loading) ? 0.55 : 1, border: "1px solid transparent",
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: "12.5px" },
    md: { padding: "9px 14px", fontSize: "13.5px" },
    lg: { padding: "11px 18px", fontSize: "14px" },
    icon: { padding: "8px", fontSize: "13.5px" },
  };
  const variants = {
    primary:  { background: c.ink,    color: "#FFFFFF" },
    indigo:   { background: c.indigo, color: "#FFFFFF" },
    light:    { background: c.surface, color: c.text, border: `1px solid ${c.border}` },
    ghost:    { background: "transparent", color: c.textMuted },
    danger:   { background: "transparent", color: c.dangerText, border: `1px solid ${c.dangerBg}` },
  };
  return (
    <button disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }} {...rest}>
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      {loading ? "…" : children}
      {iconRight && <span style={{ display: "inline-flex" }}>{iconRight}</span>}
    </button>
  );
}

export const inputStyle = (hasError) => ({
  width: "100%", boxSizing: "border-box",
  padding: "10px 12px", fontSize: "13.5px", fontFamily: "inherit",
  border: `1px solid ${hasError ? "#FCA5A5" : c.border}`, borderRadius: radius.lg,
  outline: "none", background: hasError ? "#FEF2F2" : c.surface, color: c.text,
  transition: "border-color 0.15s, box-shadow 0.15s",
});

export function Input({ icon, hasError, leftPad, style, ...rest }) {
  const pad = icon ? "10px 12px 10px 38px" : "10px 12px";
  return (
    <div style={{ position: "relative" }}>
      {icon && (
        <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                      color: hasError ? c.dangerDeep : c.textDim, pointerEvents: "none",
                      display: "flex", alignItems: "center" }}>{icon}</div>
      )}
      <input
        style={{ ...inputStyle(hasError), padding: pad, ...style }}
        onFocus={(e) => {
          if (!hasError) {
            e.target.style.borderColor = c.indigo;
            e.target.style.boxShadow = `0 0 0 3px ${c.indigoBg}`;
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = hasError ? "#FCA5A5" : c.border;
          e.target.style.boxShadow = "none";
        }}
        {...rest} />
    </div>
  );
}

export function Select({ children, hasError, style, ...rest }) {
  return (
    <select
      style={{ ...inputStyle(hasError), appearance: "none",
               backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2378716C' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
               backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
               paddingRight: "32px", ...style }}
      {...rest}>{children}</select>
  );
}

export function Field({ label, hint, error, optional, children }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <label style={{ fontSize: "12.5px", fontWeight: 500, color: "#44403C" }}>
            {label}
            {optional && <span style={{ color: c.textDim, fontWeight: 400, marginLeft: "6px" }}>· {optional}</span>}
          </label>
        </div>
      )}
      {children}
      {error && <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "5px", color: c.dangerText, fontSize: "11.5px" }}><Icon.Alert size={12} />{error}</div>}
      {hint && !error && <div style={{ marginTop: "5px", color: c.textDim, fontSize: "11.5px" }}>{hint}</div>}
    </div>
  );
}

export function Badge({ kind = "neutral", children, dot = false, style }) {
  const kinds = {
    success: { background: c.successBg, color: c.successText },
    warning: { background: c.warningBg, color: c.warningText },
    danger:  { background: c.dangerBg,  color: c.dangerText },
    info:    { background: c.infoBg,    color: c.infoText },
    neutral: { background: c.surfaceMuted, color: "#44403C" },
    indigo:  { background: c.indigoBg, color: c.indigo },
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: "11px", fontWeight: 500, padding: "3px 8px",
      borderRadius: radius.sm, ...kinds[kind], ...style,
    }}>
      {dot && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "currentColor" }} />}
      {children}
    </span>
  );
}

export function StatusDot({ color = c.successDeep }) {
  return (
    <span style={{
      width: "6px", height: "6px", borderRadius: "50%", background: color,
      boxShadow: `0 0 0 3px ${color}26`, display: "inline-block",
    }} />
  );
}

export function MetricCard({ label, value, sub, valueColor, accent }) {
  return (
    <div style={{
      background: c.surface, border: `1px solid ${c.border}`,
      borderRadius: radius.xl, padding: "16px",
      borderLeft: accent ? `2px solid ${accent}` : `1px solid ${c.border}`,
    }}>
      <div style={{ fontSize: "11.5px", fontWeight: 500, color: c.textDim }}>{label}</div>
      <div style={{ fontSize: "26px", fontWeight: 500, color: valueColor || c.text, letterSpacing: "-0.02em", margin: "6px 0 4px" }}>{value}</div>
      {sub && <div style={{ fontSize: "11.5px", color: c.textDim, display: "flex", alignItems: "center", gap: "4px" }}>{sub}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{
        width: "44px", height: "44px", borderRadius: radius.xl,
        background: c.indigoBg, display: "inline-flex",
        alignItems: "center", justifyContent: "center", marginBottom: "14px",
        color: c.indigo,
      }}>{icon}</div>
      <h3 style={{ fontSize: "15px", fontWeight: 500, margin: "0 0 4px", color: c.text }}>{title}</h3>
      {description && (
        <p style={{ fontSize: "13px", color: c.textDim, margin: "0 0 18px",
                    maxWidth: "340px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.55 }}>{description}</p>
      )}
      {action}
    </div>
  );
}

export function Toast({ kind = "success", children, onClose }) {
  const kinds = {
    success: { bg: c.successBg, border: c.successBorder, color: c.successText, icon: <Icon.Check size={14} /> },
    danger:  { bg: c.dangerBg,  border: "#FCA5A5",       color: c.dangerText,  icon: <Icon.X size={14} /> },
    info:    { bg: c.indigoBg,  border: "#C7D2FE",       color: c.indigo,      icon: <Icon.Info size={14} /> },
  };
  const k = kinds[kind];
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
      background: k.bg, border: `1px solid ${k.border}`, color: k.color,
      borderRadius: radius.lg, padding: "10px 14px", fontSize: "13px", fontWeight: 500,
      display: "flex", alignItems: "center", gap: "8px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    }}>
      {k.icon}<span>{children}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", marginLeft: "4px" }}>
          <Icon.X size={12} />
        </button>
      )}
    </div>
  );
}

// ─── Mappers (data → visual kind) ────────────────────────────

export const paymentBadge = (status) => {
  const m = {
    SUCCESS:    { kind: "success", icon: <Icon.Check size={11} />, label: "Succeeded" },
    FAILED:     { kind: "danger",  icon: <Icon.X size={11} />,     label: "Failed" },
    PROCESSING: { kind: "warning", icon: <Icon.Clock size={11} />, label: "Processing" },
    INITIATED:  { kind: "info",    icon: <Icon.Clock size={11} />, label: "Initiated" },
  };
  return m[status] || { kind: "neutral", icon: null, label: status || "—" };
};

export const webhookBadge = (status) => {
  const m = {
    DELIVERED: { kind: "success", icon: <Icon.Check size={11} />, label: "Delivered" },
    FAILED:    { kind: "danger",  icon: <Icon.X size={11} />,     label: "Failed" },
    PENDING:   { kind: "warning", icon: <Icon.Clock size={11} />, label: "Pending" },
  };
  return m[status] || { kind: "neutral", icon: null, label: status || "—" };
};

export const reconBadge = (type) => {
  const m = {
    AMOUNT_MISMATCH:   { kind: "warning", label: "Amount mismatch" },
    MISSING_IN_LEDGER: { kind: "danger",  label: "Missing in ledger" },
    MISSING_IN_DB:     { kind: "danger",  label: "Missing in DB" },
    STATUS_MISMATCH:   { kind: "info",    label: "Status mismatch" },
    DUPLICATE:         { kind: "indigo",  label: "Duplicate" },
    RESOLVED:          { kind: "success", label: "Resolved" },
    UNRESOLVED:        { kind: "danger",  label: "Unresolved" },
    Clean:             { kind: "success", label: "Clean" },
    Review:            { kind: "warning", label: "Review" },
  };
  return m[type] || { kind: "neutral", label: (type || "—").replace(/_/g, " ") };
};
