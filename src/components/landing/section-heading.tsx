import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
}: SectionHeadingProps) {
  const isCenter = align === "center";

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
        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-amber-700">
          {eyebrow}
        </span>
      ) : null}
      <div className="space-y-4">
        <h2 className="max-w-3xl font-display text-3xl font-semibold tracking-[-0.03em] text-[var(--color-text-strong)] sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-base leading-8 text-[var(--color-text-soft)] sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
