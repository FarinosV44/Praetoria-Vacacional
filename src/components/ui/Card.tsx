import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Design-system card (issue #77). `.pv-card` gives the border + radius; opt into
 * padding, elevation and hover-lift. Use `<CardLink>` when the whole card is a
 * link (the common destination/guide/blog pattern).
 */
interface CardProps {
  as?: "div" | "article" | "figure" | "section" | "li";
  pad?: boolean;
  soft?: boolean;
  interactive?: boolean;
  accent?: boolean;
  className?: string;
  children: ReactNode;
}

function cardClass({
  pad = true,
  soft = false,
  interactive = false,
  accent = false,
  className = "",
}: Omit<CardProps, "as" | "children">) {
  return [
    "pv-card",
    pad && "pv-card--pad",
    soft && "pv-card--soft",
    interactive && "pv-card--interactive",
    accent && "pv-card--accent",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Card({ as: Tag = "div", children, ...rest }: CardProps) {
  return <Tag className={cardClass(rest)}>{children}</Tag>;
}

export function CardLink({
  href,
  children,
  className = "",
  pad = true,
  soft = false,
  accent = false,
  ...props
}: { href: string } & Omit<CardProps, "as" | "interactive"> &
  Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={`group block ${cardClass({ pad, soft, interactive: true, accent, className })}`}
      {...props}
    >
      {children}
    </Link>
  );
}
