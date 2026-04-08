"use client";

import { useLang } from "@/lib/i18n/use-lang";
import { motion } from "framer-motion";
import { ArrowRight, Bot } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "./language-switcher";

const telegramHref = "https://t.me/Adr_wort_trainer_bot";

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
      className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -12 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      aria-hidden={!visible}
    >
      <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white/92 px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.10)] backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#e8a030,#f6b548)] text-white shadow-[0_2px_8px_rgba(232,160,48,0.3)]">
            <Bot className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-semibold tracking-wide text-slate-900">
            ADR Bot
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <Link
            href={telegramHref}
            tabIndex={visible ? 0 : -1}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
          >
            {t.hero.ctaPrimary}
            <ArrowRight className="h-3 w-3 shrink-0" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
