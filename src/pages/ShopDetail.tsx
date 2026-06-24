import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection, getDocs, query, orderBy, where,
  Timestamp, doc, getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

interface ProductVariant {
  size: string;
  color: string;
  stock: number;
  minStock?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  category?: string;
  variants: ProductVariant[];
}

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
}

interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  paymentType: "cash" | "qr";
  createdAt: Date;
}

function fmtK(n: number) {
  return n.toLocaleString("lo-LA");
}

type Tab = "products" | "sales" | "summary";

export default function ShopDetail() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("summary");
  const [shopName, setShopName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    getDoc(doc(db, "shops", shopId)).then(snap => {
      setShopName(snap.data()?.name ?? shopId);
    });
  }, [shopId]);

  useEffect(() => {
    if (!shopId) return;
    setLoadingProducts(true);
    getDocs(query(collection(db, "shops", shopId, "products"), orderBy("name")))
      .then(snap => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))))
      .finally(() => setLoadingProducts(false));
  }, [shopId]);

  useEffect(() => {
    if (!shopId) return;
    setLoadingSales(true);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date();   end.setHours(23, 59, 59, 999);
    getDocs(query(
      collection(db, "shops", shopId, "sales"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<=", Timestamp.fromDate(end)),
      orderBy("createdAt", "desc"),
    ))
      .then(snap => setSales(snap.docs.map(d => ({
        id: d.id, ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      } as Sale))))
      .finally(() => setLoadingSales(false));
  }, [shopId]);

  const totalRevenue = sales.reduce((s, t) => s + t.total, 0);
  const cashTotal = sales.filter(s => s.paymentType === "cash").reduce((s, t) => s + t.total, 0);
  const qrTotal   = sales.filter(s => s.paymentType === "qr" ).reduce((s, t) => s + t.total, 0);
  const itemCount  = sales.reduce((s, sale) => s + sale.items.reduce((is, i) => is + i.quantity, 0), 0);
  const totalStock = products.reduce((s, p) => s + p.variants.reduce((vs, v) => vs + v.stock, 0), 0);
  const lowStockCount = products.filter(p => p.variants.some(v => v.stock <= (v.minStock ?? 5))).length;

  const TABS: { key: Tab; label: string }[] = [
    { key: "summary",  label: "ສະຫຼຸບ" },
    { key: "products", label: "ສິນຄ້າ" },
    { key: "sales",    label: "ການຂາຍວັນນີ້" },
  ];

  return (
    <div style={{ padding: "32px 36px" }}>
      {/* Back + Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate("/customers")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", color: "var(--text-2)",
            fontSize: 13, fontWeight: 500, cursor: "pointer", marginBottom: 12, padding: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          ກັບໄປໜ້າລູກຄ້າ
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
          {shopName || "..."}
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--mono)" }}>{shopId}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 22px", background: "none", border: "none",
              fontSize: 14, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "var(--accent)" : "var(--text-2)",
              borderBottom: `2px solid ${tab === t.key ? "var(--accent)" : "transparent"}`,
              cursor: "pointer", transition: "all .15s", marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Summary Tab ─────────────────────────────────────────────────── */}
      {tab === "summary" && (
        loadingSales || loadingProducts ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {([
              { label: "ຍອດຂາຍວັນນີ້", value: `₭${fmtK(totalRevenue)}`, color: "var(--accent)", icon: "💰" },
              { label: "ເງິນສົດ",        value: `₭${fmtK(cashTotal)}`,    color: "var(--green)",  icon: "💵" },
              { label: "QR ໂອນ",         value: `₭${fmtK(qrTotal)}`,      color: "var(--blue)",   icon: "📱" },
              { label: "ຈຳນວນບິນ",       value: `${sales.length} ບິນ`,    color: "var(--text)",   icon: "🧾" },
              { label: "ສິນຄ້າຂາຍ",      value: `${itemCount} ຊິ້ນ`,      color: "var(--text)",   icon: "📦" },
              {
                label: lowStockCount > 0 ? `ສິນຄ້າໃກ້ໝົດ ${lowStockCount} ລາຍການ` : "Stock ປົກກະຕິ",
                value: `${totalStock} ຊິ້ນ`,
                color: lowStockCount > 0 ? "var(--yellow)" : "var(--green)",
                icon: lowStockCount > 0 ? "⚠️" : "✅",
              },
            ] as { label: string; value: string; color: string; icon: string }[]).map(card => (
              <div key={card.label} style={{
                background: "var(--surf)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "20px 24px",
              }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{card.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: card.color, lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6 }}>{card.label}</div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Products Tab ─────────────────────────────────────────────────── */}
      {tab === "products" && (
        loadingProducts ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)", fontSize: 14 }}>
            ຍັງບໍ່ມີສິນຄ້າ
          </div>
        ) : (
          <div style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-2)" }}>
              ສິນຄ້າທັງໝົດ {products.length} ລາຍການ
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surf2)", borderBottom: "1px solid var(--border)" }}>
                    {["ຊື່ສິນຄ້າ", "ໝວດ", "ລາຄາຂາຍ", "ຕົ້ນທຶນ", "Stock", "Variants"].map(h => (
                      <th key={h} style={{
                        padding: "10px 16px", textAlign: "left",
                        fontSize: 11, fontWeight: 600, color: "var(--muted)",
                        textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                    const isLow = p.variants.some(v => v.stock <= (v.minStock ?? 5));
                    return (
                      <tr key={p.id}
                        style={{ borderBottom: "1px solid var(--border)", transition: "background .1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--surf2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "13px 16px", fontWeight: 600, color: "var(--text)" }}>{p.name}</td>
                        <td style={{ padding: "13px 16px", color: "var(--text-2)", fontSize: 13 }}>{p.category ?? "—"}</td>
                        <td style={{ padding: "13px 16px", fontWeight: 500, color: "var(--text)" }}>₭{fmtK(p.price)}</td>
                        <td style={{ padding: "13px 16px", color: "var(--text-2)", fontSize: 13 }}>
                          {p.costPrice ? `₭${fmtK(p.costPrice)}` : "—"}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{
                            fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                            background: stock === 0 ? "var(--red-bg)" : isLow ? "var(--yellow-bg)" : "var(--green-bg)",
                            color: stock === 0 ? "var(--red)" : isLow ? "var(--yellow)" : "var(--green)",
                          }}>
                            {stock === 0 ? "ໝົດ" : `${stock} ຊິ້ນ`}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px", color: "var(--muted)", fontSize: 12 }}>
                          {p.variants.length}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Sales Tab ────────────────────────────────────────────────────── */}
      {tab === "sales" && (
        loadingSales ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : sales.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)", fontSize: 14 }}>
            ຍັງບໍ່ມີລາຍການຂາຍໃນວັນນີ້
          </div>
        ) : (
          <div style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: 13, color: "var(--text-2)" }}>
              ວັນນີ້ {sales.length} ບິນ · ຍອດ ₭{fmtK(totalRevenue)}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surf2)", borderBottom: "1px solid var(--border)" }}>
                    {["ເວລາ", "ສິນຄ້າ", "ຊຳລະ", "ຍອດ"].map(h => (
                      <th key={h} style={{
                        padding: "10px 16px", textAlign: "left",
                        fontSize: 11, fontWeight: 600, color: "var(--muted)",
                        textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => {
                    const isCash = s.paymentType === "cash";
                    return (
                      <tr key={s.id}
                        style={{ borderBottom: "1px solid var(--border)", transition: "background .1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--surf2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "13px 16px", color: "var(--muted)", fontSize: 13, whiteSpace: "nowrap" }}>
                          {s.createdAt.toLocaleTimeString("lo-LA", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td style={{ padding: "13px 16px", color: "var(--text-2)", fontSize: 13 }}>
                          {s.items.map(i => `${i.productName} ×${i.quantity}`).join(", ")}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{
                            fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                            background: isCash ? "var(--green-bg)" : "var(--blue-bg)",
                            color: isCash ? "var(--green)" : "var(--blue)",
                          }}>
                            {isCash ? "💵 ສົດ" : "📱 QR"}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px", fontWeight: 700, color: "var(--text)" }}>
                          ₭{fmtK(s.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
