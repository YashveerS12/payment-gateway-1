import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { c, radius, Icon, StatusDot, Button } from "./ui/theme";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import PaymentsPage from "./pages/PaymentsPage";
import ReconPage from "./pages/ReconPage";
import WebhooksPage from "./pages/WebhooksPage";

const navItems = [
  { id: "dashboard", label: "Dashboard",      icon: <Icon.Dashboard /> },
  { id: "payments",  label: "Payments",       icon: <Icon.Card /> },
  { id: "recon",     label: "Reconciliation", icon: <Icon.File /> },
  { id: "webhooks",  label: "Webhooks",       icon: <Icon.Webhook /> },
];

const pageMeta = {
  dashboard: { title: "Dashboard",      subtitle: "Here's what's happening with your payments today." },
  payments:  { title: "Payments",       subtitle: "Initiate, track, and inspect every transaction." },
  recon:     { title: "Reconciliation", subtitle: "Match your records against bank settlements daily." },
  webhooks:  { title: "Webhooks",       subtitle: "Real-time event delivery with exponential backoff retries." },
};

function SidebarItem({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = c.surfaceMuted; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "10px",
        padding: "8px 10px", borderRadius: radius.md, border: "none", cursor: "pointer",
        background: active ? c.ink : "transparent",
        color: active ? "#FFFFFF" : c.textMuted,
        fontSize: "13.5px", fontWeight: active ? 500 : 450,
        textAlign: "left", marginBottom: "2px", transition: "background 0.15s, color 0.15s",
        fontFamily: "inherit",
      }}>
      <span style={{ display: "flex", color: active ? "#FFFFFF" : c.textDim, flexShrink: 0 }}>{icon}</span>
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    </button>
  );
}

function SidebarLabel({ children }) {
  return (
    <div style={{
      fontSize: "10.5px", color: c.textFaint, textTransform: "uppercase",
      letterSpacing: "0.06em", fontWeight: 500, padding: "14px 10px 6px",
    }}>{children}</div>
  );
}

function AppInner() {
  const { token, merchant, logout } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (!token) return <OnboardingPage />;

  const meta = pageMeta[page];
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: c.bg }}>

      {/* ─── Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: "232px", background: c.surface, borderRight: `1px solid ${c.border}`,
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "sticky", top: 0, height: "100vh", padding: "18px 12px",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "4px 8px", marginBottom: "12px" }}>
          <div style={{
            width: "28px", height: "28px", background: c.ink, borderRadius: "7px",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF",
          }}><Icon.Bolt size={16} /></div>
          <span style={{ fontSize: "14.5px", fontWeight: 500, color: c.text, letterSpacing: "-0.01em" }}>PayGateway</span>
        </div>

        {/* Merchant switcher */}
        <div style={{ padding: "0 4px 4px" }}>
          <div style={{
            width: "100%", padding: "8px 10px", background: c.surfaceMuted,
            border: `1px solid ${c.border}`, borderRadius: radius.lg,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
              <div style={{
                width: "26px", height: "26px", borderRadius: radius.md,
                background: c.indigoBg, color: c.indigo, display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 500,
                flexShrink: 0,
              }}>
                {(merchant?.name || "M").substring(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "12.5px", fontWeight: 500, color: c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {merchant?.name || "Merchant"}
                </div>
                <div style={{ fontSize: "10.5px", color: c.successText, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "5px", height: "5px", background: c.successDeep, borderRadius: "50%" }} />
                  Live mode
                </div>
              </div>
            </div>
            <Icon.Selector size={13} />
          </div>
        </div>

        {/* Nav */}
        <SidebarLabel>Overview</SidebarLabel>
        <nav style={{ display: "flex", flexDirection: "column" }}>
          {navItems.map(item => (
            <SidebarItem key={item.id} active={page === item.id}
                         icon={item.icon} label={item.label} onClick={() => setPage(item.id)} />
          ))}
        </nav>

        <SidebarLabel>Account</SidebarLabel>
        <SidebarItem icon={<Icon.Settings size={16} />} label="Settings" onClick={() => {}} />
        <SidebarItem icon={<Icon.Book size={16} />} label="API docs" onClick={() => {}} />

        {/* Footer */}
        <div style={{ marginTop: "auto", padding: "12px 4px 0", borderTop: `1px solid ${c.divider}` }}>
          <button onClick={logout} style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "8px 10px", borderRadius: radius.md, border: "none",
            background: "transparent", color: c.dangerText, cursor: "pointer",
            fontSize: "13px", fontWeight: 450, fontFamily: "inherit", textAlign: "left",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = c.dangerBg}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <Icon.Logout size={16} /> Sign out
          </button>
          <div style={{ marginTop: "8px", padding: "8px 10px", fontSize: "10.5px", color: c.textDim,
                        display: "flex", alignItems: "center", gap: "6px" }}>
            <StatusDot /> All systems normal
          </div>
        </div>
      </aside>

      {/* ─── Main column ─────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          height: "68px", padding: "0 32px", borderBottom: `1px solid ${c.border}`,
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 500, color: c.text, letterSpacing: "-0.02em", margin: 0 }}>
              {meta?.title}
            </h1>
            <p style={{ fontSize: "12.5px", color: c.textDim, margin: "2px 0 0" }}>
              {today} · {meta?.subtitle}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "5px 10px", background: c.successBg,
              border: `1px solid ${c.successBorder}`, borderRadius: radius.md,
              fontSize: "11.5px", fontWeight: 500, color: c.successText,
            }}>
              <StatusDot /> All systems operational
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
          {page === "dashboard" && <DashboardPage />}
          {page === "payments" && <PaymentsPage />}
          {page === "recon" && <ReconPage />}
          {page === "webhooks" && <WebhooksPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
