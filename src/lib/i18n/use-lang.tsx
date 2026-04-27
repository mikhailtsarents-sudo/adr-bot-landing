"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  translations,
  type LangCode,
  type Translation,
} from "./translations";

const STORAGE_KEY = "site_language";

// ── Detection logic ───────────────────────────────────────────────────────────
function detectLang(): LangCode {
  if (typeof window === "undefined") return DEFAULT_LANG;

  // Priority 1: explicit language route on the current page
  const pathSegment = window.location.pathname.split("/")[1]?.toLowerCase() ?? "";
  if ((SUPPORTED_LANGS as readonly string[]).includes(pathSegment)) {
    return pathSegment as LangCode;
  }

  // Priority 2: user has manually selected a language
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (SUPPORTED_LANGS as readonly string[]).includes(saved)) {
      return saved as LangCode;
    }
  } catch {
    // localStorage blocked (private mode etc.) — continue
  }

  // Priority 3: browser/device language
  const browserLang = (navigator.language ?? "").slice(0, 2).toLowerCase();
  if ((SUPPORTED_LANGS as readonly string[]).includes(browserLang)) {
    return browserLang as LangCode;
  }

  // Priority 4: fallback to German
  return DEFAULT_LANG;
}

function persistLangCookie(lang: LangCode) {
  if (typeof document === "undefined") return;
  document.cookie = `${STORAGE_KEY}=${encodeURIComponent(lang)}; path=/; max-age=31536000; SameSite=Lax`;
}

// ── Context ───────────────────────────────────────────────────────────────────
type LangContextType = {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: Translation;
};

const LangContext = createContext<LangContextType>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: translations[DEFAULT_LANG],
});

function subscribeToLangChange(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function LangProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang?: LangCode;
}) {
  const detectedLang = useSyncExternalStore(
    subscribeToLangChange,
    detectLang,
    () => DEFAULT_LANG,
  );
  const [manualLang, setManualLang] = useState<LangCode | null>(
    initialLang ?? null,
  );
  const lang = manualLang ?? detectedLang;

  // Apply RTL + lang attribute whenever language changes
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(newLang: LangCode) {
    setManualLang(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
    persistLangCookie(newLang);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useLang() {
  return useContext(LangContext);
}
