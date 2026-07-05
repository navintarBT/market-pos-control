import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

interface Tenant {
  id: string;
  shopName: string;
  ownerEmail: string;
  plan: string;
  status: "active" | "suspended" | "cancelled" | "trial";
  createdAt: Date;
}


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

export default function Dashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, "tenants"), orderBy("createdAt", "desc")));
        const data = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Tenant, "id" | "createdAt">),
          createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        })) as Tenant[];
        setTenants(data);
      } catch {
        // collection might be empty on first run
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

    </div>
  );
}
