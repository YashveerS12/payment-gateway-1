import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { listPayments, getReconSummary } from "../services/api";
import {
  c, radius, Icon, Card, Button, Badge, StatusDot,
  MetricCard, EmptyState, paymentBadge,
} from "../ui/theme";

const services = [
  { name: "API Gateway",     port: ":8080" },
  { name: "Payment Service", port: ":8081" },
  { name: "Notification Svc",port: ":3001" },
  { name: "Recon Service",   port: ":8082" },
  { name: "Apache Kafka",    port: ":9092" },
  { name: "PostgreSQL",      port: ":5432" },
  { name: "Redis",           port: ":6379" },
];

const bankColors = { HDFC: c.indigo, ICICI: c.successDeep, SBI: c.warningDeep };

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN");
}

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
  const failureRate = stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : "0.0";
  const totalBanks = bankStats.HDFC + bankStats.ICICI + bankStats.SBI || 1;
  const bankPcts = {
    HDFC: Math.round((bankStats.HDFC / totalBanks) * 100),
    ICICI: Math.round((bankStats.ICICI / totalBanks) * 100),
    SBI: Math.round((bankStats.SBI / totalBanks) * 100),
  };

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: c.textDim, fontSize: "13px" }}>
        Loading dashboard…
      </div>
    );
  }

  return (
    <div>
      {/* Welcome strip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <div style={{ fontSize: "13.5px", color: c.textMuted }}>
          Welcome back,{" "}
          <span style={{ color: c.text, fontWeight: 500 }}>{merchant?.name}</span>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {lastUpdated && (
            <span style={{ fontSize: "11.5px", color: c.textDim }}>Updated {lastUpdated}</span>
          )}
          <Button variant="light" size="sm" icon={<Icon.Refresh />} onClick={fetchData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <MetricCard
          label="Total revenue"
          value={`₹${stats.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          sub={<><Icon.TrendingUp size={12} /><span>{stats.success} successful payments</span></>}
        />
        <MetricCard
          label="Success rate"
          value={`${successRate}%`}
          valueColor={parseFloat(successRate) > 80 ? c.successText : (stats.total > 0 ? c.dangerText : c.text)}
          sub={`${stats.success} success · ${stats.total} total`}
        />
        <MetricCard
          label="Total transactions"
          value={stats.total.toLocaleString()}
          sub={<span style={{ color: c.indigo }}>{stats.processing} processing now</span>}
        />
        <MetricCard
          label="Failed payments"
          value={stats.failed}
          valueColor={stats.failed > 0 ? c.dangerText : c.text}
          sub={`${failureRate}% failure rate`}
        />
      </div>

      {/* Mid row — bank usage + system status */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px", marginBottom: "16px" }}>
        {/* Bank adapter usage */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: 500, color: c.text }}>Bank adapter usage</div>
              <div style={{ fontSize: "11.5px", color: c.textDim, marginTop: "2px" }}>
                Distribution across {totalBanks > 1 ? `${totalBanks - (totalBanks === 1 && stats.total === 0 ? 1 : 0)} transactions` : "configured adapters"}
              </div>
            </div>
          </div>
          {stats.total === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: radius.lg, background: c.surfaceMuted,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: c.textDim, marginBottom: "8px",
              }}><Icon.Bank size={18} /></div>
              <div style={{ fontSize: "12.5px", color: "#44403C", fontWeight: 500 }}>Awaiting transactions</div>
              <div style={{ fontSize: "11.5px", color: c.textDim, marginTop: "2px" }}>
                HDFC · ICICI · SBI adapters ready
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              {["HDFC", "ICICI", "SBI"].map(b => (
                <div key={b}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "5px" }}>
                    <span style={{ fontWeight: 500, color: c.text }}>{b}</span>
                    <span style={{ color: c.textDim }}>{bankStats[b]} txns · {bankPcts[b]}%</span>
                  </div>
                  <div style={{ height: "6px", background: c.surfaceMuted, borderRadius: radius.pill, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${bankPcts[b]}%`,
                      background: bankColors[b], borderRadius: radius.pill,
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* System status */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "13.5px", fontWeight: 500, color: c.text }}>System status</div>
            <Badge kind="success">{services.length}/{services.length} up</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            {services.map(svc => (
              <div key={svc.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
                <span style={{ color: "#44403C" }}>{svc.name}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", color: c.textDim,
                                fontFamily: "'JetBrains Mono', monospace", fontSize: "11px" }}>
                  {svc.port} <StatusDot />
                </span>
              </div>
            ))}
          </div>
          {reconSummary && (
            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: `1px solid ${c.divider}` }}>
              <div style={{ fontSize: "11px", color: c.textDim, fontWeight: 500,
                            textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
                Today's recon
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: c.successText }}>✓ {reconSummary.matched} matched</span>
                <span style={{ color: reconSummary.mismatched > 0 ? c.dangerText : c.successText }}>
                  ✗ {reconSummary.mismatched} mismatched
                </span>
                <Badge kind={reconSummary.mismatched === 0 ? "success" : "warning"}>
                  {reconSummary.status}
                </Badge>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Recent transactions */}
      <Card padded={false}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${c.divider}` }}>
          <div>
            <div style={{ fontSize: "13.5px", fontWeight: 500, color: c.text }}>Recent transactions</div>
            <div style={{ fontSize: "11.5px", color: c.textDim, marginTop: "2px" }}>
              Latest 5 payments across all adapters
            </div>
          </div>
          <Badge kind="neutral">{payments.length} of {stats.total}</Badge>
        </div>

        {payments.length === 0 ? (
          <EmptyState
            icon={<Icon.Card size={20} />}
            title="No transactions yet"
            description="Once you initiate a payment, it'll appear here in real-time with status updates from Kafka."
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Payment ID", "Amount", "Bank", "Bank Ref", "Status", "Time"].map(h => (
                  <th key={h} style={{
                    fontSize: "11px", fontWeight: 500, color: c.textDim, textTransform: "uppercase",
                    letterSpacing: "0.04em", textAlign: "left", padding: "10px 20px",
                    borderBottom: `1px solid ${c.border}`, background: c.surfaceSubtle,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const b = paymentBadge(p.status);
                return (
                  <tr key={p.id}>
                    <td style={tdMono}>{p.id?.substring(0, 8)}…</td>
                    <td style={td}><span style={{ fontWeight: 500 }}>₹{parseFloat(p.amount).toLocaleString("en-IN")}</span></td>
                    <td style={td}>{p.bankAdapter ? <Badge kind="neutral">{p.bankAdapter}</Badge> : "—"}</td>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: c.textDim }}>
                      {p.bankRefId || "—"}
                    </td>
                    <td style={td}><Badge kind={b.kind}>{b.icon}{b.label}</Badge></td>
                    <td style={{ ...td, color: c.textDim }}>{timeAgo(p.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

const td = {
  padding: "12px 20px", fontSize: "13px", color: c.text,
  borderBottom: `1px solid ${c.divider}`,
};
const tdMono = {
  ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: c.textMuted,
};
