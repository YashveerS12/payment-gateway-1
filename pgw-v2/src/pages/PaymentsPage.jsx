import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { initiatePayment, listPayments, getPaymentStatus } from "../services/api";

const s = {
  card: { background: "#0f1117", border: "1px solid #1e2235", borderRadius: "8px", padding: "24px", marginBottom: "20px" },
  cardTitle: { fontSize: "12px", color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  label: { fontSize: "11px", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px", display: "block" },
  hint: { fontSize: "10px", color: "#334155", marginTop: "-10px", marginBottom: "14px", letterSpacing: "0.03em" },
  input: { width: "100%", background: "#0a0b0f", border: "1px solid #1e2235", borderRadius: "4px", padding: "10px 12px", fontSize: "13px", color: "#e2e8f0", outline: "none", marginBottom: "14px", fontFamily: "inherit", boxSizing: "border-box" },
  select: { width: "100%", background: "#0a0b0f", border: "1px solid #1e2235", borderRadius: "4px", padding: "10px 12px", fontSize: "13px", color: "#e2e8f0", outline: "none", marginBottom: "14px", fontFamily: "inherit", boxSizing: "border-box" },
  btn: (primary) => ({ padding: "10px 18px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer", border: primary ? "none" : "1px solid #1e2235", background: primary ? "#2563eb" : "transparent", color: primary ? "white" : "#64748b", fontFamily: "inherit", letterSpacing: "0.08em", textTransform: "uppercase" }),
  table: { width: "100%", borderCollapse: "collapse" },
  th: { fontSize: "10px", color: "#475569", textAlign: "left", padding: "8px 0", borderBottom: "1px solid #1e2235", letterSpacing: "0.1em", textTransform: "uppercase" },
  td: { fontSize: "12px", color: "#94a3b8", padding: "12px 0", borderBottom: "1px solid #0f1117" },
  badge: (type) => {
    const c = { SUCCESS: { background: "#064e3b30", color: "#34d399" }, FAILED: { background: "#4c1d2430", color: "#f87171" }, PROCESSING: { background: "#451a0330", color: "#fbbf24" }, INITIATED: { background: "#1e3a5f30", color: "#60a5fa" } };
    return { display: "inline-block", padding: "3px 10px", borderRadius: "3px", fontSize: "10px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", ...(c[type] || c.INITIATED) };
  },
  success: { background: "#064e3b20", border: "1px solid #065f46", borderRadius: "4px", padding: "16px", marginTop: "16px" },
  error: { background: "#4c1d2420", border: "1px solid #7f1d1d", borderRadius: "4px", padding: "12px", marginTop: "12px", fontSize: "12px", color: "#f87171" },
  pre: { background: "#0a0b0f", border: "1px solid #1e2235", borderRadius: "4px", padding: "12px", fontSize: "11px", color: "#60a5fa", overflow: "auto", marginTop: "8px", lineHeight: "1.6", whiteSpace: "pre-wrap" },
  empty: { textAlign: "center", color: "#475569", padding: "32px", fontSize: "13px" },
  pagination: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", fontSize: "12px", color: "#475569" },
  keyBox: { background: "#0a0b0f", border: "1px solid #1e2235", borderRadius: "4px", padding: "10px 12px", fontSize: "11px", color: "#334155", fontFamily: "monospace", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  copyToast: { position: "fixed", bottom: "24px", right: "24px", background: "#064e3b", border: "1px solid #065f46", borderRadius: "6px", padding: "12px 20px", fontSize: "12px", color: "#34d399", zIndex: 9999, letterSpacing: "0.05em" },
};

const generateKey = () => "order-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

export default function PaymentsPage() {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", currency: "INR", bankAdapter: "HDFC", note: "" });
  const [currentKey, setCurrentKey] = useState(generateKey());
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [payments, setPayments] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);

  const [statusCheckId, setStatusCheckId] = useState("");
  const [statusResult, setStatusResult] = useState(null);
  const [statusError, setStatusError] = useState("");

  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`✅ ${label} copied!`);
    });
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

  return (
    <div>
      {toast && <div style={s.copyToast}>{toast}</div>}

      {/* Initiate Payment */}
      <div style={s.card}>
        <div style={s.cardTitle}>
          <span>Initiate payment</span>
          <button style={s.btn(false)} onClick={() => { setShowForm(!showForm); setResult(null); setFormError(""); }}>
            {showForm ? "− Hide" : "+ New payment"}
          </button>
        </div>

        {showForm && (
          <>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Amount (INR)</label>
                <input style={s.input} type="number" placeholder="5000" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Bank adapter</label>
                <select style={s.select} value={form.bankAdapter}
                  onChange={(e) => setForm({ ...form, bankAdapter: e.target.value })}>
                  <option>HDFC</option>
                  <option>ICICI</option>
                  <option>SBI</option>
                </select>
              </div>
            </div>

            <label style={s.label}>Note (optional)</label>
            <input style={s.input} placeholder="e.g. Payment for Order #123"
              value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <div style={s.hint}>Any note you want to attach to this payment</div>

            <label style={s.label}>Transaction ID (auto generated)</label>
            <div style={s.keyBox}>
              <span>{currentKey}</span>
              <span style={{ fontSize: "10px", color: "#1e3a5f" }}>AUTO</span>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button style={s.btn(true)} onClick={handleSubmit} disabled={formLoading}>
                {formLoading ? "Processing..." : "Submit payment"}
              </button>
              <button style={s.btn(false)} onClick={() => setShowForm(false)}>Cancel</button>
            </div>

            {result && (
              <div style={s.success}>
                <div style={{ fontSize: "12px", color: result.status === "SUCCESS" ? "#34d399" : "#f87171", marginBottom: "8px" }}>
                  {result.status === "SUCCESS" ? "✅ Payment SUCCESS!" : "❌ Payment FAILED"}
                  {result.status === "SUCCESS" && ` — Bank Ref: ${result.bankRefId}`}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#475569" }}>Payment ID:</span>
                  <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#60a5fa" }}>{result.id}</span>
                  <button style={{ ...s.btn(false), padding: "2px 8px", fontSize: "10px" }}
                    onClick={() => { copyToClipboard(result.id, "Payment ID"); setStatusCheckId(result.id); }}>
                    📋 Copy & check status
                  </button>
                </div>
                <pre style={s.pre}>{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
            {formError && <div style={s.error}>❌ {formError}</div>}
          </>
        )}
      </div>

      {/* Status Check */}
      <div style={s.card}>
        <div style={s.cardTitle}>Poll payment status</div>
        <div style={{ fontSize: "11px", color: "#334155", marginBottom: "10px" }}>
          💡 Click any payment row below to auto fill the ID here
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input style={{ ...s.input, marginBottom: 0, flex: 1 }}
            placeholder="Click any payment row below to auto fill"
            value={statusCheckId}
            onChange={(e) => setStatusCheckId(e.target.value)} />
          <button style={{ ...s.btn(true), whiteSpace: "nowrap" }} onClick={handleCheckStatus}>
            Check status
          </button>
        </div>
        {statusResult && (
          <div style={s.success}>
            <div style={{ fontSize: "12px", color: "#34d399", marginBottom: "8px" }}>Status result:</div>
            <pre style={s.pre}>{JSON.stringify(statusResult, null, 2)}</pre>
          </div>
        )}
        {statusError && <div style={s.error}>❌ {statusError}</div>}
      </div>

      {/* Payments List */}
      <div style={s.card}>
        <div style={s.cardTitle}>
          <span>All payments ({totalElements} total)</span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select style={{ ...s.select, marginBottom: 0, width: "140px", padding: "6px 10px", fontSize: "12px" }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <option value="">All status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PROCESSING">Processing</option>
              <option value="INITIATED">Initiated</option>
            </select>
            <button style={{ ...s.btn(false), padding: "6px 12px" }} onClick={fetchPayments}>↻ Refresh</button>
          </div>
        </div>

        {fetchLoading ? (
          <div style={s.empty}>Loading payments...</div>
        ) : payments.length === 0 ? (
          <div style={s.empty}>No payments yet. Click "+ New payment" to make one!</div>
        ) : (
          <>
            <div style={{ fontSize: "10px", color: "#334155", marginBottom: "10px" }}>
              💡 Click any row to check status · Click ID to copy full UUID
            </div>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Payment ID</th>
                  <th style={s.th}>Amount</th>
                  <th style={s.th}>Bank</th>
                  <th style={s.th}>Bank Ref</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Time</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setStatusCheckId(p.id)}
                    title="Click to check status">
                    <td
                      style={{ ...s.td, fontFamily: "monospace", fontSize: "11px", color: "#60a5fa", cursor: "copy" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(p.id, "Payment ID");
                        setStatusCheckId(p.id);
                      }}
                      title={`Click to copy: ${p.id}`}>
                      {p.id?.substring(0, 8)}... 📋
                    </td>
                    <td style={s.td}>₹{parseFloat(p.amount).toLocaleString("en-IN")}</td>
                    <td style={s.td}>{p.bankAdapter || "—"}</td>
                    <td style={{ ...s.td, fontFamily: "monospace", fontSize: "10px" }}>{p.bankRefId || "—"}</td>
                    <td style={s.td}><span style={s.badge(p.status)}>{p.status}</span></td>
                    <td style={{ ...s.td, color: "#475569", fontSize: "11px" }}>
                      {new Date(p.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
    </div>
  );
}