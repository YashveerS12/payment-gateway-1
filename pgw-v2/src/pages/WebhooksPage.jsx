import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getWebhookLogs, retryWebhook } from "../services/api";

const s = {
  card: { background: "#0f1117", border: "1px solid #1e2235", borderRadius: "8px", padding: "24px", marginBottom: "20px" },
  cardTitle: { fontSize: "12px", color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" },
  statCard: { background: "#0f1117", border: "1px solid #1e2235", borderRadius: "8px", padding: "20px" },
  statLabel: { fontSize: "11px", color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" },
  statValue: (color) => ({ fontSize: "26px", fontWeight: "600", color: color || "#e2e8f0", fontFamily: "monospace" }),
  input: { width: "100%", background: "#0a0b0f", border: "1px solid #1e2235", borderRadius: "4px", padding: "10px 12px", fontSize: "13px", color: "#e2e8f0", outline: "none", marginBottom: "14px", fontFamily: "inherit", boxSizing: "border-box" },
  label: { fontSize: "11px", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px", display: "block" },
  select: { background: "#0a0b0f", border: "1px solid #1e2235", borderRadius: "4px", padding: "8px 12px", fontSize: "12px", color: "#e2e8f0", outline: "none", fontFamily: "inherit" },
  btn: (primary) => ({ padding: "10px 18px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer", border: primary ? "none" : "1px solid #1e2235", background: primary ? "#2563eb" : "transparent", color: primary ? "white" : "#64748b", fontFamily: "inherit", letterSpacing: "0.08em", textTransform: "uppercase" }),
  badge: (type) => {
    const c = { DELIVERED: { background: "#064e3b30", color: "#34d399" }, FAILED: { background: "#4c1d2430", color: "#f87171" }, PENDING: { background: "#451a0330", color: "#fbbf24" } };
    return { display: "inline-block", padding: "3px 10px", borderRadius: "3px", fontSize: "10px", fontWeight: "600", letterSpacing: "0.08em", ...(c[type] || c.PENDING) };
  },
  success: { background: "#064e3b20", border: "1px solid #065f46", borderRadius: "4px", padding: "12px", marginTop: "12px", fontSize: "12px", color: "#34d399" },
  error: { background: "#4c1d2420", border: "1px solid #7f1d1d", borderRadius: "4px", padding: "12px", marginTop: "12px", fontSize: "12px", color: "#f87171" },
  timelineItem: { display: "flex", gap: "16px", alignItems: "flex-start", padding: "16px 0", borderBottom: "1px solid #1e2235" },
  dot: (color) => ({ width: "8px", height: "8px", borderRadius: "50%", background: color, marginTop: "4px", flexShrink: 0 }),
  empty: { textAlign: "center", color: "#475569", padding: "32px", fontSize: "13px" },
  pagination: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", fontSize: "12px", color: "#475569" },
  toast: { position: "fixed", bottom: "24px", right: "24px", background: "#064e3b", border: "1px solid #065f46", borderRadius: "6px", padding: "12px 20px", fontSize: "12px", color: "#34d399", zIndex: 9999, letterSpacing: "0.05em" },
  idBadge: { fontSize: "10px", fontFamily: "monospace", color: "#60a5fa", cursor: "copy", padding: "4px 8px", borderRadius: "4px", border: "1px solid #1e2235", background: "#0a0b0f", flexShrink: 0 },
};

const dotColors = { DELIVERED: "#34d399", FAILED: "#f87171", PENDING: "#fbbf24" };

export default function WebhooksPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ delivered: 0, failed: 0, pending: 0 });
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryId, setRetryId] = useState("");
  const [retryResult, setRetryResult] = useState("");
  const [retryError, setRetryError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const copyAndSetId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setRetryId(id);
      showToast("✅ Webhook ID copied & set for retry!");
    }).catch(() => {
      setRetryId(id);
      showToast("✅ Webhook ID set for retry!");
    });
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getWebhookLogs(token, page, 10, statusFilter);
      const content = data.content || [];
      setLogs(content);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
      setStats({
        delivered: content.filter(l => l.status === "DELIVERED").length,
        failed: content.filter(l => l.status === "FAILED").length,
        pending: content.filter(l => l.status === "PENDING").length,
      });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, statusFilter]);

  const handleRetry = async () => {
    if (!retryId.trim()) { setRetryError("Enter a webhook log ID"); return; }
  
    // Check if this log is already delivered
    const log = logs.find(l => l.id === retryId.trim());
    if (log && log.status === "DELIVERED") {
      setRetryError("❌ This webhook was already delivered. No retry needed.");
      return;
    }
  
    setRetryResult(""); setRetryError("");
    try {
      await retryWebhook(token, retryId.trim());
      setRetryResult(`✅ Retry triggered for: ${retryId}`);
      setRetryId("");
      fetchLogs();
    } catch (e) {
      setRetryError("❌ " + e.message);
    }
  };
  const timeAgo = (dateStr) => {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Delivered</div>
          <div style={s.statValue("#34d399")}>{stats.delivered}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Failed</div>
          <div style={s.statValue("#f87171")}>{stats.failed}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total logs</div>
          <div style={s.statValue()}>{totalElements}</div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>
          <span>Webhook delivery logs</span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {lastUpdated && <span style={{ fontSize: "10px", color: "#334155" }}>Updated: {lastUpdated}</span>}
            <select style={s.select} value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <option value="">All status</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
            <button style={{ ...s.btn(false), padding: "6px 12px" }} onClick={fetchLogs}>↻ Refresh</button>
          </div>
        </div>

        <div style={{ fontSize: "10px", color: "#334155", marginBottom: "12px" }}>
          💡 Click the ID badge on the right to copy it and auto fill retry box
        </div>

        {loading ? (
          <div style={s.empty}>Loading webhook logs...</div>
        ) : logs.length === 0 ? (
          <div style={s.empty}>
            No webhook logs yet.
            <br />
            <span style={{ fontSize: "11px", color: "#334155", marginTop: "8px", display: "block" }}>
              Make a payment → Notification Service sends webhook → logs appear here
            </span>
          </div>
        ) : (
          <>
            {logs.map(log => (
              <div key={log.id} style={s.timelineItem}>
                <div style={s.dot(dotColors[log.status] || "#fbbf24")}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#60a5fa", marginBottom: "4px" }}>
                    POST {log.callback_url || "webhook URL"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#475569", marginBottom: "6px" }}>
                    {log.event_type} · {log.response_code > 0 ? `${log.response_code} ${log.response_code === 200 ? "OK" : "Error"}` : "No response"} · {log.attempt_count} attempt{log.attempt_count !== 1 ? "s" : ""} · {timeAgo(log.last_attempt_at)}
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={s.badge(log.status)}>{log.status}</span>
                    {log.status === "FAILED" && (
                      <button style={{ ...s.btn(false), padding: "2px 10px", fontSize: "10px" }}
                        onClick={() => copyAndSetId(log.id)}>
                        Set for retry →
                      </button>
                    )}
                  </div>
                </div>
                <div style={s.idBadge}
                  onClick={() => copyAndSetId(log.id)}
                  title={`Click to copy & set for retry: ${log.id}`}>
                  {log.id?.substring(0, 8)}... 📋
                </div>
              </div>
            ))}

            <div style={s.pagination}>
              <span>Page {page + 1} of {totalPages || 1} · {totalElements} total</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={s.btn(false)} onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>← Prev</button>
                <button style={s.btn(false)} onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Manually retry webhook</div>
        <div style={{ fontSize: "11px", color: "#334155", marginBottom: "10px" }}>
          💡 Click any webhook ID above to auto fill here
        </div>
        <label style={s.label}>Webhook log ID</label>
        <input style={s.input}
          placeholder="Click webhook ID above or paste UUID here"
          value={retryId}
          onChange={(e) => setRetryId(e.target.value)} />
        <button style={s.btn(true)} onClick={handleRetry}>↻ Retry webhook</button>
        {retryResult && <div style={s.success}>{retryResult}</div>}
        {retryError && <div style={s.error}>{retryError}</div>}
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Retry policy</div>
        {[
          { attempt: "Attempt 1", delay: "Immediate", desc: "First delivery on payment event" },
          { attempt: "Attempt 2", delay: "30 seconds", desc: "First retry after failure" },
          { attempt: "Attempt 3", delay: "60 seconds", desc: "Second retry" },
          { attempt: "Attempt 4", delay: "120 seconds", desc: "Final retry — marked FAILED permanently" },
        ].map(r => (
          <div key={r.attempt} style={{ display: "flex", gap: "16px", padding: "12px 0", borderBottom: "1px solid #1e2235", fontSize: "12px" }}>
            <div style={{ width: "100px", color: "#60a5fa", fontFamily: "monospace" }}>{r.attempt}</div>
            <div style={{ width: "120px", color: "#fbbf24" }}>{r.delay}</div>
            <div style={{ color: "#64748b" }}>{r.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}