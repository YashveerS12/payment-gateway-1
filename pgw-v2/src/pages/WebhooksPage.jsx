import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getWebhookLogs, retryWebhook } from "../services/api";
import {
  c, radius, Icon, Card, Button, Input, Select, Badge,
  MetricCard, EmptyState, Toast, webhookBadge,
} from "../ui/theme";

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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const copyAndSetId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setRetryId(id);
      showToast("Webhook ID copied & set for retry");
    }).catch(() => {
      setRetryId(id);
      showToast("Webhook ID set for retry");
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
    const log = logs.find(l => l.id === retryId.trim());
    if (log && log.status === "DELIVERED") {
      setRetryError("This webhook was already delivered. No retry needed.");
      return;
    }
    setRetryResult(""); setRetryError("");
    try {
      await retryWebhook(token, retryId.trim());
      setRetryResult(`Retry triggered for: ${retryId}`);
      setRetryId("");
      fetchLogs();
    } catch (e) {
      setRetryError(e.message);
    }
  };

  const retryPolicy = [
    { attempt: "Attempt 1", delay: "Immediate", desc: "First delivery on payment event" },
    { attempt: "Attempt 2", delay: "+30 sec",   desc: "First retry after failure" },
    { attempt: "Attempt 3", delay: "+60 sec",   desc: "Second retry" },
    { attempt: "Attempt 4", delay: "+120 sec",  desc: "Final retry — marked FAILED permanently" },
  ];

  return (
    <div>
      {toast && <Toast kind="success">{toast}</Toast>}

      {/* Page action bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "16px" }}>
        {lastUpdated && (
          <span style={{ fontSize: "11.5px", color: c.textDim, alignSelf: "center" }}>Updated {lastUpdated}</span>
        )}
        <Button variant="light" size="sm" icon={<Icon.Refresh />} onClick={fetchLogs}>Refresh</Button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <MetricCard
          label="Delivered"
          value={stats.delivered}
          valueColor={stats.delivered > 0 ? c.successText : c.text}
          sub={totalElements > 0 ? `${((stats.delivered / Math.max(logs.length, 1)) * 100).toFixed(1)}% on this page` : "—"}
        />
        <MetricCard
          label="Failed"
          value={stats.failed}
          valueColor={stats.failed > 0 ? c.dangerText : c.text}
          sub={stats.failed > 0 ? "Manual retry available" : "All clear"}
        />
        <MetricCard
          label="Pending"
          value={stats.pending}
          valueColor={stats.pending > 0 ? c.warningText : c.text}
          sub={stats.pending > 0 ? "In backoff retry" : "—"}
        />
        <MetricCard label="Total logs" value={totalElements.toLocaleString()} sub="Across all status" />
      </div>

      {/* Delivery logs */}
      <Card padded={false} style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 20px", borderBottom: `1px solid ${c.divider}`, gap: "8px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "13.5px", fontWeight: 500, color: c.text }}>Webhook delivery logs</div>
            <div style={{ fontSize: "11.5px", color: c.textDim, marginTop: "2px" }}>
              Click the ID badge to copy and auto-fill the retry box below
            </div>
          </div>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                  style={{ width: "160px", padding: "7px 32px 7px 12px", fontSize: "12.5px" }}>
            <option value="">All status</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </Select>
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: c.textDim, fontSize: "13px" }}>
            Loading webhook logs…
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<Icon.Webhook size={20} />}
            title="No webhook logs yet"
            description="Make a payment → Notification Service sends webhook → delivery logs appear here in real-time."
          />
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Event", "Webhook ID", "Endpoint", "HTTP", "Attempts", "Status", "Time", ""].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const b = webhookBadge(log.status);
                  return (
                    <tr key={log.id}>
                      <td style={td}>
                        <span style={{ fontWeight: 500 }}>{log.event_type || "—"}</span>
                      </td>
                      <td style={tdMono}>
                        <button onClick={() => copyAndSetId(log.id)}
                                title={`Click to copy & set for retry: ${log.id}`}
                                style={{
                                  background: c.surfaceSubtle, border: `1px solid ${c.border}`,
                                  borderRadius: radius.sm, padding: "3px 8px",
                                  fontSize: "11.5px", color: c.indigo,
                                  fontFamily: "'JetBrains Mono', monospace",
                                  cursor: "copy", fontWeight: 500,
                                }}>
                          {log.id?.substring(0, 8)}…
                        </button>
                      </td>
                      <td style={{ ...tdMono, color: c.textMuted, maxWidth: "240px", overflow: "hidden",
                                    textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={log.callback_url}>
                        {log.callback_url || "—"}
                      </td>
                      <td style={tdMono}>
                        <span style={{ color: log.response_code === 200 ? c.successText : (log.response_code > 0 ? c.dangerText : c.textDim) }}>
                          {log.response_code > 0 ? log.response_code : "—"}
                        </span>
                      </td>
                      <td style={td}>{log.attempt_count}</td>
                      <td style={td}><Badge kind={b.kind}>{b.icon}{b.label}</Badge></td>
                      <td style={{ ...td, color: c.textDim }}>{timeAgo(log.last_attempt_at)}</td>
                      <td style={td}>
                        {log.status === "FAILED" && (
                          <Button variant="light" size="sm" onClick={() => copyAndSetId(log.id)}>
                            Set for retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "12px 20px", borderTop: `1px solid ${c.divider}`,
                          fontSize: "12px", color: c.textDim }}>
              <span>Page {page + 1} of {Math.max(totalPages, 1)} · {totalElements} total</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <Button variant="light" size="sm" icon={<Icon.ChevronLeft />}
                        onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
                  Prev
                </Button>
                <Button variant="light" size="sm" iconRight={<Icon.ChevronRight />}
                        onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Manual retry */}
      <Card style={{ marginBottom: "16px", background: c.surfaceSubtle }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: radius.md,
            background: c.indigoBg, display: "flex", alignItems: "center", justifyContent: "center",
            color: c.indigo, flexShrink: 0, marginTop: "2px",
          }}><Icon.Refresh size={16} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: c.text }}>Manually retry webhook</div>
            <div style={{ fontSize: "11.5px", color: c.textDim, marginBottom: "10px" }}>
              Click any webhook ID above to auto-fill, or paste a UUID
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <Input placeholder="wh_a3f9c2b1… or paste full UUID"
                       value={retryId}
                       onChange={(e) => setRetryId(e.target.value)}
                       onKeyDown={(e) => e.key === "Enter" && handleRetry()} />
              </div>
              <Button variant="primary" size="md" icon={<Icon.Refresh />} onClick={handleRetry}>
                Retry webhook
              </Button>
            </div>
            {retryResult && (
              <div style={{
                marginTop: "10px", padding: "9px 12px",
                background: c.successBg, border: `1px solid ${c.successBorder}`,
                borderRadius: radius.md, color: c.successText, fontSize: "12.5px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <Icon.Check size={14} />{retryResult}
              </div>
            )}
            {retryError && (
              <div style={{
                marginTop: "10px", padding: "9px 12px",
                background: c.dangerBg, border: "1px solid #FCA5A5",
                borderRadius: radius.md, color: c.dangerText, fontSize: "12.5px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <Icon.Alert size={14} />{retryError}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Retry policy */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "13.5px", fontWeight: 500, color: c.text }}>Retry policy</div>
            <div style={{ fontSize: "11.5px", color: c.textDim, marginTop: "2px" }}>
              Exponential backoff · failed deliveries are retried automatically
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {retryPolicy.map((r, idx) => (
            <div key={r.attempt} style={{
              padding: "12px 14px", background: c.surfaceSubtle,
              borderRadius: radius.lg, border: `1px solid ${c.border}`,
            }}>
              <div style={{ fontSize: "10.5px", color: c.textDim, fontWeight: 500,
                            textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>
                {r.attempt}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: idx === 0 ? c.indigo : c.text, marginBottom: "6px" }}>
                {r.delay}
              </div>
              <div style={{ fontSize: "11.5px", color: c.textDim, lineHeight: 1.45 }}>
                {r.desc}
              </div>
            </div>
          ))}
        </div>
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
