import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email, password);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ ຫຼືທ່ານບໍ່ມີສິດໃຊ້ງານ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--sidebar-bg)",
      display: "flex",
      alignItems: "stretch",
    }}>
      {/* Left panel — brand */}
      <div style={{
        flex: "0 0 420px",
        background: "linear-gradient(160deg, #0A1628 0%, #0F2033 60%, #0C2840 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 52px",
        borderRight: "1px solid rgba(255,255,255,.06)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 52 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Market POS</div>
            <div style={{ fontSize: 12, color: "rgba(139,174,200,.7)", marginTop: 1 }}>Control Panel</div>
          </div>
        </div>

        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1.25, marginBottom: 14 }}>
            ຈັດການລະບົບທັງໝົດ<br />ຈາກທີ່ດຽວ
          </div>
          <div style={{ fontSize: 15, color: "rgba(139,174,200,.75)", lineHeight: 1.7 }}>
            ດູແລ ລູກຄ້າ, subscription<br />ແລະຂໍ້ມູນທຸກຮ້ານໄດ້ຈາກໜ້ານີ້
          </div>
        </div>

        {/* Feature list */}
        {[
          "ເພີ່ມແລະຈັດການລູກຄ້າໃໝ່",
          "ເບິ່ງຂໍ້ມູນຍອດຂາຍທຸກຮ້ານ",
          "ຄວບຄຸມສະຖານະ subscription",
        ].map((item) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: "rgba(14,165,160,.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0EA5A0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span style={{ fontSize: 13, color: "rgba(200,216,228,.8)" }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1,
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
              ເຂົ້າສູ່ລະບົບ
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-2)" }}>
              ສຳລັບ superadmin ແລະ admin ເທົ່ານັ້ນ
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                ອີເມວ
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                style={{
                  width: "100%", padding: "10px 14px",
                  border: "1.5px solid var(--border)",
                  borderRadius: 8, outline: "none",
                  fontSize: 14, color: "var(--text)",
                  background: "var(--surf)",
                  transition: "border-color .15s",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                ລະຫັດຜ່ານ
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%", padding: "10px 40px 10px 14px",
                    border: "1.5px solid var(--border)",
                    borderRadius: 8, outline: "none",
                    fontSize: 14, color: "var(--text)",
                    background: "var(--surf)",
                    transition: "border-color .15s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "var(--muted)", padding: 2,
                  }}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", marginBottom: 16,
                background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.25)",
                borderRadius: 8, fontSize: 13, color: "var(--red)",
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              style={{
                width: "100%", padding: "11px",
                background: busy ? "var(--muted)" : "var(--accent)",
                border: "none", borderRadius: 8,
                color: "#fff", fontSize: 15, fontWeight: 600,
                transition: "background .15s, transform .1s",
              }}
              onMouseEnter={e => { if (!busy) e.currentTarget.style.background = "var(--accent-dark)"; }}
              onMouseLeave={e => { if (!busy) e.currentTarget.style.background = "var(--accent)"; }}
            >
              {busy ? "ກຳລັງເຂົ້າສູ່ລະບົບ..." : "ເຂົ້າສູ່ລະບົບ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
