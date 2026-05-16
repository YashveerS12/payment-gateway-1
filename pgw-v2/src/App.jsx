import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import PaymentsPage from "./pages/PaymentsPage";
import ReconPage from "./pages/ReconPage";
import WebhooksPage from "./pages/WebhooksPage";

// ─── Icons ────────────────────────────────────────────────
const Icon = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
    </svg>
  ),
  Payments: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  ),
  Recon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>
    </svg>
  ),
  Webhooks: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/>
    </svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
    </svg>
  ),
  Menu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  ),
  Zap: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  Circle: () => (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="#22c55e" stroke="none">
      <circle cx="12" cy="12" r="12"/>
    </svg>
  ),
};

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <Icon.Dashboard /> },
  { id: "payments", label: "Payments", icon: <Icon.Payments /> },
  { id: "recon", label: "Reconciliation", icon: <Icon.Recon /> },
  { id: "webhooks", label: "Webhooks", icon: <Icon.Webhooks /> },
];

export default function App() {
  const { token, merchant, logout } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!token) return <OnboardingPage />;

  const currentPage = navItems.find(n => n.id === page);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fb", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? "240px" : "72px",
        background: "white",
        borderRight: "1px solid #f1f5f9",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        boxShadow: "1px 0 0 #f1f5f9",
      }}>

        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "65px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
            <div style={{ width: "32px", height: "32px", background: "#3b82f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
              <Icon.Zap />
            </div>
            {sidebarOpen && (
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>PayGateway</span>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px", borderRadius: "6px", display: "flex", flexShrink: 0 }}>
            {sidebarOpen ? <Icon.ChevronLeft /> : <Icon.Menu />}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {navItems.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
                background: active ? "#eff6ff" : "none",
                color: active ? "#3b82f6" : "#64748b",
                fontSize: "14px", fontWeight: active ? "600" : "500",
                fontFamily: "inherit", textAlign: "left",
                marginBottom: "2px", transition: "all 0.15s",
                whiteSpace: "nowrap", overflow: "hidden",
              }}>
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
                {active && sidebarOpen && <span style={{ marginLeft: "auto", width: "6px", height: "6px", background: "#3b82f6", borderRadius: "50%" }} />}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid #f1f5f9" }}>
          {sidebarOpen && (
            <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#f8fafc", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", background: "#dbeafe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", flexShrink: 0 }}>
                  <Icon.User />
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{merchant?.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Icon.Circle />
                    <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: "500" }}>Connected</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button onClick={logout} style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 12px", borderRadius: "8px", border: "none", cursor: "pointer",
            background: "none", color: "#ef4444", fontSize: "14px", fontWeight: "500",
            fontFamily: "inherit", whiteSpace: "nowrap", overflow: "hidden",
          }}>
            <span style={{ flexShrink: 0 }}><Icon.Logout /></span>
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <div style={{ height: "65px", background: "white", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", padding: "0 32px", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.02em", margin: 0 }}>
              {currentPage?.label}
            </h1>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "1px" }}>
              {merchant?.name} · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ padding: "6px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon.Circle />
              <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "600" }}>All systems operational</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          {page === "dashboard" && <DashboardPage />}
          {page === "payments" && <PaymentsPage />}
          {page === "recon" && <ReconPage />}
          {page === "webhooks" && <WebhooksPage />}
        </div>
      </div>
    </div>
  );
}