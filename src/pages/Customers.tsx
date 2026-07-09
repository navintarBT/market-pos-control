import { useEffect, useState, useRef } from "react";
import {
  collection, getDocs, query, orderBy,
  doc, updateDoc, addDoc, serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import LaoAddressSelect from "../components/LaoAddressSelect";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  village: string;
  district: string;
  province: string;
  dateOfBirth: string;
  idType: "id_card" | "passport" | "household";
  idNumber: string;
  createdAt: Date;
}

const ID_TYPE_LABELS: Record<string, string> = {
  id_card: "ບັດປະຈຳຕົວ",
  passport: "ໜັງສືຜ່ານດ່ານ",
  household: "ສຳມະໂນຄົວ",
};

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "customers"), orderBy("createdAt", "desc")));
      setCustomers(snap.docs.map(d => ({
        id: d.id,
        firstName: d.data().firstName ?? "",
        lastName: d.data().lastName ?? "",
        phone: d.data().phone ?? "",
        email: d.data().email ?? "",
        village: d.data().village ?? "",
        district: d.data().district ?? "",
        province: d.data().province ?? "",
        dateOfBirth: d.data().dateOfBirth ?? "",
        idType: d.data().idType ?? "id_card",
        idNumber: d.data().idNumber ?? "",
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      })));
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !search
      || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
      || c.phone.includes(q)
      || c.email.toLowerCase().includes(q)
      || c.idNumber.toLowerCase().includes(q)
      || c.village.toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: "32px 36px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>ລູກຄ້າ</h1>
          <p style={{ fontSize: 14, color: "var(--text-2)" }}>ຂໍ້ມູນສ່ວນຕົວລູກຄ້າ — ກົດ "ຮ້ານ →" ເພື່ອຈັດການຮ້ານ</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 18px", background: "var(--accent)",
            border: "none", borderRadius: 8,
            color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: "pointer", transition: "background .15s",
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

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 360, marginBottom: 20 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text" placeholder="ຄົ້ນຫາຊື່, ເບີໂທ, ໝາຍເລກ..."
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

      {/* Table */}
      <div style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, display: "flex", justifyContent: "center" }}><div className="spinner"/></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--muted)" }}>
              {customers.length === 0 ? "ຍັງບໍ່ມີລູກຄ້າ ກົດ \"ເພີ່ມລູກຄ້າໃໝ່\" ເພື່ອເລີ່ມ" : "ບໍ່ພົບຂໍ້ມູນທີ່ຄົ້ນຫາ"}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surf2)" }}>
                  {["ຊື່-ນາມສະກຸນ", "ເບີໂທ / Gmail", "ບ້ານ / ເມືອງ / ແຂວງ", "ວັນເດືອນປີເກີດ", "ປ.ຈ. / ໝາຍເລກ", ""].map(h => (
                    <th key={h} style={{
                      padding: "11px 20px", textAlign: "left",
                      fontSize: 12, fontWeight: 600, letterSpacing: ".05em",
                      textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}
                    style={{ borderBottom: "1px solid var(--border)", transition: "background .1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surf2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 20px", fontWeight: 600, color: "var(--text)" }}>
                      {c.firstName} {c.lastName}
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--text-2)", fontSize: 13 }}>
                      <div>{c.phone || "—"}</div>
                      {c.email && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{c.email}</div>}
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--text-2)", fontSize: 13 }}>
                      {[c.village, c.district, c.province].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--text-2)", fontSize: 13 }}>
                      {c.dateOfBirth || "—"}
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--text-2)", fontSize: 13 }}>
                      <span style={{ fontSize: 11, color: "var(--muted)", marginRight: 4 }}>
                        {ID_TYPE_LABELS[c.idType]}
                      </span>
                      {c.idNumber || "—"}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setEditCustomer(c)}
                          style={{
                            padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                            border: "1px solid rgba(59,130,246,.3)",
                            background: "var(--blue-bg)", color: "var(--blue)", cursor: "pointer",
                          }}
                        >ແກ້ໄຂ</button>
                        <button
                          onClick={() => navigate(`/customers/${c.id}`)}
                          style={{
                            padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                            border: "1px solid rgba(224,123,57,.3)",
                            background: "rgba(224,123,57,.08)", color: "var(--accent)", cursor: "pointer",
                          }}
                        >ຮ້ານ →</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && (
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
          ສະແດງ {filtered.length} ຈາກ {customers.length} ລາຍການ
        </div>
      )}

      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(); }}
        />
      )}

      {editCustomer && (
        <EditCustomerModal
          customer={editCustomer}
          onClose={() => setEditCustomer(null)}
          onSaved={(updated) => {
            setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
            setEditCustomer(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Add Customer Modal ────────────────────────────────────────────────

function AddCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idType, setIdType] = useState<"id_card" | "passport" | "household">("id_card");
  const [idNumber, setIdNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await addDoc(collection(db, "customers"), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        village: village.trim(),
        district: district.trim(),
        province: province.trim(),
        dateOfBirth,
        idType,
        idNumber: idNumber.trim(),
        createdAt: serverTimestamp(),
      });
      onCreated();
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
        background: "var(--surf)", borderRadius: 14, width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,.2)", overflow: "hidden",
        maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>ເພີ່ມລູກຄ້າໃໝ່</div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>ຂໍ້ມູນສ່ວນຕົວ</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", padding: 4, borderRadius: 6, cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="ຊື່" required>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} placeholder="ຊື່" />
            </Field>
            <Field label="ນາມສະກຸນ" required>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required style={inputStyle} placeholder="ນາມສະກຸນ" />
            </Field>
          </div>
          <Field label="ເບີໂທ" required>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={inputStyle} placeholder="020xxxxxxxx" />
          </Field>
          <Field label="Gmail / ອີເມວ">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="example@gmail.com" />
          </Field>
          <LaoAddressSelect
            province={province} district={district} village={village}
            onProvinceChange={setProvince} onDistrictChange={setDistrict} onVillageChange={setVillage}
          />
          <Field label="ວັນເດືອນປີເກີດ">
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="ປະເພດເອກະສານ" required>
            <select value={idType} onChange={e => setIdType(e.target.value as typeof idType)} style={inputStyle}>
              <option value="id_card">ບັດປະຈຳຕົວ</option>
              <option value="passport">ໜັງສືຜ່ານດ່ານ</option>
              <option value="household">ສຳມະໂນຄົວ</option>
            </select>
          </Field>
          <Field label="ໝາຍເລກເອກະສານ" required>
            <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)} required style={inputStyle} placeholder="ໝາຍເລກ" />
          </Field>

          {error && (
            <div style={{ padding: "10px 14px", marginBottom: 16, background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", border: "1.5px solid var(--border)", borderRadius: 8, background: "none", fontSize: 14, fontWeight: 500, color: "var(--text-2)", cursor: "pointer" }}>
              ຍົກເລີກ
            </button>
            <button type="submit" disabled={busy} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: busy ? "var(--muted)" : "var(--accent)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: busy ? "not-allowed" : "pointer", transition: "background .15s" }}>
              {busy ? "ກຳລັງບັນທຶກ..." : "ເພີ່ມລູກຄ້າ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Customer Modal ───────────────────────────────────────────────

function EditCustomerModal({ customer, onClose, onSaved }: {
  customer: Customer;
  onClose: () => void;
  onSaved: (updated: Customer) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [firstName, setFirstName] = useState(customer.firstName);
  const [lastName, setLastName] = useState(customer.lastName);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email);
  const [village, setVillage] = useState(customer.village);
  const [district, setDistrict] = useState(customer.district);
  const [province, setProvince] = useState(customer.province);
  const [dateOfBirth, setDateOfBirth] = useState(customer.dateOfBirth);
  const [idType, setIdType] = useState<Customer["idType"]>(customer.idType);
  const [idNumber, setIdNumber] = useState(customer.idNumber);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await updateDoc(doc(db, "customers", customer.id), {
        firstName: firstName.trim(), lastName: lastName.trim(),
        phone: phone.trim(), email: email.trim(),
        village: village.trim(), district: district.trim(), province: province.trim(),
        dateOfBirth, idType, idNumber: idNumber.trim(),
        updatedAt: serverTimestamp(),
      });
      onSaved({
        ...customer,
        firstName: firstName.trim(), lastName: lastName.trim(),
        phone: phone.trim(), email: email.trim(),
        village: village.trim(), district: district.trim(), province: province.trim(),
        dateOfBirth, idType, idNumber: idNumber.trim(),
      });
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
        background: "var(--surf)", borderRadius: 14, width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,.2)", overflow: "hidden",
        maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>ແກ້ໄຂຂໍ້ມູນລູກຄ້າ</div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{customer.firstName} {customer.lastName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", padding: 4, borderRadius: 6, cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="ຊື່" required>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} />
            </Field>
            <Field label="ນາມສະກຸນ" required>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required style={inputStyle} />
            </Field>
          </div>
          <Field label="ເບີໂທ" required>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={inputStyle} />
          </Field>
          <Field label="Gmail / ອີເມວ">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="example@gmail.com" />
          </Field>
          <LaoAddressSelect
            province={province} district={district} village={village}
            onProvinceChange={setProvince} onDistrictChange={setDistrict} onVillageChange={setVillage}
          />
          <Field label="ວັນເດືອນປີເກີດ">
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="ປະເພດເອກະສານ" required>
            <select value={idType} onChange={e => setIdType(e.target.value as Customer["idType"])} style={inputStyle}>
              <option value="id_card">ບັດປະຈຳຕົວ</option>
              <option value="passport">ໜັງສືຜ່ານດ່ານ</option>
              <option value="household">ສຳມະໂນຄົວ</option>
            </select>
          </Field>
          <Field label="ໝາຍເລກເອກະສານ" required>
            <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)} required style={inputStyle} />
          </Field>

          {error && (
            <div style={{ padding: "10px 14px", marginBottom: 16, background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", border: "1.5px solid var(--border)", borderRadius: 8, background: "none", fontSize: 14, fontWeight: 500, color: "var(--text-2)", cursor: "pointer" }}>
              ຍົກເລີກ
            </button>
            <button type="submit" disabled={busy} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: busy ? "var(--muted)" : "var(--accent)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: busy ? "not-allowed" : "pointer", transition: "background .15s" }}>
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
