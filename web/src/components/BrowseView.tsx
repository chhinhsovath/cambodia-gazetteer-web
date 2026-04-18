import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, X } from "lucide-react";
import { motion } from "motion/react";
import type { AdminLevel, FlatRow, Counts } from "../lib/data";
import { levelLabel } from "../lib/data";

interface Props {
  rows: FlatRow[];
  counts: Counts;
}

const LEVELS: (AdminLevel | "all")[] = [
  "all",
  "province",
  "district",
  "commune",
  "village",
];

export function BrowseView({ rows, counts }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AdminLevel | "all">("all");
  const deferred = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    let r = rows;
    if (filter !== "all") r = r.filter((row) => row.type === filter);
    if (q) r = r.filter((row) => row.searchKey.includes(q));
    return r;
  }, [rows, deferred, filter]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 12,
  });

  const totalForLevel = (l: AdminLevel | "all") =>
    l === "all" ? counts.total : counts[l];

  return (
    <section>
      <header className="mb-10">
        <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-stone mb-3">
          § Three — Browse
        </p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.05] text-ink mb-3 letterpress">
              The full{" "}
              <span className="italic text-terracotta">register</span>.
            </h2>
            <p className="font-display italic text-lg text-ink-mute max-w-md">
              All {counts.total.toLocaleString()} entries — searchable in
              Khmer, Latin, or by code.
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone mb-1">
              Showing
            </p>
            <p className="font-display text-3xl tabular text-ink">
              {filtered.length.toLocaleString()}
              <span className="text-stone text-xl">
                {" / "}
                {totalForLevel(filter).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col gap-5 mb-6">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-stone"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anywhere — បន្ទាយ · Battambang · 0102…"
            className="w-full pl-7 pr-9 py-3 bg-transparent border-b-2 border-stone hover:border-ink focus:border-terracotta transition-colors outline-none font-display text-2xl placeholder:text-ink-mute placeholder:italic placeholder:text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-ink-mute hover:text-terracotta"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => {
            const active = filter === l;
            const label =
              l === "all"
                ? { en: "All", km: "ទាំងអស់" }
                : levelLabel(l);
            const n = totalForLevel(l);
            return (
              <button
                key={l}
                onClick={() => setFilter(l)}
                className={[
                  "group relative px-4 py-2 border transition-all duration-200 flex items-baseline gap-2",
                  active
                    ? "bg-ink text-parchment border-ink"
                    : "bg-transparent text-ink-soft border-stone/40 hover:border-ink hover:text-ink",
                ].join(" ")}
              >
                <span className="font-display text-sm tracking-wide">
                  {label.en}
                </span>
                <span
                  className={[
                    "font-khmer text-xs",
                    active ? "text-parchment/70" : "text-ink-mute",
                  ].join(" ")}
                >
                  {label.km}
                </span>
                <span
                  className={[
                    "font-mono text-[10px] tabular tracking-wider ml-1",
                    active ? "text-parchment/60" : "text-stone",
                  ].join(" ")}
                >
                  {n.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="border-t-2 border-ink">
        {/* Column header */}
        <div className="grid grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_120px] items-baseline gap-4 px-3 py-3 border-b border-stone/40 bg-parchment-deep/40">
          <Th>Type</Th>
          <Th>Latin</Th>
          <Th>Khmer · ខ្មែរ</Th>
          <Th>Within</Th>
          <Th align="right">Code</Th>
        </div>

        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-6xl text-stone/40 mb-4">∅</p>
            <p className="font-display italic text-lg text-ink-mute">
              No entries match this search.
            </p>
          </div>
        ) : (
          <div
            ref={parentRef}
            className="h-[640px] overflow-auto relative"
            style={{ contain: "strict" }}
          >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((vi) => {
                const row = filtered[vi.index];
                return (
                  <div
                    key={vi.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      transform: `translateY(${vi.start}px)`,
                      height: vi.size,
                    }}
                  >
                    <Row row={row} index={vi.index} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-stone">
        Hierarchical codes follow the NCDD Cambodian gazetteer scheme.
      </p>
    </section>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <span
      className={[
        "font-mono text-[10px] uppercase tracking-[0.25em] text-stone",
        align === "right" ? "text-right" : "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

const TYPE_BADGE: Record<AdminLevel, { label: string; cls: string }> = {
  province: {
    label: "PROV",
    cls: "bg-terracotta/10 text-terracotta border-terracotta/30",
  },
  district: {
    label: "DIST",
    cls: "bg-moss/10 text-moss border-moss/30",
  },
  commune: {
    label: "COMM",
    cls: "bg-stone/15 text-ink-soft border-stone/40",
  },
  village: {
    label: "VILL",
    cls: "bg-parchment-deep text-ink-mute border-stone/30",
  },
};

function Row({ row, index }: { row: FlatRow; index: number }) {
  const badge = TYPE_BADGE[row.type];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className={[
        "grid grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_120px]",
        "items-center gap-4 px-3 h-14",
        "border-b border-stone/15 hover:bg-parchment-deep/60 transition-colors",
        index % 2 === 1 ? "bg-parchment-deep/20" : "",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex items-center justify-center w-14 h-6 border font-mono text-[10px] tracking-wider tabular",
          badge.cls,
        ].join(" ")}
      >
        {badge.label}
      </span>
      <span
        className={[
          "font-display truncate",
          row.type === "province"
            ? "text-lg text-ink"
            : row.type === "district"
              ? "text-base text-ink"
              : "text-sm text-ink-soft",
        ].join(" ")}
      >
        {row.latin}
      </span>
      <span
        className={[
          "font-khmer truncate",
          row.type === "province"
            ? "text-lg text-terracotta"
            : "text-base text-ink-soft",
        ].join(" ")}
      >
        {row.khmer}
      </span>
      <span className="font-display italic text-sm text-ink-mute truncate">
        {row.parentLatin}
      </span>
      <span className="font-mono text-[11px] tabular tracking-wider text-stone text-right">
        {row.code}
      </span>
    </motion.div>
  );
}
