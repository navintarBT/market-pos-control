import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";

interface TenantRow {
  id: string;
  shopName: string;
  ownerEmail: string;
  customerId: string;
  plan: string;
  status: "active" | "suspended" | "cancelled" | "trial";
  expiresAt?: Date;
  createdAt: Date;
}

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: number | string; sub?: string;
  color: string; icon: ReactNode;
}) {
  return (
    <div style={{
      background: "var(--surf)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "18px 22px",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "ໃຊ້ງານ",    color: "var(--green)",  bg: "var(--green-bg)" },
  trial:     { label: "ທົດລອງ",    color: "var(--yellow)", bg: "var(--yellow-bg)" },
  suspended: { label: "ລະງັບ",     color: "var(--red)",    bg: "var(--red-bg)" },
  cancelled: { label: "ຍົກເລີກ",   color: "var(--muted)",  bg: "var(--surf2)" },
};

function daysUntil(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [tenantSnap, custSnap] = await Promise.all([
          getDocs(query(collection(db, "tenants"), orderBy("createdAt", "desc"))),
          getDocs(collection(db, "customers")),
        ]);
        setCustomerCount(custSnap.size);
        setTenants(tenantSnap.docs.map(d => ({
          id: d.id,
          shopName: d.data().shopName ?? "",
          ownerEmail: d.data().ownerEmail ?? "",
          customerId: d.data().customerId ?? "",
          plan: d.data().plan ?? "trial",
          status: d.data().status ?? "trial",
          expiresAt: d.data().expiresAt instanceof Timestamp ? d.data().expiresAt.toDate() : undefined,
          createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toDate() : new Date(),
        })));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86_400_000);
  const in7  = new Date(now.getTime() + 7  * 86_400_000);

  const active    = tenants.filter(t => t.status === "active");
  const trial     = tenants.filter(t => t.status === "trial");
  const suspended = tenants.filter(t => t.status === "suspended");
  const unlimited = tenants.filter(t => t.plan === "unlimited");
  const expiring30 = active.filter(t => t.expiresAt && t.expiresAt > now && t.expiresAt <= in30);
  const expiring7  = active.filter(t => t.expiresAt && t.expiresAt > now && t.expiresAt <= in7);
  const expired    = tenants.filter(t => t.status === "active" && t.expiresAt && t.expiresAt <= now);

  const expiringSoon = [...expiring30].sort((a, b) => (a.expiresAt!.getTime()) - (b.expiresAt!.getTime()));

  const rowStyle: CSSProperties = {
    borderBottom: "1px solid var(--border)", transition: "background .1s", cursor: "pointer",
  };
  const thStyle: CSSProperties = {
    padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700,
    letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap",
  };
  const tdStyle: CSSProperties = { padding: "12px 16px", fontSize: 13, color: "var(--text-2)" };

  const iconShop = <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  const iconPeople = <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  const iconCheck = <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
  const iconClock = <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  const iconWarn  = <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  const iconBan   = <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
  const iconInf   = <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg>;

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: "var(--text-2)" }}>ພາບລວມລະບົບທັງໝົດ</p>
      </div>

      {loading ? (
        <div style={{ padding: 60, display: "flex", justifyContent: "center" }}><div className="spinner"/></div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
            <StatCard label="ລູກຄ້າທັງໝົດ"  value={customerCount}    color="var(--accent)"  icon={iconPeople} />
            <StatCard label="ຮ້ານທັງໝົດ"    value={tenants.length}   color="#3b82f6"        icon={iconShop} />
            <StatCard label="ກຳລັງໃຊ້ງານ"   value={active.length}    color="var(--green)"   icon={iconCheck} />
            <StatCard label="ທົດລອງໃຊ້"     value={trial.length}     color="var(--yellow)"  icon={iconClock} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
            <StatCard label="ຖືກລະງັບ"       value={suspended.length} color="var(--red)"     icon={iconBan} />
            <StatCard label="ໝົດໄວໆ (30 ວັນ)" value={expiring30.length} color="#f97316"
              sub={expiring7.length > 0 ? `${expiring7.length} ຮ້ານ ≤ 7 ວັນ!` : undefined} icon={iconWarn} />
            <StatCard label="ໝົດແລ້ວ (ຍັງ active)" value={expired.length} color="var(--red)" icon={iconWarn} />
            <StatCard label="Unlimited"       value={unlimited.length} color="#7c3aed"        icon={iconInf} />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>
              ⚠️ ໃກ້ໝົດອາຍຸ (30 ວັນ)
              <span style={{ fontWeight: 400, color: "var(--muted)", marginLeft: 8 }}>{expiringSoon.length} ຮ້ານ</span>
            </div>
            <div style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
              {expiringSoon.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", fontSize: 13, color: "var(--muted)" }}>ບໍ່ມີຮ້ານໃກ້ໝົດ 🎉</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--surf2)", borderBottom: "1px solid var(--border)" }}>
                        <th style={thStyle}>ຮ້ານ</th>
                        <th style={thStyle}>ໝົດອາຍຸ</th>
                        <th style={thStyle}>ເຫຼືອ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiringSoon.map(t => {
                        const days = daysUntil(t.expiresAt!);
                        const urgent = days <= 7;
                        return (
                          <tr key={t.id} style={rowStyle}
                            onClick={() => navigate(`/customers/${t.customerId}`)}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--surf2)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <td style={{ ...tdStyle, fontWeight: 600, color: "var(--text)" }}>
                              {t.shopName}
                              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{t.ownerEmail}</div>
                            </td>
                            <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                              {t.expiresAt!.toLocaleDateString("en-GB")}
                            </td>
                            <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                              <span style={{
                                fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "2px 10px",
                                color: urgent ? "var(--red)" : "#f97316",
                                background: urgent ? "var(--red-bg)" : "rgba(249,115,22,.1)",
                                border: `1px solid ${urgent ? "rgba(239,68,68,.3)" : "rgba(249,115,22,.3)"}`,
                              }}>
                                {days} ວັນ
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
