import { useRef, useState } from "react";
import { reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

interface Props {
  title: string;
  warning: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function ConfirmDestructiveModal({ title, warning, confirmLabel = "ລຶບ", onConfirm, onClose }: Props) {
  const { user } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<"password" | "confirm">("password");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current && !busy) onClose();
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email || !auth.currentUser) return;
    setError(""); setBusy(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      setStep("confirm");
    } catch {
      setError("ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    setBusy(true); setError("");
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ເກີດຂໍ້ຜິດພາດ");
      setBusy(false);
    }
  }

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} style={{
      position: "fixed", inset: 0, background: "rgba(10,22,40,.72)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 300, padding: 20,
    }}>
      <div style={{
        background: "var(--surf)", borderRadius: 14, width: "100%", maxWidth: 400,
        boxShadow: "0 24px 64px rgba(0,0,0,.3)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{title}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
              {step === "password" ? "ຢືນຢັນຕົວຕົນ superadmin ກ່ອນດຳເນີນການ" : "ຢືນຢັນການລຶບຂໍ້ມູນ"}
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Warning */}
          <div style={{
            padding: "12px 14px", marginBottom: 20,
            background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)",
            borderRadius: 8, fontSize: 13, color: "var(--red)", lineHeight: 1.65,
          }}>
            {warning}
          </div>

          {step === "password" ? (
            <form onSubmit={handleVerify}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                  ລະຫັດຜ່ານ superadmin
                  <span style={{ fontSize: 11, fontWeight: 400, color: "var(--muted)", marginLeft: 6 }}>({user?.email})</span>
                </label>
                <input
                  type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                  required autoFocus placeholder="••••••••"
                  style={{ width: "100%", padding: "9px 13px", border: `1.5px solid ${error ? "var(--red)" : "var(--border)"}`, borderRadius: 8, fontSize: 14, color: "var(--text)", background: "var(--surf)", outline: "none" }}
                />
              </div>
              {error && (
                <div style={{ marginBottom: 14, fontSize: 13, color: "var(--red)", fontWeight: 500 }}>{error}</div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={onClose} disabled={busy} style={{ flex: 1, padding: "10px", border: "1.5px solid var(--border)", borderRadius: 8, background: "none", fontSize: 14, fontWeight: 500, color: "var(--text-2)", cursor: "pointer" }}>
                  ຍົກເລີກ
                </button>
                <button type="submit" disabled={busy || !password} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: busy || !password ? "var(--muted)" : "var(--accent)", fontSize: 14, fontWeight: 600, color: "#fff", cursor: busy || !password ? "not-allowed" : "pointer" }}>
                  {busy ? "ກຳລັງກວດສອບ..." : "ຢືນຢັນຕົວຕົນ"}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 20, lineHeight: 1.6 }}>
                ທ່ານຢືນຢັນແລ້ວ — ກົດ <strong style={{ color: "var(--red)" }}>"{confirmLabel}"</strong> ເພື່ອດຳເນີນການ.<br/>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>ການກະທຳນີ້ <strong>ບໍ່ສາມາດກູ້ຄືນໄດ້</strong></span>
              </p>
              {error && (
                <div style={{ padding: "10px 14px", marginBottom: 14, background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>{error}</div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onClose} disabled={busy} style={{ flex: 1, padding: "10px", border: "1.5px solid var(--border)", borderRadius: 8, background: "none", fontSize: 14, fontWeight: 500, color: "var(--text-2)", cursor: "pointer" }}>
                  ຍົກເລີກ
                </button>
                <button onClick={handleConfirm} disabled={busy} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: busy ? "var(--muted)" : "#ef4444", fontSize: 14, fontWeight: 700, color: "#fff", cursor: busy ? "not-allowed" : "pointer" }}>
                  {busy ? "ກຳລັງລຶບ..." : confirmLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
