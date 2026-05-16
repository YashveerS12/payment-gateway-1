import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { triggerRecon, getReconSummary, getReconMismatches, exportReconCsv } from "../services/api";

const s = {
  card: { background: "#0f1117", border: "1px solid #1e2235", borderRadius: "8px", padding: "24px", marginBottom: "20px" },
  cardTitle: { fontSize: "12px", color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" },
  statCard: { background: "#0f1117", border: "1px solid #1e2235", borderRadius: "8px", padding: "20px" },
  statLabel: { fontSize: "11px", color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" },
  statValue: (color) => ({ fontSize: "26px", fontWeight: "600", color: color || "#e2e8f0", fontFamily: "monospace" }),
  topRow: { display: "flex", gap: "12px", alignItems: "center", marginBottom: "24px", flexWrap: "wrap" },
  input: { background: "#0a0b0f", border: "1px solid #1e2235", borderRadius: "4px", padding: "10px 12px", fontSize: "13px", color: "#e2e8f0", outline: "none", fontFamily: "inherit" },
  select: { background: "#0a0b0f", border: "1px solid #1e2235", borderRadius: "4px", padding: "8px 12px", fontSize: "12px", color: "#e2e8f0", outline: "none", fontFamily: "inherit" },
  btn: (primary) => ({ padding: "10px 18px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer", border: primary ? "none" : "1px solid #1e2235", background: primary ? "#2563eb" : "transparent", color: primary ? "white" : "#64748b", fontFamily: "inherit", letterSpacing: "0.08em", textTransform: "uppercase" }),
  table: { width: "100%", borderCollapse: "collapse" },
  th: { fontSize: "10px", color: "#475569", textAlign: "left", padding: "8px 0", borderBottom: "1px solid #1e2235", letterSpacing: "0.1em", textTransform: "uppercase" },
  td: { fontSize: "12px", color: "#94a3b8", padding: "12px 0", borderBottom: "1px solid #0f1117" },
  badge: (type) => {
    const c = {
      AMOUNT_MISMATCH: { background: "#451a0330", color: "#fbbf24" },
      MISSING_IN_LEDGER: { background: "#4c1d2430", color: "#f87171" },
      MISSING_IN_DB: { background: "#4c1d2430", color: "#f87171" },
      STATUS_MISMATCH: { background: "#1e3a5f30", color: "#60a5fa" },
      DUPLICATE: { background: "#2d1b6930", color: "#a78bfa" },
      RESOLVED: { background: "#064e3b30", color: "#34d399" },
      UNRESOLVED: { background: "#4c1d2430", color: "#f87171" },
      Clean: { background: "#064e3b30", color: "#34d399" },
      Review: { background: "#451a0330", color: "#fbbf24" },
    };
    return { display: "inline-block", padding: "3px 10px", borderRadius: "3px", fontSize: "10px", fontWeight: "600", letterSpacing: "0.05em", ...(c[type] || { background: "#1e2235", color: "#94a3b8" }) };
  },
  success: { background: "#064e3b20", border: "1px solid #065f46", borderRadius: "4px", padding: "12px", marginBottom: "16px", fontSize: "12px", color: "#34d399" },
  error: { background: "#4c1d2420", border: "1px solid #7f1d1d", borderRadius: "4px", padding: "12px", marginBottom: "16px", fontSize: "12px", color: "#f87171" },
  empty: { textAlign: "center", color: "#475569", padding: "32px", fontSize: "13px" },
};

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
          history.push({ date: dateStr, total: s2.totalTransactions, matched: s2.matched, mismatched: s2.mismatched, status: s2.mismatched === 0 ? "Clean" : "Review" });
        }
      } catch (e) { }
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
      setMsg(`Recon triggered for ${date}. Fetching results...`);
      setTimeout(async () => {
        try {
          const s2 = await getReconSummary(token, date);
          setSummary(s2);
          const m = await getReconMismatches(token, date, typeFilter);
          setMismatches(m);
          setMsg(`✅ Recon complete for ${date}!`);
          fetchHistory();
        } catch (e) { setMsg(`Recon triggered. Results pending...`); }
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
      try { const m = await getReconMismatches(token, date, type); setMismatches(m); }
      catch (e) { }
    }
  };

  const handleHistoryClick = async (histDate) => {
    setDate(histDate);
    await handleFetch(histDate);
  };

  return (
    <div>
      <div style={s.topRow}>
        <input style={s.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button style={s.btn(true)} onClick={handleTrigger} disabled={loading}>{loading ? "Running..." : "▶ Run recon"}</button>
        <button style={s.btn(false)} onClick={() => handleFetch(date)} disabled={loading}>↻ Fetch results</button>
        <button style={s.btn(false)} onClick={handleExport}>↓ Export CSV</button>
      </div>

      {msg && <div style={s.success}>{msg}</div>}
      {error && <div style={s.error}>❌ {error}</div>}

      <div style={s.statsGrid}>
        {[
          { label: "Total", value: summary ? summary.totalTransactions.toLocaleString() : "—" },
          { label: "Matched", value: summary ? summary.matched.toLocaleString() : "—", color: "#34d399" },
          { label: "Mismatched", value: summary ? summary.mismatched : "—", color: summary?.mismatched > 0 ? "#f87171" : "#34d399" },
          { label: "Unresolved", value: summary ? summary.unresolved : "—", color: summary?.unresolved > 0 ? "#fbbf24" : "#34d399" },
        ].map(item => (
          <div key={item.label} style={s.statCard}>
            <div style={s.statLabel}>{item.label}</div>
            <div style={s.statValue(item.color)}>{item.value}</div>
          </div>
        ))}
      </div>

      {summary && (
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Overall status:</span>
          <span style={{ ...s.badge(summary.mismatched === 0 ? "Clean" : "Review"), fontSize: "12px", padding: "4px 14px" }}>{summary.status}</span>
        </div>
      )}

      <div style={s.card}>
        <div style={s.cardTitle}>
          <span>Mismatch records {mismatches.length > 0 ? `(${mismatches.length})` : ""}</span>
          <select style={s.select} value={typeFilter} onChange={(e) => handleFilterChange(e.target.value)}>
            <option value="">All types</option>
            <option value="AMOUNT_MISMATCH">Amount mismatch</option>
            <option value="MISSING_IN_LEDGER">Missing in ledger</option>
            <option value="MISSING_IN_DB">Missing in DB</option>
            <option value="STATUS_MISMATCH">Status mismatch</option>
            <option value="DUPLICATE">Duplicate</option>
          </select>
        </div>
        {mismatches.length === 0 ? (
          <div style={s.empty}>{summary ? summary.mismatched === 0 ? "✅ No mismatches!" : "No mismatches for filter" : "Run recon first"}</div>
        ) : (
          <table style={s.table}>
            <thead><tr>
              <th style={s.th}>Payment ID</th><th style={s.th}>DB Amount</th>
              <th style={s.th}>Ledger Amount</th><th style={s.th}>Mismatch type</th>
              <th style={s.th}>Description</th><th style={s.th}>Resolved</th>
            </tr></thead>
            <tbody>
              {mismatches.map(m => (
                <tr key={m.id}>
                  <td style={{ ...s.td, fontFamily: "monospace", fontSize: "11px", color: "#60a5fa" }}>{m.paymentId?.substring(0, 8)}...</td>
                  <td style={s.td}>₹{m.transactionAmount?.toLocaleString() || "—"}</td>
                  <td style={s.td}>{m.ledgerAmount ? `₹${m.ledgerAmount.toLocaleString()}` : "—"}</td>
                  <td style={s.td}><span style={s.badge(m.mismatchType)}>{m.mismatchType?.replace(/_/g, " ")}</span></td>
                  <td style={{ ...s.td, fontSize: "11px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.mismatchDescription || "—"}</td>
                  <td style={s.td}><span style={s.badge(m.resolved ? "RESOLVED" : "UNRESOLVED")}>{m.resolved ? "Yes" : "No"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>
          <span>Recon history (last 3 days)</span>
          <button style={{ ...s.btn(false), padding: "4px 12px", fontSize: "11px" }} onClick={fetchHistory} disabled={historyLoading}>
            {historyLoading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>
        {historyLoading ? (
          <div style={s.empty}>Loading history...</div>
        ) : historyData.length === 0 ? (
          <div style={s.empty}>No recon history. Run recon for any date.</div>
        ) : (
          <table style={s.table}>
            <thead><tr>
              <th style={s.th}>Date</th><th style={s.th}>Total</th>
              <th style={s.th}>Matched</th><th style={s.th}>Mismatched</th>
              <th style={s.th}>Status</th>
            </tr></thead>
            <tbody>
              {historyData.map(h => (
                <tr key={h.date} style={{ cursor: "pointer", background: h.date === date ? "#1e2235" : "transparent" }}
                  onClick={() => handleHistoryClick(h.date)}>
                  <td style={{ ...s.td, color: "#60a5fa" }}>{h.date}</td>
                  <td style={s.td}>{h.total.toLocaleString()}</td>
                  <td style={{ ...s.td, color: "#34d399" }}>{h.matched.toLocaleString()}</td>
                  <td style={{ ...s.td, color: h.mismatched > 0 ? "#f87171" : "#34d399" }}>{h.mismatched}</td>
                  <td style={s.td}><span style={s.badge(h.status)}>{h.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}