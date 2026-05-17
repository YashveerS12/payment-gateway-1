import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { triggerRecon, getReconSummary, getReconMismatches, exportReconCsv } from "../services/api";
import {
  c, radius, Icon, Card, Button, Input, Select, Badge,
  MetricCard, EmptyState, reconBadge,
} from "../ui/theme";

export default function ReconPage() {
  const { token } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState(null);
  const [mismatches, setMismatches] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const history = [];
    for (let i = 0; i <= 2; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      try {
        const s2 = await getReconSummary(token, dateStr);
        if (s2.totalTransactions > 0) {
          history.push({
            date: dateStr,
            total: s2.totalTransactions,
            matched: s2.matched,
            mismatched: s2.mismatched,
            status: s2.mismatched === 0 ? "Clean" : "Review",
          });
        }
      } catch (e) {}
    }
    setHistoryData(history);
    setHistoryLoading(false);
  };

  const handleFetch = async (fetchDate) => {
    const d = fetchDate || date;
    setLoading(true); setError(""); setMsg("");
    try {
      const s2 = await getReconSummary(token, d);
      setSummary(s2);
      const m = await getReconMismatches(token, d, typeFilter);
      setMismatches(m);
    } catch (e) {
      setError(`No recon data for ${d}. Run recon first.`);
      setSummary(null); setMismatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    handleFetch(date);
  }, []);

  const handleTrigger = async () => {
    setLoading(true); setMsg(""); setError("");
    try {
      await triggerRecon(token, date);
      setMsg(`Recon triggered for ${date}. Fetching results…`);
      setTimeout(async () => {
        try {
          const s2 = await getReconSummary(token, date);
          setSummary(s2);
          const m = await getReconMismatches(token, date, typeFilter);
          setMismatches(m);
          setMsg(`Recon complete for ${date}.`);
          fetchHistory();
        } catch (e) {
          setMsg("Recon triggered. Results pending…");
        }
      }, 2000);
    } catch (e) {
      setError("Failed to trigger recon: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try { await exportReconCsv(token, date); }
    catch (e) { setError("Export failed: " + e.message); }
  };

  const handleFilterChange = async (type) => {
    setTypeFilter(type);
    if (summary) {
      try {
        const m = await getReconMismatches(token, date, type);
        setMismatches(m);
      } catch (e) {}
    }
  };

  const handleHistoryClick = async (histDate) => {
    setDate(histDate);
    await handleFetch(histDate);
  };

  return (
    <div>
      {/* Action row */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "160px" }} />
        </div>
        <Button variant="primary" size="md" icon={<Icon.Play />}
                onClick={handleTrigger} disabled={loading} loading={loading}>
          {loading ? "Running" : "Run recon"}
        </Button>
        <Button variant="light" size="md" icon={<Icon.Refresh />}
                onClick={() => handleFetch(date)} disabled={loading}>
          Fetch results
        </Button>
        <Button variant="light" size="md" icon={<Icon.Download />} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      {/* Status banners */}
      {msg && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px",
          background: c.successBg, border: `1px solid ${c.successBorder}`,
          borderRadius: radius.lg, marginBottom: "16px",
        }}>
          <Icon.Check size={15} />
          <span style={{ flex: 1, fontSize: "12.5px", color: c.successText, fontWeight: 500 }}>{msg}</span>
        </div>
      )}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px",
          background: c.dangerBg, border: "1px solid #FCA5A5",
          borderRadius: radius.lg, marginBottom: "16px",
        }}>
          <Icon.Alert size={15} />
          <span style={{ flex: 1, fontSize: "12.5px", color: c.dangerText }}>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <MetricCard
          label="Total records"
          value={summary ? summary.totalTransactions.toLocaleString() : "—"}
          sub={<><Icon.Database size={12} />{date}</>}
        />
        <MetricCard
          label="Matched"
          value={summary ? summary.matched.toLocaleString() : "—"}
          valueColor={summary ? c.successText : c.text}
          accent={summary ? c.successDeep : null}
          sub={summary && summary.totalTransactions > 0
                ? <span style={{ color: c.successText }}>{((summary.matched / summary.totalTransactions) * 100).toFixed(1)}% match rate</span>
                : "—"}
        />
        <MetricCard
          label="Mismatched"
          value={summary ? summary.mismatched : "—"}
          valueColor={summary?.mismatched > 0 ? c.warningText : (summary ? c.successText : c.text)}
          accent={summary?.mismatched > 0 ? c.warningDeep : null}
          sub={summary?.mismatched > 0 ? <span style={{ color: c.warningText }}>Amount or status diff</span> : "—"}
        />
        <MetricCard
          label="Unresolved"
          value={summary ? summary.unresolved : "—"}
          valueColor={summary?.unresolved > 0 ? c.dangerText : (summary ? c.successText : c.text)}
          accent={summary?.unresolved > 0 ? c.dangerDeep : null}
          sub={summary?.unresolved > 0 ? <span style={{ color: c.dangerText }}>Need manual review</span> : "—"}
        />
      </div>

      {/* Overall status */}
      {summary && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          marginBottom: "16px", padding: "10px 14px",
          background: c.surface, border: `1px solid ${c.border}`, borderRadius: radius.lg,
        }}>
          <span style={{ fontSize: "12.5px", color: c.textDim }}>Overall status</span>
          <Badge kind={summary.mismatched === 0 ? "success" : "warning"}>
            {summary.status}
          </Badge>
          <span style={{ fontSize: "12px", color: c.textDim, marginLeft: "auto" }}>
            Date: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: c.text }}>{date}</span>
          </span>
        </div>
      )}

      {/* Mismatch records */}
      <Card padded={false} style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 20px", borderBottom: `1px solid ${c.divider}` }}>
          <div>
            <div style={{ fontSize: "13.5px", fontWeight: 500, color: c.text }}>
              Mismatch records {mismatches.length > 0 && <span style={{ color: c.textDim, fontWeight: 400 }}>· {mismatches.length}</span>}
            </div>
            <div style={{ fontSize: "11.5px", color: c.textDim, marginTop: "2px" }}>
              Discrepancies between your ledger and bank settlements
            </div>
          </div>
          <Select value={typeFilter} onChange={(e) => handleFilterChange(e.target.value)} style={{ width: "180px", padding: "7px 32px 7px 12px", fontSize: "12.5px" }}>
            <option value="">All types</option>
            <option value="AMOUNT_MISMATCH">Amount mismatch</option>
            <option value="MISSING_IN_LEDGER">Missing in ledger</option>
            <option value="MISSING_IN_DB">Missing in DB</option>
            <option value="STATUS_MISMATCH">Status mismatch</option>
            <option value="DUPLICATE">Duplicate</option>
          </Select>
        </div>

        {mismatches.length === 0 ? (
          <EmptyState
            icon={<Icon.File size={20} />}
            title={summary ? (summary.mismatched === 0 ? "All clear" : "No mismatches for filter") : "Run recon first"}
            description={summary
              ? (summary.mismatched === 0
                  ? "Every record in your ledger matched the bank settlement perfectly."
                  : "Try removing the filter to see all mismatch records.")
              : "Pick a date and click 'Run recon' to begin reconciliation."}
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Payment ID", "DB Amount", "Ledger Amount", "Mismatch type", "Description", "Resolved"].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mismatches.map(m => {
                const mb = reconBadge(m.mismatchType);
                return (
                  <tr key={m.id}>
                    <td style={tdMono}>
                      <span style={{ color: c.indigo }}>{m.paymentId?.substring(0, 8)}…</span>
                    </td>
                    <td style={td}>{m.transactionAmount ? `₹${m.transactionAmount.toLocaleString("en-IN")}` : "—"}</td>
                    <td style={td}>{m.ledgerAmount ? `₹${m.ledgerAmount.toLocaleString("en-IN")}` : "—"}</td>
                    <td style={td}><Badge kind={mb.kind}>{mb.label}</Badge></td>
                    <td style={{ ...td, fontSize: "12px", maxWidth: "240px", overflow: "hidden",
                                  textOverflow: "ellipsis", whiteSpace: "nowrap", color: c.textMuted }}
                        title={m.mismatchDescription}>
                      {m.mismatchDescription || "—"}
                    </td>
                    <td style={td}>
                      <Badge kind={m.resolved ? "success" : "danger"}>
                        {m.resolved ? "Yes" : "No"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Recon history */}
      <Card padded={false}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 20px", borderBottom: `1px solid ${c.divider}` }}>
          <div>
            <div style={{ fontSize: "13.5px", fontWeight: 500, color: c.text }}>Recon history</div>
            <div style={{ fontSize: "11.5px", color: c.textDim, marginTop: "2px" }}>Last 3 days · click a row to view that date</div>
          </div>
          <Button variant="light" size="sm" icon={<Icon.Refresh />}
                  onClick={fetchHistory} disabled={historyLoading}>
            {historyLoading ? "Loading" : "Refresh"}
          </Button>
        </div>

        {historyLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: c.textDim, fontSize: "13px" }}>
            Loading history…
          </div>
        ) : historyData.length === 0 ? (
          <EmptyState
            icon={<Icon.Clock size={20} />}
            title="No recon history yet"
            description="Run recon for any past date to start building your history."
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Total", "Matched", "Mismatched", "Status"].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyData.map(h => {
                const isActive = h.date === date;
                return (
                  <tr key={h.date}
                    style={{ cursor: "pointer", background: isActive ? c.indigoBg : "transparent", transition: "background 0.1s" }}
                    onClick={() => handleHistoryClick(h.date)}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = c.surfaceSubtle; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ ...td, color: c.indigo, fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>{h.date}</td>
                    <td style={td}>{h.total.toLocaleString()}</td>
                    <td style={{ ...td, color: c.successText }}>{h.matched.toLocaleString()}</td>
                    <td style={{ ...td, color: h.mismatched > 0 ? c.dangerText : c.successText }}>{h.mismatched}</td>
                    <td style={td}><Badge kind={reconBadge(h.status).kind}>{h.status}</Badge></td>
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

const th = {
  fontSize: "11px", fontWeight: 500, color: c.textDim, textTransform: "uppercase",
  letterSpacing: "0.04em", textAlign: "left", padding: "10px 20px",
  borderBottom: `1px solid ${c.border}`, background: c.surfaceSubtle,
};
const td = {
  padding: "12px 20px", fontSize: "13px", color: c.text,
  borderBottom: `1px solid ${c.divider}`,
};
const tdMono = {
  ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: "12px",
};
