import { useEffect, useMemo, useState } from "react";

export type AdminLevel = "province" | "district" | "commune" | "village";

export interface Village {
  code: string;
  khmer: string;
  latin: string;
}
export interface Commune extends Village {
  villages: Village[];
}
export interface District extends Village {
  communes: Commune[];
}
export interface Province extends Village {
  boundary: {
    boundary: string | null;
    east: string;
    west: string;
    south: string;
    north: string;
  };
  districts: District[];
}

export interface FlatRow {
  type: AdminLevel;
  code: string;
  khmer: string;
  latin: string;
  parentLatin: string;
  parentKhmer: string;
  searchKey: string; // lowercased khmer + latin + code for fast matches
}

export interface Counts {
  province: number;
  district: number;
  commune: number;
  village: number;
  total: number;
}

const LEVEL_LABEL: Record<AdminLevel, { en: string; km: string }> = {
  province: { en: "Province", km: "ខេត្ត" },
  district: { en: "District", km: "ស្រុក/ខណ្ឌ" },
  commune: { en: "Commune", km: "ឃុំ/សង្កាត់" },
  village: { en: "Village", km: "ភូមិ" },
};

export function levelLabel(level: AdminLevel) {
  return LEVEL_LABEL[level];
}

export function flatten(provinces: Province[]): FlatRow[] {
  const out: FlatRow[] = [];
  for (const p of provinces) {
    out.push({
      type: "province",
      code: p.code,
      khmer: p.khmer,
      latin: p.latin,
      parentLatin: "Kingdom of Cambodia",
      parentKhmer: "ព្រះរាជាណាចក្រកម្ពុជា",
      searchKey: `${p.khmer} ${p.latin} ${p.code}`.toLowerCase(),
    });
    for (const d of p.districts) {
      out.push({
        type: "district",
        code: d.code,
        khmer: d.khmer,
        latin: d.latin,
        parentLatin: p.latin,
        parentKhmer: p.khmer,
        searchKey: `${d.khmer} ${d.latin} ${d.code}`.toLowerCase(),
      });
      for (const c of d.communes) {
        out.push({
          type: "commune",
          code: c.code,
          khmer: c.khmer,
          latin: c.latin,
          parentLatin: `${d.latin}, ${p.latin}`,
          parentKhmer: `${d.khmer}, ${p.khmer}`,
          searchKey: `${c.khmer} ${c.latin} ${c.code}`.toLowerCase(),
        });
        for (const v of c.villages) {
          out.push({
            type: "village",
            code: v.code,
            khmer: v.khmer,
            latin: v.latin,
            parentLatin: `${c.latin}, ${d.latin}, ${p.latin}`,
            parentKhmer: `${c.khmer}, ${d.khmer}, ${p.khmer}`,
            searchKey: `${v.khmer} ${v.latin} ${v.code}`.toLowerCase(),
          });
        }
      }
    }
  }
  return out;
}

export type DistrictKind = "krong" | "srok" | "khan";
export type CommuneKind = "commune" | "sangkat";

export function classifyDistrict(d: { khmer: string; latin: string }): DistrictKind {
  if (d.khmer.startsWith("ខណ្ឌ") || / Khan$/.test(d.latin)) return "khan";
  if (d.khmer.startsWith("ក្រុង") || / Municipality$/.test(d.latin))
    return "krong";
  return "srok";
}

export function classifyCommune(c: { khmer: string; latin: string }): CommuneKind {
  if (c.khmer.startsWith("សង្កាត់") || / Sangkat$/.test(c.latin))
    return "sangkat";
  return "commune";
}

export interface PivotRow {
  code: string;
  khmer: string;
  latin: string;
  krong: number;
  srok: number;
  khan: number;
  commune: number;
  sangkat: number;
  village: number;
  districtTotal: number;
  communeTotal: number;
}

export interface PivotTotals
  extends Omit<PivotRow, "code" | "khmer" | "latin"> {}

export function pivotByProvince(provinces: Province[]): {
  rows: PivotRow[];
  totals: PivotTotals;
} {
  const rows: PivotRow[] = provinces.map((p) => {
    const r = {
      code: p.code,
      khmer: p.khmer,
      latin: p.latin,
      krong: 0,
      srok: 0,
      khan: 0,
      commune: 0,
      sangkat: 0,
      village: 0,
      districtTotal: 0,
      communeTotal: 0,
    };
    for (const d of p.districts) {
      r[classifyDistrict(d)]++;
      for (const c of d.communes) {
        r[classifyCommune(c)]++;
        r.village += c.villages.length;
      }
    }
    r.districtTotal = r.krong + r.srok + r.khan;
    r.communeTotal = r.commune + r.sangkat;
    return r;
  });

  const totals: PivotTotals = rows.reduce(
    (t, r) => ({
      krong: t.krong + r.krong,
      srok: t.srok + r.srok,
      khan: t.khan + r.khan,
      commune: t.commune + r.commune,
      sangkat: t.sangkat + r.sangkat,
      village: t.village + r.village,
      districtTotal: t.districtTotal + r.districtTotal,
      communeTotal: t.communeTotal + r.communeTotal,
    }),
    {
      krong: 0,
      srok: 0,
      khan: 0,
      commune: 0,
      sangkat: 0,
      village: 0,
      districtTotal: 0,
      communeTotal: 0,
    },
  );

  return { rows, totals };
}

export function countAll(provinces: Province[]): Counts {
  let d = 0,
    c = 0,
    v = 0;
  for (const p of provinces) {
    d += p.districts.length;
    for (const dist of p.districts) {
      c += dist.communes.length;
      for (const com of dist.communes) v += com.villages.length;
    }
  }
  const province = provinces.length;
  return {
    province,
    district: d,
    commune: c,
    village: v,
    total: province + d + c + v,
  };
}

export function useGazetteer() {
  const [provinces, setProvinces] = useState<Province[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/cambodia_gazetteer.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Province[]) => {
        if (!cancelled) setProvinces(data);
      })
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(
    () => (provinces ? countAll(provinces) : null),
    [provinces],
  );
  const flat = useMemo(() => (provinces ? flatten(provinces) : null), [
    provinces,
  ]);

  return { provinces, counts, flat, error };
}
