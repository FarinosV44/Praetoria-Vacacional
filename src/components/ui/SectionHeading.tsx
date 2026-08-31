import type { ReactNode } from "react";

/**
 * Design-system section header (issue #77) — eyebrow + display heading + lede,
 * with consistent spacing. `align="center"` for the centred variant used above
 * full-width modules.
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  id,
  level = 2,
  align = "start",
  size = "2",
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  id?: string;
  level?: 1 | 2 | 3;
  align?: "start" | "center";
  size?: "1" | "2" | "3";
  className?: string;
}) {
  const H = `h${level}` as "h1" | "h2" | "h3";
  return (
    <div
      className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}
    >
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <H id={id} className={`${eyebrow ? "mt-2" : ""} display-${size}`}>
        {title}
      </H>
      {lede ? <p className="lede mt-3">{lede}</p> : null}
    </div>
  );
}
