import { useEffect, useState, useRef } from "react";
import {
  collection, getDocs, query, orderBy,
  doc, addDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Package {
  id: string;
  name: string;
  price: number;
  duration: number;
  unit: "day" | "month" | "year";
  active: boolean;
  order: number;
}

export const UNIT_LABELS: Record<string, string> = { day: "ວັນ", month: "ເດືອນ", year: "ປີ" };

export default function PackageSettings() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editPkg, setEditPkg] = useState<Package | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "packages"), orderBy("order")));
      setPackages(snap.docs.map(d => ({
        id: d.id,
        name: d.data().name ?? "",
        price: d.data().price ?? 0,
        duration: d.data().duration ?? 1,
        unit: d.data().unit ?? "month",
        active: d.data().active ?? true,
        order: d.data().order ?? 0,
      })));
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(pkg: Package) {
    setActionId(pkg.id);
    try {
      await updateDoc(doc(db, "packages", pkg.id), { active: !pkg.active, updatedAt: serverTimestamp() });
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, active: !p.active } : p));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>ແພັກເກດ</h1>
          <p style={{ fontSize: 14, color: "var(--text-2)" }}>ຈັດການລາຄາ ແລະ ໄລຍະຂອງແຕ່ລະແພັກເກດ</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 18px", background: "var(--accent)",
            border: "none", borderRadius: 8, color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background .15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-dark)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--accent)")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          ເພີ່ມແພັກເກດ
        </button>
      </div>

      <div style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, display: "flex", justifyContent: "center" }}><div className="spinner"/></div>
        ) : packages.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
            ຍັງບໍ່ມີແພັກເກດ ກົດ "ເພີ່ມແພັກເກດ" ເພື່ອເລີ່ມ
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surf2)" }}>
                  {["ຊື່ແພັກເກດ", "ລາຄາ", "ໄລຍະ", "ສະຖານະ", ""].map(h => (
                    <th key={h} style={{
                      padding: "11px 20px", textAlign: "left",
                      fontSize: 12, fontWeight: 600, letterSpacing: ".05em",
                      textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packages.map(pkg => (
                  <tr key={pkg.id}
                    style={{ borderBottom: "1px solid var(--border)", transition: "background .1s", opacity: pkg.active ? 1 : 0.5 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surf2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--text)", fontSize: 15 }}>
                      {pkg.name}
                    </td>
                    <td style={{ padding: "14px 20px", fontWeight: 700, color: "#10b981" }}>
                      {pkg.price === 0 ? "ຟຣີ" : `${pkg.price.toLocaleString()} ₭`}
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--text-2)", fontSize: 13 }}>
                      {pkg.duration} {UNIT_LABELS[pkg.unit]}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        display: "inline-block", fontSize: 12, fontWeight: 600, borderRadius: 20, padding: "2px 10px",
                        color: pkg.active ? "var(--green)" : "var(--muted)",
                        background: pkg.active ? "var(--green-bg)" : "var(--surf2)",
                        border: `1px solid ${pkg.active ? "rgba(16,185,129,.3)" : "var(--border)"}`,
                      }}>
                        {pkg.active ? "ໃຊ້ງານ" : "ປິດໃຊ້"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setEditPkg(pkg)}
                          style={{
                            padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                            border: "1px solid rgba(59,130,246,.3)",
                            background: "var(--blue-bg)", color: "var(--blue)", cursor: "pointer",
                          }}
                        >ແກ້ໄຂ</button>
                        <button
                          onClick={() => toggleActive(pkg)}
                          disabled={actionId === pkg.id}
                          style={{
                            padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                            border: `1px solid ${pkg.active ? "rgba(239,68,68,.3)" : "rgba(16,185,129,.3)"}`,
                            background: pkg.active ? "var(--red-bg)" : "var(--green-bg)",
                            color: pkg.active ? "var(--red)" : "var(--green)",
                            cursor: actionId === pkg.id ? "not-allowed" : "pointer",
                            opacity: actionId === pkg.id ? 0.6 : 1,
                          }}
                        >
                          {pkg.active ? "ປິດໃຊ້" : "ເປີດໃຊ້"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <PackageModal
          nextOrder={packages.length}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}
      {editPkg && (
        <PackageModal
          pkg={editPkg}
          nextOrder={packages.length}
          onClose={() => setEditPkg(null)}
          onSaved={() => { setEditPkg(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Package Modal (Add / Edit) ────────────────────────────────────────

function PackageModal({ pkg, nextOrder, onClose, onSaved }: {
  pkg?: Package;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(pkg?.name ?? "");
  const [price, setPrice] = useState(pkg ? String(pkg.price) : "");
  const [duration, setDuration] = useState(pkg ? String(pkg.duration) : "1");
  const [unit, setUnit] = useState<"day" | "month" | "year">(pkg?.unit ?? "month");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const data = {
        name: name.trim(),
        price: parseFloat(price) || 0,
        duration: parseInt(duration) || 1,
        unit,
        active: pkg?.active ?? true,
        order: pkg?.order ?? nextOrder,
        updatedAt: serverTimestamp(),
      };
      if (pkg) {
        await updateDoc(doc(db, "packages", pkg.id), data);
      } else {
        await addDoc(collection(db, "packages"), { ...data, createdAt: serverTimestamp() });
      }
      onSaved();
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
        background: "var(--surf)", borderRadius: 14, width: "100%", maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,.2)", overflow: "hidden",
      }}>
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
            {pkg ? "ແກ້ໄຂແພັກເກດ" : "ເພີ່ມແພັກເກດໃໝ່"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", padding: 4, borderRadius: 6, cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          <Field label="ຊື່ແພັກເກດ" required>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} placeholder="ເຊັ່ນ: ລາຍເດືອນ Basic" />
          </Field>
          <Field label="ລາຄາ (₭)">
            <input type="number" min="0" step="1000" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} placeholder="0 = ຟຣີ" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Field label="ໄລຍະ" required>
              <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} required style={inputStyle} />
            </Field>
            <Field label="ໜ່ວຍ">
              <select value={unit} onChange={e => setUnit(e.target.value as typeof unit)} style={inputStyle}>
                <option value="day">ວັນ</option>
                <option value="month">ເດືອນ</option>
                <option value="year">ປີ</option>
              </select>
            </Field>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", marginBottom: 16, background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", border: "1.5px solid var(--border)", borderRadius: 8, background: "none", fontSize: 14, fontWeight: 500, color: "var(--text-2)", cursor: "pointer" }}>
              ຍົກເລີກ
            </button>
            <button type="submit" disabled={busy} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: busy ? "var(--muted)" : "var(--accent)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: busy ? "not-allowed" : "pointer" }}>
              {busy ? "ກຳລັງບັນທຶກ..." : pkg ? "ບັນທຶກ" : "ເພີ່ມ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 13px",
  border: "1.5px solid var(--border)", borderRadius: 8,
  fontSize: 14, color: "var(--text)", background: "var(--surf)", outline: "none",
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
