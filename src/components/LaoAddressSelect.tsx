import { useMemo } from "react";
// Import raw data directly — bypasses the broken extensionless import in index.js
// @ts-ignore
import { PROVINCE, DISTRICT, VILLAGE } from "@anouluk/laos-address-typescript/dist/addresses.js";

interface Province { pid: string; pn: string; pn_en: string; }
interface District { did: string; pid: string; dn: string; dn_en: string; }
interface Village { vid: string; did: string; vn: string; vn_en: string; }

const ALL_PROVINCES: Province[] = PROVINCE as Province[];
const ALL_DISTRICTS: District[] = DISTRICT as District[];
const ALL_VILLAGES: Village[] = VILLAGE as Village[];

const sel: React.CSSProperties = {
  width: "100%", padding: "9px 13px",
  border: "1.5px solid var(--border)", borderRadius: 8,
  fontSize: 14, color: "var(--text)", background: "var(--surf)", outline: "none",
};

interface Props {
  province: string;
  district: string;
  village: string;
  onProvinceChange: (v: string) => void;
  onDistrictChange: (v: string) => void;
  onVillageChange: (v: string) => void;
}

export default function LaoAddressSelect({
  province, district, village,
  onProvinceChange, onDistrictChange, onVillageChange,
}: Props) {
  const selectedProvince = useMemo(
    () => ALL_PROVINCES.find(p => p.pn === province) ?? null,
    [province]
  );

  const districts = useMemo(
    () => selectedProvince
      ? ALL_DISTRICTS.filter(d => d.pid === selectedProvince.pid)
      : [],
    [selectedProvince]
  );

  const selectedDistrict = useMemo(
    () => ALL_DISTRICTS.find(d => d.dn === district) ?? null,
    [district]
  );

  const villages = useMemo(
    () => selectedDistrict
      ? ALL_VILLAGES.filter(v => v.did === selectedDistrict.did)
      : [],
    [selectedDistrict]
  );

  function handleProvinceChange(pn: string) {
    onProvinceChange(pn);
    onDistrictChange("");
    onVillageChange("");
  }

  function handleDistrictChange(dn: string) {
    onDistrictChange(dn);
    onVillageChange("");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px", marginBottom: 2 }}>
      {/* ແຂວງ */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          ແຂວງ
        </label>
        <select value={province} onChange={e => handleProvinceChange(e.target.value)} style={sel}>
          <option value="">— ເລືອກ —</option>
          {ALL_PROVINCES.map(p => (
            <option key={p.pid} value={p.pn}>{p.pn}</option>
          ))}
        </select>
      </div>

      {/* ເມືອງ */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          ເມືອງ
        </label>
        <select
          value={district}
          onChange={e => handleDistrictChange(e.target.value)}
          disabled={!province}
          style={{ ...sel, opacity: !province ? 0.45 : 1 }}
        >
          <option value="">— ເລືອກ —</option>
          {districts.map(d => (
            <option key={d.did} value={d.dn}>{d.dn}</option>
          ))}
        </select>
      </div>

      {/* ບ້ານ */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          ບ້ານ
        </label>
        <select
          value={village}
          onChange={e => onVillageChange(e.target.value)}
          disabled={!district}
          style={{ ...sel, opacity: !district ? 0.45 : 1 }}
        >
          <option value="">— ເລືອກ —</option>
          {villages.map(v => (
            <option key={v.vid} value={v.vn}>{v.vn}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
