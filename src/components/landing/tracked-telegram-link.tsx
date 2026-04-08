"use client";

import { track } from "@vercel/analytics";
import type { ReactNode } from "react";

type TrackedTelegramLinkProps = {
  href?: string;
  source: string;
  className?: string;
  children: ReactNode;
  tabIndex?: number;
};

export function TrackedTelegramLink({
  href,
  source,
  className,
  children,
  tabIndex,
}: TrackedTelegramLinkProps) {
  function handleClick() {
    track("telegram_cta_click", { source });
  }

  return (
    <a
      href={href ?? `/telegram?source=${encodeURIComponent(source)}`}
      className={className}
      onClick={handleClick}
      tabIndex={tabIndex}
    >
      {children}
    </a>
  );
}
