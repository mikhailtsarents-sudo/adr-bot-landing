"use client";

import { SUPPORTED_LANGS, type LangCode } from "@/lib/i18n/translations";
import { useLang } from "@/lib/i18n/use-lang";
import { ChevronDown, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const LANG_NAMES: Record<LangCode, string> = {
  de: "Deutsch",
  en: "English",
  ru: "Русский",
  uk: "Українська",
  tr: "Türkçe",
  ar: "العربية",
  pl: "Polski",
  ro: "Română",
  bg: "Български",
  hr: "Hrvatski",
};

type Props = { compact?: boolean };

export function LanguageSwitcher({ compact = false }: Props) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Select language"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <Globe className="h-3.5 w-3.5 text-slate-500" />
        {compact ? (
          <span className="font-mono text-xs font-semibold uppercase tracking-wide">
            {lang}
          </span>
        ) : (
          <span className="hidden sm:inline">{LANG_NAMES[lang]}</span>
        )}
        <ChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {SUPPORTED_LANGS.map((code) => (
            <button
              key={code}
              onClick={() => {
                setLang(code);
                setOpen(false);
              }}
              className={[
                "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50",
                code === lang ? "bg-amber-50 font-semibold text-amber-700" : "text-slate-700",
              ].join(" ")}
            >
              <span className="w-6 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                {code}
              </span>
              <span>{LANG_NAMES[code]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
