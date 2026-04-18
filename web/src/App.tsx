import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useGazetteer } from "./lib/data";
import { CascadingView } from "./components/CascadingView";
import { BrowseView } from "./components/BrowseView";

type View = "cascade" | "browse";

export default function App() {
  const { provinces, counts, flat, error } = useGazetteer();
  const [view, setView] = useState<View>("cascade");

  return (
    <div className="min-h-screen flex flex-col">
      <Header view={view} setView={setView} />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 md:px-10 lg:px-16 pb-32">
        {error ? (
          <ErrorState error={error} />
        ) : !provinces || !counts || !flat ? (
          <LoadingState />
        ) : (
          <>
            <StatsBar counts={counts} />

            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {view === "cascade" ? (
                  <CascadingView provinces={provinces} />
                ) : (
                  <BrowseView rows={flat} counts={counts} />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Header({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-parchment/85 border-b border-stone/25">
      <div className="max-w-[1280px] w-full mx-auto px-6 md:px-10 lg:px-16 py-5 flex items-center justify-between gap-6">
        <a href="/" className="flex items-center gap-3 group">
          <Mark />
          <div className="leading-tight">
            <div className="font-display text-xl text-ink letterpress group-hover:text-terracotta transition-colors">
              Gazetteer
              <span className="text-stone font-normal"> · </span>
              <span className="italic font-light">Cambodia</span>
            </div>
            <div className="font-khmer text-[11px] text-ink-mute tracking-wider">
              ប្រទេសកម្ពុជា · ខេត្ត ស្រុក ឃុំ ភូមិ
            </div>
          </div>
        </a>

        <nav className="flex items-center gap-1 p-1 bg-parchment-deep/70 border border-stone/30 rounded-sm">
          <NavTab
            active={view === "cascade"}
            onClick={() => setView("cascade")}
            label="Locate"
            kh="ស្វែងរក"
          />
          <NavTab
            active={view === "browse"}
            onClick={() => setView("browse")}
            label="Browse"
            kh="មើលទាំងអស់"
          />
        </nav>
      </div>
    </header>
  );
}

function NavTab({
  active,
  onClick,
  label,
  kh,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  kh: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative px-4 py-1.5 transition-colors duration-300",
        active ? "text-parchment" : "text-ink-soft hover:text-ink",
      ].join(" ")}
    >
      {active && (
        <motion.span
          layoutId="navpill"
          className="absolute inset-0 bg-ink rounded-[2px]"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative font-display text-sm tracking-wide">
        {label}
        <span className="font-khmer text-[10px] ml-1.5 opacity-70">{kh}</span>
      </span>
    </button>
  );
}

function Mark() {
  return (
    <svg
      viewBox="0 0 40 40"
      width="38"
      height="38"
      className="shrink-0"
      aria-hidden
    >
      {/* Stylized prasat / temple silhouette */}
      <rect x="1" y="1" width="38" height="38" rx="3" fill="#1F1A14" />
      <g fill="none" stroke="#C68E5A" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M9 28 L20 9 L31 28 Z" />
        <path d="M13 28 L20 16 L27 28" />
        <path d="M16 28 L20 22 L24 28" />
      </g>
      <circle cx="20" cy="22" r="1.3" fill="#C68E5A" />
      <line
        x1="6"
        y1="32"
        x2="34"
        y2="32"
        stroke="#C68E5A"
        strokeWidth="1"
      />
    </svg>
  );
}

function StatsBar({
  counts,
}: {
  counts: { province: number; district: number; commune: number; village: number };
}) {
  const items = [
    { n: counts.province, en: "Provinces", km: "ខេត្ត" },
    { n: counts.district, en: "Districts", km: "ស្រុក" },
    { n: counts.commune, en: "Communes", km: "ឃុំ" },
    { n: counts.village, en: "Villages", km: "ភូមិ" },
  ];
  return (
    <section className="pt-16 pb-20 anim-fade">
      <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-stone mb-6">
        A complete enumeration —
        <span className="font-khmer text-ink-mute ml-1">បញ្ជីឈ្មោះពេញលេញ</span>
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-stone/30 border border-stone/30">
        {items.map((it, i) => (
          <div
            key={it.en}
            className="bg-parchment px-6 py-8 anim-rise"
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className="font-display text-6xl md:text-7xl tabular text-ink leading-none letterpress mb-3">
              {it.n.toLocaleString()}
            </div>
            <div className="flex items-baseline justify-between border-t border-stone/30 pt-2 mt-3">
              <span className="font-display italic text-ink-soft text-sm">
                {it.en}
              </span>
              <span className="font-khmer text-ink-mute text-sm">{it.km}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center anim-fade">
      <div className="relative w-16 h-16 mb-8">
        <div className="absolute inset-0 border-2 border-stone/30 rounded-full" />
        <div className="absolute inset-0 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="font-display italic text-xl text-ink-soft mb-1">
        Unrolling the gazetteer…
      </p>
      <p className="font-khmer text-sm text-ink-mute">
        កំពុងផ្ទុកទិន្នន័យ
      </p>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center anim-fade">
      <p className="font-display text-3xl text-terracotta mb-2">
        Could not load the gazetteer.
      </p>
      <p className="font-mono text-xs text-ink-mute">{error}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stone/25 mt-auto">
      <div className="max-w-[1280px] w-full mx-auto px-6 md:px-10 lg:px-16 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="font-display italic text-sm text-ink-soft">
            Data sourced from the National Committee for Sub-National
            Democratic Development.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone mt-2">
            db.ncdd.gov.kh / gazetteer
          </p>
        </div>
        <p className="font-display italic text-xs text-ink-mute">
          A demo for the
          <code className="not-italic font-mono mx-1.5 text-ink-soft">
            cambodia-gazetteer
          </code>
          npm package.
        </p>
      </div>
    </footer>
  );
}
