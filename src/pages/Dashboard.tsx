import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

interface Tenant {
  id: string;
  shopName: string;
  ownerEmail: string;
  plan: string;
  status: "active" | "suspended" | "cancelled" | "trial";
  createdAt: Date;
}

const STATUS_CONFIG = {
  active:    { label: "ໃຊ້ງານ",    color: "var(--green)",  bg: "var(--green-bg)"  },
  trial:     { label: "ທົດລອງໃຊ້", color: "var(--yellow)", bg: "var(--yellow-bg)" },
  suspended: { label: "ລະງັບ",     color: "var(--red)",    bg: "var(--red-bg)"    },
  cancelled: { label: "ຍົກເລີກ",   color: "var(--muted)",  bg: "var(--surf2)"     },
};

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surf)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "20px 24px",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: color === "var(--accent)" ? "var(--accent-bg)" : `${color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.cancelled;
  return (
    <span style={{
      display: "inline-block", fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}30`,
      borderRadius: 20, padding: "2px 10px",
    }}>
      {cfg.label}
    </span>
  );
}

export default function Dashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, "tenants"), orderBy("createdAt", "desc"), limit(50)));
        const data = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Tenant, "id" | "createdAt">),
          createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        })) as Tenant[];
        setTenants(data);
      } catch {
        // collection might be empty on first run
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === "active").length,
    trial: tenants.filter(t => t.status === "trial").length,
    suspended: tenants.filter(t => t.status === "suspended").length,
  };

  const recent = tenants.slice(0, 5);

  return (
    <div style={{ padding: "32px 36px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: "var(--text-2)" }}>ພາບລວມລະບົບທັງໝົດ</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 }}>
        <StatCard label="ລູກຄ້າທັງໝົດ" value={stats.total} color="var(--accent)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard label="ກຳລັງໃຊ້ງານ" value={stats.active} color="var(--green)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        />
        <StatCard label="ທົດລອງໃຊ້" value={stats.trial} color="var(--yellow)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard label="ຖືກລະງັບ" value={stats.suspended} color="var(--red)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}
        />
      </div>

      {/* Recent customers */}
      <div style={{
        background: "var(--surf)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", overflow: "hidden",
      }}>
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>ລູກຄ້າລ່າສຸດ</div>
          <a href="/customers" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
            ເບິ່ງທັງໝົດ →
          </a>
        </div>

        {loading ? (
          <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
            <div className="spinner" />
          </div>
        ) : recent.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
            ຍັງບໍ່ມີລູກຄ້າ — ເພີ່ມລູກຄ້າທຳອິດໄດ້ທີ່ໜ້າ Customers
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["ຊື່ຮ້ານ", "ອີເມວ", "ແພັກເກດ", "ສະຖານະ", "ວັນທີສະໝັກ"].map(h => (
                  <th key={h} style={{
                    padding: "10px 20px", textAlign: "left",
                    fontSize: 12, fontWeight: 600, letterSpacing: ".05em",
                    textTransform: "uppercase", color: "var(--muted)",
                    background: "var(--surf2)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(t => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 500, color: "var(--text)" }}>{t.shopName}</td>
                  <td style={{ padding: "14px 20px", color: "var(--text-2)", fontSize: 13 }}>{t.ownerEmail}</td>
                  <td style={{ padding: "14px 20px", color: "var(--text-2)", fontSize: 13, textTransform: "capitalize" }}>{t.plan}</td>
                  <td style={{ padding: "14px 20px" }}><StatusBadge status={t.status as keyof typeof STATUS_CONFIG} /></td>
                  <td style={{ padding: "14px 20px", color: "var(--muted)", fontSize: 13 }}>
                    {t.createdAt.toLocaleDateString("lo-LA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
