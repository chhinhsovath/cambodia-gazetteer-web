import { useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import { ChevronDown, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { AdminLevel } from "../lib/data";
import { levelLabel } from "../lib/data";

export interface ComboboxOption {
  code: string;
  khmer: string;
  latin: string;
}

interface Props {
  level: AdminLevel;
  index: number; // 1..4 — used as the editorial roman numeral
  options: ComboboxOption[];
  value: ComboboxOption | null;
  onChange: (v: ComboboxOption | null) => void;
  disabled?: boolean;
  placeholderHint?: string; // e.g., "select a province first"
}

const ROMAN = ["", "I", "II", "III", "IV"];

export function Combobox({
  level,
  index,
  options,
  value,
  onChange,
  disabled,
  placeholderHint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const label = levelLabel(level);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-display tabular text-stone text-sm tracking-[0.2em] font-medium">
          {ROMAN[index]}
        </span>
        <div className="h-px flex-1 bg-stone/30" />
        <span className="font-display italic text-ink-soft text-sm">
          {label.en}{" "}
          <span className="font-khmer not-italic text-ink-mute">
            · {label.km}
          </span>
        </span>
      </div>

      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={[
          "group w-full text-left transition-all duration-300",
          "border-b-2 pb-3 pt-2 px-1",
          disabled
            ? "border-stone/20 cursor-not-allowed opacity-50"
            : open
              ? "border-terracotta"
              : value
                ? "border-ink hover:border-terracotta"
                : "border-stone hover:border-ink",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {value ? (
              <div className="flex items-baseline gap-3">
                <span className="font-display text-2xl text-ink letterpress truncate">
                  {value.latin}
                </span>
                <span className="font-khmer text-xl text-ink-soft truncate">
                  {value.khmer}
                </span>
              </div>
            ) : (
              <span className="font-display italic text-lg text-ink-mute">
                {disabled
                  ? placeholderHint ?? "—"
                  : `Choose a ${label.en.toLowerCase()}…`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {value && (
              <span className="font-mono text-xs text-stone tabular tracking-wider">
                {value.code}
              </span>
            )}
            <ChevronDown
              size={18}
              className={[
                "text-ink-mute transition-transform duration-300",
                open ? "rotate-180 text-terracotta" : "",
              ].join(" ")}
            />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute z-50 mt-2 w-full bg-parchment-deep border border-stone/40 rounded-sm shadow-[0_24px_48px_-16px_rgba(31,26,20,0.25),0_2px_0_0_rgba(31,26,20,0.08)]"
          >
            <Command label={`Search ${label.en}`} shouldFilter={true}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-stone/30">
                <Search size={15} className="text-stone shrink-0" />
                <Command.Input
                  ref={inputRef}
                  value={search}
                  onValueChange={setSearch}
                  placeholder={`Search ${options.length} ${label.en.toLowerCase()}${options.length === 1 ? "" : "s"}…`}
                  className="text-base"
                />
                {value && (
                  <button
                    onClick={() => {
                      onChange(null);
                      setSearch("");
                    }}
                    className="font-display italic text-xs text-terracotta hover:underline shrink-0"
                  >
                    clear
                  </button>
                )}
              </div>
              <Command.List className="px-2 py-2">
                <Command.Empty>
                  No {label.en.toLowerCase()} matches “{search}”.
                </Command.Empty>
                {options.map((opt) => {
                  const selected = value?.code === opt.code;
                  return (
                    <Command.Item
                      key={opt.code}
                      value={`${opt.latin} ${opt.khmer} ${opt.code}`}
                      onSelect={() => {
                        onChange(opt);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <span className="w-4 shrink-0">
                        {selected && (
                          <Check size={14} className="text-terracotta" />
                        )}
                      </span>
                      <span className="font-display text-base text-ink min-w-0 truncate">
                        {opt.latin}
                      </span>
                      <span className="font-khmer text-base text-ink-soft min-w-0 truncate">
                        {opt.khmer}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-stone tabular tracking-wider shrink-0">
                        {opt.code}
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.List>
            </Command>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
