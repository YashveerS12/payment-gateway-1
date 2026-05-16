import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import PaymentsPage from "./pages/PaymentsPage";
import ReconPage from "./pages/ReconPage";
import WebhooksPage from "./pages/WebhooksPage";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⬛" },
  { id: "payments", label: "Payments", icon: "💳" },
  { id: "recon", label: "Reconciliation", icon: "📊" },
  { id: "webhooks", label: "Webhooks", icon: "🔔" },
];

const styles = {
  app: { display: "flex", height: "100vh", background: "#0a0b0f", color: "#e2e8f0", fontFamily: "'DM Mono', 'Fira Code', monospace", overflow: "hidden" },
  sidebar: { width: "220px", background: "#0f1117", borderRight: "1px solid #1e2235", display: "flex", flexDirection: "column", flexShrink: 0 },
  logo: { padding: "24px 20px", borderBottom: "1px solid #1e2235" },
  logoText: { fontSize: "14px", fontWeight: "600", color: "#60a5fa", letterSpacing: "0.1em", textTransform: "uppercase" },
  logoSub: { fontSize: "11px", color: "#475569", marginTop: "4px", letterSpacing: "0.05em" },
  nav: { padding: "16px 12px", flex: 1 },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: active ? "#60a5fa" : "#64748b", background: active ? "#1e3a5f20" : "transparent", marginBottom: "4px", border: active ? "1px solid #1e3a5f40" : "1px solid transparent", transition: "all 0.15s", letterSpacing: "0.03em" }),
  main: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" },
  topbar: { padding: "16px 28px", borderBottom: "1px solid #1e2235", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f1117", flexShrink: 0 },
  pageTitle: { fontSize: "13px", color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" },
  merchantBadge: { background: "#1a1d2e", border: "1px solid #1e2235", borderRadius: "4px", padding: "6px 14px", fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px", letterSpacing: "0.05em" },
  content: { flex: 1, overflowY: "auto", padding: "28px" },
  connStatus: { padding: "16px 20px", borderTop: "1px solid #1e2235" },
  logoutBtn: { padding: "14px 20px", borderTop: "1px solid #1e2235", cursor: "pointer", fontSize: "12px", color: "#475569", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "8px", transition: "color 0.15s" },
};

const pageTitles = { dashboard: "Overview", payments: "Payments", recon: "Reconciliation", webhooks: "Webhooks" };

const AppInner = () => {
  const { token, merchant, logout } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (!token) return <OnboardingPage />;

  const pages = { dashboard: <DashboardPage />, payments: <PaymentsPage />, recon: <ReconPage />, webhooks: <WebhooksPage /> };

  return (
    <div style={styles.app}>
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoText}>⚡ PayGateway</div>
          <div style={styles.logoSub}>Merchant Portal v1.0</div>
        </div>
        <nav style={styles.nav}>
          {NAV.map(item => (
            <div key={item.id} style={styles.navItem(page === item.id)} onClick={() => setPage(item.id)}>
              <span>{item.icon}</span>{item.label}
            </div>
          ))}
        </nav>
        <div style={styles.connStatus}>
          <div style={{ fontSize: "11px", color: "#334155", marginBottom: "4px" }}>Connected</div>
          <div style={{ fontSize: "12px", color: "#34d399", letterSpacing: "0.05em" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", display: "inline-block", marginRight: "6px" }}></span>
            localhost:8080
          </div>
        </div>
        <div style={styles.logoutBtn} onClick={logout}>🚪 Sign out</div>
      </div>

      <div style={styles.main}>
        <div style={styles.topbar}>
          <div style={styles.pageTitle}>{pageTitles[page]}</div>
          <div style={styles.merchantBadge}>🏪 {merchant?.name || "Merchant"}</div>
        </div>
        <div style={styles.content}>{pages[page]}</div>
      </div>
    </div>
  );
};

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
