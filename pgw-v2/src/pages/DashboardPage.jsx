import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { listPayments, getReconSummary } from "../services/api";

const s = {
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" },
  statCard: { background: "#0f1117", border: "1px solid #1e2235", borderRadius: "8px", padding: "20px" },
  statLabel: { fontSize: "11px", color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" },
  statValue: (color) => ({ fontSize: "26px", fontWeight: "600", color: color || "#e2e8f0", fontFamily: "monospace" }),
  statSub: (up) => ({ fontSize: "11px", marginTop: "6px", color: up ? "#34d399" : "#f87171", letterSpacing: "0.05em" }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" },
  card: { background: "#0f1117", border: "1px solid #1e2235", borderRadius: "8px", padding: "24px", marginBottom: "20px" },
  cardTitle: { fontSize: "12px", color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "20px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { fontSize: "10px", color: "#475569", textAlign: "left", padding: "8px 0", borderBottom: "1px solid #1e2235", letterSpacing: "0.1em", textTransform: "uppercase" },
  td: { fontSize: "12px", color: "#94a3b8", padding: "12px 0", borderBottom: "1px solid #0f1117" },
  badge: (type) => {
    const c = { SUCCESS: { background: "#064e3b30", color: "#34d399" }, FAILED: { background: "#4c1d2430", color: "#f87171" }, PROCESSING: { background: "#451a0330", color: "#fbbf24" }, INITIATED: { background: "#1e3a5f30", color: "#60a5fa" } };
    return { display: "inline-block", padding: "3px 10px", borderRadius: "3px", fontSize: "10px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", ...(c[type] || c.INITIATED) };
  },
  progressWrap: { marginBottom: "14px" },
  progressRow: { display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "6px" },
  progressBar: { background: "#1e2235", borderRadius: "2px", height: "4px" },
  refreshBtn: { padding: "6px 14px", background: "transparent", border: "1px solid #1e2235", borderRadius: "4px", color: "#64748b", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" },
  empty: { textAlign: "center", color: "#475569", padding: "32px", fontSize: "13px" },
};

export default function DashboardPage() {
  const { token, merchant } = useAuth();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, processing: 0, revenue: 0 });
  const [bankStats, setBankStats] = useState({ HDFC: 0, ICICI: 0, SBI: 0 });
  const [reconSummary, setReconSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listPayments(token, 0, 100, "");
      const all = data.content || [];

      const success = all.filter(p => p.status === "SUCCESS");
      const failed = all.filter(p => p.status === "FAILED");
      const processing = all.filter(p => p.status === "PROCESSING");
      const revenue = success.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      setStats({ total: data.totalElements || all.length, success: success.length, failed: failed.length, processing: processing.length, revenue });

      const banks = { HDFC: 0, ICICI: 0, SBI: 0 };
      all.forEach(p => { const b = p.bankAdapter?.toUpperCase(); if (banks[b] !== undefined) banks[b]++; });
      setBankStats(banks);
      setPayments(all.slice(0, 5));

      const today = new Date().toISOString().split("T")[0];
      try { const r = await getReconSummary(token, today); setReconSummary(r); } catch (e) { }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : "0.0";
  const totalBanks = bankStats.HDFC + bankStats.ICICI + bankStats.SBI || 1;
  const bankPcts = { HDFC: Math.round((bankStats.HDFC / totalBanks) * 100), ICICI: Math.round((bankStats.ICICI / totalBanks) * 100), SBI: Math.round((bankStats.SBI / totalBanks) * 100) };

  if (loading) return <div style={s.empty}>Loading dashboard...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "12px", color: "#334155" }}>Welcome back, <span style={{ color: "#60a5fa" }}>{merchant?.name}</span></div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {lastUpdated && <span style={{ fontSize: "11px", color: "#334155" }}>Updated: {lastUpdated}</span>}
          <button style={s.refreshBtn} onClick={fetchData}>↻ Refresh</button>
        </div>
      </div>

      <div style={s.statsGrid}>
        {[
          { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: `${stats.success} successful payments`, up: true },
          { label: "Success Rate", value: `${successRate}%`, sub: `${stats.success} success / ${stats.total} total`, up: parseFloat(successRate) > 80, color: parseFloat(successRate) > 80 ? "#34d399" : "#f87171" },
          { label: "Total Transactions", value: stats.total.toLocaleString(), sub: `${stats.processing} processing now`, up: true },
          { label: "Failed Payments", value: stats.failed, sub: `${stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : "0.0"}% failure rate`, up: false, color: stats.failed > 0 ? "#f87171" : "#e2e8f0" },
        ].map((item) => (
          <div key={item.label} style={s.statCard}>
            <div style={s.statLabel}>{item.label}</div>
            <div style={s.statValue(item.color)}>{item.value}</div>
            <div style={s.statSub(item.up)}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={s.grid2}>
        <div style={s.card}>
          <div style={s.cardTitle}>Bank adapter usage</div>
          {stats.total === 0 ? (
            <div style={s.empty}>No transactions yet</div>
          ) : (
            [{ name: "HDFC", pct: bankPcts.HDFC, color: "#60a5fa", count: bankStats.HDFC },
             { name: "ICICI", pct: bankPcts.ICICI, color: "#8b5cf6", count: bankStats.ICICI },
             { name: "SBI", pct: bankPcts.SBI, color: "#06b6d4", count: bankStats.SBI }
            ].map(b => (
              <div key={b.name} style={s.progressWrap}>
                <div style={s.progressRow}><span>{b.name} ({b.count} txns)</span><span>{b.pct}%</span></div>
                <div style={s.progressBar}><div style={{ width: `${b.pct}%`, height: "100%", borderRadius: "2px", background: b.color }}></div></div>
              </div>
            ))
          )}
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>System status</div>
          {[
            { name: "API Gateway", port: ":8080" }, { name: "Payment Service", port: ":8081" },
            { name: "Notification Svc", port: ":3001" }, { name: "Recon Service", port: ":8082" },
            { name: "Apache Kafka", port: ":9092" }, { name: "PostgreSQL", port: ":5432" },
            { name: "Redis", port: ":6379" },
          ].map(svc => (
            <div key={svc.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1e2235", fontSize: "12px" }}>
              <span style={{ color: "#94a3b8" }}>{svc.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#334155", fontFamily: "monospace", fontSize: "11px" }}>{svc.port}</span>
                <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: "600", background: "#064e3b30", color: "#34d399" }}>UP</span>
              </div>
            </div>
          ))}
          {reconSummary && (
            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e2235" }}>
              <div style={{ fontSize: "11px", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Today's recon</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#34d399" }}>✓ {reconSummary.matched} matched</span>
                <span style={{ color: "#f87171" }}>✗ {reconSummary.mismatched} mismatched</span>
                <span style={{ padding: "2px 8px", borderRadius: "3px", fontSize: "10px", background: reconSummary.mismatched === 0 ? "#064e3b30" : "#451a0330", color: reconSummary.mismatched === 0 ? "#34d399" : "#fbbf24" }}>{reconSummary.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={s.card}>
        <div style={{ ...s.cardTitle, display: "flex", justifyContent: "space-between" }}>
          <span>Recent transactions</span>
          <span style={{ color: "#334155", fontSize: "11px" }}>Latest 5</span>
        </div>
        {payments.length === 0 ? (
          <div style={s.empty}>No transactions yet. Go to Payments to make one!</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Payment ID</th><th style={s.th}>Amount</th>
                <th style={s.th}>Bank</th><th style={s.th}>Bank Ref</th>
                <th style={s.th}>Status</th><th style={s.th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ ...s.td, fontFamily: "monospace", fontSize: "11px", color: "#60a5fa" }}>{p.id?.substring(0, 8)}...</td>
                  <td style={s.td}>₹{parseFloat(p.amount).toLocaleString("en-IN")}</td>
                  <td style={s.td}>{p.bankAdapter || "—"}</td>
                  <td style={{ ...s.td, fontFamily: "monospace", fontSize: "10px" }}>{p.bankRefId || "—"}</td>
                  <td style={s.td}><span style={s.badge(p.status)}>{p.status}</span></td>
                  <td style={{ ...s.td, color: "#475569", fontSize: "11px" }}>{new Date(p.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
