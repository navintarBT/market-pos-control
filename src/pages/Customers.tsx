import { useEffect, useState, useRef } from "react";
import {
  collection, getDocs, query, orderBy,
  doc, updateDoc, serverTimestamp, writeBatch, Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

interface Tenant {
  id: string;
  shopName: string;
  ownerEmail: string;
  plan: "trial" | "monthly" | "yearly";
  status: "active" | "trial" | "suspended" | "cancelled";
  createdAt: Date;
}

const STATUS_CFG = {
  active:    { label: "ໃຊ້ງານ",    color: "var(--green)",  bg: "var(--green-bg)"  },
  trial:     { label: "ທົດລອງໃຊ້", color: "var(--yellow)", bg: "var(--yellow-bg)" },
  suspended: { label: "ລະງັບ",     color: "var(--red)",    bg: "var(--red-bg)"    },
  cancelled: { label: "ຍົກເລີກ",   color: "var(--muted)",  bg: "var(--surf2)"     },
};

const PLAN_LABEL: Record<string, string> = {
  trial: "ທົດລອງໃຊ້ (30 ວັນ)",
  monthly: "ລາຍເດືອນ",
  yearly: "ລາຍປີ",
};

export default function Customers() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  async function loadTenants() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "tenants"), orderBy("createdAt", "desc")));
      setTenants(snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Tenant, "id" | "createdAt">),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      })));
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
                  {["ຊື່ຮ້ານ", "ອີເມວເຈົ້າຂອງຮ້ານ", "ແພັກເກດ", "ສະຖານະ", "ວັນທີສະໝັກ", ""].map(h => (
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
                      <td style={{ padding: "14px 20px", color: "var(--text-2)", fontSize: 13 }}>{PLAN_LABEL[t.plan] ?? t.plan}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{
                          display: "inline-block", fontSize: 12, fontWeight: 600,
                          color: cfg.color, background: cfg.bg,
                          border: `1px solid ${cfg.color}30`, borderRadius: 20, padding: "2px 10px",
                        }}>{cfg.label}</span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "var(--muted)", fontSize: 13, whiteSpace: "nowrap" }}>
                        {t.createdAt.toLocaleDateString("lo-LA")}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
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
      // สร้าง Firebase Auth user ผ่าน REST API (ไม่กระทบ session ปัจจุบัน)
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
        if (code.startsWith("WEAK_PASSWORD")) throw new Error("ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ");
        throw new Error(code);
      }
      const uid: string = signUpData.localId;
      const shopId = uid;

      // เขียน Firestore ทั้งหมดใน batch เดียว
      const now = serverTimestamp();
      const trialEndsAt = plan === "trial"
        ? Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
        : null;

      const batch = writeBatch(db);
      batch.set(doc(db, "users", uid), { role: "customer", shopId, email: email.trim() });
      batch.set(doc(db, "shops", shopId), { name: shopName.trim(), createdAt: now });
      batch.set(doc(db, `shops/${shopId}/users`, uid), { role: "customer", email: email.trim(), createdAt: now });
      batch.set(doc(db, "tenants", shopId), {
        shopName: shopName.trim(), ownerEmail: email.trim(), ownerUid: uid,
        plan, status: "trial", trialEndsAt, createdAt: now,
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
              placeholder="owner@example.com" required style={inputStyle} />
          </Field>
          <Field label="ລະຫັດຜ່ານເລີ່ມຕົ້ນ" required>
            <input type="text" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ" minLength={8} required style={inputStyle} />
          </Field>
          <Field label="ແພັກເກດ">
            <select value={plan} onChange={e => setPlan(e.target.value as typeof plan)} style={inputStyle}>
              <option value="trial">ທົດລອງໃຊ້ 30 ວັນ (ຟຣີ)</option>
              <option value="monthly">ລາຍເດືອນ</option>
              <option value="yearly">ລາຍປີ</option>
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
              {busy ? "ກຳລັງສ້າງ..." : "ສ້າງບັນຊີ"}
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
