import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, RotateCcw, ArrowRight } from "lucide-react";
import { Combobox, type ComboboxOption } from "./Combobox";
import type { Province } from "../lib/data";

interface Props {
  provinces: Province[];
}

export function CascadingView({ provinces }: Props) {
  const [province, setProvince] = useState<ComboboxOption | null>(null);
  const [district, setDistrict] = useState<ComboboxOption | null>(null);
  const [commune, setCommune] = useState<ComboboxOption | null>(null);
  const [village, setVillage] = useState<ComboboxOption | null>(null);
  const [copied, setCopied] = useState(false);

  const provinceOptions = useMemo(
    () =>
      provinces.map((p) => ({ code: p.code, khmer: p.khmer, latin: p.latin })),
    [provinces],
  );

  const provinceObj = useMemo(
    () => provinces.find((p) => p.code === province?.code) ?? null,
    [provinces, province],
  );
  const districtOptions = useMemo(
    () =>
      provinceObj?.districts.map((d) => ({
        code: d.code,
        khmer: d.khmer,
        latin: d.latin,
      })) ?? [],
    [provinceObj],
  );

  const districtObj = useMemo(
    () => provinceObj?.districts.find((d) => d.code === district?.code) ?? null,
    [provinceObj, district],
  );
  const communeOptions = useMemo(
    () =>
      districtObj?.communes.map((c) => ({
        code: c.code,
        khmer: c.khmer,
        latin: c.latin,
      })) ?? [],
    [districtObj],
  );

  const communeObj = useMemo(
    () => districtObj?.communes.find((c) => c.code === commune?.code) ?? null,
    [districtObj, commune],
  );
  const villageOptions = useMemo(
    () =>
      communeObj?.villages.map((v) => ({
        code: v.code,
        khmer: v.khmer,
        latin: v.latin,
      })) ?? [],
    [communeObj],
  );

  const handleProvince = (v: ComboboxOption | null) => {
    setProvince(v);
    setDistrict(null);
    setCommune(null);
    setVillage(null);
  };
  const handleDistrict = (v: ComboboxOption | null) => {
    setDistrict(v);
    setCommune(null);
    setVillage(null);
  };
  const handleCommune = (v: ComboboxOption | null) => {
    setCommune(v);
    setVillage(null);
  };

  const reset = () => {
    setProvince(null);
    setDistrict(null);
    setCommune(null);
    setVillage(null);
  };

  const path = [province, district, commune, village].filter(Boolean) as ComboboxOption[];
  const deepest = village || commune || district || province;
  const depth = path.length;

  const copyJson = async () => {
    if (!deepest) return;
    const payload = {
      province: province && { code: province.code, khmer: province.khmer, latin: province.latin },
      district: district && { code: district.code, khmer: district.khmer, latin: district.latin },
      commune: commune && { code: commune.code, khmer: commune.khmer, latin: commune.latin },
      village: village && { code: village.code, khmer: village.khmer, latin: village.latin },
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16">
      {/* Left: cascade controls */}
      <div>
        <header className="mb-10">
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-stone mb-3">
            § One — Locate
          </p>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] text-ink mb-3 letterpress">
            Trace a place,{" "}
            <span className="italic text-terracotta">level by level</span>.
          </h2>
          <p className="font-display italic text-lg text-ink-mute max-w-md">
            Begin with a province; each choice narrows the field beneath it,
            from twenty-five down to a single village among fourteen thousand.
          </p>
        </header>

        <div className="space-y-9">
          <Combobox
            level="province"
            index={1}
            options={provinceOptions}
            value={province}
            onChange={handleProvince}
          />
          <Combobox
            level="district"
            index={2}
            options={districtOptions}
            value={district}
            onChange={handleDistrict}
            disabled={!province}
            placeholderHint="Choose a province first"
          />
          <Combobox
            level="commune"
            index={3}
            options={communeOptions}
            value={commune}
            onChange={handleCommune}
            disabled={!district}
            placeholderHint="Choose a district first"
          />
          <Combobox
            level="village"
            index={4}
            options={villageOptions}
            value={village}
            onChange={setVillage}
            disabled={!commune}
            placeholderHint="Choose a commune first"
          />
        </div>

        {depth > 0 && (
          <button
            onClick={reset}
            className="mt-10 inline-flex items-center gap-2 font-display italic text-sm text-ink-mute hover:text-terracotta transition-colors"
          >
            <RotateCcw size={13} /> reset selection
          </button>
        )}
      </div>

      {/* Right: result panel */}
      <aside className="lg:sticky lg:top-24 self-start">
        <div className="relative">
          {/* Decorative corner brackets */}
          <CornerBrackets />

          <div className="relative bg-parchment-deep/60 border border-stone/30 px-8 py-10 md:px-10 md:py-12">
            <div className="flex items-center justify-between mb-8">
              <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-stone">
                § Two — Record
              </p>
              <span className="font-display tabular text-stone text-sm">
                {depth}/4
              </span>
            </div>

            <AnimatePresence mode="wait">
              {!deepest ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-16 text-center"
                >
                  <div className="font-display text-7xl text-stone/40 mb-6">
                    ◇
                  </div>
                  <p className="font-display italic text-xl text-ink-mute max-w-xs mx-auto leading-snug">
                    Your selection will appear here, inscribed.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={path.map((p) => p.code).join("-")}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  {/* Hero block: deepest selection */}
                  <div className="mb-10 pb-10 border-b border-stone/30">
                    <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-stone mb-3">
                      {labelFor(depth)}
                    </p>
                    <h3 className="font-display text-5xl md:text-6xl leading-[0.95] text-ink letterpress mb-3">
                      {deepest.latin}
                    </h3>
                    <p className="font-khmer text-3xl md:text-4xl text-terracotta leading-tight">
                      {deepest.khmer}
                    </p>
                    <p className="mt-5 font-mono text-xs text-stone tabular tracking-[0.2em]">
                      CODE · {deepest.code}
                    </p>
                  </div>

                  {/* Breadcrumb path */}
                  <div className="space-y-3 mb-10">
                    {path.map((node, i) => (
                      <motion.div
                        key={node.code}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.35 }}
                        className="flex items-baseline gap-3"
                      >
                        <span className="font-mono text-[10px] text-stone tabular w-8 shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <ArrowRight
                          size={12}
                          className="text-stone shrink-0 self-center"
                        />
                        <span className="font-display text-base text-ink-soft truncate">
                          {node.latin}
                        </span>
                        <span className="font-khmer text-sm text-ink-mute truncate">
                          {node.khmer}
                        </span>
                        <span className="ml-auto font-mono text-[10px] text-stone tabular shrink-0">
                          {node.code}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <button
                    onClick={copyJson}
                    className="w-full group relative overflow-hidden border border-ink bg-ink text-parchment hover:bg-terracotta hover:border-terracotta transition-colors duration-300 px-5 py-3.5 flex items-center justify-center gap-2.5"
                  >
                    <Copy size={14} />
                    <span className="font-display text-sm tracking-wide">
                      {copied ? "Copied to clipboard" : "Copy as JSON"}
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Province boundary footnote */}
        {provinceObj && (
          <motion.div
            key={provinceObj.code + "-footnote"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 pt-8 border-t border-stone/20"
          >
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-stone mb-4">
              Boundaries — ព្រំប្រទល់
            </p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {(["north", "east", "south", "west"] as const).map((dir) => (
                <div key={dir}>
                  <dt className="font-display italic text-xs text-ink-mute capitalize mb-0.5">
                    {dir}
                  </dt>
                  <dd className="font-khmer text-sm text-ink-soft leading-snug">
                    {provinceObj.boundary[dir] || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </aside>
    </section>
  );
}

function labelFor(depth: number): string {
  return ["", "Province", "District", "Commune", "Village"][depth];
}

function CornerBrackets() {
  const cls =
    "absolute w-6 h-6 border-terracotta pointer-events-none";
  return (
    <>
      <span className={`${cls} border-l-2 border-t-2 -top-px -left-px`} />
      <span className={`${cls} border-r-2 border-t-2 -top-px -right-px`} />
      <span className={`${cls} border-l-2 border-b-2 -bottom-px -left-px`} />
      <span className={`${cls} border-r-2 border-b-2 -bottom-px -right-px`} />
    </>
  );
}
