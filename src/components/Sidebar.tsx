import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/customers",
    label: "ລູກຄ້າ",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: "/packages",
    label: "ແພັກເກດ",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <aside style={{
      width: "var(--sidebar-w)",
      background: "var(--sidebar-bg)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{
        padding: "24px 20px 20px",
        borderBottom: "1px solid var(--sidebar-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", lineHeight: 1.2 }}>Market POS</div>
            <div style={{ fontSize: 11, color: "var(--sidebar-text)", marginTop: 1 }}>Control Panel</div>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--sidebar-border)" }}>
        <span style={{
          display: "inline-block",
          fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase",
          background: role === "superadmin" ? "rgba(14,165,160,.2)" : "rgba(59,130,246,.15)",
          color: role === "superadmin" ? "var(--accent)" : "#7CB8F5",
          border: `1px solid ${role === "superadmin" ? "rgba(14,165,160,.3)" : "rgba(59,130,246,.25)"}`,
          borderRadius: 4, padding: "3px 8px",
        }}>
          {role === "superadmin" ? "Super Admin" : "Admin"}
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 7,
              marginBottom: 2,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
              background: isActive ? "var(--sidebar-active)" : "transparent",
              transition: "background .15s, color .15s",
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}

      </nav>

      {/* User info + Sign out */}
      <div style={{
        padding: "16px 20px",
        borderTop: "1px solid var(--sidebar-border)",
      }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#C8D8E8", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: "100%", padding: "8px 12px",
            background: "rgba(239,68,68,.08)",
            border: "1px solid rgba(239,68,68,.2)",
            borderRadius: 6, color: "#F87171",
            fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
            transition: "background .15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,.15)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,.08)")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          ອອກຈາກລະບົບ
        </button>
      </div>
    </aside>
  );
}
