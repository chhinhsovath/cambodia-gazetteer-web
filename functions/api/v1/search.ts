// GET /api/v1/search?q=...&type=...&limit=...
// Substring match across khmer + latin + code, case-insensitive.

interface FlatRow {
  type: "province" | "district" | "commune" | "village";
  code: string;
  khmer: string;
  latin: string;
  parent: string;
  href?: string;
  searchKey: string;
}

let INDEX: FlatRow[] | null = null;

interface RawProvince {
  code: string;
  khmer: string;
  latin: string;
  districts: Array<{
    code: string;
    khmer: string;
    latin: string;
    communes: Array<{
      code: string;
      khmer: string;
      latin: string;
      villages: Array<{ code: string; khmer: string; latin: string }>;
    }>;
  }>;
}

async function loadIndex(env: { ASSETS: Fetcher }, originUrl: string) {
  if (INDEX) return INDEX;
  const res = await env.ASSETS.fetch(
    new URL("/api/v1/full.json", originUrl),
  );
  const provinces: RawProvince[] = await res.json();
  const rows: FlatRow[] = [];
  for (const p of provinces) {
    rows.push({
      type: "province",
      code: p.code,
      khmer: p.khmer,
      latin: p.latin,
      parent: "Cambodia",
      href: `/api/v1/provinces/${p.code}`,
      searchKey: `${p.khmer} ${p.latin} ${p.code}`.toLowerCase(),
    });
    for (const d of p.districts) {
      rows.push({
        type: "district",
        code: d.code,
        khmer: d.khmer,
        latin: d.latin,
        parent: p.latin,
        href: `/api/v1/districts/${d.code}`,
        searchKey: `${d.khmer} ${d.latin} ${d.code}`.toLowerCase(),
      });
      for (const c of d.communes) {
        rows.push({
          type: "commune",
          code: c.code,
          khmer: c.khmer,
          latin: c.latin,
          parent: `${d.latin}, ${p.latin}`,
          href: `/api/v1/communes/${c.code}`,
          searchKey: `${c.khmer} ${c.latin} ${c.code}`.toLowerCase(),
        });
        for (const v of c.villages) {
          rows.push({
            type: "village",
            code: v.code,
            khmer: v.khmer,
            latin: v.latin,
            parent: `${c.latin}, ${d.latin}, ${p.latin}`,
            searchKey: `${v.khmer} ${v.latin} ${v.code}`.toLowerCase(),
          });
        }
      }
    }
  }
  INDEX = rows;
  return rows;
}

export const onRequestGet: PagesFunction<{ ASSETS: Fetcher }> = async ({
  request,
  env,
}) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const type = url.searchParams.get("type");
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") || "25", 10) || 25, 1),
    200,
  );

  if (!q) {
    return Response.json(
      { error: "missing required query parameter `q`" },
      { status: 400 },
    );
  }

  const index = await loadIndex(env, request.url);
  const validTypes = new Set([
    "province",
    "district",
    "commune",
    "village",
  ]);
  const typeFilter = type && validTypes.has(type) ? type : null;

  const matches: FlatRow[] = [];
  for (const row of index) {
    if (typeFilter && row.type !== typeFilter) continue;
    if (row.searchKey.includes(q)) {
      matches.push(row);
      if (matches.length >= limit) break;
    }
  }

  return Response.json(
    {
      meta: {
        query: q,
        type: typeFilter,
        limit,
        returned: matches.length,
      },
      data: matches.map(({ searchKey, ...rest }) => rest),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    },
  );
};
