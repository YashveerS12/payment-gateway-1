import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { initiatePayment, listPayments, getPaymentStatus } from "../services/api";
import {
  c, radius, Icon, Card, Button, Input, Select, Field, Badge,
  MetricCard, EmptyState, Toast, paymentBadge,
} from "../ui/theme";

const generateKey = () => "order-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

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

export default function PaymentsPage() {
  const { token } = useAuth();

  // Initiate form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", currency: "INR", bankAdapter: "HDFC", note: "" });
  const [currentKey, setCurrentKey] = useState(generateKey());
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // List
  const [payments, setPayments] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);

  // Status check
  const [statusCheckId, setStatusCheckId] = useState("");
  const [statusResult, setStatusResult] = useState(null);
  const [statusError, setStatusError] = useState("");

  // Toast
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => showToast(`${label} copied`));
  };

  const fetchPayments = async () => {
    setFetchLoading(true);
    try {
      const data = await listPayments(token, page, 10, statusFilter);
      setPayments(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (e) {
      setPayments([]);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, [page, statusFilter]);

  const handleSubmit = async () => {
    if (!form.amount) { setFormError("Amount is required"); return; }
    setFormLoading(true); setFormError(""); setResult(null);
    try {
      const metadata = form.note ? JSON.stringify({ note: form.note }) : undefined;
      const data = await initiatePayment(token, currentKey, {
        amount: parseFloat(form.amount),
        currency: form.currency,
        bankAdapter: form.bankAdapter,
        metadata,
      });
      setResult(data);
      setCurrentKey(generateKey());
      setForm({ amount: "", currency: "INR", bankAdapter: "HDFC", note: "" });
      fetchPayments();
    } catch (e) {
      setFormError(e.message);
      setCurrentKey(generateKey());
    } finally {
      setFormLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!statusCheckId) { setStatusError("Enter a payment ID"); return; }
    setStatusError(""); setStatusResult(null);
    try {
      const data = await getPaymentStatus(token, statusCheckId);
      setStatusResult(data);
    } catch (e) {
      setStatusError("Payment not found or unauthorized");
    }
  };

  const filters = [
    { value: "",           label: "All",        count: totalElements },
    { value: "SUCCESS",    label: "Succeeded" },
    { value: "PROCESSING", label: "Processing" },
    { value: "FAILED",     label: "Failed" },
    { value: "INITIATED",  label: "Initiated" },
  ];

  return (
    <div>
      {toast && <Toast kind="success">{toast}</Toast>}

      {/* Page action bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "16px" }}>
        <Button variant="light" size="sm" icon={<Icon.Refresh />} onClick={fetchPayments}>Refresh</Button>
        <Button variant="primary" size="sm" icon={<Icon.Plus />}
                onClick={() => { setShowForm(!showForm); setResult(null); setFormError(""); }}>
          {showForm ? "Hide form" : "New payment"}
        </Button>
      </div>

      {/* ─── Initiate form ──────────────────────────────── */}
      {showForm && (
        <Card style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "14px", fontWeight: 500, color: c.text, marginBottom: "2px" }}>Initiate payment</div>
            <div style={{ fontSize: "12px", color: c.textDim }}>
              Create a payment intent and route through your selected bank adapter.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Amount (INR)">
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                                color: c.textDim, fontSize: "14px", pointerEvents: "none" }}>₹</span>
                <Input type="number" placeholder="5000" value={form.amount}
                       onChange={(e) => setForm({ ...form, amount: e.target.value })}
                       style={{ paddingLeft: "24px" }} />
              </div>
            </Field>
            <Field label="Bank adapter">
              <Select value={form.bankAdapter} onChange={(e) => setForm({ ...form, bankAdapter: e.target.value })}>
                <option>HDFC</option>
                <option>ICICI</option>
                <option>SBI</option>
              </Select>
            </Field>
          </div>

          <Field label="Note" optional="optional" hint="Any note you want to attach to this payment">
            <Input placeholder="e.g. Payment for Order #123" value={form.note}
                   onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>

          <Field label="Idempotency key" optional="auto-generated">
            <div style={{ display: "flex", gap: "6px" }}>
              <Input value={currentKey} readOnly
                     style={{ background: c.surfaceSubtle, fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }} />
              <Button variant="light" size="md" icon={<Icon.Refresh />}
                      onClick={() => setCurrentKey(generateKey())} title="Generate new" />
              <Button variant="light" size="md" icon={<Icon.Copy />}
                      onClick={() => copyToClipboard(currentKey, "Key")} title="Copy" />
            </div>
            <div style={{ fontSize: "11.5px", color: c.textDim, marginTop: "5px" }}>
              Prevents duplicate charges if the request retries. Stored in Redis.
            </div>
          </Field>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px", paddingTop: "14px", borderTop: `1px solid ${c.divider}` }}>
            <Button variant="light" size="md" onClick={() => setShowForm(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleSubmit} disabled={formLoading} loading={formLoading}
                    icon={<Icon.Bolt size={14} />} style={{ flex: 2 }}>
              {formLoading ? "Processing" : "Submit payment"}
            </Button>
          </div>

          {/* Result */}
          {result && (
            <div style={{
              marginTop: "14px",
              background: result.status === "SUCCESS" ? c.successBg : c.dangerBg,
              border: `1px solid ${result.status === "SUCCESS" ? c.successBorder : "#FCA5A5"}`,
              borderRadius: radius.lg, padding: "14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px",
                            color: result.status === "SUCCESS" ? c.successText : c.dangerText,
                            fontSize: "13px", fontWeight: 500 }}>
                {result.status === "SUCCESS" ? <Icon.Check size={14} /> : <Icon.X size={14} />}
                Payment {result.status}
                {result.status === "SUCCESS" && result.bankRefId && (
                  <span style={{ fontWeight: 400, fontSize: "12px" }}> · Bank Ref: {result.bankRefId}</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{ fontSize: "11.5px", color: c.textDim }}>Payment ID:</span>
                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: c.indigo, flex: 1 }}>
                  {result.id}
                </code>
                <Button variant="light" size="sm" icon={<Icon.Copy />}
                        onClick={() => { copyToClipboard(result.id, "Payment ID"); setStatusCheckId(result.id); }}>
                  Copy & poll
                </Button>
              </div>
              <pre style={{
                background: c.surface, border: `1px solid ${c.border}`, borderRadius: radius.md,
                padding: "10px 12px", fontSize: "11.5px", color: c.textMuted, overflow: "auto",
                lineHeight: 1.55, whiteSpace: "pre-wrap", fontFamily: "'JetBrains Mono', monospace",
                margin: 0,
              }}>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
          {formError && (
            <div style={{
              marginTop: "12px", background: c.dangerBg, border: "1px solid #FCA5A5",
              borderRadius: radius.lg, padding: "10px 12px",
              color: c.dangerText, fontSize: "12.5px",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <Icon.Alert size={14} />{formError}
            </div>
          )}
        </Card>
      )}

      {/* ─── Quick stats ────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <MetricCard label="All payments" value={totalElements.toLocaleString()} />
        <MetricCard label="Showing" value={payments.length}
                    sub={`page ${page + 1} of ${Math.max(totalPages, 1)}`} />
        <MetricCard label="Filter"
                    value={statusFilter ? paymentBadge(statusFilter).label : "All"}
                    sub={statusFilter ? "filter active" : "no filter"} />
        <MetricCard label="Idempotency"
                    value={<span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>Redis</span>}
                    sub="Active duplicate prevention" />
      </div>

      {/* ─── Poll status panel ─────────────────────────── */}
      <Card style={{ marginBottom: "16px", background: c.surfaceSubtle }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: radius.md,
            background: c.indigoBg, display: "flex", alignItems: "center", justifyContent: "center",
            color: c.indigo, flexShrink: 0, marginTop: "2px",
          }}><Icon.Search size={16} /></div>
          <div style={{ flex: 1, minWidth: "280px" }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: c.text }}>Poll payment status</div>
            <div style={{ fontSize: "11.5px", color: c.textDim, marginBottom: "10px" }}>
              Click any row below to auto-fill, or paste a payment ID.
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <Input placeholder="pay_8f3a92c1…" value={statusCheckId}
                       onChange={(e) => setStatusCheckId(e.target.value)}
                       onKeyDown={(e) => e.key === "Enter" && handleCheckStatus()} />
              </div>
              <Button variant="primary" size="md" onClick={handleCheckStatus}>Check status</Button>
            </div>
            {statusResult && (
              <div style={{
                marginTop: "10px", background: c.surface, border: `1px solid ${c.border}`,
                borderRadius: radius.md, padding: "10px 12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px",
                              fontSize: "12px", fontWeight: 500, color: c.successText }}>
                  <Icon.Check size={13} /> Status retrieved
                </div>
                <pre style={{
                  margin: 0, fontSize: "11.5px", color: c.textMuted,
                  fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.55,
                  whiteSpace: "pre-wrap", maxHeight: "180px", overflow: "auto",
                }}>{JSON.stringify(statusResult, null, 2)}</pre>
              </div>
            )}
            {statusError && (
              <div style={{
                marginTop: "10px", background: c.dangerBg, border: "1px solid #FCA5A5",
                borderRadius: radius.md, padding: "8px 12px",
                color: c.dangerText, fontSize: "12px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <Icon.Alert size={13} />{statusError}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ─── Payments table ────────────────────────────── */}
      <Card padded={false}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${c.divider}`, gap: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "4px", padding: "2px", background: c.surfaceMuted, borderRadius: radius.md }}>
            {filters.map(f => {
              const active = statusFilter === f.value;
              return (
                <button key={f.value || "all"}
                  onClick={() => { setStatusFilter(f.value); setPage(0); }}
                  style={{
                    padding: "5px 10px", border: "none", borderRadius: radius.sm,
                    background: active ? c.surface : "transparent",
                    color: active ? c.text : c.textDim,
                    fontSize: "12px", fontWeight: active ? 500 : 450,
                    fontFamily: "inherit", cursor: "pointer",
                    boxShadow: active ? "0 0 0 0.5px #E7E5E4" : "none",
                  }}>
                  {f.label}{f.count !== undefined && <span style={{ marginLeft: "5px", color: c.textDim }}>{f.count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {fetchLoading ? (
          <div style={{ padding: "48px", textAlign: "center", color: c.textDim, fontSize: "13px" }}>
            Loading payments…
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<Icon.Card size={20} />}
            title="No payments yet"
            description="Click 'New payment' above to create your first transaction. It'll appear here once routed."
          />
        ) : (
          <>
            <div style={{ fontSize: "11.5px", color: c.textDim, padding: "10px 20px 0" }}>
              Click any row to auto-fill the status checker · click the ID to copy
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Payment ID", "Amount", "Bank", "Bank Ref", "Status", "Time"].map(h => (
                    <th key={h} style={{
                      fontSize: "11px", fontWeight: 500, color: c.textDim, textTransform: "uppercase",
                      letterSpacing: "0.04em", textAlign: "left", padding: "10px 20px",
                      borderBottom: `1px solid ${c.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const b = paymentBadge(p.status);
                  return (
                    <tr key={p.id}
                      style={{ cursor: "pointer", transition: "background 0.1s" }}
                      onClick={() => setStatusCheckId(p.id)}
                      onMouseEnter={(e) => e.currentTarget.style.background = c.surfaceSubtle}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={tdMono} onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(p.id, "Payment ID");
                        setStatusCheckId(p.id);
                      }} title={p.id}>
                        <span style={{ color: c.indigo, cursor: "copy" }}>{p.id?.substring(0, 8)}…</span>
                      </td>
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
    </div>
  );
}

const td = {
  padding: "12px 20px", fontSize: "13px", color: c.text,
  borderBottom: `1px solid ${c.divider}`,
};
const tdMono = {
  ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: "12px",
};
