import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react";
import { pivotByProvince, type PivotRow, type Province } from "../lib/data";

type SortKey =
  | "code"
  | "latin"
  | "krong"
  | "srok"
  | "khan"
  | "districtTotal"
  | "commune"
  | "sangkat"
  | "communeTotal"
  | "village";

interface Props {
  provinces: Province[];
}

export function PivotView({ provinces }: Props) {
  const { rows, totals } = useMemo(() => pivotByProvince(provinces), [
    provinces,
  ]);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "code",
    dir: "asc",
  });

  const sorted = useMemo(() => {
    const copy = [...rows];
    const dir = sort.dir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      const k = sort.key;
      if (k === "code")
        return a.code.localeCompare(b.code) * dir;
      if (k === "latin") return a.latin.localeCompare(b.latin) * dir;
      return ((a[k] as number) - (b[k] as number)) * dir;
    });
    return copy;
  }, [rows, sort]);

  const onSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "code" || key === "latin" ? "asc" : "desc" },
    );

  const downloadCsv = () => {
    const headers = [
      "rank",
      "code",
      "khmer",
      "english",
      "krong",
      "srok",
      "khan",
      "districts_total",
      "commune",
      "sangkat",
      "communes_total",
      "villages",
    ];
    const lines = [
      headers.join(","),
      ...sorted.map((r, i) =>
        [
          i + 1,
          r.code,
          quoteCsv(r.khmer),
          quoteCsv(r.latin),
          r.krong,
          r.srok,
          r.khan,
          r.districtTotal,
          r.commune,
          r.sangkat,
          r.communeTotal,
          r.village,
        ].join(","),
      ),
      [
        "",
        "",
        "ផលបូក",
        "Total",
        totals.krong,
        totals.srok,
        totals.khan,
        totals.districtTotal,
        totals.commune,
        totals.sangkat,
        totals.communeTotal,
        totals.village,
      ].join(","),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cambodia_gazetteer_summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <header className="mb-10">
        <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-stone mb-3">
          § Four — Survey
        </p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.05] text-ink mb-3 letterpress">
              The kingdom by{" "}
              <span className="italic text-terracotta">province</span>.
            </h2>
            <p className="font-display italic text-lg text-ink-mute max-w-md">
              A measured count, twenty-five rows deep — districts split into
              ក្រុង / ស្រុក / ខណ្ឌ, communes into ឃុំ / សង្កាត់.
            </p>
          </div>
          <button
            onClick={downloadCsv}
            className="self-start md:self-end inline-flex items-center gap-2 px-4 py-2.5 border border-ink text-ink hover:bg-ink hover:text-parchment transition-colors duration-300 font-display text-sm tracking-wide"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </header>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full border-collapse min-w-[860px]">
          <thead>
            <tr className="bg-parchment-deep/50">
              <Th rowSpan={2}>#</Th>
              <Th rowSpan={2} sortable sortKey="code" sort={sort} onSort={onSort}>
                Code
              </Th>
              <Th rowSpan={2}>Khmer · ខ្មែរ</Th>
              <Th rowSpan={2} sortable sortKey="latin" sort={sort} onSort={onSort}>
                English
              </Th>
              <Th colSpan={4} center>
                Districts <span className="font-khmer text-stone">· ស្រុក/ខណ្ឌ/ក្រុង</span>
              </Th>
              <Th colSpan={3} center>
                Communes <span className="font-khmer text-stone">· ឃុំ/សង្កាត់</span>
              </Th>
              <Th rowSpan={2} sortable sortKey="village" sort={sort} onSort={onSort} align="right">
                Villages <span className="font-khmer block text-[9px] text-stone normal-case tracking-normal">ភូមិ</span>
              </Th>
            </tr>
            <tr className="bg-parchment-deep/30">
              <Sub sortable sortKey="krong" sort={sort} onSort={onSort}>
                Krong<span className="font-khmer text-[9px] text-stone ml-1">ក្រុង</span>
              </Sub>
              <Sub sortable sortKey="srok" sort={sort} onSort={onSort}>
                Srok<span className="font-khmer text-[9px] text-stone ml-1">ស្រុក</span>
              </Sub>
              <Sub sortable sortKey="khan" sort={sort} onSort={onSort}>
                Khan<span className="font-khmer text-[9px] text-stone ml-1">ខណ្ឌ</span>
              </Sub>
              <Sub sortable sortKey="districtTotal" sort={sort} onSort={onSort} emphasis>
                ∑
              </Sub>
              <Sub sortable sortKey="commune" sort={sort} onSort={onSort}>
                Commune<span className="font-khmer text-[9px] text-stone ml-1">ឃុំ</span>
              </Sub>
              <Sub sortable sortKey="sangkat" sort={sort} onSort={onSort}>
                Sangkat<span className="font-khmer text-[9px] text-stone ml-1">សង្កាត់</span>
              </Sub>
              <Sub sortable sortKey="communeTotal" sort={sort} onSort={onSort} emphasis>
                ∑
              </Sub>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <Row key={r.code} row={r} index={i} />
            ))}
            <TotalsRow totals={totals} />
          </tbody>
        </table>
      </div>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-stone max-w-3xl">
        District &amp; commune kinds inferred from Khmer prefixes
        (ក្រុង/ស្រុក/ខណ្ឌ, សង្កាត់/ឃុំ). Click any column header to sort.
      </p>
    </section>
  );
}

function quoteCsv(s: string) {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function Th({
  children,
  rowSpan,
  colSpan,
  sortable,
  sortKey,
  sort,
  onSort,
  center,
  align,
}: {
  children: React.ReactNode;
  rowSpan?: number;
  colSpan?: number;
  sortable?: boolean;
  sortKey?: SortKey;
  sort?: { key: SortKey; dir: "asc" | "desc" };
  onSort?: (k: SortKey) => void;
  center?: boolean;
  align?: "right";
}) {
  const cls = [
    "px-3 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-stone border-b border-stone/40 align-bottom",
    center ? "text-center" : align === "right" ? "text-right" : "text-left",
    sortable ? "cursor-pointer hover:text-ink select-none" : "",
  ].join(" ");
  const isSorted = sortable && sort && sortKey === sort.key;
  return (
    <th
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={cls}
      onClick={sortable && sortKey ? () => onSort?.(sortKey) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <SortIcon
            active={!!isSorted}
            dir={isSorted ? sort!.dir : undefined}
          />
        )}
      </span>
    </th>
  );
}

function Sub({
  children,
  sortable,
  sortKey,
  sort,
  onSort,
  emphasis,
}: {
  children: React.ReactNode;
  sortable?: boolean;
  sortKey?: SortKey;
  sort?: { key: SortKey; dir: "asc" | "desc" };
  onSort?: (k: SortKey) => void;
  emphasis?: boolean;
}) {
  const isSorted = sortable && sort && sortKey === sort.key;
  return (
    <th
      onClick={sortable && sortKey ? () => onSort?.(sortKey) : undefined}
      className={[
        "px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] border-b border-stone/40 text-right",
        emphasis ? "text-ink-soft" : "text-stone",
        sortable ? "cursor-pointer hover:text-ink select-none" : "",
      ].join(" ")}
    >
      <span className="inline-flex items-center gap-1 justify-end">
        {children}
        {sortable && (
          <SortIcon
            active={!!isSorted}
            dir={isSorted ? sort!.dir : undefined}
          />
        )}
      </span>
    </th>
  );
}

function SortIcon({
  active,
  dir,
}: {
  active: boolean;
  dir?: "asc" | "desc";
}) {
  if (!active) return <ArrowUpDown size={10} className="opacity-30" />;
  return dir === "asc" ? (
    <ArrowUp size={10} className="text-terracotta" />
  ) : (
    <ArrowDown size={10} className="text-terracotta" />
  );
}

function Row({ row, index }: { row: PivotRow; index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: index * 0.012 }}
      className={[
        "group hover:bg-parchment-deep/60 transition-colors",
        index % 2 === 1 ? "bg-parchment-deep/20" : "",
      ].join(" ")}
    >
      <td className="px-3 py-3 font-mono text-[11px] tabular text-stone border-b border-stone/15 w-10">
        {String(index + 1).padStart(2, "0")}
      </td>
      <td className="px-3 py-3 font-mono text-xs tabular text-ink-soft border-b border-stone/15">
        {row.code}
      </td>
      <td className="px-3 py-3 border-b border-stone/15">
        <span className="font-khmer text-base text-terracotta">
          {row.khmer}
        </span>
      </td>
      <td className="px-3 py-3 border-b border-stone/15">
        <span className="font-display text-base text-ink leading-tight">
          {row.latin}
        </span>
      </td>
      <Cell n={row.krong} />
      <Cell n={row.srok} />
      <Cell n={row.khan} />
      <Cell n={row.districtTotal} emphasis />
      <Cell n={row.commune} />
      <Cell n={row.sangkat} />
      <Cell n={row.communeTotal} emphasis />
      <td className="px-3 py-3 text-right font-display tabular text-base text-ink border-b border-stone/15">
        {row.village.toLocaleString()}
      </td>
    </motion.tr>
  );
}

function Cell({ n, emphasis }: { n: number; emphasis?: boolean }) {
  const dim = n === 0;
  return (
    <td
      className={[
        "px-3 py-3 text-right font-mono tabular text-[13px] border-b border-stone/15",
        emphasis ? "text-ink-soft font-semibold" : "text-ink",
        dim ? "text-stone/60" : "",
      ].join(" ")}
    >
      {n === 0 ? "—" : n.toLocaleString()}
    </td>
  );
}

function TotalsRow({ totals }: { totals: ReturnType<typeof pivotByProvince>["totals"] }) {
  return (
    <tr className="border-t-2 border-ink bg-parchment-deep/40">
      <td colSpan={4} className="px-3 py-4 font-display italic text-ink">
        Total
        <span className="font-khmer text-ink-mute ml-2 text-sm">· ផលបូកសរុប</span>
      </td>
      <TotalCell n={totals.krong} />
      <TotalCell n={totals.srok} />
      <TotalCell n={totals.khan} />
      <TotalCell n={totals.districtTotal} emphasis />
      <TotalCell n={totals.commune} />
      <TotalCell n={totals.sangkat} />
      <TotalCell n={totals.communeTotal} emphasis />
      <td className="px-3 py-4 text-right font-display tabular text-xl text-ink letterpress">
        {totals.village.toLocaleString()}
      </td>
    </tr>
  );
}

function TotalCell({ n, emphasis }: { n: number; emphasis?: boolean }) {
  return (
    <td
      className={[
        "px-3 py-4 text-right font-mono tabular text-sm",
        emphasis ? "text-terracotta font-semibold" : "text-ink",
      ].join(" ")}
    >
      {n.toLocaleString()}
    </td>
  );
}
