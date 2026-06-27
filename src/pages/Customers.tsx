import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, getDocs, query, orderBy,
  doc, updateDoc, serverTimestamp, writeBatch, Timestamp,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "../firebase";

interface Tenant {
  id: string;
  shopName: string;
  ownerEmail: string;
  plan: "trial" | "monthly" | "yearly";
  duration: number;
  status: "active" | "trial" | "suspended" | "cancelled";
  createdAt: Date;
  expiresAt?: Date;
}

const STATUS_CFG = {
  active:    { label: "ໃຊ້ງານ",    color: "var(--green)",  bg: "var(--green-bg)"  },
  trial:     { label: "ທົດລອງໃຊ້", color: "var(--yellow)", bg: "var(--yellow-bg)" },
  suspended: { label: "ລະງັບ",     color: "var(--red)",    bg: "var(--red-bg)"    },
  cancelled: { label: "ຍົກເລີກ",   color: "var(--muted)",  bg: "var(--surf2)"     },
};

function planLabel(plan: string, duration: number): string {
  if (plan === "monthly") return `ລາຍເດືອນ · ${duration} ເດືອນ`;
  if (plan === "yearly") return `ລາຍປີ · ${duration} ປີ`;
  return "ທົດລອງໃຊ້ (30 ວັນ)";
}

function planEndsAt(plan: string, duration: number): Date {
  const d = new Date();
  if (plan === "monthly") d.setMonth(d.getMonth() + duration);
  else if (plan === "yearly") d.setFullYear(d.getFullYear() + duration);
  else d.setDate(d.getDate() + 30);
  return d;
}

const MONTHLY_DURATIONS = [1, 3, 6, 9];
const YEARLY_DURATIONS  = [1, 3, 5];

export default function Customers() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [setPlanTenant, setSetPlanTenant] = useState<Tenant | null>(null);

  async function loadTenants() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "tenants"), orderBy("createdAt", "desc")));
      setTenants(snap.docs.map(d => {
        const raw = d.data();
        const plan: string = raw.plan ?? "trial";
        const duration: number = raw.duration ?? 1;
        const createdAt: Date = raw.createdAt?.toDate?.() ?? new Date();

        let expiresAt: Date | undefined = raw.expiresAt?.toDate?.() ?? undefined;
        if (!expiresAt) {
          expiresAt = new Date(createdAt);
          if (plan === "monthly") expiresAt.setMonth(expiresAt.getMonth() + duration);
          else if (plan === "yearly") expiresAt.setFullYear(expiresAt.getFullYear() + duration);
          else expiresAt.setDate(expiresAt.getDate() + 30);
        }

        return {
          id: d.id,
          ...(raw as Omit<Tenant, "id" | "createdAt" | "expiresAt">),
          duration,
          createdAt,
          expiresAt,
        };
      }));
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTenants(); }, []);

  const filtered = tenants.filter(t => {
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchSearch = !search || t.shopName.toLowerCase().includes(search.toLowerCase()) || t.ownerEmail.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  async function toggleSuspend(t: Tenant) {
    if (!window.confirm(t.status === "suspended" ? `ເປີດໃຊ້ງານ "${t.shopName}" ໃໝ່?` : `ລະງັບການໃຊ້ງານ "${t.shopName}"?`)) return;
    setActionId(t.id);
    try {
      const newStatus = t.status === "suspended" ? "active" : "suspended";
      await updateDoc(doc(db, "tenants", t.id), { status: newStatus, updatedAt: serverTimestamp() });
      setTenants(prev => prev.map(x => x.id === t.id ? { ...x, status: newStatus } : x));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div style={{ padding: "32px 36px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>ລູກຄ້າ</h1>
          <p style={{ fontSize: 14, color: "var(--text-2)" }}>ຈັດການບັນຊີລູກຄ້າທັງໝົດ</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 18px", background: "var(--accent)",
            border: "none", borderRadius: 8,
            color: "#fff", fontSize: 14, fontWeight: 600,
            transition: "background .15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-dark)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--accent)")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          ເພີ່ມລູກຄ້າໃໝ່
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1", minWidth: 220 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text" placeholder="ຄົ້ນຫາຊື່ຮ້ານ ຫຼື ອີເມວ..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px 9px 36px",
              border: "1.5px solid var(--border)", borderRadius: 8,
              fontSize: 14, color: "var(--text)", background: "var(--surf)", outline: "none",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "active", "trial", "suspended"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "8px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500,
                border: `1.5px solid ${filterStatus === s ? "var(--accent)" : "var(--border)"}`,
                background: filterStatus === s ? "var(--accent-bg)" : "var(--surf)",
                color: filterStatus === s ? "var(--accent)" : "var(--text-2)",
                transition: "all .15s", cursor: "pointer",
              }}
            >
              {{ all: "ທັງໝົດ", active: "ໃຊ້ງານ", trial: "ທົດລອງໃຊ້", suspended: "ລະງັບ" }[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, display: "flex", justifyContent: "center" }}><div className="spinner"/></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--muted)" }}>
              {tenants.length === 0 ? "ຍັງບໍ່ມີລູກຄ້າ ກົດ \"ເພີ່ມລູກຄ້າໃໝ່\" ເພື່ອເລີ່ມ" : "ບໍ່ພົບຂໍ້ມູນທີ່ຄົ້ນຫາ"}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surf2)" }}>
                  {["ຊື່ຮ້ານ", "ອີເມວເຈົ້າຂອງຮ້ານ", "ແພັກເກດ", "ສະຖານະ", "ວັນທີສະໝັກ", "ໝົດອາຍຸ", ""].map(h => (
                    <th key={h} style={{
                      padding: "11px 20px", textAlign: "left",
                      fontSize: 12, fontWeight: 600, letterSpacing: ".05em",
                      textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const cfg = STATUS_CFG[t.status] ?? STATUS_CFG.cancelled;
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border)", transition: "background .1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--surf2)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 20px", fontWeight: 600, color: "var(--text)" }}>{t.shopName}</td>
                      <td style={{ padding: "14px 20px", color: "var(--text-2)", fontSize: 13 }}>{t.ownerEmail}</td>
                      <td style={{ padding: "14px 20px", color: "var(--text-2)", fontSize: 13 }}>{planLabel(t.plan, t.duration)}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{
                          display: "inline-block", fontSize: 12, fontWeight: 600,
                          color: cfg.color, background: cfg.bg,
                          border: `1px solid ${cfg.color}30`, borderRadius: 20, padding: "2px 10px",
                        }}>{cfg.label}</span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "var(--muted)", fontSize: 13, whiteSpace: "nowrap" }}>
                        {t.createdAt.toLocaleDateString("en-GB")}
                      </td>
                      <td style={{ padding: "14px 20px", color: "var(--muted)", fontSize: 13, whiteSpace: "nowrap" }}>
                        {t.expiresAt ? t.expiresAt.toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => navigate(`/customers/${t.id}`)}
                            style={{
                              padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                              border: "1px solid var(--border)",
                              background: "var(--surf2)", color: "var(--text-2)",
                              cursor: "pointer",
                            }}
                          >
                            ເບິ່ງ
                          </button>
                          <button
                            onClick={() => setEditTenant(t)}
                            style={{
                              padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                              border: "1px solid rgba(59,130,246,.3)",
                              background: "var(--blue-bg)", color: "var(--blue)",
                              cursor: "pointer",
                            }}
                          >
                            ແກ້ໄຂ
                          </button>
                          <button
                            onClick={() => setSetPlanTenant(t)}
                            style={{
                              padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                              border: "1px solid rgba(139,92,246,.3)",
                              background: "var(--purple-bg, rgba(139,92,246,.08))", color: "var(--purple, #7c3aed)",
                              cursor: "pointer",
                            }}
                          >
                            ຕັ້ງຄ່າ
                          </button>
                          <button
                            onClick={() => toggleSuspend(t)}
                            disabled={actionId === t.id}
                            style={{
                              padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                              border: `1px solid ${t.status === "suspended" ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)"}`,
                              background: t.status === "suspended" ? "var(--green-bg)" : "var(--red-bg)",
                              color: t.status === "suspended" ? "var(--green)" : "var(--red)",
                              cursor: actionId === t.id ? "not-allowed" : "pointer",
                              opacity: actionId === t.id ? 0.6 : 1,
                            }}
                          >
                            {t.status === "suspended" ? "ເປີດໃຊ້ງານ" : "ລະງັບ"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && (
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
          ສະແດງ {filtered.length} ຈາກ {tenants.length} ລາຍການ
        </div>
      )}

      {/* Add Customer Modal */}
      {showModal && (
        <AddCustomerModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); loadTenants(); }}
        />
      )}

      {/* Edit Customer Modal */}
      {editTenant && (
        <EditCustomerModal
          tenant={editTenant}
          onClose={() => setEditTenant(null)}
          onSaved={(updated) => {
            setTenants(prev => prev.map(t => t.id === updated.id ? updated : t));
            setEditTenant(null);
          }}
        />
      )}

      {/* Set Plan Modal */}
      {setPlanTenant && (
        <SetPlanModal
          tenant={setPlanTenant}
          onClose={() => setSetPlanTenant(null)}
          onUpdated={() => { setSetPlanTenant(null); loadTenants(); }}
        />
      )}
    </div>
  );
}

// ─── Set Plan Modal ───────────────────────────────────────────────────

function defaultDateStr(plan: "monthly" | "yearly"): string {
  const d = new Date();
  if (plan === "monthly") d.setDate(d.getDate() + 30);
  else d.setDate(d.getDate() + 365);
  return d.toISOString().slice(0, 10);
}

function SetPlanModal({ tenant, onClose, onUpdated }: {
  tenant: Tenant;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [dateStr, setDateStr] = useState(() => defaultDateStr("monthly"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cfg = STATUS_CFG[tenant.status] ?? STATUS_CFG.cancelled;

  function handlePlanChange(newPlan: "monthly" | "yearly") {
    setPlan(newPlan);
    setDateStr(defaultDateStr(newPlan));
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await updateDoc(doc(db, "tenants", tenant.id), {
        plan,
        status: "active",
        expiresAt: Timestamp.fromDate(new Date(dateStr + "T23:59:59")),
        updatedAt: serverTimestamp(),
      });
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(10,22,40,.6)",
        backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: 20,
      }}
    >
      <div style={{
        background: "var(--surf)", borderRadius: 14,
        width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,.2)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>ຕັ້ງຄ່າແພັກເກດ</div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
              {tenant.shopName}
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: cfg.color, background: cfg.bg,
                border: `1px solid ${cfg.color}30`, borderRadius: 20, padding: "1px 8px",
              }}>{cfg.label}</span>
              {tenant.plan !== "trial" && (
                <span style={{ fontSize: 12, color: "var(--muted)" }}>· {planLabel(tenant.plan, tenant.duration)}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", padding: 4, borderRadius: 6, cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          <Field label="ແພັກເກດ">
            <select
              value={plan}
              onChange={e => handlePlanChange(e.target.value as "monthly" | "yearly")}
              style={inputStyle}
            >
              <option value="monthly">ລາຍເດືອນ</option>
              <option value="yearly">ລາຍປີ</option>
            </select>
          </Field>
          <Field label="ວັນໝົດອາຍຸ">
            <input
              type="date"
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              required
              style={inputStyle}
            />
          </Field>

          {error && (
            <div style={{ padding: "10px 14px", marginBottom: 16, background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "10px", border: "1.5px solid var(--border)", borderRadius: 8, background: "none", fontSize: 14, fontWeight: 500, color: "var(--text-2)", cursor: "pointer" }}>
              ຍົກເລີກ
            </button>
            <button type="submit" disabled={busy}
              style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: busy ? "var(--muted)" : "var(--accent)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: busy ? "not-allowed" : "pointer", transition: "background .15s" }}>
              {busy ? "ກຳລັງບັນທຶກ..." : "ຕັ້ງຄ່າ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Customer Modal ────────────────────────────────────────────────

function AddCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<"trial" | "monthly" | "yearly">("trial");
  const [duration, setDuration] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const signUpRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${import.meta.env.VITE_FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password, returnSecureToken: false }),
        }
      );
      const signUpData = await signUpRes.json();
      if (!signUpRes.ok) {
        const code: string = signUpData.error?.message ?? "CREATE_USER_FAILED";
        if (code === "EMAIL_EXISTS") throw new Error("ອີເມວນີ້ມີໃນລະບົບແລ້ວ");
        throw new Error(code);
      }
      const uid: string = signUpData.localId;
      const shopId = uid;

      const now = serverTimestamp();
      const expiresAt = Timestamp.fromDate(planEndsAt(plan, duration));

      const batch = writeBatch(db);
      batch.set(doc(db, "users", uid), { role: "customer", shopId, email: email.trim() });
      batch.set(doc(db, "shops", shopId), { name: shopName.trim(), createdAt: now });
      batch.set(doc(db, `shops/${shopId}/users`, uid), { role: "customer", email: email.trim(), createdAt: now });
      batch.set(doc(db, "tenants", shopId), {
        shopName: shopName.trim(), ownerEmail: email.trim(), ownerUid: uid,
        plan, duration, status: plan === "trial" ? "trial" : "active", expiresAt, createdAt: now,
      });
      await batch.commit();
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ເກີດຂໍ້ຜິດພາດ";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(10,22,40,.6)",
        backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: 20,
      }}
    >
      <div style={{
        background: "var(--surf)", borderRadius: 14,
        width: "100%", maxWidth: 440,
        boxShadow: "0 20px 60px rgba(0,0,0,.2)",
        overflow: "hidden",
      }}>
        {/* Modal header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>ເພີ່ມລູກຄ້າໃໝ່</div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>ສ້າງບັນຊີສຳລັບຮ້ານຄ້າ</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", padding: 4, borderRadius: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          <Field label="ຊື່ຮ້ານຄ້າ" required>
            <input type="text" value={shopName} onChange={e => setShopName(e.target.value)}
              placeholder="ເຊັ່ນ: ຮ້ານເສື້ອຜ້າ" required style={inputStyle} />
          </Field>
          <Field label="ອີເມວ" required>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Customer email" required style={inputStyle} />
          </Field>
          <Field label="ລະຫັດຜ່ານ" required>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="ຕັ້ງລະຫັດໃຫ້ customer" required minLength={8} style={inputStyle} />
          </Field>
          <Field label="ແພັກເກດ">
            <select value={plan} onChange={e => { setPlan(e.target.value as typeof plan); setDuration(1); }} style={inputStyle}>
              <option value="trial">ທົດລອງໃຊ້ 30 ວັນ (ຟຣີ)</option>
              <option value="monthly">ລາຍເດືອນ</option>
              <option value="yearly">ລາຍປີ</option>
            </select>
          </Field>
          {plan === "monthly" && (
            <Field label="ຈຳນວນເດືອນ">
              <div style={{ display: "flex", gap: 8 }}>
                {MONTHLY_DURATIONS.map(m => (
                  <button key={m} type="button" onClick={() => setDuration(m)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 7, fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${duration === m ? "var(--accent)" : "var(--border)"}`,
                      background: duration === m ? "var(--accent-bg)" : "var(--surf2)",
                      color: duration === m ? "var(--accent)" : "var(--text-2)", cursor: "pointer" }}>
                    {m}
                  </button>
                ))}
              </div>
            </Field>
          )}
          {plan === "yearly" && (
            <Field label="ຈຳນວນປີ">
              <div style={{ display: "flex", gap: 8 }}>
                {YEARLY_DURATIONS.map(y => (
                  <button key={y} type="button" onClick={() => setDuration(y)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 7, fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${duration === y ? "var(--accent)" : "var(--border)"}`,
                      background: duration === y ? "var(--accent-bg)" : "var(--surf2)",
                      color: duration === y ? "var(--accent)" : "var(--text-2)", cursor: "pointer" }}>
                    {y}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {error && (
            <div style={{ padding: "10px 14px", marginBottom: 16, background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "10px", border: "1.5px solid var(--border)", borderRadius: 8, background: "none", fontSize: 14, fontWeight: 500, color: "var(--text-2)", cursor: "pointer" }}>
              ຍົກເລີກ
            </button>
            <button type="submit" disabled={busy}
              style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: busy ? "var(--muted)" : "var(--accent)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: busy ? "not-allowed" : "pointer", transition: "background .15s" }}>
              {busy ? "ກຳລັງສ້າງ..." : "ສ້າງບັນຊີ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Customer Modal ───────────────────────────────────────────────

function EditCustomerModal({ tenant, onClose, onSaved }: {
  tenant: Tenant;
  onClose: () => void;
  onSaved: (updated: Tenant) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [shopName, setShopName] = useState(tenant.shopName);
  const [ownerEmail, setOwnerEmail] = useState(tenant.ownerEmail);
  const [plan, setPlan] = useState<Tenant["plan"]>(tenant.plan);
  const [duration, setDuration] = useState(tenant.duration ?? 1);
  const [status, setStatus] = useState<Tenant["status"]>(tenant.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopName.trim() || !ownerEmail.trim()) return;
    setError(""); setBusy(true);
    try {
      const shopId = tenant.id;
      const newEmail = ownerEmail.trim().toLowerCase();
      const emailChanged = newEmail !== tenant.ownerEmail.toLowerCase();

      if (emailChanged) {
        // Create new Auth user with new email
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const rand = new Uint8Array(16);
        crypto.getRandomValues(rand);
        const tempPassword = Array.from(rand, b => chars[b % 62]).join("") + "Aa1!";

        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${import.meta.env.VITE_FIREBASE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: newEmail, password: tempPassword, returnSecureToken: false }),
          }
        );
        const json = await res.json();
        if (!res.ok) {
          const code: string = json.error?.message ?? "FAILED";
          if (code === "EMAIL_EXISTS") throw new Error("ອີເມວນີ້ຖືກໃຊ້ແລ້ວ");
          throw new Error(code);
        }
        const newUid: string = json.localId;
        const now = serverTimestamp();

        // Migrate: new uid points to same shopId — all shop data preserved
        const batch = writeBatch(db);
        batch.set(doc(db, "users", newUid), { role: "customer", shopId, email: newEmail, createdAt: now });
        batch.set(doc(db, "shops", shopId, "users", newUid), { role: "customer", email: newEmail, createdAt: now });
        batch.delete(doc(db, "users", tenant.id));
        batch.delete(doc(db, "shops", shopId, "users", tenant.id));
        const expiresAt = Timestamp.fromDate(planEndsAt(plan, duration));
        batch.update(doc(db, "tenants", shopId), {
          shopName: shopName.trim(), ownerEmail: newEmail, ownerUid: newUid,
          plan, duration, expiresAt, status, updatedAt: now,
        });
        batch.update(doc(db, "shops", shopId), {
          name: shopName.trim(), updatedAt: now,
        });
        await batch.commit();
        await sendPasswordResetEmail(auth, newEmail);
      } else {
        const expiresAt = Timestamp.fromDate(planEndsAt(plan, duration));
        const batch = writeBatch(db);
        batch.update(doc(db, "tenants", shopId), {
          shopName: shopName.trim(), plan, duration, expiresAt, status, updatedAt: serverTimestamp(),
        });
        batch.update(doc(db, "shops", shopId), {
          name: shopName.trim(), updatedAt: serverTimestamp(),
        });
        await batch.commit();
      }

      onSaved({ ...tenant, shopName: shopName.trim(), ownerEmail: newEmail, plan, duration, status });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} style={{
      position: "fixed", inset: 0, background: "rgba(10,22,40,.6)",
      backdropFilter: "blur(3px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 200, padding: 20,
    }}>
      <div style={{
        background: "var(--surf)", borderRadius: 14, width: "100%", maxWidth: 440,
        boxShadow: "0 20px 60px rgba(0,0,0,.2)", overflow: "hidden",
      }}>
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>ແກ້ໄຂຂໍ້ມູນລູກຄ້າ</div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{tenant.ownerEmail}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", padding: 4, borderRadius: 6, cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          <Field label="ຊື່ຮ້ານຄ້າ" required>
            <input type="text" value={shopName} onChange={e => setShopName(e.target.value)}
              required style={inputStyle} />
          </Field>
          <Field label="ອີເມວເຈົ້າຂອງຮ້ານ" required>
            <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
              required style={inputStyle} />
            {ownerEmail.trim().toLowerCase() !== tenant.ownerEmail.toLowerCase() && (
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--yellow)" }}>
                ⚠️ ປ່ຽນ email — Firebase ຈະສົ່ງ reset ລະຫັດໄປ email ໃໝ່ທັນທີ
              </div>
            )}
          </Field>
          <Field label="ແພັກເກດ">
            <select value={plan} onChange={e => { setPlan(e.target.value as Tenant["plan"]); setDuration(1); }} style={inputStyle}>
              <option value="trial">ທົດລອງໃຊ້ 30 ວັນ (ຟຣີ)</option>
              <option value="monthly">ລາຍເດືອນ</option>
              <option value="yearly">ລາຍປີ</option>
            </select>
          </Field>
          {plan === "monthly" && (
            <Field label="ຈຳນວນເດືອນ">
              <div style={{ display: "flex", gap: 8 }}>
                {MONTHLY_DURATIONS.map(m => (
                  <button key={m} type="button" onClick={() => setDuration(m)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 7, fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${duration === m ? "var(--accent)" : "var(--border)"}`,
                      background: duration === m ? "var(--accent-bg)" : "var(--surf2)",
                      color: duration === m ? "var(--accent)" : "var(--text-2)", cursor: "pointer" }}>
                    {m}
                  </button>
                ))}
              </div>
            </Field>
          )}
          {plan === "yearly" && (
            <Field label="ຈຳນວນປີ">
              <div style={{ display: "flex", gap: 8 }}>
                {YEARLY_DURATIONS.map(y => (
                  <button key={y} type="button" onClick={() => setDuration(y)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 7, fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${duration === y ? "var(--accent)" : "var(--border)"}`,
                      background: duration === y ? "var(--accent-bg)" : "var(--surf2)",
                      color: duration === y ? "var(--accent)" : "var(--text-2)", cursor: "pointer" }}>
                    {y}
                  </button>
                ))}
              </div>
            </Field>
          )}
          <Field label="ສະຖານະ">
            <select value={status} onChange={e => setStatus(e.target.value as Tenant["status"])} style={inputStyle}>
              <option value="active">ໃຊ້ງານ</option>
              <option value="trial">ທົດລອງໃຊ້</option>
              <option value="suspended">ລະງັບ</option>
              <option value="cancelled">ຍົກເລີກ</option>
            </select>
          </Field>

          {error && (
            <div style={{ padding: "10px 14px", marginBottom: 16, background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "10px", border: "1.5px solid var(--border)", borderRadius: 8, background: "none", fontSize: 14, fontWeight: 500, color: "var(--text-2)", cursor: "pointer" }}>
              ຍົກເລີກ
            </button>
            <button type="submit" disabled={busy}
              style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: busy ? "var(--muted)" : "var(--accent)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: busy ? "not-allowed" : "pointer", transition: "background .15s" }}>
              {busy ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 13px",
  border: "1.5px solid var(--border)",
  borderRadius: 8, fontSize: 14, color: "var(--text)",
  background: "var(--surf)", outline: "none",
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}
