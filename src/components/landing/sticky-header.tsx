"use client";

import { useLang } from "@/lib/i18n/use-lang";
import { motion } from "framer-motion";
import { ArrowRight, Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "./language-switcher";
import { TrackedTelegramLink } from "./tracked-telegram-link";

export function StickyHeader() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 420);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      className={[
        "fixed left-1/2 top-4 z-50 w-[calc(100%-1.25rem)] max-w-5xl -translate-x-1/2 transition-[pointer-events]",
        visible ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -12 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      aria-hidden={!visible}
    >
      <div className="flex items-center justify-between rounded-full border border-white/14 bg-[rgba(23,23,23,0.82)] px-3 py-2 shadow-[0_16px_42px_rgba(15,23,42,0.24)] backdrop-blur-xl sm:px-4 sm:py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-dark)] shadow-[0_6px_14px_rgba(242,183,5,0.28)]">
            <Bot className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-semibold tracking-wide text-white max-[360px]:hidden">
            ADR Bot
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher compact />
          <TrackedTelegramLink
            source="sticky_header"
            tabIndex={visible ? 0 : -1}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-dark)] transition hover:bg-[var(--color-accent-strong)] sm:px-4"
          >
            {t.hero.ctaPrimary}
            <ArrowRight className="h-3 w-3 shrink-0" />
          </TrackedTelegramLink>
        </div>
      </div>
    </motion.div>
  );
}
