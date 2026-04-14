import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  theme?: "light" | "dark";
  action?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  theme = "light",
  action,
}: SectionHeadingProps) {
  const isCenter = align === "center";
  const isDark = theme === "dark";

  return (
    <div
      className={[
        "flex gap-6",
        isCenter
          ? "mx-auto max-w-3xl flex-col items-center text-center"
          : "flex-col items-start",
      ].join(" ")}
    >
      {eyebrow ? (
        <span
          className={[
            "inline-flex items-center rounded-full px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.32em]",
            isDark
              ? "border border-amber-300/28 bg-[rgba(255,232,189,0.12)] text-amber-100"
              : "border border-amber-300 bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {eyebrow}
        </span>
      ) : null}
      <div className="space-y-4">
        <h2
          className={[
            "max-w-3xl font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-5xl",
            isDark ? "text-white" : "text-[var(--color-text-strong)]",
          ].join(" ")}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={[
              "max-w-2xl text-base leading-8 sm:text-lg",
              isDark ? "text-white/74" : "text-[var(--color-text-soft)]",
            ].join(" ")}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
