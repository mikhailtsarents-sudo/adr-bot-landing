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

const LANG_SWITCHER_LABELS: Record<LangCode, string> = {
  de: "Sprache auswählen",
  en: "Select language",
  ru: "Выбрать язык",
  uk: "Вибрати мову",
  tr: "Dil seç",
  ar: "اختر اللغة",
  pl: "Wybierz język",
  ro: "Alege limba",
  bg: "Избери език",
  hr: "Odaberi jezik",
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
    <div ref={ref} className="relative z-[120]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={LANG_SWITCHER_LABELS[lang]}
        aria-expanded={open}
        title={LANG_SWITCHER_LABELS[lang]}
        className="flex items-center gap-1.5 rounded-full border border-white/65 bg-white/72 px-3 py-1.5 text-sm text-slate-700 shadow-[0_8px_24px_rgba(15,10,6,0.12)] backdrop-blur-md transition hover:border-white/80 hover:bg-white/82"
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
        <div className="absolute right-0 top-full z-[140] mt-2 w-44 overflow-hidden rounded-2xl border border-white/70 bg-white/92 shadow-[0_18px_40px_rgba(15,10,6,0.18)] backdrop-blur-xl">
          {SUPPORTED_LANGS.map((code) => (
            <button
              key={code}
              onClick={() => {
                setLang(code);
                setOpen(false);
              }}
              className={[
                "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-white/80",
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
